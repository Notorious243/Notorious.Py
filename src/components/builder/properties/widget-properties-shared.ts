import { WidgetData, type WidgetProperties, type WidgetPropertyValue } from '@/types/widget';

export interface WidgetPropertySectionProps {
  selectedWidget: WidgetData;
  properties: WidgetProperties;
  handlePropertyChange: (prop: string, value: WidgetPropertyValue) => void;
  handleBatchPropertyChange: (updates: WidgetProperties) => void;
  handleNumericPropertyBlur: (prop: keyof WidgetData['properties'], raw: string | number, fallback: number, min?: number) => void;
  handleSizeBlur: (dim: 'width' | 'height', value: string | number) => void;
}

export interface TableColumn {
  id: string;
  label: string;
  width?: number | string;
  type?: string;
  colorMap?: Record<string, string>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { id: 'id', label: 'ID', width: 80 },
  { id: 'name', label: 'Name', width: 160 },
  { id: 'status', label: 'Status', width: 140 },
];

export const DEFAULT_TABLE_ROWS = [
  ['1', 'Alice Martin', 'Confirmed'],
  ['2', 'Bob Dupont', 'In Progress'],
  ['3', 'Chloé Leroy', 'Delivered'],
];
