export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WidgetStyle {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  borderRadius: number;
  padding: number;
  margin: number;
  opacity: number;
  boxShadow: string;
  objectFit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  hoverColor: string;
}

export type AutoLayoutDirection = 'vertical' | 'horizontal';
export type AutoLayoutAlignment = 'start' | 'center' | 'end' | 'stretch';
export type AutoLayoutDistribution = 'packed' | 'space_between' | 'space_around' | 'space_evenly';

export interface AutoLayoutConfig {
  enabled: boolean;
  direction: AutoLayoutDirection;
  spacing: number;
  padding_top: number;
  padding_bottom: number;
  padding_left: number;
  padding_right: number;
  alignment: AutoLayoutAlignment;
  distribution: AutoLayoutDistribution;
}

export interface AutoLayoutChildOverrides {
  fill_width?: boolean;
  fill_height?: boolean;
  align_self?: AutoLayoutAlignment;
}

export interface WidgetConstraints {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export const DEFAULT_AUTO_LAYOUT: AutoLayoutConfig = {
  enabled: false,
  direction: 'vertical',
  spacing: 8,
  padding_top: 8,
  padding_bottom: 8,
  padding_left: 8,
  padding_right: 8,
  alignment: 'start',
  distribution: 'packed',
};

export const DEFAULT_CONSTRAINTS: WidgetConstraints = {
  top: true,
  bottom: false,
  left: true,
  right: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetPropertyValue = any;
export type WidgetProperties = Record<string, WidgetPropertyValue>;

export interface WidgetData {
  id: string;
  type: string;
  name?: string;
  position: Position;
  size: Size;
  style: Partial<WidgetStyle>;
  properties: WidgetProperties;
  children?: string[];
  parentId?: string | null;
  parentSlot?: string | null;
  locked?: boolean;
  hidden?: boolean;
  autoLayout?: AutoLayoutConfig;
  autoLayoutChild?: AutoLayoutChildOverrides;
  constraints?: WidgetConstraints;
}

export interface WidgetCategory {
  name: string;
  widgets: WidgetType[];
}

export interface WidgetType {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
  popular?: boolean;
  defaultSize: Size;
  defaultProperties: WidgetProperties;
  category: string;
}

export interface CanvasSettings {
  width: number;
  height: number;
  title: string;
  titleFontWeight: 'normal' | 'bold';
  resizable: boolean;
  layoutMode?: 'absolute' | 'centered' | 'responsive';
  scaling: number;
  backgroundColor: string;
  headerBackgroundColor: string;
  gridVisible: boolean;
  background_image?: string;
  background_image_data?: string;
  icon_path?: string;
  icon_data?: string;
}
