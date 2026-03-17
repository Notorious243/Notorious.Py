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
  <div className="flex items-start justify-between gap-3">
    <div>
      <Label>{label}</Label>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
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
  <div>
    <Label>{label}</Label>
    <ColorPicker color={value} onChange={onChange} />
  </div>
);

export const ActionsRow: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-between gap-2">{children}</div>
);

export const CompactButton: React.FC<React.ComponentProps<typeof Button>> = ({ children, ...rest }) => (
  <Button size="sm" variant="outline" className="h-8" {...rest}>
    {children}
  </Button>
);
