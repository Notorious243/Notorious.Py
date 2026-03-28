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

export const MenuItemProperties: React.FC<WidgetPropertySectionProps> = ({
  properties,
  handlePropertyChange,
  handleBatchPropertyChange,
  handleNumericPropertyBlur,
}) => {
  const menuIconValue = normalizeIconKey(properties.icon || 'layoutDashboard');

  return (
    <div className="p-2.5 border border-border/30 rounded-lg bg-muted/20 space-y-3">
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Barre de Navigation</Label>

      <div className="space-y-3">
        <Label>Texte</Label>
        <Input value={properties.text || ''} onChange={e => handlePropertyChange('text', e.target.value)} placeholder="Tableau de bord" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Police</Label>
          <Select value={properties.fontFamily || 'Poppins'} onValueChange={value => handlePropertyChange('fontFamily', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Taille Texte</Label>
          <LazyInput value={properties.fontSize ?? 14} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('fontSize', val, 14)} />
        </div>
      </div>

      <div>
        <Label>Arrondi des coins (px)</Label>
        <LazyInput value={properties.cornerRadius ?? 0} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('cornerRadius', val, 0, 0)} />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Couleur Active</Label>
          <ColorPicker color={properties.fg_color || '#2563EB'} onChange={color => handlePropertyChange('fg_color', color)} />
        </div>
        <div>
          <Label>Texte Actif</Label>
          <ColorPicker color={properties.text_color || '#FFFFFF'} onChange={color => handlePropertyChange('text_color', color)} />
        </div>
        <div>
          <Label>Texte Inactif</Label>
          <ColorPicker color={properties.unselected_text_color || '#1E293B'} onChange={color => handlePropertyChange('unselected_text_color', color)} />
        </div>
        <div>
          <Label>Fond Inactif</Label>
          <ColorPicker color={properties.backgroundColor || 'transparent'} onChange={color => handlePropertyChange('backgroundColor', color)} />
        </div>
        <div>
          <Label>Fond Survol</Label>
          <ColorPicker color={properties.hover_color || '#1E4FD8'} onChange={color => handlePropertyChange('hover_color', color)} />
        </div>
        <div>
          <Label>Couleur Icône</Label>
          <ColorPicker color={properties.iconColor || (properties.text_color || '#FFFFFF')} onChange={color => handlePropertyChange('iconColor', color)} />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch checked={properties.selected !== false} onCheckedChange={checked => handlePropertyChange('selected', checked)} />
          <Label>Marquer comme Actif</Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Icône prédéfinie</Label>
            <Select
              value={properties.customIconData ? '__custom__' : menuIconValue}
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
                  onClick={() => handleBatchPropertyChange({ customIconData: '', icon: 'layoutDashboard' })}
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
            <Label>Taille Icône</Label>
            <LazyInput value={properties.iconSize ?? 20} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('iconSize', val, 20, 12)} />
          </div>
        </div>
      </div>
    </div>
  );
};
