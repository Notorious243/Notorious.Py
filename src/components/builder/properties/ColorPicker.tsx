import * as React from "react";

import {
  ColorPicker as ShadcnColorPicker,
  type ColorPresetGroup,
} from "@/components/ui/color-picker";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
  allowReset?: boolean;
  onReset?: () => void;
}

const CTK_DARK_PRESETS = [
  "#1A1A2E",
  "#16213E",
  "#0F3460",
  "#1F5AA0",
  "#0C2B52",
  "#2B2B2B",
  "#343638",
];
const CTK_LIGHT_PRESETS = [
  "#DCE4EE",
  "#F9F9F9",
  "#EBEBEB",
  "#C0C2C5",
  "#979DA2",
  "#6B7280",
  "#4A4D50",
];
const CTK_ACCENT_PRESETS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#0EA5E9",
  "#0F3460",
  "#EC4899",
];

const PRESET_GROUPS: ColorPresetGroup[] = [
  { label: "Sombre", colors: CTK_DARK_PRESETS },
  { label: "Clair", colors: CTK_LIGHT_PRESETS },
  { label: "Accent", colors: CTK_ACCENT_PRESETS },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  allowTransparent = false,
  allowReset = false,
  onReset,
}) => {
  return (
    <ShadcnColorPicker
      value={color}
      onChange={onChange}
      allowTransparent={allowTransparent}
      allowReset={allowReset}
      onReset={onReset}
      presetGroups={PRESET_GROUPS}
    />
  );
};

