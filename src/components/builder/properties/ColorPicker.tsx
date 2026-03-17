import React, { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { Copy, Pipette, Check, Ban, RotateCcw } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
  allowReset?: boolean;
  onReset?: () => void;
}

const CTK_DARK_PRESETS = [
  '#1A1A2E', '#16213E', '#0F3460', '#1F5AA0', '#0C2B52', '#2B2B2B', '#343638',
];
const CTK_LIGHT_PRESETS = [
  '#DCE4EE', '#F9F9F9', '#EBEBEB', '#C0C2C5', '#979DA2', '#6B7280', '#4A4D50',
];
const CTK_ACCENT_PRESETS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#0EA5E9', '#0F3460', '#EC4899',
];

const isValidHex = (v: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
const normalizeHex = (v: string | null | undefined, fallback = '#000000'): string => {
  if (!v || v === 'transparent' || v === 'none') return fallback;
  if (isValidHex(v)) return v.toUpperCase();
  // Try adding # prefix
  if (isValidHex('#' + v)) return ('#' + v).toUpperCase();
  return fallback;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, allowTransparent = false, allowReset = false, onReset }) => {
  const isTransparent = color === 'transparent' || color === 'none' || color === '';
  const safeColor = normalizeHex(color);
  const [hexInput, setHexInput] = useState(isTransparent ? '' : safeColor);
  const [copied, setCopied] = useState(false);
  const [eyedropperSupported] = useState(() => 'EyeDropper' in window);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (color === 'transparent' || color === 'none' || color === '') {
      setHexInput('');
    } else {
      setHexInput(normalizeHex(color));
    }
  }, [color]);

  const handleHexInputChange = (value: string) => {
    // Auto-prepend # if user types raw hex digits
    let normalized = value;
    if (normalized && !normalized.startsWith('#')) {
      normalized = '#' + normalized;
    }
    setHexInput(normalized);
    if (isValidHex(normalized)) {
      onChange(normalized);
    }
  };

  const handleHexBlur = () => {
    if (!isValidHex(hexInput)) {
      setHexInput(safeColor);
    }
  };

  const handleCopyColor = async () => {
    try {
      await navigator.clipboard.writeText(safeColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  const handleEyeDropper = async () => {
    if (!eyedropperSupported) return;
    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (err) {
      console.log('EyeDropper cancelled or failed:', err);
    }
  };

  return (
    <div className="flex items-center gap-1.5 w-full">
      {/* Inline hex input — always visible */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
          onBlur={handleHexBlur}
          onFocus={(e) => e.target.select()}
          className="w-full h-8 px-2 border border-input rounded-md text-xs font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={isTransparent ? 'transparent' : '#000000'}
          maxLength={7}
        />
      </div>

      {/* Swatch — opens visual picker popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-8 w-8 shrink-0 rounded-md border border-input hover:border-primary transition-colors relative overflow-hidden"
            style={{ backgroundColor: isTransparent ? 'transparent' : safeColor }}
            title="Ouvrir le sélecteur de couleur"
          >
            {isTransparent && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-red-500 rotate-45 absolute" />
                <div className="absolute inset-0 bg-[length:8px_8px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%)] bg-[position:0_0,4px_4px]" />
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none" align="end">
          <div className="p-4 bg-popover rounded-md border border-border shadow-lg space-y-3">
            <HexColorPicker color={safeColor} onChange={onChange} />

            {/* Couleurs préréglées — organisées par thème */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sombre</p>
              <div className="grid grid-cols-7 gap-1.5">
                {CTK_DARK_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`w-6 h-6 rounded border-2 hover:scale-110 transition-all ${safeColor.toUpperCase() === preset.toUpperCase() ? 'border-primary ring-1 ring-primary' : 'border-secondary'}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => onChange(preset)}
                    title={preset}
                  />
                ))}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Clair</p>
              <div className="grid grid-cols-7 gap-1.5">
                {CTK_LIGHT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`w-6 h-6 rounded border-2 hover:scale-110 transition-all ${safeColor.toUpperCase() === preset.toUpperCase() ? 'border-primary ring-1 ring-primary' : 'border-secondary'}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => onChange(preset)}
                    title={preset}
                  />
                ))}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Accent</p>
              <div className="grid grid-cols-7 gap-1.5">
                {CTK_ACCENT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`w-6 h-6 rounded border-2 hover:scale-110 transition-all ${safeColor.toUpperCase() === preset.toUpperCase() ? 'border-primary ring-1 ring-primary' : 'border-secondary'}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => onChange(preset)}
                    title={preset}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyColor}
                className="flex-1 h-7 flex items-center justify-center gap-1 border border-input rounded-md bg-background hover:bg-accent transition-colors text-[11px]"
                title="Copier"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              {eyedropperSupported && (
                <button
                  onClick={handleEyeDropper}
                  className="flex-1 h-7 flex items-center justify-center gap-1 border border-input rounded-md bg-background hover:bg-accent transition-colors text-[11px]"
                  title="Pipette"
                >
                  <Pipette className="w-3 h-3" />
                  Pipette
                </button>
              )}
              {allowTransparent && (
                <button
                  onClick={() => onChange('transparent')}
                  className={`flex-1 h-7 flex items-center justify-center gap-1 border rounded-md transition-colors text-[11px] ${isTransparent ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background hover:bg-accent'}`}
                  title="Transparent"
                >
                  <Ban className="w-3 h-3" />
                  Transp.
                </button>
              )}
              {allowReset && onReset && (
                <button
                  onClick={onReset}
                  className="flex-1 h-7 flex items-center justify-center gap-1 border border-input rounded-md bg-background hover:bg-accent transition-colors text-[11px]"
                  title="Réinitialiser (thème auto)"
                >
                  <RotateCcw className="w-3 h-3" />
                  Auto
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
