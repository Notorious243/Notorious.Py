import { CanvasSettings, WidgetData } from '@/types/widget';

export const CONTAINER_TYPES = ['frame', 'scrollableframe', 'tabview'] as const;
export const ACTIVE_TAB_STATE_KEY = '__builder_active_tab';

export const isContainerWidget = (widget: WidgetData) => CONTAINER_TYPES.includes(widget.type as typeof CONTAINER_TYPES[number]);

export interface ContainerMetrics {
  offsetX: number;
  offsetY: number;
  innerWidth: number;
  innerHeight: number;
}

const getNumericPadding = (widget: WidgetData): number => {
  const padding = widget.style?.padding;
  return typeof padding === 'number' ? padding : 0;
};

export const getContainerMetrics = (widget: WidgetData): ContainerMetrics => {
  const padding = getNumericPadding(widget);

  // Extract border width (defaults: frame=0, tabview=0 structurally outer, but we handle it separately)
  const borderWidth = typeof widget.style?.borderWidth === 'number' ? widget.style.borderWidth
    : typeof widget.properties?.border_width === 'number' ? Number(widget.properties.border_width) : 0;

  let offsetX = padding + borderWidth;
  let offsetY = padding + borderWidth;
  let innerWidth = Math.max(0, widget.size.width - (padding + borderWidth) * 2);
  let innerHeight = Math.max(0, widget.size.height - (padding + borderWidth) * 2);

  if (widget.type === 'scrollableframe') {
    const labelHeight = widget.properties?.label_text ? 28 : 0;
    offsetY += labelHeight;
    innerHeight = Math.max(0, innerHeight - labelHeight);
  }

  if (widget.type === 'tabview') {
    const tabHeaderHeight = 40;
    const tabGap = 12; // Gap in flex column
    const tabInnerBorder = 1; // 1px dashed
    offsetY += tabHeaderHeight + tabGap + tabInnerBorder;
    innerHeight = Math.max(0, innerHeight - (tabHeaderHeight + tabGap + tabInnerBorder * 2));
    offsetX += tabInnerBorder;
    innerWidth = Math.max(0, innerWidth - tabInnerBorder * 2);
  }

  return { offsetX, offsetY, innerWidth, innerHeight };
};

export interface ContentBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const getParentContentBounds = (
  widgets: WidgetData[],
  parentId: string | null | undefined,
  canvasSettings: CanvasSettings
): ContentBounds => {
  if (!parentId) {
    return {
      left: 0,
      top: 0,
      width: canvasSettings.width,
      height: Math.max(0, canvasSettings.height - 40),
    };
  }

  const parent = widgets.find((w) => w.id === parentId);
  if (!parent) {
    return {
      left: 0,
      top: 0,
      width: canvasSettings.width,
      height: Math.max(0, canvasSettings.height - 40),
    };
  }

  const metrics = getContainerMetrics(parent);
  return {
    left: parent.position.x + metrics.offsetX,
    top: parent.position.y + metrics.offsetY,
    width: Math.max(0, metrics.innerWidth),
    height: Math.max(0, metrics.innerHeight),
  };
};

export const collectDescendantIds = (widgets: WidgetData[], widgetId: string): string[] => {
  const descendants: string[] = [];
  const stack = [widgetId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = widgets.filter((w) => w.parentId === current);
    children.forEach((child) => {
      descendants.push(child.id);
      stack.push(child.id);
    });
  }

  return descendants;
};

export const isDescendant = (widgets: WidgetData[], ancestorId: string, descendantId: string): boolean => {
  const descendants = collectDescendantIds(widgets, ancestorId);
  return descendants.includes(descendantId);
};

export const getWidgetDepth = (widgets: WidgetData[], widgetId: string): number => {
  let depth = 0;
  let current = widgets.find((w) => w.id === widgetId);

  while (current?.parentId) {
    depth += 1;
    current = widgets.find((w) => w.id === current?.parentId);
  }

  return depth;
};

export const getTabSlots = (widget: WidgetData): string[] => {
  const explicit = widget.properties?.tabs;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit as string[];
  }
  const legacy = widget.properties?._tabs;
  if (Array.isArray(legacy) && legacy.length > 0) {
    return legacy as string[];
  }
  return ['Tab 1'];
};

export const getDefaultTabSlot = (widget: WidgetData): string | undefined => {
  const slots = getTabSlots(widget);
  return slots[0];
};

export const getActiveTabSlot = (widget: WidgetData): string | undefined => {
  if (widget.type !== 'tabview') return undefined;
  const slots = getTabSlots(widget);
  const stored = widget.properties?.[ACTIVE_TAB_STATE_KEY];
  if (stored && typeof stored === 'string' && slots.includes(stored)) {
    return stored;
  }
  return getDefaultTabSlot(widget);
};

/**
 * Calculate the position of a widget relative to its parent container.
 * For root widgets (no parent), returns the absolute position.
 * For child widgets, returns position relative to parent's content area.
 */
export const getRelativePosition = (
  widget: WidgetData,
  allWidgets: WidgetData[]
): { x: number; y: number } => {
  if (!widget.parentId) {
    return { x: widget.position.x, y: widget.position.y };
  }

  const parent = allWidgets.find(w => w.id === widget.parentId);
  if (!parent) {
    return { x: widget.position.x, y: widget.position.y };
  }

  const metrics = getContainerMetrics(parent);
  return {
    x: Math.max(0, widget.position.x - parent.position.x - metrics.offsetX),
    y: Math.max(0, widget.position.y - parent.position.y - metrics.offsetY),
  };
};
