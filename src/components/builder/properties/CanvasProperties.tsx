import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useWidgets } from '@/contexts/WidgetContext';
import { Square, Bold, Trash2, Upload, Link, MapPin, Target, Smartphone, Image as ImageIcon } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { LazyInput } from './ui/LazyInput';

const PRESET_SIZES = [
  { label: '640 × 480', value: '640,480' },
  { label: '800 × 600', value: '800,600' },
  { label: '1024 × 768', value: '1024,768' },
  { label: '1280 × 720 (HD)', value: '1280,720' },
];

export const CanvasProperties: React.FC = () => {
  const { canvasSettings, updateCanvasSettings } = useWidgets();
  const bgImageInputRef = React.useRef<HTMLInputElement>(null);
  const iconInputRef = React.useRef<HTMLInputElement>(null);

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
    <AccordionItem value="canvas">
      <AccordionTrigger className="px-4">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
          <Square className="h-4 w-4" />Propriétés du Canvas
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-3 space-y-3">

        {/* Dimensions */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dimensions</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Largeur</Label>
              <LazyInput
                inputMode="numeric"
                value={canvasSettings.width}
                onValueChange={val => {
                  const updateVal = val === '' ? 400 : Math.max(300, Number(val));
                  updateCanvasSettings({ width: updateVal });
                }}
                onFocus={e => e.target.select()}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Hauteur</Label>
              <LazyInput
                inputMode="numeric"
                value={canvasSettings.height}
                onValueChange={val => {
                  const updateVal = val === '' ? 300 : Math.max(200, Number(val));
                  updateCanvasSettings({ height: updateVal });
                }}
                onFocus={e => e.target.select()}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Taille prédéfinie..." /></SelectTrigger>
            <SelectContent>
              {PRESET_SIZES.map(size => (
                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Titre */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titre</Label>
          <div className="flex items-center gap-2">
            <Input
              value={canvasSettings.title}
              onChange={e => updateCanvasSettings({ title: e.target.value })}
              placeholder="Nom de l'application"
              className="h-8 text-xs"
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

        {/* Options fenêtre */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paramètres de la fenêtre</Label>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Redimensionnable</Label>
            <Switch
              checked={canvasSettings.resizable}
              onCheckedChange={checked => updateCanvasSettings({ resizable: checked })}
            />
          </div>

          <div>
            <Label className="text-xs">Mode de disposition</Label>
            <Select
              value={canvasSettings.layoutMode || 'absolute'}
              onValueChange={(value: 'absolute' | 'centered' | 'responsive') => updateCanvasSettings({ layoutMode: value })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Absolu</span>
                </SelectItem>
                <SelectItem value="centered">
                  <span className="flex items-center gap-1.5"><Target className="h-3 w-3" /> Centré</span>
                </SelectItem>
                <SelectItem value="responsive">
                  <span className="flex items-center gap-1.5"><Smartphone className="h-3 w-3" /> Responsif</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Apparence — colors side by side */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Couleurs</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">En-tête</Label>
              <ColorPicker
                color={canvasSettings.headerBackgroundColor || '#2b2b2b'}
                onChange={color => updateCanvasSettings({ headerBackgroundColor: color })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fond</Label>
              <ColorPicker
                color={canvasSettings.backgroundColor || '#FFFFFF'}
                onChange={color => updateCanvasSettings({ backgroundColor: color })}
              />
            </div>
          </div>
        </div>

        {/* Quadrillage */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quadrillage</Label>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Afficher la grille</Label>
            <Switch
              checked={canvasSettings.gridVisible}
              onCheckedChange={checked => updateCanvasSettings({ gridVisible: checked })}
            />
          </div>
        </div>

        {/* Image de fond */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Image de Fond</Label>
            {backgroundPreview && (
              <Button variant="ghost" size="sm" onClick={clearBackground} className="h-6 text-xs text-destructive hover:text-destructive px-2">
                <Trash2 className="h-3 w-3 mr-1" />Retirer
              </Button>
            )}
          </div>
          <input ref={bgImageInputRef} type="file" accept=".png,.jpg,.jpeg,.ico" className="hidden" onChange={handleBackgroundUpload} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs justify-start" onClick={() => bgImageInputRef.current?.click()}>
              <Upload className="h-3 w-3 mr-1.5 shrink-0" />Fichier
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs justify-start" onClick={handleBackgroundUrl}>
              <Link className="h-3 w-3 mr-1.5 shrink-0" />URL
            </Button>
          </div>
          {backgroundPreview && (
            <div className="h-16 border border-border/40 rounded-lg overflow-hidden bg-muted/30">
              <img src={backgroundPreview} alt="Fond" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Logo / Icône */}
        <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Logo / Icône</Label>
            {iconPreview && (
              <Button variant="ghost" size="sm" onClick={clearIcon} className="h-6 text-xs text-destructive hover:text-destructive px-2">
                <Trash2 className="h-3 w-3 mr-1" />Retirer
              </Button>
            )}
          </div>

          {/* Aperçu ou placeholder */}
          <div className="flex items-center gap-3">
            <div className={`
              w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all
              ${iconPreview
                ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                : 'border-border/60 bg-muted/20 dark:bg-muted/10'
              }
            `}>
              {iconPreview ? (
                <img src={iconPreview} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-medium text-foreground truncate">
                {iconPreview ? 'Logo appliqué' : 'Aucun logo'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                32×32 ou 64×64 px · PNG transparent recommandé
              </p>
            </div>
          </div>

          {/* Boutons d'import */}
          <input ref={iconInputRef} type="file" accept=".png,.jpg,.jpeg,.ico" className="hidden" onChange={handleIconUpload} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs justify-center gap-1.5 font-medium"
              onClick={() => iconInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 shrink-0" />
              Fichier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs justify-center gap-1.5 font-medium"
              onClick={handleIconUrl}
            >
              <Link className="h-3.5 w-3.5 shrink-0" />
              URL
            </Button>
          </div>
        </div>

      </AccordionContent>
    </AccordionItem>
  );
};
