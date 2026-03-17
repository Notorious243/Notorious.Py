import { WidgetData } from '@/types/widget';

export interface WidgetPropertySectionProps {
  selectedWidget: WidgetData;
  properties: Record<string, any>;
  handlePropertyChange: (prop: keyof WidgetData['properties'], value: any) => void;
  handleBatchPropertyChange: (updates: Record<string, any>) => void;
  handleNumericPropertyBlur: (prop: keyof WidgetData['properties'], raw: string | number, fallback: number, min?: number) => void;
  handleSizeBlur: (dim: 'width' | 'height', value: string | number) => void;
}

export const DEFAULT_TABLE_COLUMNS = [
  { id: 'id', label: 'ID', width: 80 },
  { id: 'name', label: 'Name', width: 160 },
  { id: 'status', label: 'Status', width: 140 },
];

export const DEFAULT_TABLE_ROWS = [
  ['1', 'Alice Martin', 'Confirmed'],
  ['2', 'Bob Dupont', 'In Progress'],
  ['3', 'Chloé Leroy', 'Delivered'],
];
