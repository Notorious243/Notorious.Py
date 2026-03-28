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
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-7 w-7 shrink-0 rounded-lg border border-border/60 shadow-sm hover:border-primary/50 transition-all relative overflow-hidden ring-1 ring-black/5"
            style={{ backgroundColor: isTransparent ? 'transparent' : safeColor }}
            title="Ouvrir le sélecteur de couleur"
          >
            {isTransparent && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-red-500 rotate-45 absolute" />
                <div className="absolute inset-0 bg-[length:6px_6px] bg-[linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%),linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%)] bg-[position:0_0,3px_3px]" />
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none" align="end" side="left">
          <div className="p-3 bg-popover rounded-xl border border-border shadow-xl space-y-2.5">
            <HexColorPicker color={safeColor} onChange={onChange} className="!w-[200px]" />

            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-widest">Sombre</p>
              <div className="flex gap-1">
                {CTK_DARK_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`w-5 h-5 rounded-md border hover:scale-110 transition-all ${safeColor.toUpperCase() === preset.toUpperCase() ? 'border-primary ring-1 ring-primary/50' : 'border-border/40'}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => onChange(preset)}
                    title={preset}
                  />
                ))}
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-widest">Clair</p>
              <div className="flex gap-1">
                {CTK_LIGHT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`w-5 h-5 rounded-md border hover:scale-110 transition-all ${safeColor.toUpperCase() === preset.toUpperCase() ? 'border-primary ring-1 ring-primary/50' : 'border-border/40'}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => onChange(preset)}
                    title={preset}
                  />
                ))}
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-widest">Accent</p>
              <div className="flex gap-1">
                {CTK_ACCENT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`w-5 h-5 rounded-md border hover:scale-110 transition-all ${safeColor.toUpperCase() === preset.toUpperCase() ? 'border-primary ring-1 ring-primary/50' : 'border-border/40'}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => onChange(preset)}
                    title={preset}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyColor}
                className="flex-1 h-6 flex items-center justify-center gap-1 rounded-md bg-muted/50 hover:bg-muted transition-colors text-[10px] font-medium"
                title="Copier"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              {eyedropperSupported && (
                <button
                  onClick={handleEyeDropper}
                  className="flex-1 h-6 flex items-center justify-center gap-1 rounded-md bg-muted/50 hover:bg-muted transition-colors text-[10px] font-medium"
                  title="Pipette"
                >
                  <Pipette className="w-2.5 h-2.5" />
                  Pipette
                </button>
              )}
              {allowTransparent && (
                <button
                  onClick={() => onChange('transparent')}
                  className={`flex-1 h-6 flex items-center justify-center gap-1 rounded-md transition-colors text-[10px] font-medium ${isTransparent ? 'bg-primary/10 text-primary' : 'bg-muted/50 hover:bg-muted'}`}
                  title="Transparent"
                >
                  <Ban className="w-2.5 h-2.5" />
                  Transp.
                </button>
              )}
              {allowReset && onReset && (
                <button
                  onClick={onReset}
                  className="flex-1 h-6 flex items-center justify-center gap-1 rounded-md bg-muted/50 hover:bg-muted transition-colors text-[10px] font-medium"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Auto
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <input
        ref={inputRef}
        type="text"
        value={hexInput}
        onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
        onBlur={handleHexBlur}
        onFocus={(e) => e.target.select()}
        className="flex-1 h-7 px-2 rounded-lg border border-border/50 bg-muted/30 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
        placeholder={isTransparent ? 'transparent' : '#000000'}
        maxLength={7}
      />
    </div>
  );
};
