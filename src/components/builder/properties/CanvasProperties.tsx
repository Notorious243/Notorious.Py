import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useWidgets } from '@/contexts/WidgetContext';
import { Square, Bold, Trash2, Upload, Link, MapPin, Target, Smartphone, Image as ImageIcon, ChevronRight, Ruler, Palette, Settings2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ColorPicker } from './ColorPicker';
import { LazyInput } from './ui/LazyInput';
import { AnimatedDropdown, type AnimatedDropdownOption } from '@/components/ui/animated-dropdown';

const PRESET_SIZES = [
  { label: '640 × 480', value: '640,480' },
  { label: '800 × 600', value: '800,600' },
  { label: '1024 × 768', value: '1024,768' },
  { label: '1280 × 720 (HD)', value: '1280,720' },
];

const LAYOUT_MODE_OPTIONS: AnimatedDropdownOption[] = [
  { value: 'absolute', label: 'Absolu', icon: <MapPin className="h-3.5 w-3.5" /> },
  { value: 'centered', label: 'Centre', icon: <Target className="h-3.5 w-3.5" /> },
  { value: 'responsive', label: 'Responsif', icon: <Smartphone className="h-3.5 w-3.5" /> },
];

export const CanvasProperties: React.FC = () => {
  const { canvasSettings, updateCanvasSettings } = useWidgets();
  const bgImageInputRef = React.useRef<HTMLInputElement>(null);
  const iconInputRef = React.useRef<HTMLInputElement>(null);
  const presetSelection = React.useMemo(() => {
    const target = `${canvasSettings.width},${canvasSettings.height}`;
    return PRESET_SIZES.find((size) => size.value === target)?.value;
  }, [canvasSettings.width, canvasSettings.height]);

  const handlePresetChange = (value: string) => {
    if (!value) return;
    const [width, height] = value.split(',').map(Number);
    updateCanvasSettings({ width, height });
  };
  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateCanvasSettings({ background_image_data: base64, background_image: '' });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleBackgroundUrl = () => {
    const url = window.prompt('URL de l\'image de fond');
    if (url && url.trim()) {
      updateCanvasSettings({ background_image: url.trim(), background_image_data: '' });
    }
  };

  const clearBackground = () => {
    updateCanvasSettings({ background_image_data: '', background_image: '' });
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateCanvasSettings({ icon_data: base64, icon_path: '' });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleIconUrl = () => {
    const url = window.prompt('URL du logo');
    if (url && url.trim()) {
      updateCanvasSettings({ icon_path: url.trim(), icon_data: '' });
    }
  };

  const clearIcon = () => {
    updateCanvasSettings({ icon_data: '', icon_path: '' });
  };

  const backgroundPreview = canvasSettings.background_image_data || canvasSettings.background_image;
  const iconPreview = canvasSettings.icon_data || canvasSettings.icon_path;

  return (
    <AccordionItem value="canvas" className="rounded-2xl border border-border bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Square className="h-4 w-4" />Propriétés du Canvas
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-3 space-y-3">

        {/* ── DIMENSIONS & TITRE ── */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Ruler className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Dimensions</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Taille</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Largeur</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={canvasSettings.width}
                    onValueChange={val => {
                      const updateVal = val === '' ? 400 : Math.max(300, Number(val));
                      updateCanvasSettings({ width: updateVal });
                    }}
                    onFocus={e => e.target.select()}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Hauteur</Label>
                  <LazyInput
                    inputMode="numeric"
                    value={canvasSettings.height}
                    onValueChange={val => {
                      const updateVal = val === '' ? 300 : Math.max(200, Number(val));
                      updateCanvasSettings({ height: updateVal });
                    }}
                    onFocus={e => e.target.select()}
                  />
                </div>
              </div>
              <AnimatedDropdown
                value={presetSelection}
                placeholder="Taille prédéfinie..."
                options={PRESET_SIZES.map((size) => ({ value: size.value, label: size.label }))}
                onValueChange={handlePresetChange}
              />
            </div>

            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-1.5">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Titre de la fenêtre</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={canvasSettings.title}
                  onChange={e => updateCanvasSettings({ title: e.target.value })}
                  placeholder="Nom de l'application"
                  className="h-8 text-xs bg-background/50"
                />
                <Toggle
                  pressed={canvasSettings.titleFontWeight === 'bold'}
                  onPressedChange={pressed => updateCanvasSettings({ titleFontWeight: pressed ? 'bold' : 'normal' })}
                  aria-label="Gras"
                  className="h-8 w-8"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Toggle>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── PARAMÈTRES ── */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Paramètres</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fenêtre</Label>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[10px] text-muted-foreground">Redimensionnable</Label>
                <Switch
                  checked={canvasSettings.resizable}
                  onCheckedChange={checked => updateCanvasSettings({ resizable: checked })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Mode de disposition</Label>
                <AnimatedDropdown
                  value={canvasSettings.layoutMode || 'absolute'}
                  options={LAYOUT_MODE_OPTIONS}
                  onValueChange={(value) =>
                    updateCanvasSettings({ layoutMode: value as 'absolute' | 'centered' | 'responsive' })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[10px] text-muted-foreground">Afficher la grille</Label>
                <Switch
                  checked={canvasSettings.gridVisible}
                  onCheckedChange={checked => updateCanvasSettings({ gridVisible: checked })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ── APPARENCE ── */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors group">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Palette className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Apparence</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Couleurs</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">En-tête</Label>
                  <ColorPicker
                    color={canvasSettings.headerBackgroundColor || '#2b2b2b'}
                    onChange={color => updateCanvasSettings({ headerBackgroundColor: color })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Fond</Label>
                  <ColorPicker
                    color={canvasSettings.backgroundColor || '#FFFFFF'}
                    onChange={color => updateCanvasSettings({ backgroundColor: color })}
                  />
                </div>
              </div>
            </div>

            {/* Image de fond */}
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Image de fond</Label>
                {backgroundPreview && (
                  <Button variant="ghost" size="sm" onClick={clearBackground} className="h-5 text-[10px] text-destructive hover:text-destructive px-1.5">
                    <Trash2 className="h-2.5 w-2.5 mr-0.5" />Retirer
                  </Button>
                )}
              </div>
              <input ref={bgImageInputRef} type="file" accept=".png,.jpg,.jpeg,.ico" className="hidden" onChange={handleBackgroundUpload} />
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs justify-start" onClick={() => bgImageInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1.5 shrink-0" />Fichier
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs justify-start" onClick={handleBackgroundUrl}>
                  <Link className="h-3 w-3 mr-1.5 shrink-0" />URL
                </Button>
              </div>
              {backgroundPreview && (
                <div className="h-14 border border-border/30 rounded-md overflow-hidden bg-muted/30">
                  <img src={backgroundPreview} alt="Fond" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Logo / Icône */}
            <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Logo / Icône</Label>
                {iconPreview && (
                  <Button variant="ghost" size="sm" onClick={clearIcon} className="h-5 text-[10px] text-destructive hover:text-destructive px-1.5">
                    <Trash2 className="h-2.5 w-2.5 mr-0.5" />Retirer
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`
                  w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-all
                  ${iconPreview
                    ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                    : 'border-border/60 bg-muted/20 dark:bg-muted/10'
                  }
                `}>
                  {iconPreview ? (
                    <img src={iconPreview} alt="Logo" className="w-8 h-8 object-contain" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    32×32 ou 64×64 px · PNG recommandé
                  </p>
                </div>
              </div>
              <input ref={iconInputRef} type="file" accept=".png,.jpg,.jpeg,.ico" className="hidden" onChange={handleIconUpload} />
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs justify-center gap-1" onClick={() => iconInputRef.current?.click()}>
                  <Upload className="h-3 w-3 shrink-0" />Fichier
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs justify-center gap-1" onClick={handleIconUrl}>
                  <Link className="h-3 w-3 shrink-0" />URL
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

      </AccordionContent>
    </AccordionItem>
  );
};
