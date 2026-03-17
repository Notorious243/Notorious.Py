import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Link, Image as ImageIcon } from 'lucide-react';
import { FONT_FAMILIES } from '@/constants/widgets';
import { ColorPicker } from '../ColorPicker';
import { LazyInput } from '../ui/LazyInput';
import { WidgetPropertySectionProps } from '../widget-properties-shared';

export const UserProfileProperties: React.FC<WidgetPropertySectionProps> = ({
  properties,
  handlePropertyChange,
  handleBatchPropertyChange,
  handleNumericPropertyBlur,
}) => {
  return (
    <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-4">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profil Utilisateur</Label>

      {/* Informations */}
      <div className="space-y-3">
        <div>
          <Label>Nom</Label>
          <Input value={properties.userName || ''} onChange={e => handlePropertyChange('userName', e.target.value)} placeholder="Michel Maleka" />
        </div>
        <div>
          <Label>Info / Email</Label>
          <Input value={properties.userInfo || ''} onChange={e => handlePropertyChange('userInfo', e.target.value)} placeholder="michelmaleka@gmail.com" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={properties.showDate !== false} onCheckedChange={checked => handlePropertyChange('showDate', checked)} />
          <Label>Afficher la date</Label>
        </div>
        {properties.showDate !== false && (
          <div>
            <Label>Texte de date (vide = auto)</Label>
            <Input value={properties.dateText || ''} onChange={e => handlePropertyChange('dateText', e.target.value)} placeholder="Automatique" />
          </div>
        )}
      </div>

      <Separator />

      {/* Avatar */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avatar</Label>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.png,.jpg,.jpeg,.ico';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const base64 = ev.target?.result as string;
                  handleBatchPropertyChange({ avatarData: base64, avatarUrl: '' });
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}>
            <ImageIcon className="h-4 w-4 mr-2 shrink-0" />
            <span>Fichier local</span>
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => {
            const url = window.prompt('URL de l\'image avatar (http(s)://...)');
            if (url && url.trim()) {
              handleBatchPropertyChange({ avatarUrl: url.trim(), avatarData: '' });
            }
          }}>
            <Link className="h-4 w-4 mr-2 shrink-0" />
            <span>URL</span>
          </Button>
        </div>
        {(properties.avatarData || properties.avatarUrl) ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="border border-border/40 rounded-full overflow-hidden bg-muted/20 flex items-center justify-center flex-shrink-0"
                style={{ width: 56, height: 56 }}>
                <img src={properties.avatarData || properties.avatarUrl} alt="Aperçu avatar" className="object-cover w-full h-full" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBatchPropertyChange({ avatarData: '', avatarUrl: '' })}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucun avatar. Une icône par défaut sera affichée.</p>
        )}
        <div>
          <Label>Taille Avatar (px)</Label>
          <LazyInput value={properties.avatarSize ?? 48} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('avatarSize', val, 48, 24)} />
        </div>
      </div>

      <Separator />

      {/* Typographie */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Typographie</Label>
        <div>
          <Label>Police</Label>
          <Select value={properties.nameFont || 'Poppins'} onValueChange={value => handlePropertyChange('nameFont', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Nom</Label>
            <LazyInput value={properties.nameFontSize ?? 17} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('nameFontSize', val, 17, 10)} />
          </div>
          <div>
            <Label className="text-xs">Info</Label>
            <LazyInput value={properties.infoFontSize ?? 13} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('infoFontSize', val, 13, 8)} />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <LazyInput value={properties.dateFontSize ?? 13} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('dateFontSize', val, 13, 8)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Couleurs */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Couleurs</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fond</Label>
            <ColorPicker color={properties.backgroundColor || 'transparent'} onChange={color => handlePropertyChange('backgroundColor', color)} />
          </div>
          <div>
            <Label>Nom</Label>
            <ColorPicker color={properties.nameColor || '#0F172A'} onChange={color => handlePropertyChange('nameColor', color)} />
          </div>
          <div>
            <Label>Info</Label>
            <ColorPicker color={properties.infoColor || '#64748B'} onChange={color => handlePropertyChange('infoColor', color)} />
          </div>
          <div>
            <Label>Date</Label>
            <ColorPicker color={properties.dateColor || '#94A3B8'} onChange={color => handlePropertyChange('dateColor', color)} />
          </div>
        </div>
      </div>
    </div>
  );
};
