import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/builder/properties/ColorPicker';
import { Button } from '@/components/ui/button';

type ToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="min-w-0">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {description && <p className="text-[10px] text-muted-foreground/70 leading-tight">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <Label className="text-[10px] text-muted-foreground">{label}</Label>
    <ColorPicker color={value} onChange={onChange} />
  </div>
);

export const ActionsRow: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-between gap-1.5">{children}</div>
);

export const CompactButton: React.FC<React.ComponentProps<typeof Button>> = ({ children, ...rest }) => (
  <Button size="sm" variant="outline" className="h-7 text-xs" {...rest}>
    {children}
  </Button>
);
