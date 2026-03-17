import { WidgetData, AutoLayoutConfig, DEFAULT_AUTO_LAYOUT } from '@/types/widget';
import { getContainerMetrics } from './widgetLayout';

/**
 * Auto Layout Engine — Figma-style auto layout for container widgets.
 *
 * Given a container with autoLayout enabled, computes the absolute position
 * and size of each child widget based on direction, spacing, padding,
 * alignment and distribution settings.
 *
 * Returns a map of childId → { x, y, width, height } in absolute coordinates.
 */

export interface ComputedChildLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const computeAutoLayout = (
  container: WidgetData,
  children: WidgetData[],
): Map<string, ComputedChildLayout> => {
  const result = new Map<string, ComputedChildLayout>();
  const config: AutoLayoutConfig = container.autoLayout?.enabled
    ? container.autoLayout
    : DEFAULT_AUTO_LAYOUT;

  if (!config.enabled || children.length === 0) {
    return result;
  }

  // Container inner area (accounting for existing border/style padding)
  const metrics = getContainerMetrics(container);

  // Auto-layout padding (on top of container metrics)
  const padTop = config.padding_top;
  const padBottom = config.padding_bottom;
  const padLeft = config.padding_left;
  const padRight = config.padding_right;

  // Available content area after auto-layout padding
  const contentLeft = container.position.x + metrics.offsetX + padLeft;
  const contentTop = container.position.y + metrics.offsetY + padTop;
  const contentWidth = Math.max(0, metrics.innerWidth - padLeft - padRight);
  const contentHeight = Math.max(0, metrics.innerHeight - padTop - padBottom);

  const isVertical = config.direction === 'vertical';
  const mainAxisSize = isVertical ? contentHeight : contentWidth;
  const crossAxisSize = isVertical ? contentWidth : contentHeight;

  // Sort children by their current position along main axis for stable ordering
  const sortedChildren = [...children].sort((a, b) => {
    if (isVertical) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  });

  // Compute child sizes along main axis
  const childMainSizes = sortedChildren.map(child => {
    return isVertical ? child.size.height : child.size.width;
  });

  const totalChildMainSize = childMainSizes.reduce((sum, s) => sum + s, 0);
  const totalSpacing = config.spacing * Math.max(0, sortedChildren.length - 1);

  // Distribution: compute starting offset and actual spacing
  let startOffset = 0;
  let actualSpacing = config.spacing;

  switch (config.distribution) {
    case 'packed':
      // Children packed together with specified spacing
      startOffset = 0;
      actualSpacing = config.spacing;
      break;

    case 'space_between': {
      // First child at start, last at end, equal space between
      actualSpacing = sortedChildren.length > 1
        ? (mainAxisSize - totalChildMainSize) / (sortedChildren.length - 1)
        : 0;
      startOffset = 0;
      break;
    }

    case 'space_around': {
      // Equal space around each child
      const gap = (mainAxisSize - totalChildMainSize) / sortedChildren.length;
      actualSpacing = gap;
      startOffset = gap / 2;
      break;
    }

    case 'space_evenly': {
      // Equal space between all edges
      const gap = (mainAxisSize - totalChildMainSize) / (sortedChildren.length + 1);
      actualSpacing = gap;
      startOffset = gap;
      break;
    }
  }

  // Lay out children
  let mainCursor = startOffset;

  sortedChildren.forEach((child) => {
    const childOverrides = child.autoLayoutChild;
    const fillWidth = childOverrides?.fill_width ?? false;
    const fillHeight = childOverrides?.fill_height ?? false;
    const alignSelf = childOverrides?.align_self ?? config.alignment;

    let childWidth = child.size.width;
    let childHeight = child.size.height;

    // Fill overrides
    if (isVertical) {
      if (fillWidth || alignSelf === 'stretch') {
        childWidth = contentWidth;
      }
      if (fillHeight) {
        // In vertical mode, fill_height distributes remaining space
        const remainingSpace = mainAxisSize - totalChildMainSize - totalSpacing;
        childHeight = child.size.height + Math.max(0, remainingSpace / sortedChildren.length);
      }
    } else {
      if (fillHeight || alignSelf === 'stretch') {
        childHeight = contentHeight;
      }
      if (fillWidth) {
        const remainingSpace = mainAxisSize - totalChildMainSize - totalSpacing;
        childWidth = child.size.width + Math.max(0, remainingSpace / sortedChildren.length);
      }
    }

    // Cross-axis alignment
    let crossOffset = 0;
    const childCrossSize = isVertical ? childWidth : childHeight;

    switch (alignSelf) {
      case 'start':
        crossOffset = 0;
        break;
      case 'center':
        crossOffset = (crossAxisSize - childCrossSize) / 2;
        break;
      case 'end':
        crossOffset = crossAxisSize - childCrossSize;
        break;
      case 'stretch':
        crossOffset = 0;
        // Size already set above
        break;
    }

    // Compute absolute position
    let x: number, y: number;
    if (isVertical) {
      x = contentLeft + crossOffset;
      y = contentTop + mainCursor;
    } else {
      x = contentLeft + mainCursor;
      y = contentTop + crossOffset;
    }

    result.set(child.id, {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(Math.max(20, childWidth)),
      height: Math.round(Math.max(20, childHeight)),
    });

    mainCursor += (isVertical ? childHeight : childWidth) + actualSpacing;
  });

  return result;
};

/**
 * Check if a container has auto-layout enabled.
 */
export const hasAutoLayout = (widget: WidgetData): boolean => {
  return widget.autoLayout?.enabled === true;
};
