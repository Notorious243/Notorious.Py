import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trash2, 
  Copy, 
  FileText, 
  Palette, 
  Move, 
  Maximize2,
  Type,
  Settings,
  Image as ImageIcon,
  Monitor,
  Ruler,
  LayoutGrid,
  ArrowDown,
  ArrowRight,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  StretchHorizontal,
  Anchor,
} from 'lucide-react';
import { useWidgets } from '@/contexts/WidgetContext';
import { FONT_FAMILIES } from '@/constants/widgets';
import { AutoLayoutConfig, DEFAULT_AUTO_LAYOUT, AutoLayoutDirection, AutoLayoutAlignment, AutoLayoutDistribution, WidgetConstraints, DEFAULT_CONSTRAINTS, AutoLayoutChildOverrides } from '@/types/widget';

export const PropertiesPanel: React.FC = () => {
  const { widgets, selectedWidgetId, canvasSettings, updateWidget, updateCanvasSettings, deleteWidget, addWidget, selectWidget } = useWidgets();
  
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);

  const updateWidgetProperty = (property: string, value: any) => {
    if (selectedWidget) {
      updateWidget(selectedWidget.id, {
        properties: {
          ...selectedWidget.properties,
          [property]: value,
        },
      });
    }
  };

  const updateWidgetStyle = (property: string, value: any) => {
    if (selectedWidget) {
      updateWidget(selectedWidget.id, {
        style: {
          ...selectedWidget.style,
          [property]: value,
        },
      });
    }
  };

  const updateWidgetSize = (dimension: 'width' | 'height', value: number) => {
    if (selectedWidget) {
      updateWidget(selectedWidget.id, {
        size: {
          ...selectedWidget.size,
          [dimension]: value,
        },
      });
    }
  };

  const updateWidgetPosition = (axis: 'x' | 'y', value: number) => {
    if (selectedWidget) {
      updateWidget(selectedWidget.id, {
        position: {
          ...selectedWidget.position,
          [axis]: value,
        },
      });
    }
  };

  const duplicateWidget = () => {
    if (selectedWidget) {
      const newWidget = {
        ...selectedWidget,
        id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        position: {
          x: selectedWidget.position.x + 20,
          y: selectedWidget.position.y + 20,
        },
      };
      addWidget(newWidget);
      selectWidget(newWidget.id);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bgImageInputRef = React.useRef<HTMLInputElement>(null);
  const iconInputRef = React.useRef<HTMLInputElement>(null);

  const renderWidgetSpecificProperties = () => {
    if (!selectedWidget) return null;

    const { type, properties } = selectedWidget;

    switch (type) {
      case 'button':
      case 'label':
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Text</span>
              </div>
              <div>
                <Label htmlFor="text" className="text-xs text-muted-foreground">Contenu</Label>
                <Input 
                  id="text" 
                  value={properties.text || ''} 
                  onChange={(e) => updateWidgetProperty('text', e.target.value)} 
                  placeholder="Entrer du texte..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'entry':
      case 'textbox':
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Champ de Saisie</span>
              </div>
              <div>
                <Label htmlFor="placeholder" className="text-xs text-muted-foreground">Texte Indicatif</Label>
                <Input 
                  id="placeholder" 
                  value={properties.placeholder_text || ''} 
                  onChange={(e) => updateWidgetProperty('placeholder_text', e.target.value)} 
                  placeholder="Texte indicatif..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'image_label':
        const handleImageLabelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              updateWidgetProperty('image_data', base64);
              updateWidgetProperty('image_path', '');
              // Image uploaded successfully
            };
            reader.onerror = () => {
              console.error('❌ Error reading image');
            };
            reader.readAsDataURL(file);
          }
        };

        const clearImageLabel = () => {
          updateWidgetProperty('image_data', '');
          updateWidgetProperty('image_path', '');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };
        
        const triggerFileInput = () => {
          fileInputRef.current?.click();
        };

        const hasImageLabel = properties.image_data || properties.image_path;
        const imageLabelSize = properties.image_size || [200, 200];

        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">CTkImage - Chargement Image</span>
              </div>
              
              {/* BOUTON UPLOAD - PRINCIPAL */}
              <div className="space-y-3">
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <Label className="text-sm font-semibold text-primary mb-3 block">📁 Charger Image</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.ico"
                    onChange={handleImageLabelUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={triggerFileInput}
                      className="flex-1 h-12 text-base font-semibold"
                    >
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Choisir Image
                    </Button>
                    {hasImageLabel && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearImageLabel}
                        title="Supprimer l'image"
                        className="h-12 w-12"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  {properties.image_data && (
                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ✓ Image chargée avec succès !
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
              
              {/* Texte optionnel */}
              <div>
                <Label htmlFor="image_label_text" className="text-xs text-muted-foreground">Texte (optionnel)</Label>
                <Input 
                  id="image_label_text" 
                  value={properties.text || ''} 
                  onChange={(e) => updateWidgetProperty('text', e.target.value)} 
                  placeholder="Laisser vide pour image seule"
                  className="mt-1.5"
                />
              </div>

              {/* Position texte/image */}
              {properties.text && (
                <div>
                  <Label className="text-xs text-muted-foreground">Position du Texte</Label>
                  <Select 
                    value={properties.compound || 'center'} 
                    onValueChange={(value) => updateWidgetProperty('compound', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Haut</SelectItem>
                      <SelectItem value="bottom">Bas</SelectItem>
                      <SelectItem value="left">Gauche</SelectItem>
                      <SelectItem value="right">Droite</SelectItem>
                      <SelectItem value="center">Centré (image seule)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />
              
              {/* Taille de l'image */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Largeur Image : {imageLabelSize[0]}px</Label>
                  <Slider 
                    value={[imageLabelSize[0]]} 
                    onValueChange={([value]) => updateWidgetProperty('image_size', [value, imageLabelSize[1]])} 
                    min={20} 
                    max={500} 
                    step={10}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hauteur Image : {imageLabelSize[1]}px</Label>
                  <Slider 
                    value={[imageLabelSize[1]]} 
                    onValueChange={([value]) => updateWidgetProperty('image_size', [imageLabelSize[0], value])} 
                    min={20} 
                    max={500} 
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Coins arrondis */}
              <div>
                <Label className="text-xs text-muted-foreground">Rayon des Coins : {properties.corner_radius || 0}px</Label>
                <Slider 
                  value={[properties.corner_radius || 0]} 
                  onValueChange={([value]) => updateWidgetProperty('corner_radius', value)} 
                  min={0} 
                  max={100} 
                  step={1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'combobox':
      case 'optionmenu':
      case 'segmentedbutton':
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Options</span>
              </div>
              <div>
                <Label htmlFor="values" className="text-xs text-muted-foreground">
                  Valeurs (une par ligne)
                </Label>
                <textarea 
                  id="values" 
                  className="w-full p-2.5 border rounded-md text-sm bg-background mt-1.5 min-h-[120px] font-mono"
                  value={(properties.values || []).join('\n')} 
                  onChange={(e) => updateWidgetProperty('values', e.target.value.split('\n').filter(Boolean))} 
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'checkbox':
      case 'radiobutton':
      case 'switch':
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contenu</span>
              </div>
              <div>
                <Label htmlFor="text" className="text-xs text-muted-foreground">Libellé</Label>
                <Input 
                  id="text" 
                  value={properties.text || ''} 
                  onChange={(e) => updateWidgetProperty('text', e.target.value)} 
                  placeholder="Texte du contrôle..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'slider':
        return (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Plage de Valeurs</span>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Minimum : {properties.from_ || 0}</Label>
                <Slider 
                  value={[properties.from_ || 0]} 
                  onValueChange={([value]) => updateWidgetProperty('from_', value)} 
                  min={-100} 
                  max={100} 
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Maximum : {properties.to || 100}</Label>
                <Slider 
                  value={[properties.to || 100]} 
                  onValueChange={([value]) => updateWidgetProperty('to', value)} 
                  min={0} 
                  max={200} 
                  step={1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'frame':
      case 'scrollableframe':
      case 'tabview': {
        const autoLayout: AutoLayoutConfig = selectedWidget.autoLayout ?? { ...DEFAULT_AUTO_LAYOUT };
        const updateAutoLayout = (updates: Partial<AutoLayoutConfig>) => {
          updateWidget(selectedWidget.id, {
            autoLayout: { ...autoLayout, ...updates },
          });
        };

        return (
          <div className="space-y-4">
            {/* Auto Layout Section */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-medium">Auto Layout</span>
                  </div>
                  <Switch
                    checked={autoLayout.enabled}
                    onCheckedChange={(enabled) => updateAutoLayout({ enabled })}
                  />
                </div>

                {autoLayout.enabled && (
                  <>
                    <Separator />

                    {/* Direction */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Direction</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={autoLayout.direction === 'vertical' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => updateAutoLayout({ direction: 'vertical' as AutoLayoutDirection })}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                          Vertical
                        </Button>
                        <Button
                          variant={autoLayout.direction === 'horizontal' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => updateAutoLayout({ direction: 'horizontal' as AutoLayoutDirection })}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Horizontal
                        </Button>
                      </div>
                    </div>

                    {/* Spacing */}
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Espacement : {autoLayout.spacing}px
                      </Label>
                      <Slider
                        value={[autoLayout.spacing]}
                        onValueChange={([value]) => updateAutoLayout({ spacing: value })}
                        min={0}
                        max={40}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <Separator />

                    {/* Padding */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Padding Interne</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Haut</Label>
                          <Input
                            type="number"
                            value={autoLayout.padding_top}
                            onChange={(e) => updateAutoLayout({ padding_top: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Bas</Label>
                          <Input
                            type="number"
                            value={autoLayout.padding_bottom}
                            onChange={(e) => updateAutoLayout({ padding_bottom: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Gauche</Label>
                          <Input
                            type="number"
                            value={autoLayout.padding_left}
                            onChange={(e) => updateAutoLayout({ padding_left: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Droite</Label>
                          <Input
                            type="number"
                            value={autoLayout.padding_right}
                            onChange={(e) => updateAutoLayout({ padding_right: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Alignment */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Alignement</Label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['start', 'center', 'end', 'stretch'] as AutoLayoutAlignment[]).map((align) => (
                          <Button
                            key={align}
                            variant={autoLayout.alignment === align ? 'default' : 'outline'}
                            size="sm"
                            className="text-[10px] px-1 h-7"
                            onClick={() => updateAutoLayout({ alignment: align })}
                          >
                            {align === 'start' && <AlignStartHorizontal className="h-3 w-3" />}
                            {align === 'center' && <AlignCenterHorizontal className="h-3 w-3" />}
                            {align === 'end' && <AlignEndHorizontal className="h-3 w-3" />}
                            {align === 'stretch' && <StretchHorizontal className="h-3 w-3" />}
                          </Button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-center capitalize">{autoLayout.alignment}</p>
                    </div>

                    {/* Distribution */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Distribution</Label>
                      <Select
                        value={autoLayout.distribution}
                        onValueChange={(value) => updateAutoLayout({ distribution: value as AutoLayoutDistribution })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="packed">Packed</SelectItem>
                          <SelectItem value="space_between">Space Between</SelectItem>
                          <SelectItem value="space_around">Space Around</SelectItem>
                          <SelectItem value="space_evenly">Space Evenly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Standard config */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Configuration</span>
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Utilisez les propriétés de style et de position pour personnaliser ce conteneur.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune propriété spécifique pour ce widget.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  const renderProperties = () => {
    if (!selectedWidget) {
      const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateCanvasSettings({ background_image_data: base64, background_image: '' });
          };
          reader.readAsDataURL(file);
        }
      };

      const handleBgImageUrl = () => {
        if (typeof window === 'undefined') return;
        const input = window.prompt('Entrer l\'URL de l\'image de fond :', canvasSettings.background_image || '');
        const url = input?.trim();
        if (!url) return;
        updateCanvasSettings({ background_image: url, background_image_data: '' });
      };

      const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateCanvasSettings({ icon_data: base64, icon_path: '' });
          };
          reader.readAsDataURL(file);
        }
      };

      const handleIconUrl = () => {
        if (typeof window === 'undefined') return;
        const input = window.prompt('Entrer l\'URL du logo :', canvasSettings.icon_path || '');
        const url = input?.trim();
        if (!url) return;
        updateCanvasSettings({ icon_path: url, icon_data: '' });
      };

      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Paramètres du Canvas</span>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="canvas-title" className="text-xs text-muted-foreground">Titre de la Fenêtre</Label>
                  <Input 
                    id="canvas-title" 
                    value={canvasSettings.title} 
                    onChange={(e) => updateCanvasSettings({ title: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="canvas-width" className="text-xs text-muted-foreground">Largeur</Label>
                    <Input 
                      id="canvas-width" 
                      type="number" 
                      value={canvasSettings.width} 
                      onChange={(e) => updateCanvasSettings({ width: parseInt(e.target.value) || 800 })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="canvas-height" className="text-xs text-muted-foreground">Hauteur</Label>
                    <Input 
                      id="canvas-height" 
                      type="number" 
                      value={canvasSettings.height} 
                      onChange={(e) => updateCanvasSettings({ height: parseInt(e.target.value) || 600 })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 px-1">
                  <Label htmlFor="resizable" className="text-xs text-muted-foreground cursor-pointer">
                    Fenêtre Redimensionnable
                  </Label>
                  <Switch 
                    id="resizable" 
                    checked={canvasSettings.resizable} 
                    onCheckedChange={(resizable) => updateCanvasSettings({ resizable })} 
                  />
                </div>

                <Separator />

                {/* Image de fond du canvas - AMÉLIORÉE */}
                <div className="space-y-3">
                  <div className="p-4 bg-violet-500/5 border-2 border-violet-500/20 rounded-lg">
                    <Label className="text-sm font-semibold text-violet-600 mb-3 block">🖼️ Image de Fond</Label>
                    <input
                      ref={bgImageInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.ico"
                      onChange={handleBgImageUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Button
                        type="button"
                        onClick={() => bgImageInputRef.current?.click()}
                        className="h-12"
                        variant="outline"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Fichier Local
                      </Button>
                      <Button
                        type="button"
                        onClick={handleBgImageUrl}
                        variant="outline"
                        className="h-12"
                      >
                        🌐 URL Image
                      </Button>
                    </div>
                    {canvasSettings.background_image_data && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => updateCanvasSettings({ background_image_data: '', background_image: '' })}
                        className="w-full h-10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer l'image de fond
                      </Button>
                    )}
                    {canvasSettings.background_image_data && (
                      <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ✓ Image de fond chargée !
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Logo de l'application - AMÉLIORÉ */}
                <div className="space-y-3">
                  <div className="p-4 bg-purple-500/5 border-2 border-purple-500/20 rounded-lg">
                    <Label className="text-sm font-semibold text-purple-600 mb-3 block">🎯 Logo de l'App</Label>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.ico"
                      onChange={handleIconUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Button
                        type="button"
                        onClick={() => iconInputRef.current?.click()}
                        className="h-12"
                        variant="outline"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Fichier Local
                      </Button>
                      <Button
                        type="button"
                        onClick={handleIconUrl}
                        variant="outline"
                        className="h-12"
                      >
                        🌐 URL Logo
                      </Button>
                    </div>
                    {canvasSettings.icon_data && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => updateCanvasSettings({ icon_data: '', icon_path: '' })}
                        className="w-full h-10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer le logo
                      </Button>
                    )}
                    {canvasSettings.icon_data && (
                      <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ✓ Logo chargé !
                        </p>
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={canvasSettings.icon_data} 
                            alt="Logo preview" 
                            className="w-8 h-8 rounded object-contain border border-border"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="properties" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs">Contenu</span>
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span className="text-xs">Style</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-1.5">
            <Move className="h-3.5 w-3.5" />
            <span className="text-xs">Disposition</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4 mt-0">
          {renderWidgetSpecificProperties()}
        </TabsContent>

        <TabsContent value="style" className="space-y-4 mt-0">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-3">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Typographie</span>
              </div>
              
              <div>
                <Label htmlFor="font-family" className="text-xs text-muted-foreground">Police</Label>
                <Select 
                  value={selectedWidget.style.fontFamily || 'Roboto'} 
                  onValueChange={(value) => updateWidgetStyle('fontFamily', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Taille : {selectedWidget.style.fontSize || 14}px
                </Label>
                <Slider 
                  value={[selectedWidget.style.fontSize || 14]} 
                  onValueChange={([value]) => updateWidgetStyle('fontSize', value)} 
                  min={8} 
                  max={48} 
                  step={1}
                  className="mt-2"
                />
              </div>

              <Separator />

              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Couleurs</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="text-color" className="text-xs text-muted-foreground">Texte</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input 
                      id="text-color" 
                      type="color" 
                      value={selectedWidget.style.textColor || '#000000'} 
                      onChange={(e) => updateWidgetStyle('textColor', e.target.value)} 
                      className="h-10 w-full p-1 cursor-pointer"
                    />
                  </div>
                </div>
                {!['button', 'label'].includes(selectedWidget.type) && (
                <div>
                  <Label htmlFor="bg-color" className="text-xs text-muted-foreground">Fond</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input 
                      id="bg-color" 
                      type="color" 
                      value={selectedWidget.style.backgroundColor || '#ffffff'} 
                      onChange={(e) => updateWidgetStyle('backgroundColor', e.target.value)} 
                      className="h-10 w-full p-1 cursor-pointer"
                    />
                  </div>
                </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-2 mb-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bordure & Coins</span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Rayon des Coins : {selectedWidget.style.borderRadius ?? 0}px
                </Label>
                <Slider 
                  value={[selectedWidget.style.borderRadius ?? 0]} 
                  onValueChange={([value]) => updateWidgetStyle('borderRadius', value)} 
                  min={0} 
                  max={50} 
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Largeur Bordure : {selectedWidget.style.borderWidth ?? 0}px
                </Label>
                <Slider 
                  value={[selectedWidget.style.borderWidth ?? 0]} 
                  onValueChange={([value]) => updateWidgetStyle('borderWidth', value)} 
                  min={0} 
                  max={10} 
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="border-color" className="text-xs text-muted-foreground">Couleur Bordure</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input 
                    id="border-color" 
                    type="color" 
                    value={selectedWidget.style.borderColor || '#565B5E'} 
                    onChange={(e) => updateWidgetStyle('borderColor', e.target.value)} 
                    className="h-10 w-full p-1 cursor-pointer"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 mb-3">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Espacement & Opacité</span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Marge Interne (padding) : {selectedWidget.style.padding ?? 0}px
                </Label>
                <Slider 
                  value={[selectedWidget.style.padding ?? 0]} 
                  onValueChange={([value]) => updateWidgetStyle('padding', value)} 
                  min={0} 
                  max={40} 
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Marge Externe (margin) : {selectedWidget.style.margin ?? 0}px
                </Label>
                <Slider 
                  value={[selectedWidget.style.margin ?? 0]} 
                  onValueChange={([value]) => updateWidgetStyle('margin', value)} 
                  min={0} 
                  max={40} 
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Opacité : {Math.round((selectedWidget.style.opacity ?? 1) * 100)}%
                </Label>
                <Slider 
                  value={[Math.round((selectedWidget.style.opacity ?? 1) * 100)]} 
                  onValueChange={([value]) => updateWidgetStyle('opacity', value / 100)} 
                  min={0} 
                  max={100} 
                  step={5}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 mt-0">
          {/* Position */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-3">
                <Move className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Position</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pos-x" className="text-xs text-muted-foreground">Axe X</Label>
                  <Input 
                    id="pos-x" 
                    type="number" 
                    value={selectedWidget.position.x} 
                    onChange={(e) => updateWidgetPosition('x', parseInt(e.target.value) || 0)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="pos-y" className="text-xs text-muted-foreground">Axe Y</Label>
                  <Input 
                    id="pos-y" 
                    type="number" 
                    value={selectedWidget.position.y} 
                    onChange={(e) => updateWidgetPosition('y', parseInt(e.target.value) || 0)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 mb-3">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Dimensions</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="size-w" className="text-xs text-muted-foreground">Largeur</Label>
                  <Input 
                    id="size-w" 
                    type="number" 
                    value={selectedWidget.size.width} 
                    onChange={(e) => updateWidgetSize('width', parseInt(e.target.value) || 100)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="size-h" className="text-xs text-muted-foreground">Hauteur</Label>
                  <Input 
                    id="size-h" 
                    type="number" 
                    value={selectedWidget.size.height} 
                    onChange={(e) => updateWidgetSize('height', parseInt(e.target.value) || 32)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Constraints (Phase 3) */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Contraintes</span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-2">
                Attacher le widget aux bords lors du redimensionnement
              </p>

              {(() => {
                const constraints = selectedWidget.constraints ?? { ...DEFAULT_CONSTRAINTS };
                const updateConstraint = (key: keyof WidgetConstraints, value: boolean) => {
                  updateWidget(selectedWidget.id, {
                    constraints: { ...constraints, [key]: value },
                  });
                };

                return (
                  <div className="flex justify-center">
                    <div className="relative w-[120px] h-[120px]">
                      {/* Visual box */}
                      <div className="absolute inset-[28px] rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20" />
                      {/* Top */}
                      <button
                        onClick={() => updateConstraint('top', !constraints.top)}
                        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[28px] rounded-full transition-colors ${constraints.top ? 'bg-violet-500' : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
                        title="Contrainte Haut"
                      />
                      {/* Bottom */}
                      <button
                        onClick={() => updateConstraint('bottom', !constraints.bottom)}
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-[28px] rounded-full transition-colors ${constraints.bottom ? 'bg-violet-500' : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
                        title="Contrainte Bas"
                      />
                      {/* Left */}
                      <button
                        onClick={() => updateConstraint('left', !constraints.left)}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-[3px] w-[28px] rounded-full transition-colors ${constraints.left ? 'bg-violet-500' : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
                        title="Contrainte Gauche"
                      />
                      {/* Right */}
                      <button
                        onClick={() => updateConstraint('right', !constraints.right)}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 h-[3px] w-[28px] rounded-full transition-colors ${constraints.right ? 'bg-violet-500' : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
                        title="Contrainte Droite"
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-4 gap-1 text-center">
                {(['top', 'bottom', 'left', 'right'] as const).map((side) => {
                  const c = selectedWidget.constraints ?? DEFAULT_CONSTRAINTS;
                  return (
                    <div key={side} className="text-[10px]">
                      <span className={c[side] ? 'text-violet-500 font-semibold' : 'text-muted-foreground'}>
                        {side === 'top' ? 'Haut' : side === 'bottom' ? 'Bas' : side === 'left' ? 'Gauche' : 'Droite'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Auto Layout Child Overrides (visible if parent has auto-layout) */}
          {(() => {
            const parentWidget = selectedWidget.parentId ? widgets.find(w => w.id === selectedWidget.parentId) : null;
            const parentHasAutoLayout = parentWidget?.autoLayout?.enabled === true;
            if (!parentHasAutoLayout) return null;

            const childOverrides: AutoLayoutChildOverrides = selectedWidget.autoLayoutChild ?? {};
            const updateChildOverride = (updates: Partial<AutoLayoutChildOverrides>) => {
              updateWidget(selectedWidget.id, {
                autoLayoutChild: { ...childOverrides, ...updates },
              });
            };

            return (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-medium">Auto Layout (enfant)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Remplir la largeur</Label>
                    <Switch
                      checked={childOverrides.fill_width ?? false}
                      onCheckedChange={(v) => updateChildOverride({ fill_width: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Remplir la hauteur</Label>
                    <Switch
                      checked={childOverrides.fill_height ?? false}
                      onCheckedChange={(v) => updateChildOverride({ fill_height: v })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Alignement propre</Label>
                    <Select
                      value={childOverrides.align_self ?? 'inherit'}
                      onValueChange={(v) => updateChildOverride({ align_self: v === 'inherit' ? undefined : v as AutoLayoutAlignment })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit">Hériter du parent</SelectItem>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Propriétés</h2>
          </div>
          {selectedWidget && (
            <div className="flex gap-1.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={duplicateWidget}
                title="Dupliquer"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive" 
                onClick={() => deleteWidget(selectedWidget.id)}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {selectedWidget && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
              {selectedWidget.type}
            </span>
            <span className="text-xs text-muted-foreground">
              #{selectedWidget.id.slice(-8)}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderProperties()}
        </div>
      </ScrollArea>
    </div>
  );
};
