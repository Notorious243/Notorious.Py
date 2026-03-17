import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, Link, Image as ImageIcon } from 'lucide-react';
import { FONT_FAMILIES } from '@/constants/widgets';
import { ColorPicker } from '../ColorPicker';
import { LazyInput } from '../ui/LazyInput';
import { WidgetPropertySectionProps } from '../widget-properties-shared';

export const ProductCardProperties: React.FC<WidgetPropertySectionProps> = ({
  properties,
  handlePropertyChange,
  handleBatchPropertyChange,
  handleNumericPropertyBlur,
}) => {
  const pcImageInputRef = React.createRef<HTMLInputElement>();

  return (
    <div className="p-3 border border-border/40 rounded-xl bg-card/30 space-y-4">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carte Produit</Label>

      {/* Textes */}
      <div className="space-y-3">
        <div>
          <Label>Nom du Produit</Label>
          <Input value={properties.productName || ''} onChange={e => handlePropertyChange('productName', e.target.value)} placeholder="Doliprane 1000mg" />
        </div>
        <div>
          <Label>Détail / Description</Label>
          <Input value={properties.productDetail || ''} onChange={e => handlePropertyChange('productDetail', e.target.value)} placeholder="Comprimés" />
        </div>
        <div>
          <Label>Prix</Label>
          <Input value={properties.price || ''} onChange={e => handlePropertyChange('price', e.target.value)} placeholder="5.000 Fc" />
        </div>
      </div>

      <Separator />

      {/* Image */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Image du Produit</Label>
        <input
          ref={pcImageInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.ico"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                handleBatchPropertyChange({ imageData: base64, imageUrl: '' });
              };
              reader.readAsDataURL(file);
            }
            if (e.target) e.target.value = '';
          }}
        />
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => pcImageInputRef.current?.click()}>
            <ImageIcon className="h-4 w-4 mr-2 shrink-0" />
            <span>Fichier local</span>
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => {
            const url = window.prompt('URL de l\'image du produit (http(s)://...)');
            if (url && url.trim()) {
              handleBatchPropertyChange({ imageUrl: url.trim(), imageData: '' });
            }
          }}>
            <Link className="h-4 w-4 mr-2 shrink-0" />
            <span>URL</span>
          </Button>
        </div>
        {(properties.imageData || properties.imageUrl) ? (
          <div className="space-y-2">
            <div className="h-28 border border-border/40 rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
              <img src={properties.imageData || properties.imageUrl} alt="Aperçu produit" className="object-contain w-full h-full" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBatchPropertyChange({ imageData: '', imageUrl: '' })}
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer l'image
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucune image. Un placeholder sera affiché.</p>
        )}

        {/* Fond de la zone image */}
        <div className="space-y-2 pt-1">
          <Label>Fond zone image</Label>
          <Select
            value={
              properties.imageBgColor === 'transparent' ? 'transparent'
                : properties.imageBgColor ? 'custom'
                : 'auto'
            }
            onValueChange={value => {
              if (value === 'auto') handlePropertyChange('imageBgColor', '');
              else if (value === 'transparent') handlePropertyChange('imageBgColor', 'transparent');
              else handlePropertyChange('imageBgColor', '#F1F5F9');
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automatique (thème)</SelectItem>
              <SelectItem value="transparent">Transparent</SelectItem>
              <SelectItem value="custom">Couleur personnalisée</SelectItem>
            </SelectContent>
          </Select>
          {properties.imageBgColor && properties.imageBgColor !== 'transparent' && (
            <ColorPicker color={properties.imageBgColor || '#F1F5F9'} onChange={color => handlePropertyChange('imageBgColor', color)} />
          )}
        </div>
      </div>

      <Separator />

      {/* Typographie */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Typographie</Label>
        <div>
          <Label>Police</Label>
          <Select value={properties.fontFamily || 'Poppins'} onValueChange={value => handlePropertyChange('fontFamily', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_FAMILIES.map(font => (<SelectItem key={font} value={font}>{font}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Taille Texte</Label>
            <LazyInput value={properties.fontSize ?? 13} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('fontSize', val, 13)} />
          </div>
          <div>
            <Label>Taille Prix</Label>
            <LazyInput value={properties.priceFontSize ?? 15} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('priceFontSize', val, 15)} />
          </div>
        </div>
        <div>
          <Label>Rayon des Coins</Label>
          <LazyInput value={properties.cornerRadius ?? 12} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('cornerRadius', val, 12, 0)} />
        </div>
      </div>

      <Separator />

      {/* Couleurs */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Couleurs</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fond carte</Label>
            <ColorPicker color={properties.backgroundColor || '#FFFFFF'} onChange={color => handlePropertyChange('backgroundColor', color)} />
          </div>
          <div>
            <Label>Texte</Label>
            <ColorPicker color={properties.textColor || '#1E293B'} onChange={color => handlePropertyChange('textColor', color)} />
          </div>
          <div>
            <Label>Prix</Label>
            <ColorPicker color={properties.priceColor || '#0F172A'} onChange={color => handlePropertyChange('priceColor', color)} />
          </div>
          <div>
            <Label>Bordure</Label>
            <ColorPicker color={properties.borderColor || '#E2E8F0'} onChange={color => handlePropertyChange('borderColor', color)} />
          </div>
        </div>
      </div>
    </div>
  );
};
