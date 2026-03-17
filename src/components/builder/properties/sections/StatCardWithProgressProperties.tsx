import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FONT_FAMILIES } from '@/constants/widgets';
import { ColorPicker } from '../ColorPicker';
import { LazyInput } from '../ui/LazyInput';
import { WidgetPropertySectionProps } from '../widget-properties-shared';

export const StatCardWithProgressProperties: React.FC<WidgetPropertySectionProps> = ({
  properties,
  handlePropertyChange,
  handleNumericPropertyBlur,
}) => {
  return (
    <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-4">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carte Stat + Barre</Label>

      {/* Contenu */}
      <div className="space-y-3">
        <div>
          <Label>Titre</Label>
          <Input value={properties.title || ''} onChange={e => handlePropertyChange('title', e.target.value)} placeholder="Ventes Totales" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Valeur</Label>
            <Input value={properties.value || ''} onChange={e => handlePropertyChange('value', e.target.value)} placeholder="125" />
          </div>
          <div>
            <Label>Légende</Label>
            <Input value={properties.caption || ''} onChange={e => handlePropertyChange('caption', e.target.value)} placeholder="Durant la période" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Barre de progression */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progression</Label>
        <div>
          <Label>Valeur (0 à 1)</Label>
          <LazyInput
            value={properties.progressValue ?? 0.65}
            inputMode="decimal"
            onValueChange={val => {
              const num = parseFloat(String(val));
              if (!isNaN(num)) {
                handlePropertyChange('progressValue', Math.max(0, Math.min(1, num)));
              }
            }}
          />
          <div className="mt-2 w-full h-2 rounded-full overflow-hidden bg-muted/40">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(0, Math.min(1, Number(properties.progressValue) || 0.65)) * 100}%`,
                backgroundColor: properties.progressColor || '#166534',
              }}
            />
          </div>
        </div>
        <div>
          <Label>Couleur Barre</Label>
          <ColorPicker color={properties.progressColor || '#166534'} onChange={color => handlePropertyChange('progressColor', color)} />
        </div>
      </div>

      <Separator />

      {/* Typographie */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Typographie</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Police Titre</Label>
            <Select value={properties.titleFont || 'Poppins'} onValueChange={value => handlePropertyChange('titleFont', value)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Police Valeur</Label>
            <Select value={properties.valueFont || 'Poppins'} onValueChange={value => handlePropertyChange('valueFont', value)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Police Légende</Label>
            <Select value={properties.captionFont || 'Poppins'} onValueChange={value => handlePropertyChange('captionFont', value)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Taille Titre</Label>
            <LazyInput value={properties.titleFontSize ?? 12} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('titleFontSize', val, 12)} />
          </div>
          <div>
            <Label className="text-xs">Taille Valeur</Label>
            <LazyInput value={properties.valueFontSize ?? 28} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('valueFontSize', val, 28)} />
          </div>
          <div>
            <Label className="text-xs">Taille Légende</Label>
            <LazyInput value={properties.captionFontSize ?? 11} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('captionFontSize', val, 11)} />
          </div>
        </div>
        <div>
          <Label>Rayon des Coins</Label>
          <LazyInput value={properties.cornerRadius ?? 16} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('cornerRadius', val, 16, 0)} />
        </div>
      </div>

      <Separator />

      {/* Couleurs */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Couleurs</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fond</Label>
            <ColorPicker color={properties.backgroundColor || '#FFFFFF'} onChange={color => handlePropertyChange('backgroundColor', color)} />
          </div>
          <div>
            <Label>Valeur</Label>
            <ColorPicker color={properties.valueColor || '#0F172A'} onChange={color => handlePropertyChange('valueColor', color)} />
          </div>
          <div>
            <Label>Titre</Label>
            <ColorPicker color={properties.titleColor || '#64748B'} onChange={color => handlePropertyChange('titleColor', color)} />
          </div>
          <div>
            <Label>Légende</Label>
            <ColorPicker color={properties.captionColor || '#94A3B8'} onChange={color => handlePropertyChange('captionColor', color)} />
          </div>
        </div>
      </div>
    </div>
  );
};
