import * as React from "react";
import { Check, Copy, Pipette, Ban, RotateCcw } from "lucide-react";
import { HexColorPicker } from "react-colorful";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ColorPresetGroup {
  label: string;
  colors: string[];
}

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
  allowReset?: boolean;
  onReset?: () => void;
  presetGroups?: ColorPresetGroup[];
  className?: string;
}

const isValidHex = (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);

const normalizeHex = (value: string | null | undefined, fallback = "#000000"): string => {
  if (!value || value === "transparent" || value === "none") return fallback;
  if (isValidHex(value)) return value.toUpperCase();
  if (isValidHex(`#${value}`)) return `#${value}`.toUpperCase();
  return fallback;
};

export function ColorPicker({
  value,
  onChange,
  allowTransparent = false,
  allowReset = false,
  onReset,
  presetGroups = [],
  className,
}: ColorPickerProps) {
  const isTransparent = value === "transparent" || value === "none" || value === "";
  const safeColor = normalizeHex(value);
  const [hexInput, setHexInput] = React.useState(isTransparent ? "" : safeColor);
  const [copied, setCopied] = React.useState(false);
  const eyedropperSupported = React.useMemo(
    () => typeof window !== "undefined" && "EyeDropper" in window,
    []
  );

  React.useEffect(() => {
    if (isTransparent) {
      setHexInput("");
    } else {
      setHexInput(safeColor);
    }
  }, [isTransparent, safeColor]);

  const handleHexInputChange = (nextValue: string) => {
    const normalized = nextValue && !nextValue.startsWith("#") ? `#${nextValue}` : nextValue;
    const upper = normalized.toUpperCase();
    setHexInput(upper);
    if (isValidHex(upper)) {
      onChange(upper);
    }
  };

  const handleHexBlur = () => {
    if (!isValidHex(hexInput)) {
      setHexInput(isTransparent ? "" : safeColor);
    }
  };

  const handleCopyColor = async () => {
    try {
      await navigator.clipboard.writeText(safeColor);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // No-op: clipboard is best effort only.
    }
  };

  const handleEyeDropper = async () => {
    if (!eyedropperSupported) return;
    try {
      const EyeDropperCtor = (window as Window & {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper;
      if (!EyeDropperCtor) return;
      const eyeDropper = new EyeDropperCtor();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex.toUpperCase());
    } catch {
      // User cancelled eyedropper.
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5 w-full", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative size-7 shrink-0 overflow-hidden rounded-lg border border-border/60 shadow-sm transition-all hover:border-primary/50 ring-1 ring-black/5"
            style={{ backgroundColor: isTransparent ? "transparent" : safeColor }}
            title="Ouvrir le selecteur de couleur"
          >
            {isTransparent && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute h-[1px] w-full rotate-45 bg-red-500" />
                <div className="absolute inset-0 bg-[length:6px_6px] bg-[linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%),linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%)] bg-[position:0_0,3px_3px]" />
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-none p-0" align="end" side="left">
          <div className="space-y-2.5 rounded-xl border border-border bg-popover p-3 shadow-xl">
            <HexColorPicker color={safeColor} onChange={onChange} className="!w-[200px]" />

            {presetGroups.length > 0 && (
              <div className="space-y-1.5">
                {presetGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                      {group.label}
                    </p>
                    <div className="flex gap-1">
                      {group.colors.map((preset) => (
                        <button
                          key={`${group.label}-${preset}`}
                          type="button"
                          className={cn(
                            "size-5 rounded-md border transition-all hover:scale-110",
                            safeColor.toUpperCase() === preset.toUpperCase()
                              ? "border-primary ring-1 ring-primary/50"
                              : "border-border/40"
                          )}
                          style={{ backgroundColor: preset }}
                          onClick={() => onChange(preset)}
                          title={preset}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleCopyColor()}
                className="flex h-6 flex-1 items-center justify-center gap-1 rounded-md bg-muted/50 text-[10px] font-medium transition-colors hover:bg-muted"
                title="Copier"
              >
                {copied ? <Check className="size-2.5 text-green-500" /> : <Copy className="size-2.5" />}
                {copied ? "Copie" : "Copier"}
              </button>
              {eyedropperSupported && (
                <button
                  type="button"
                  onClick={() => void handleEyeDropper()}
                  className="flex h-6 flex-1 items-center justify-center gap-1 rounded-md bg-muted/50 text-[10px] font-medium transition-colors hover:bg-muted"
                  title="Pipette"
                >
                  <Pipette className="size-2.5" />
                  Pipette
                </button>
              )}
              {allowTransparent && (
                <button
                  type="button"
                  onClick={() => onChange("transparent")}
                  className={cn(
                    "flex h-6 flex-1 items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-colors",
                    isTransparent ? "bg-primary/10 text-primary" : "bg-muted/50 hover:bg-muted"
                  )}
                  title="Transparent"
                >
                  <Ban className="size-2.5" />
                  Transp.
                </button>
              )}
              {allowReset && onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="flex h-6 flex-1 items-center justify-center gap-1 rounded-md bg-muted/50 text-[10px] font-medium transition-colors hover:bg-muted"
                  title="Reinitialiser"
                >
                  <RotateCcw className="size-2.5" />
                  Auto
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <input
        type="text"
        value={hexInput}
        onChange={(event) => handleHexInputChange(event.target.value)}
        onBlur={handleHexBlur}
        onFocus={(event) => event.target.select()}
        className="h-7 flex-1 rounded-lg border border-border/50 bg-muted/30 px-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
        placeholder={isTransparent ? "transparent" : "#000000"}
        maxLength={7}
      />
    </div>
  );
}

