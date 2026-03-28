import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Upload, Trash2 } from 'lucide-react';
import { FONT_FAMILIES } from '@/constants/widgets';
import { ICON_OPTIONS, normalizeIconKey } from '@/constants/icons';
import { ColorPicker } from '../ColorPicker';
import { LazyInput } from '../ui/LazyInput';
import { WidgetPropertySectionProps } from '../widget-properties-shared';

export const StatCardProperties: React.FC<WidgetPropertySectionProps> = ({
  properties,
  handlePropertyChange,
  handleBatchPropertyChange,
  handleNumericPropertyBlur,
}) => {
  const iconValue = normalizeIconKey(properties.icon);

  return (
    <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-3">
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Carte Statistique</Label>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Titre</Label>
          <Input
            value={properties.title || ''}
            onChange={e => handlePropertyChange('title', e.target.value)}
            placeholder="Total Patients"
          />
        </div>
        <div>
          <Label>Valeur</Label>
          <Input
            value={properties.value || ''}
            onChange={e => handlePropertyChange('value', e.target.value)}
            placeholder="1,234"
          />
        </div>
        <div>
          <Label>Légende</Label>
          <Input
            value={properties.caption || ''}
            onChange={e => handlePropertyChange('caption', e.target.value)}
            placeholder="Depuis ce mois"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Police Titre</Label>
          <Select value={properties.titleFont || 'Poppins'} onValueChange={value => handlePropertyChange('titleFont', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Police Valeur</Label>
          <Select value={properties.valueFont || 'Poppins'} onValueChange={value => handlePropertyChange('valueFont', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Police Légende</Label>
          <Select value={properties.captionFont || 'Poppins'} onValueChange={value => handlePropertyChange('captionFont', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Taille Titre</Label>
          <LazyInput value={properties.titleFontSize ?? 13} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('titleFontSize', val, 13)} />
        </div>
        <div>
          <Label>Taille Valeur</Label>
          <LazyInput value={properties.valueFontSize ?? 32} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('valueFontSize', val, 32)} />
        </div>
        <div>
          <Label>Taille Légende</Label>
          <LazyInput value={properties.captionFontSize ?? 12} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('captionFontSize', val, 12)} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Couleur de Fond</Label>
          <ColorPicker color={properties.backgroundColor || '#FFFFFF'} onChange={color => handlePropertyChange('backgroundColor', color)} />
        </div>
        <div>
          <Label>Couleur Valeur</Label>
          <ColorPicker color={properties.valueColor || '#0F172A'} onChange={color => handlePropertyChange('valueColor', color)} />
        </div>
        <div>
          <Label>Couleur Titre</Label>
          <ColorPicker color={properties.titleColor || '#64748B'} onChange={color => handlePropertyChange('titleColor', color)} />
        </div>
        <div>
          <Label>Couleur Légende</Label>
          <ColorPicker color={properties.captionColor || '#94A3B8'} onChange={color => handlePropertyChange('captionColor', color)} />
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        <Switch checked={properties.showIcon !== false} onCheckedChange={checked => handlePropertyChange('showIcon', checked)} />
        <Label>Afficher l'icône</Label>
      </div>

      {properties.showIcon !== false && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Icône prédéfinie</Label>
            <Select
              value={properties.customIconData ? '__custom__' : iconValue}
              onValueChange={value => {
                if (value !== '__custom__') {
                  handleBatchPropertyChange({ icon: value, customIconData: '' });
                }
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {properties.customIconData && (
                  <SelectItem value="__custom__">
                    <span className="flex items-center gap-2">
                      <img src={properties.customIconData} className="h-4 w-4 object-contain" alt="custom" />
                      Icône personnalisée
                    </span>
                  </SelectItem>
                )}
                {ICON_OPTIONS.map(option => {
                  const IconPreview = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <IconPreview className="h-4 w-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Icône personnalisée</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.png,.jpg,.jpeg,.ico';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        handleBatchPropertyChange({ customIconData: base64, icon: '__custom__' });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Importer
              </Button>
              {properties.customIconData && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleBatchPropertyChange({ customIconData: '', icon: 'users' })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {properties.customIconData && (
              <div className="flex items-center gap-2 p-2 border border-border/40 rounded-lg bg-muted/20">
                <img src={properties.customIconData} className="h-6 w-6 object-contain" alt="Icône personnalisée" />
                <span className="text-xs text-muted-foreground">Icône personnalisée active</span>
              </div>
            )}
          </div>
          <div>
            <Label>Couleur Icône</Label>
            <ColorPicker color={properties.iconColor || '#2563EB'} onChange={color => handlePropertyChange('iconColor', color)} />
          </div>
          <div>
            <Label>Couleur Accent</Label>
            <ColorPicker color={properties.accentColor || `${(properties.iconColor || '#2563EB')}26`} onChange={color => handlePropertyChange('accentColor', color)} />
          </div>
          <div>
            <Label>Taille Icône</Label>
            <LazyInput value={properties.iconSize ?? 28} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('iconSize', val, 28)} />
          </div>
        </div>
      )}
    </div>
  );
};
