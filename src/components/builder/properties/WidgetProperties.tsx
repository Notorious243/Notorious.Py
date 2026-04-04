import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useWidgets } from '@/contexts/useWidgets';
import { useFileSystem } from '@/hooks/useFileSystemContext';
import { isCtkStyleSupported } from '@/constants/customtkinter-validation';
import { FONT_FAMILIES } from '@/constants/widgets';
import { WidgetData, WidgetStyle } from '@/types/widget';
import { getParentContentBounds } from '@/lib/widgetLayout';
import { Bold, Italic, Underline, Settings, Plus, Trash2, Upload, Link, FolderOpen, Image as ImageIcon, Ruler, PenSquare, Palette, Settings2, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ColorPicker } from './ColorPicker';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { LazyInput } from './ui/LazyInput';
import { TableProperties } from './sections/TableProperties';
import { StatCardProperties } from './sections/StatCardProperties';
import { StatCardWithProgressProperties } from './sections/StatCardWithProgressProperties';
import { MenuItemProperties } from './sections/MenuItemProperties';
import { ProductCardProperties } from './sections/ProductCardProperties';
import { UserProfileProperties } from './sections/UserProfileProperties';
import { ChartProperties } from './sections/ChartProperties';

interface WidgetPropertiesProps {
  selectedWidget: WidgetData | undefined;
}

export const WidgetProperties: React.FC<WidgetPropertiesProps> = ({ selectedWidget }) => {
  // ✅ TOUS LES HOOKS DOIVENT ÊTRE APPELÉS AVANT TOUT EARLY RETURN
  const { updateWidget, updateWidgetStyle, canvasSettings, snapToGrid, widgets } = useWidgets();
  const { addImage } = useFileSystem();
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [imageUrlInput, setImageUrlInput] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageLabelInputRef = React.useRef<HTMLInputElement>(null);

  // Pending image import state (rename before confirming)
  const [pendingImg, setPendingImg] = React.useState<{
    base64: string;
    suggestedName: string;
    target: 'image_label' | 'image';
  } | null>(null);
  const [pendingImgName, setPendingImgName] = React.useState('');

  // ✅ Calculer parentBounds AVANT le early return (utiliser un widget par défaut si null)
  const parentBounds = React.useMemo(
    () => getParentContentBounds(widgets, selectedWidget?.parentId ?? null, canvasSettings),
    [widgets, selectedWidget?.parentId, canvasSettings]
  );

  // ✅ Définir alignPosition AVANT le early return
  const alignPosition = React.useCallback(
    (horizontal: 'left' | 'center' | 'right' | null, vertical: 'top' | 'center' | 'bottom' | null) => {
      if (!selectedWidget) return;

      const { width, height } = selectedWidget.size;

      const baseLeft = parentBounds.left;
      const baseTop = parentBounds.top;
      const availableWidth = Math.max(parentBounds.width - width, 0);
      const availableHeight = Math.max(parentBounds.height - height, 0);

      let targetX = selectedWidget.position.x;
      let targetY = selectedWidget.position.y;

      if (horizontal === 'left') {
        targetX = baseLeft;
      } else if (horizontal === 'center') {
        targetX = baseLeft + availableWidth / 2;
      } else if (horizontal === 'right') {
        targetX = baseLeft + availableWidth;
      }

      if (vertical === 'top') {
        targetY = baseTop;
      } else if (vertical === 'center') {
        targetY = baseTop + availableHeight / 2;
      } else if (vertical === 'bottom') {
        targetY = baseTop + availableHeight;
      }

      updateWidget(selectedWidget.id, {
        position: {
          x: snapToGrid(targetX),
          y: snapToGrid(targetY),
        },
      });
    },
    [parentBounds, selectedWidget, snapToGrid, updateWidget]
  );

  // ✅ Maintenant on peut faire le early return APRÈS tous les hooks
  if (!selectedWidget) {
    return (
      <AccordionItem value="proprietes" className="rounded-2xl border border-border bg-card">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Settings className="h-4 w-4" />Propriétés
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Sélectionnez un widget pour modifier ses propriétés</p>
        </AccordionContent>
      </AccordionItem>
    );
  }

  const commitImageLabelUpdates = (
    propertyUpdates: Partial<WidgetData['properties']>,
    sizeOverride?: [number, number]
  ) => {
    const widgetUpdates: Partial<WidgetData> = {
      properties: {
        ...selectedWidget.properties,
        ...propertyUpdates,
      },
    };

    if (sizeOverride) {
      widgetUpdates.size = {
        ...selectedWidget.size,
        width: sizeOverride[0],
        height: sizeOverride[1],
      };
    }

    updateWidget(selectedWidget.id, widgetUpdates);
  };

  const handlePendingImgConfirm = () => {
    if (!pendingImg || !selectedWidget) return;
    const finalName = pendingImgName.trim() || pendingImg.suggestedName;
    const safeName = finalName.replace(/[^a-zA-Z0-9_\-. ]/g, '').trim() || 'image';
    const nameWithExt = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(safeName) ? safeName : `${safeName}.png`;
    if (pendingImg.target === 'image_label') {
      commitImageLabelUpdates({ image_data: pendingImg.base64, image_path: '' });
    } else {
      updateWidget(selectedWidget.id, {
        properties: { ...selectedWidget.properties, imageUrl: pendingImg.base64, src: pendingImg.base64 },
      });
      setImageDialogOpen(false);
    }
    addImage(nameWithExt);
    setPendingImg(null);
    setPendingImgName('');
  };

  const handleImageLabelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const suggested = file.name.replace(/\.[^.]+$/, '') || 'image';
        setPendingImg({ base64, suggestedName: suggested, target: 'image_label' });
        setPendingImgName(suggested);
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleImageLabelUrl = () => {
    const url = window.prompt('URL de l\'image (http(s)://...)');
    if (url && url.trim()) {
      commitImageLabelUpdates({ image_path: url.trim(), image_data: '' });
    }
  };

  const clearImageLabel = () => {
    commitImageLabelUpdates({ image_data: '', image_path: '' });
    if (imageLabelInputRef.current) {
      imageLabelInputRef.current.value = '';
    }
  };



  const handleImageLabelSizeBlur = (index: 0 | 1, raw: string | number) => {
    const numeric = typeof raw === 'string' && raw !== '' ? Number(raw) : typeof raw === 'number' ? raw : NaN;
    const defaultWidth = selectedWidget.size.width || 200;
    const defaultHeight = selectedWidget.size.height || 200;
    const safeValue = Number.isFinite(numeric)
      ? Math.max(20, numeric)
      : index === 0
        ? defaultWidth
        : defaultHeight;

    const rawSize = Array.isArray(selectedWidget.properties.image_size) && selectedWidget.properties.image_size.length === 2
      ? [...selectedWidget.properties.image_size]
      : [defaultWidth, defaultHeight];

    const normalizedSize: [number, number] = [
      typeof rawSize[0] === 'number' ? rawSize[0] : defaultWidth,
      typeof rawSize[1] === 'number' ? rawSize[1] : defaultHeight,
    ];

    normalizedSize[index] = safeValue;
    commitImageLabelUpdates(
      { image_size: normalizedSize },
      [normalizedSize[0], normalizedSize[1]]
    );
  };



  const handleNumericPropertyBlur = (
    prop: keyof WidgetData['properties'],
    raw: string | number,
    fallback: number,
    min: number = 1
  ) => {
    if (raw === '' || raw === undefined || raw === null) {
      handlePropertyChange(prop, fallback);
      return;
    }
    const num = typeof raw === 'number' ? raw : Number(raw);
    const safe = Number.isFinite(num) ? Math.max(min, num) : fallback;
    handlePropertyChange(prop, safe);
  };

  const handleStyleChange = (prop: keyof WidgetData['style'], value: string | number | boolean) => {
    updateWidgetStyle(selectedWidget.id, { [prop]: value });
  };

  const handlePropertyChange = (prop: string, value: WidgetData['properties'][string]) => {
    updateWidget(selectedWidget.id, { properties: { ...selectedWidget.properties, [prop]: value } });
  };

  const handleBatchPropertyChange = (updates: Record<string, WidgetData['properties'][string]>) => {
    updateWidget(selectedWidget.id, {
      properties: {
        ...selectedWidget.properties,
        ...updates,
      },
    });
  };

  const handleSizeBlur = (dim: 'width' | 'height', value: string | number) => {
    // Au blur, forcer une valeur minimale si vide ou trop petit
    const numValue = typeof value === 'string' && value === '' ? 20 : Math.max(20, Number(value));
    updateWidget(selectedWidget.id, { size: { ...selectedWidget.size, [dim]: numValue } });
  };

  const handlePositionBlur = (axis: 'x' | 'y', value: string | number) => {
    // Au blur, convertir en nombre (0 si vide)
    const numValue = typeof value === 'string' && (value === '' || value === '-') ? 0 : Number(value);
    updateWidget(selectedWidget.id, { position: { ...selectedWidget.position, [axis]: numValue } });
  };

  const { style = {}, properties, size, position } = selectedWidget;
  const imageLabelSize = (Array.isArray(properties.image_size) && properties.image_size.length === 2
    ? properties.image_size
    : [size.width || 200, size.height || 200]) as (number | string)[];

  const sectionProps = {
    selectedWidget,
    properties,
    handlePropertyChange,
    handleBatchPropertyChange,
    handleNumericPropertyBlur,
    handleSizeBlur,
  };

  return (
    <AccordionItem value="proprietes" className="rounded-2xl border border-border bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Settings className="h-4 w-4" />Propriétés
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-3 space-y-3">
        {/* ========== SECTION 1: GÉOMÉTRIE ========== */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Ruler className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Géométrie</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Position & Taille</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <Label className="text-[10px] text-muted-foreground">X</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={position.x}
                    onValueChange={val => handlePositionBlur('x', val)}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Y</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={position.y}
                    onValueChange={val => handlePositionBlur('y', val)}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Largeur</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={size.width}
                    onValueChange={val => handleSizeBlur('width', val)}
                    onFocus={e => e.target.select()}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Hauteur</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={size.height}
                    onValueChange={val => handleSizeBlur('height', val)}
                    onFocus={e => e.target.select()}
                    placeholder="50"
                  />
                </div>
              </div>
            </div>

            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Alignement</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { h: 'left', v: 'top', pos: 'top-0 left-0' },
                  { h: 'center', v: 'top', pos: 'top-0 left-1/2 -translate-x-1/2' },
                  { h: 'right', v: 'top', pos: 'top-0 right-0' },
                  { h: 'left', v: 'center', pos: 'top-1/2 -translate-y-1/2 left-0' },
                  { h: 'center', v: 'center', pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
                  { h: 'right', v: 'center', pos: 'top-1/2 -translate-y-1/2 right-0' },
                  { h: 'left', v: 'bottom', pos: 'bottom-0 left-0' },
                  { h: 'center', v: 'bottom', pos: 'bottom-0 left-1/2 -translate-x-1/2' },
                  { h: 'right', v: 'bottom', pos: 'bottom-0 right-0' },
                ].map(({ h, v, pos }) => (
                  <button
                    key={`${h}-${v}`}
                    onClick={() => alignPosition(h as 'left' | 'center' | 'right', v as 'top' | 'center' | 'bottom')}
                    className="h-8 flex items-center justify-center rounded-md border border-border/40 bg-background/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                  >
                    <div className="w-5 h-5 border border-border/60 rounded-sm relative">
                      <div className={`absolute w-1.5 h-1.5 bg-primary rounded-sm ${pos}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ========== SECTION 2: CONTENU ========== */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <PenSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Contenu</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {('text' in properties) && !['menuItem', 'statCard', 'statCardWithProgress', 'productCard', 'userProfile', 'chart', 'image_label', 'passwordentry'].includes(selectedWidget.type) && (
              <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Texte</Label>
                <Input
                  value={properties.text || ''}
                  onChange={e => handlePropertyChange('text', e.target.value)}
                  placeholder="Entrer le texte..."
                  className="h-8 text-xs bg-background/50"
                />
              </div>
            )}

            {('placeholder_text' in properties) && selectedWidget.type !== 'passwordentry' && (
              <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Texte indicatif</Label>
                <Input
                  value={properties.placeholder_text || ''}
                  onChange={e => handlePropertyChange('placeholder_text', e.target.value)}
                  placeholder="Texte affiché quand vide..."
                  className="h-8 text-xs bg-background/50"
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Frame Properties — padding */}
        {(selectedWidget.type === 'frame' || selectedWidget.type === 'scrollableframe' || selectedWidget.type === 'tabview') && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Conteneur</Label>
            <div>
              <Label className="text-[10px] text-muted-foreground">Espacement intérieur (px)</Label>
              <LazyInput
                inputMode="numeric"
                value={style.padding ?? 12}
                onValueChange={val => {
                  handleStyleChange('padding', val === '' ? 12 : Math.max(0, Number(val)));
                }}
                onFocus={e => e.target.select()}
                placeholder="12"
              />
            </div>
          </div>
        )}

        {/* PasswordEntry Properties */}
        {selectedWidget.type === 'passwordentry' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Champ mot de passe</Label>
            <div>
              <Label className="text-[10px] text-muted-foreground">Texte indicatif</Label>
              <Input
                value={properties.placeholder_text || ''}
                onChange={e => handlePropertyChange('placeholder_text', e.target.value)}
                placeholder="Mot de passe..."
                className="h-8 text-xs bg-background/50"
              />
            </div>
          </div>
        )}

        {/* ScrollableFrame: label_text */}
        {selectedWidget.type === 'scrollableframe' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cadre défilant</Label>
            <div>
              <Label className="text-[10px] text-muted-foreground">Titre du cadre</Label>
              <Input
                value={properties.label_text || ''}
                onChange={e => handlePropertyChange('label_text', e.target.value)}
                placeholder="Titre du cadre défilant..."
                className="h-8 text-xs bg-background/50"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Orientation</Label>
              <Select
                value={properties.orientation || 'vertical'}
                onValueChange={v => handlePropertyChange('orientation', v)}
              >
                <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Couleur piste scrollbar</Label>
              <ColorPicker
                color={properties.scrollbar_fg_color || '#CCCCCC'}
                onChange={color => handlePropertyChange('scrollbar_fg_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Couleur bouton scrollbar</Label>
              <ColorPicker
                color={properties.scrollbar_button_color || '#4A4D50'}
                onChange={color => handlePropertyChange('scrollbar_button_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Couleur hover scrollbar</Label>
              <ColorPicker
                color={properties.scrollbar_button_hover_color || '#636363'}
                onChange={color => handlePropertyChange('scrollbar_button_hover_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Fond du label</Label>
              <ColorPicker
                color={properties.label_fg_color || '#FFFFFF'}
                onChange={color => handlePropertyChange('label_fg_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Couleur texte label</Label>
              <ColorPicker
                color={properties.label_text_color || '#000000'}
                onChange={color => handlePropertyChange('label_text_color', color)}
              />
            </div>
          </div>
        )}

        {('tabs' in properties) && selectedWidget.type === 'tabview' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Onglets</Label>
            <div className="space-y-1.5">
              {((properties.tabs as string[]) || ['Tab 1', 'Tab 2']).map((tab, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <Input
                    value={tab}
                    onChange={e => {
                      const newTabs = [...((properties.tabs as string[]) || [])];
                      newTabs[index] = e.target.value;
                      handlePropertyChange('tabs', newTabs);
                    }}
                    placeholder={`Onglet ${index + 1}`}
                    className="flex-1 h-7 text-xs bg-background/50"
                  />
                  {((properties.tabs as string[]) || []).length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newTabs = ((properties.tabs as string[]) || []).filter((_, i) => i !== index);
                        handlePropertyChange('tabs', newTabs.length >= 2 ? newTabs : ['Tab 1', 'Tab 2']);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => {
                  const currentTabs = (properties.tabs as string[]) || ['Tab 1', 'Tab 2'];
                  const newTabs = [...currentTabs, `Tab ${currentTabs.length + 1}`];
                  handlePropertyChange('tabs', newTabs);
                }}
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Ajouter un onglet
              </Button>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Onglet par défaut</Label>
              <Select
                value={String(properties.selectedIndex !== undefined ? properties.selectedIndex : 0)}
                onValueChange={v => handlePropertyChange('selectedIndex', Number(v))}
              >
                <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {((properties.tabs as string[]) || ['Tab 1', 'Tab 2']).map((tab, index) => (
                    <SelectItem key={index} value={String(index)}>{tab}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Couleur de sélection</Label>
              <ColorPicker
                color={properties.segmented_button_selected_color || '#0F3460'}
                onChange={color => handlePropertyChange('segmented_button_selected_color', color)}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Position des onglets</Label>
              <Select
                value={properties.anchor || 'n'}
                onValueChange={v => handlePropertyChange('anchor', v)}
              >
                <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="n">Haut</SelectItem>
                  <SelectItem value="s">Bas</SelectItem>
                  <SelectItem value="w">Gauche</SelectItem>
                  <SelectItem value="e">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Fond non-sélectionné</Label>
              <ColorPicker
                color={properties.segmented_button_unselected_color || '#2B2B2B'}
                onChange={color => handlePropertyChange('segmented_button_unselected_color', color)}
              />
            </div>
          </div>
        )}

        {('src' in properties || 'imageUrl' in properties) && selectedWidget.type === 'image' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Image</Label>

            {/* Afficher l'URL actuelle si elle existe */}
            {(properties.imageUrl || properties.src) && (
              <div className="text-xs text-muted-foreground break-all bg-muted/30 p-2 rounded">
                <strong>Source actuelle:</strong> {(properties.imageUrl || properties.src)?.substring(0, 50)}...
              </div>
            )}

            {/* Bouton unique pour importer */}
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer une Image
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Importer une Image</DialogTitle>
                  <DialogDescription>
                    Choisissez comment vous souhaitez importer votre image
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Option 1: URL en ligne */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Link className="h-4 w-4" />
                      Depuis Internet (URL)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrlInput}
                        onChange={e => setImageUrlInput(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          if (imageUrlInput.trim()) {
                            handlePropertyChange('imageUrl', imageUrlInput.trim());
                            handlePropertyChange('src', imageUrlInput.trim());
                            setImageDialogOpen(false);
                            setImageUrlInput('');
                          }
                        }}
                        disabled={!imageUrlInput.trim()}
                      >
                        Valider
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou</span>
                    </div>
                  </div>

                  {/* Option 2: Fichier local */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <FolderOpen className="h-4 w-4" />
                      Depuis l'ordinateur
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.ico"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            const suggested = file.name.replace(/\.[^.]+$/, '') || 'image';
                            setPendingImg({ base64: dataUrl, suggestedName: suggested, target: 'image' });
                            setPendingImgName(suggested);
                          };
                          reader.readAsDataURL(file);
                        }
                        if (e.target) e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Parcourir les fichiers
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Formats supportés : JPG, PNG, GIF, SVG, WebP
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div>
              <Label>Texte alternatif</Label>
              <Input
                value={properties.alt || ''}
                onChange={e => handlePropertyChange('alt', e.target.value)}
                placeholder="Description de l'image"
              />
            </div>
            <div>
              <Label>Ajustement de l'image</Label>
              <Select value={style.objectFit || 'fill'} onValueChange={v => handleStyleChange('objectFit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fill">Remplir</SelectItem>
                  <SelectItem value="cover">Couvrir</SelectItem>
                  <SelectItem value="contain">Contenir</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="scale-down">Réduire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {selectedWidget.type === 'image_label' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Label + CTkImage
            </Label>

            <div className="space-y-2">
              <input
                ref={imageLabelInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.ico"
                className="hidden"
                onChange={handleImageLabelUpload}
              />
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => imageLabelInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2 shrink-0" />
                  <span>Fichier local</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleImageLabelUrl}>
                  <Link className="h-4 w-4 mr-2 shrink-0" />
                  <span>URL</span>
                </Button>
              </div>
              {(properties.image_data || properties.image_path) ? (
                <div className="space-y-2">
                  <div className="h-32 border border-border/40 rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
                    <img
                      src={properties.image_data || properties.image_path}
                      alt="Image label preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground break-all flex-1">
                      {properties.image_path ? `Source: ${properties.image_path}` : 'Image locale intégrée.'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearImageLabel}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucune image sélectionnée. Le label affichera seulement du texte.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label>Largeur Image (px)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={imageLabelSize[0] ?? ''}
                  onValueChange={val => handleImageLabelSizeBlur(0, val)}
                  onFocus={e => e.target.select()}
                  placeholder="200"
                />
              </div>
              <div>
                <Label>Hauteur Image (px)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={imageLabelSize[1] ?? ''}
                  onValueChange={val => handleImageLabelSizeBlur(1, val)}
                  onFocus={e => e.target.select()}
                  placeholder="200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ajustement de l'image</Label>
              <Select
                value={(style.objectFit as WidgetStyle['objectFit'] | undefined) || 'contain'}
                onValueChange={value => handleStyleChange('objectFit', value as WidgetStyle['objectFit'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fill">Remplir</SelectItem>
                  <SelectItem value="cover">Couvrir</SelectItem>
                  <SelectItem value="contain">Contenir</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="scale-down">Réduire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Texte du label</Label>
              <Input
                value={properties.text || ''}
                onChange={e => handlePropertyChange('text', e.target.value)}
                placeholder="Laisser vide pour image seule"
              />
            </div>

            {properties.text && (
              <div className="space-y-2">
                <Label>Position du texte</Label>
                <Select
                  value={properties.compound || 'center'}
                  onValueChange={value => handlePropertyChange('compound', value)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Texte Haut</SelectItem>
                    <SelectItem value="bottom">Texte Bas</SelectItem>
                    <SelectItem value="left">Texte Gauche</SelectItem>
                    <SelectItem value="right">Texte Droite</SelectItem>
                    <SelectItem value="center">Centré (Image seule)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* ComboBox: values (pas items) */}
        {('values' in properties) && selectedWidget.type === 'combobox' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Options de la liste déroulante</Label>
            <div className="space-y-2">
              {((properties.values as string[]) || ['Option 1']).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={e => {
                      const newValues = [...((properties.values as string[]) || [])];
                      newValues[index] = e.target.value;
                      handlePropertyChange('values', newValues);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {((properties.values as string[]) || []).length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newValues = ((properties.values as string[]) || []).filter((_, i) => i !== index);
                        handlePropertyChange('values', newValues.length > 0 ? newValues : ['Option 1']);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const currentValues = (properties.values as string[]) || ['Option 1'];
                  const newValues = [...currentValues, `Option ${currentValues.length + 1}`];
                  handlePropertyChange('values', newValues);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une option
              </Button>
              <p className="text-xs text-muted-foreground">
                {((properties.values as string[]) || []).length} option(s)
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs">Option sélectionnée par défaut</Label>
              <Select
                value={String(properties.selectedIndex !== undefined ? properties.selectedIndex : 0)}
                onValueChange={v => handlePropertyChange('selectedIndex', Number(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {((properties.values as string[]) || ['Option 1']).map((item, index) => (
                    <SelectItem key={index} value={String(index)}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label>Justification du texte</Label>
              <Select
                value={properties.justify || 'left'}
                onValueChange={v => handlePropertyChange('justify', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <Label className="text-xs font-semibold text-muted-foreground">Couleurs du bouton</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Bouton</Label>
                <ColorPicker
                  color={properties.button_color || '#0C2B52'}
                  onChange={color => handlePropertyChange('button_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bouton survol</Label>
                <ColorPicker
                  color={properties.button_hover_color || '#1F5AA0'}
                  onChange={color => handlePropertyChange('button_hover_color', color)}
                />
              </div>
            </div>
            <Label className="text-xs font-semibold text-muted-foreground">Couleurs du dropdown</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Fond</Label>
                <ColorPicker
                  color={properties.dropdown_fg_color || '#343638'}
                  onChange={color => handlePropertyChange('dropdown_fg_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Survol</Label>
                <ColorPicker
                  color={properties.dropdown_hover_color || '#4A4D50'}
                  onChange={color => handlePropertyChange('dropdown_hover_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Texte dropdown</Label>
                <ColorPicker
                  color={properties.dropdown_text_color || '#DCE4EE'}
                  onChange={color => handlePropertyChange('dropdown_text_color', color)}
                />
              </div>
            </div>
          </div>
        )}

        {/* OptionMenu: values (pas items) */}
        {('values' in properties) && selectedWidget.type === 'optionmenu' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Options du menu déroulant</Label>
            <div className="space-y-2">
              {((properties.values as string[]) || ['Option 1', 'Option 2', 'Option 3']).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={e => {
                      const newValues = [...((properties.values as string[]) || [])];
                      newValues[index] = e.target.value;
                      handlePropertyChange('values', newValues);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {((properties.values as string[]) || []).length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newValues = ((properties.values as string[]) || []).filter((_, i) => i !== index);
                        handlePropertyChange('values', newValues.length > 0 ? newValues : ['Option 1', 'Option 2']);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const currentValues = (properties.values as string[]) || ['Option 1', 'Option 2', 'Option 3'];
                  const newValues = [...currentValues, `Option ${currentValues.length + 1}`];
                  handlePropertyChange('values', newValues);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une option
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs">Option sélectionnée</Label>
              <Select
                value={String(properties.selectedIndex !== undefined ? properties.selectedIndex : 0)}
                onValueChange={(value) => handlePropertyChange('selectedIndex', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {((properties.values as string[]) || ['Option 1', 'Option 2', 'Option 3']).map((item, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {((properties.values as string[]) || []).length} option(s)
              </p>
            </div>
            <Separator />
            <div>
              <Label>Ancrage du texte</Label>
              <Select
                value={properties.anchor || 'w'}
                onValueChange={v => handlePropertyChange('anchor', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="w">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="e">Droite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={properties.dynamic_resizing !== false}
                onCheckedChange={checked => handlePropertyChange('dynamic_resizing', checked)}
              />
              <Label>Redimensionnement dynamique</Label>
            </div>
            <Label className="text-xs font-semibold text-muted-foreground">Couleurs du dropdown</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Bouton</Label>
                <ColorPicker
                  color={properties.button_color || '#0C2B52'}
                  onChange={color => handlePropertyChange('button_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bouton survol</Label>
                <ColorPicker
                  color={properties.button_hover_color || '#1F5AA0'}
                  onChange={color => handlePropertyChange('button_hover_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fond dropdown</Label>
                <ColorPicker
                  color={properties.dropdown_fg_color || '#343638'}
                  onChange={color => handlePropertyChange('dropdown_fg_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Survol dropdown</Label>
                <ColorPicker
                  color={properties.dropdown_hover_color || '#4A4D50'}
                  onChange={color => handlePropertyChange('dropdown_hover_color', color)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Texte dropdown</Label>
                <ColorPicker
                  color={properties.dropdown_text_color || '#DCE4EE'}
                  onChange={color => handlePropertyChange('dropdown_text_color', color)}
                />
              </div>
            </div>
          </div>
        )}

        {/* SegmentedButton: values (pas items) */}
        {('values' in properties) && selectedWidget.type === 'segmentedbutton' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Options Bouton Segmenté</Label>
            <div className="space-y-2">
              {((properties.values as string[]) || ['Option 1', 'Option 2', 'Option 3']).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={e => {
                      const newValues = [...((properties.values as string[]) || [])];
                      newValues[index] = e.target.value;
                      handlePropertyChange('values', newValues);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {((properties.values as string[]) || []).length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newValues = ((properties.values as string[]) || []).filter((_, i) => i !== index);
                        handlePropertyChange('values', newValues.length >= 2 ? newValues : ['Option 1', 'Option 2']);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const currentValues = (properties.values as string[]) || ['Option 1', 'Option 2', 'Option 3'];
                  const newValues = [...currentValues, `Option ${currentValues.length + 1}`];
                  handlePropertyChange('values', newValues);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une option
              </Button>
              <p className="text-xs text-muted-foreground">
                {((properties.values as string[]) || []).length} option(s)
              </p>
            </div>
            <div>
              <Label>Option sélectionnée par défaut</Label>
              <Select
                value={String(properties.selectedIndex !== undefined ? properties.selectedIndex : 0)}
                onValueChange={v => handlePropertyChange('selectedIndex', Number(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {((properties.values as string[]) || ['Option 1', 'Option 2', 'Option 3']).map((item, index) => (
                    <SelectItem key={index} value={String(index)}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Couleur sélection</Label>
              <ColorPicker
                color={properties.selected_color || '#0F3460'}
                onChange={color => handlePropertyChange('selected_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur sélection survol</Label>
              <ColorPicker
                color={properties.selected_hover_color || '#1F5AA0'}
                onChange={color => handlePropertyChange('selected_hover_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur non-sélectionné</Label>
              <ColorPicker
                color={properties.unselected_color || '#2B2B2B'}
                onChange={color => handlePropertyChange('unselected_color', color)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur non-sélectionné survol</Label>
              <ColorPicker
                color={properties.unselected_hover_color || '#3B3B3B'}
                onChange={color => handlePropertyChange('unselected_hover_color', color)}
              />
            </div>
          </div>
        )}

        {/* Table Properties */}
        {selectedWidget.type === 'table' && <TableProperties {...sectionProps} />}


        {/* Stat Card Properties */}
        {selectedWidget.type === 'statCard' && <StatCardProperties {...sectionProps} />}

        {/* StatCardWithProgress Properties */}
        {selectedWidget.type === 'statCardWithProgress' && <StatCardWithProgressProperties {...sectionProps} />}

        {/* MenuItem Properties */}
        {selectedWidget.type === 'menuItem' && <MenuItemProperties {...sectionProps} />}

        {/* ProductCard Properties */}
        {selectedWidget.type === 'productCard' && <ProductCardProperties {...sectionProps} />}

        {/* UserProfile Properties */}
        {selectedWidget.type === 'userProfile' && <UserProfileProperties {...sectionProps} />}

        {/* Chart Properties */}
        {selectedWidget.type === 'chart' && <ChartProperties {...sectionProps} />}


        {/* DatePicker Properties */}
        {selectedWidget.type === 'datepicker' && (
          <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sélecteur de Date</Label>

            <div className="space-y-2">
              <div>
                <Label>Format de Date</Label>
                <Select
                  value={properties.date_pattern || 'dd/mm/yyyy'}
                  onValueChange={v => handlePropertyChange('date_pattern', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">JJ/MM/AAAA</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/JJ/AAAA</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-JJ</SelectItem>
                    <SelectItem value="dd-mm-yyyy">JJ-MM-AAAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Premier jour de la semaine</Label>
                <Select
                  value={properties.firstweekday || 'monday'}
                  onValueChange={v => handlePropertyChange('firstweekday', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Lundi</SelectItem>
                    <SelectItem value="sunday">Dimanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Langue</Label>
                <Select
                  value={properties.locale || 'fr_FR'}
                  onValueChange={v => handlePropertyChange('locale', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr_FR">Français</SelectItem>
                    <SelectItem value="en_US">Anglais (US)</SelectItem>
                    <SelectItem value="en_GB">Anglais (UK)</SelectItem>
                    <SelectItem value="de_DE">Allemand</SelectItem>
                    <SelectItem value="es_ES">Espagnol</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={properties.showweeknumbers === true}
                  onCheckedChange={checked => handlePropertyChange('showweeknumbers', checked)}
                />
                <Label>Afficher numéros de semaine</Label>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fond En-tête</Label>
                <ColorPicker
                  color={properties.headersbackground || '#2563EB'}
                  onChange={color => handlePropertyChange('headersbackground', color)}
                />
              </div>
              <div>
                <Label>Texte En-tête</Label>
                <ColorPicker
                  color={properties.headersforeground || '#FFFFFF'}
                  onChange={color => handlePropertyChange('headersforeground', color)}
                />
              </div>
              <div>
                <Label>Fond Sélection</Label>
                <ColorPicker
                  color={properties.selectbackground || '#2563EB'}
                  onChange={color => handlePropertyChange('selectbackground', color)}
                />
              </div>
              <div>
                <Label>Texte Sélection</Label>
                <ColorPicker
                  color={properties.selectforeground || '#FFFFFF'}
                  onChange={color => handlePropertyChange('selectforeground', color)}
                />
              </div>
              <div>
                <Label>Couleur Bordure</Label>
                <ColorPicker
                  color={properties.bordercolor || '#565B5E'}
                  onChange={color => handlePropertyChange('bordercolor', color)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========== SECTION 3: APPARENCE ========== */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Palette className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Apparence</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">

            {/* Typographie */}
            {!['slider', 'progressbar', 'scrollbar', 'frame', 'scrollableframe', 'image', 'table'].includes(selectedWidget.type) && (
              <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Typographie</Label>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Police</Label>
                  <Select value={style.fontFamily || 'sans-serif'} onValueChange={v => handleStyleChange('fontFamily', v)}>
                    <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_FAMILIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Taille (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={style.fontSize || 13}
                    onValueChange={val => {
                      handleStyleChange('fontSize', val === '' ? 13 : Math.max(8, Number(val)));
                    }}
                    onFocus={e => e.target.select()}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Style</Label>
                  <ToggleGroup type="multiple" variant="outline" className="w-full justify-start bg-background/30 rounded-lg p-0.5" value={[...(style.fontWeight === 'bold' ? ['bold'] : []), ...(style.fontStyle === 'italic' ? ['italic'] : []), ...(style.textDecoration === 'underline' ? ['underline'] : [])]} onValueChange={(value) => {
                    handleStyleChange('fontWeight', value.includes('bold') ? 'bold' : 'normal');
                    handleStyleChange('fontStyle', value.includes('italic') ? 'italic' : 'normal');
                    handleStyleChange('textDecoration', value.includes('underline') ? 'underline' : 'none');
                  }}>
                    <ToggleGroupItem value="bold" aria-label="Gras" className="h-7 w-7"><Bold className="h-3.5 w-3.5" /></ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Italique" className="h-7 w-7"><Italic className="h-3.5 w-3.5" /></ToggleGroupItem>
                    <ToggleGroupItem value="underline" aria-label="Souligné" className="h-7 w-7"><Underline className="h-3.5 w-3.5" /></ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}

            {/* Couleurs */}
            {selectedWidget.type !== 'image' && (
              <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Couleurs</Label>
                {!['slider', 'progressbar', 'scrollbar', 'frame', 'scrollableframe'].includes(selectedWidget.type) && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Texte</Label>
                    <ColorPicker color={properties.text_color || style.textColor || '#DCE4EE'} onChange={color => { handleStyleChange('textColor', color); handlePropertyChange('text_color', color); }} />
                  </div>
                )}
                {!['radiobutton'].includes(selectedWidget.type) && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Fond</Label>
                    <ColorPicker color={properties.fg_color || style.backgroundColor || '#2B2B2B'} onChange={color => { handleStyleChange('backgroundColor', color); handlePropertyChange('fg_color', color); }} />
                  </div>
                )}
                {('hover_color' in properties || ['button', 'checkbox', 'radiobutton', 'switch', 'combobox', 'optionmenu'].includes(selectedWidget.type)) && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Survol</Label>
                    <ColorPicker color={properties.hover_color || style.hoverColor || '#1F5AA0'} onChange={color => { handleStyleChange('hoverColor', color); handlePropertyChange('hover_color', color); }} />
                  </div>
                )}
              </div>
            )}

            {/* Bordures & Arrondis */}
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bordures & Arrondis</Label>
              {isCtkStyleSupported(selectedWidget.type, 'border_width') && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Épaisseur de bordure</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.border_width ?? style.borderWidth ?? ''}
                    onValueChange={val => {
                      const num = val === '' ? 0 : Number(val);
                      handleStyleChange('borderWidth', num);
                      handlePropertyChange('border_width', num);
                    }}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
              )}
              {isCtkStyleSupported(selectedWidget.type, 'border_color') && (
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Couleur de bordure</Label>
                  <ColorPicker color={properties.border_color || style.borderColor || '#565B5E'} onChange={color => { handleStyleChange('borderColor', color); handlePropertyChange('border_color', color); }} />
                </div>
              )}
              <div>
                <Label className="text-[10px] text-muted-foreground">Arrondis des coins</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.corner_radius ?? style.borderRadius ?? ''}
                  onValueChange={val => {
                    const num = val === '' ? 0 : Number(val);
                    handleStyleChange('borderRadius', num);
                    handlePropertyChange('corner_radius', num);
                  }}
                  onFocus={e => e.target.select()}
                  placeholder="0"
                />
              </div>
            </div>

          </CollapsibleContent>
        </Collapsible>

        {/* ========== SECTION 4: CONFIGURATION SPÉCIFIQUE ========== */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Configuration</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">

          {/* ── État (universel) ── */}
          {['button', 'label', 'entry', 'passwordentry', 'textbox', 'checkbox', 'radiobutton', 'switch', 'combobox', 'optionmenu', 'segmentedbutton', 'slider', 'progressbar'].includes(selectedWidget.type) && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">État</Label>
              <div>
                <Label>État du widget</Label>
                <Select
                  value={properties.state || 'normal'}
                  onValueChange={v => handlePropertyChange('state', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="disabled">Désactivé</SelectItem>
                    {['entry', 'combobox'].includes(selectedWidget.type) && (
                      <SelectItem value="readonly">Lecture seule</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Label ── */}
          {(selectedWidget.type === 'label' || selectedWidget.type === 'image_label') && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Label</Label>
              <div>
                <Label>Ancrage du texte</Label>
                <Select
                  value={properties.anchor || 'center'}
                  onValueChange={v => handlePropertyChange('anchor', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="w">Gauche</SelectItem>
                    <SelectItem value="e">Droite</SelectItem>
                    <SelectItem value="n">Haut</SelectItem>
                    <SelectItem value="s">Bas</SelectItem>
                    <SelectItem value="nw">Haut-Gauche</SelectItem>
                    <SelectItem value="ne">Haut-Droite</SelectItem>
                    <SelectItem value="sw">Bas-Gauche</SelectItem>
                    <SelectItem value="se">Bas-Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Justification multi-ligne</Label>
                <Select
                  value={properties.justify || 'center'}
                  onValueChange={v => handlePropertyChange('justify', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Button ── */}
          {selectedWidget.type === 'button' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bouton</Label>
              <div>
                <Label>Ancrage du texte</Label>
                <Select
                  value={properties.anchor || 'center'}
                  onValueChange={v => handlePropertyChange('anchor', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="w">Gauche</SelectItem>
                    <SelectItem value="e">Droite</SelectItem>
                    <SelectItem value="n">Haut</SelectItem>
                    <SelectItem value="s">Bas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={properties.hover !== false}
                  onCheckedChange={checked => handlePropertyChange('hover', checked)}
                />
                <Label>Effet au survol</Label>
              </div>
            </div>
          )}

          {/* ── Entry ── */}
          {selectedWidget.type === 'entry' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Champ de saisie</Label>
              <div>
                <Label>Justification du texte</Label>
                <Select
                  value={properties.justify || 'left'}
                  onValueChange={v => handlePropertyChange('justify', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur du placeholder</Label>
                <ColorPicker
                  color={properties.placeholder_text_color || '#6B7280'}
                  onChange={color => handlePropertyChange('placeholder_text_color', color)}
                />
              </div>
            </div>
          )}

          {/* ── Textbox ── */}
          {selectedWidget.type === 'textbox' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Zone de texte</Label>
              <div>
                <Label>Retour à la ligne</Label>
                <Select
                  value={properties.wrap || 'word'}
                  onValueChange={v => handlePropertyChange('wrap', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Par mot</SelectItem>
                    <SelectItem value="char">Par caractère</SelectItem>
                    <SelectItem value="none">Aucun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={properties.activate_scrollbars !== false}
                  onCheckedChange={checked => handlePropertyChange('activate_scrollbars', checked)}
                />
                <Label>Barres de défilement</Label>
              </div>
              <div className="space-y-2">
                <Label>Couleur bouton scrollbar</Label>
                <ColorPicker
                  color={properties.scrollbar_button_color || '#4A4D50'}
                  onChange={color => handlePropertyChange('scrollbar_button_color', color)}
                />
              </div>
            </div>
          )}

          {/* ── CheckBox ── */}
          {selectedWidget.type === 'checkbox' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Checkbox</Label>
              <div className="space-y-2">
                <Label>Couleur Coche</Label>
                <ColorPicker
                  color={properties.checkmark_color || '#0F3460'}
                  onChange={color => handlePropertyChange('checkmark_color', color)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Largeur case (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.checkbox_width ?? 24}
                    onValueChange={val => handlePropertyChange('checkbox_width', val === '' ? 24 : Math.max(10, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="24"
                  />
                </div>
                <div>
                  <Label>Hauteur case (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.checkbox_height ?? 24}
                    onValueChange={val => handlePropertyChange('checkbox_height', val === '' ? 24 : Math.max(10, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="24"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Valeur cochée</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.onvalue ?? 1}
                    onValueChange={val => handlePropertyChange('onvalue', val === '' ? 1 : Number(val))}
                    onFocus={e => e.target.select()}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Valeur décochée</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.offvalue ?? 0}
                    onValueChange={val => handlePropertyChange('offvalue', val === '' ? 0 : Number(val))}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Switch ── */}
          {selectedWidget.type === 'switch' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Switch</Label>
              <div className="space-y-2">
                <Label>Couleur Progression</Label>
                <ColorPicker
                  color={properties.progress_color || '#0F3460'}
                  onChange={color => handlePropertyChange('progress_color', color)}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur Bouton</Label>
                <ColorPicker
                  color={properties.button_color || '#FFFFFF'}
                  onChange={color => handlePropertyChange('button_color', color)}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur Bouton Survol</Label>
                <ColorPicker
                  color={properties.button_hover_color || '#C0C2C5'}
                  onChange={color => handlePropertyChange('button_hover_color', color)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Largeur switch (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.switch_width ?? 36}
                    onValueChange={val => handlePropertyChange('switch_width', val === '' ? 36 : Math.max(20, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="36"
                  />
                </div>
                <div>
                  <Label>Hauteur switch (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.switch_height ?? 20}
                    onValueChange={val => handlePropertyChange('switch_height', val === '' ? 20 : Math.max(10, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="20"
                  />
                </div>
              </div>
              <div>
                <Label>Longueur bouton (px)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.button_length ?? 0}
                  onValueChange={val => handlePropertyChange('button_length', val === '' ? 0 : Math.max(0, Number(val)))}
                  onFocus={e => e.target.select()}
                  placeholder="0 (auto)"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Valeur activée</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.onvalue ?? 1}
                    onValueChange={val => handlePropertyChange('onvalue', val === '' ? 1 : Number(val))}
                    onFocus={e => e.target.select()}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Valeur désactivée</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.offvalue ?? 0}
                    onValueChange={val => handlePropertyChange('offvalue', val === '' ? 0 : Number(val))}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── RadioButton ── */}
          {selectedWidget.type === 'radiobutton' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">RadioButton</Label>
              <div className="space-y-2">
                <Label>Couleur Point</Label>
                <ColorPicker
                  color={properties.fg_color || '#0F3460'}
                  onChange={color => handlePropertyChange('fg_color', color)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Largeur radio (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.radiobutton_width ?? 22}
                    onValueChange={val => handlePropertyChange('radiobutton_width', val === '' ? 22 : Math.max(10, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="22"
                  />
                </div>
                <div>
                  <Label>Hauteur radio (px)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.radiobutton_height ?? 22}
                    onValueChange={val => handlePropertyChange('radiobutton_height', val === '' ? 22 : Math.max(10, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="22"
                  />
                </div>
              </div>
              <div>
                <Label>Valeur du bouton radio</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.value ?? 0}
                  onValueChange={val => handlePropertyChange('value', val === '' ? 0 : Number(val))}
                  onFocus={e => e.target.select()}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Bordure (non-coché)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.border_width_unchecked ?? 3}
                    onValueChange={val => handlePropertyChange('border_width_unchecked', val === '' ? 3 : Math.max(0, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label>Bordure (coché)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.border_width_checked ?? 6}
                    onValueChange={val => handlePropertyChange('border_width_checked', val === '' ? 6 : Math.max(0, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="6"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Slider ── */}
          {selectedWidget.type === 'slider' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Curseur (Slider)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Valeur min</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.from_ ?? 0}
                    onValueChange={val => handlePropertyChange('from_', val === '' ? 0 : Number(val))}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Valeur max</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.to ?? 100}
                    onValueChange={val => handlePropertyChange('to', val === '' ? 100 : Number(val))}
                    onFocus={e => e.target.select()}
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <Label>Valeur initiale</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.value ?? 50}
                  onValueChange={val => handlePropertyChange('value', val === '' ? 50 : Number(val))}
                  onFocus={e => e.target.select()}
                  placeholder="50"
                />
              </div>
              <div>
                <Label>Nombre de pas (0 = continu)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.number_of_steps ?? 0}
                  onValueChange={val => handlePropertyChange('number_of_steps', val === '' ? 0 : Math.max(0, Number(val)))}
                  onFocus={e => e.target.select()}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Orientation</Label>
                <Select
                  value={properties.orientation || 'horizontal'}
                  onValueChange={v => handlePropertyChange('orientation', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Couleur bouton</Label>
                <ColorPicker
                  color={properties.button_color || '#0F3460'}
                  onChange={color => handlePropertyChange('button_color', color)}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur bouton survol</Label>
                <ColorPicker
                  color={properties.button_hover_color || '#1F5AA0'}
                  onChange={color => handlePropertyChange('button_hover_color', color)}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur progression</Label>
                <ColorPicker
                  color={properties.progress_color || '#0F3460'}
                  onChange={color => handlePropertyChange('progress_color', color)}
                />
              </div>
              <div>
                <Label>Rayon bouton (px)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.button_corner_radius ?? 1000}
                  onValueChange={val => handlePropertyChange('button_corner_radius', val === '' ? 1000 : Math.max(0, Number(val)))}
                  onFocus={e => e.target.select()}
                  placeholder="1000"
                />
              </div>
            </div>
          )}

          {/* ── ProgressBar ── */}
          {selectedWidget.type === 'progressbar' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Barre de progression</Label>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Progression</Label>
                  <span className="text-[11px] font-mono text-muted-foreground">{properties.progress ?? 70}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[properties.progress ?? 70]}
                  onValueChange={([val]) => handlePropertyChange('progress', val)}
                  className="w-full"
                />
              </div>
              <div>
                <Label>Mode</Label>
                <Select
                  value={properties.mode || 'determinate'}
                  onValueChange={v => handlePropertyChange('mode', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="determinate">Déterminé</SelectItem>
                    <SelectItem value="indeterminate">Indéterminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orientation</Label>
                <Select
                  value={properties.orientation || 'horizontal'}
                  onValueChange={v => handlePropertyChange('orientation', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur progression</Label>
                <ColorPicker
                  color={properties.progress_color || '#0F3460'}
                  onChange={color => handlePropertyChange('progress_color', color)}
                />
              </div>
              {properties.mode === 'determinate' && (
                <div>
                  <Label>Vitesse déterminée (ms)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.determinate_speed ?? 1}
                    onValueChange={val => handlePropertyChange('determinate_speed', val === '' ? 1 : Math.max(0.1, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="1"
                  />
                </div>
              )}
              {properties.mode === 'indeterminate' && (
                <div>
                  <Label>Vitesse indéterminée (ms)</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={properties.indeterminate_speed ?? 0.5}
                    onValueChange={val => handlePropertyChange('indeterminate_speed', val === '' ? 0.5 : Math.max(0.1, Number(val)))}
                    onFocus={e => e.target.select()}
                    placeholder="0.5"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Scrollbar ── */}
          {selectedWidget.type === 'scrollbar' && (
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Barre de défilement</Label>
              <div>
                <Label>Orientation</Label>
                <Select
                  value={properties.orientation || 'vertical'}
                  onValueChange={v => handlePropertyChange('orientation', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur bouton</Label>
                <ColorPicker
                  color={properties.button_color || '#4A4D50'}
                  onChange={color => handlePropertyChange('button_color', color)}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur bouton survol</Label>
                <ColorPicker
                  color={properties.button_hover_color || '#565B5E'}
                  onChange={color => handlePropertyChange('button_hover_color', color)}
                />
              </div>
              <div>
                <Label>Espacement bordure (px)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.border_spacing ?? 2}
                  onValueChange={val => handlePropertyChange('border_spacing', val === '' ? 2 : Math.max(0, Number(val)))}
                  onFocus={e => e.target.select()}
                  placeholder="2"
                />
              </div>
              <div>
                <Label>Longueur min. pixel (px)</Label>
                <LazyInput
                  inputMode="numeric"
                  value={properties.minimum_pixel_length ?? 20}
                  onValueChange={val => handlePropertyChange('minimum_pixel_length', val === '' ? 20 : Math.max(5, Number(val)))}
                  onFocus={e => e.target.select()}
                  placeholder="20"
                />
              </div>
            </div>
          )}
          </CollapsibleContent>
        </Collapsible>
      </AccordionContent>

      {/* Rename image dialog — shown before confirming any image import */}
      <Dialog open={!!pendingImg} onOpenChange={(open) => { if (!open) { setPendingImg(null); setPendingImgName(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-indigo-500" />
              Nommer l'image
            </DialogTitle>
            <DialogDescription>
              Donnez un nom à cette image avant de l'importer. Elle sera ajoutée dans le dossier <strong>Images</strong> de l'explorateur.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="img-rename" className="text-sm font-medium mb-2 block">Nom du fichier</Label>
            <Input
              id="img-rename"
              value={pendingImgName}
              onChange={e => setPendingImgName(e.target.value)}
              placeholder="mon_image"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handlePendingImgConfirm(); if (e.key === 'Escape') { setPendingImg(null); setPendingImgName(''); } }}
            />
            <p className="text-xs text-muted-foreground mt-1.5">L'extension .png sera ajoutée automatiquement si absente.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPendingImg(null); setPendingImgName(''); }}>Annuler</Button>
            <Button onClick={handlePendingImgConfirm} disabled={!pendingImgName.trim()}>Importer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccordionItem>
  );
};
