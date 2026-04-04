import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, TapInfo } from 'framer-motion';
import { WidgetData } from '@/types/widget';
import { useWidgets } from '@/contexts/useWidgets';
import { InteractiveWidget } from './InteractiveWidget';
import {
  isContainerWidget,
  getParentContentBounds,
  getContainerMetrics,
  getWidgetDepth,
  isDescendant,
  getDefaultTabSlot,
  getActiveTabSlot,
  ACTIVE_TAB_STATE_KEY,
  getContainerOverflowPolicy,
} from '@/lib/widgetLayout';
import { hasAutoLayout } from '@/lib/autoLayoutEngine';
import { createSnapEngine, SnapGuide, DistanceMeasure, ResizeSnapResult } from '@/lib/SnapEngine';
import { calculateFigmaSnap } from '@/lib/figmaSnap';
import { FrameSmartGuidesDisplay } from './FrameSmartGuides';
import { computeFrameSmartGuides, type FrameSmartGuidesData } from './frameSmartGuidesUtils';

const ResizeHandle: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void;
  cursor: string;
  position: React.CSSProperties;
}> = ({ onMouseDown, cursor, position }) => (
  <div
    className="absolute"
    onPointerDown={(e) => {
      // Stop Framer Motion from interpreting resize handle clicks as drag starts.
      // pointerdown fires BEFORE mousedown — without this, Framer Motion starts
      // a drag on the widget (and potentially bubbles to the parent frame).
      e.stopPropagation();
    }}
    onMouseDown={onMouseDown}
    style={{
      width: 18,
      height: 18,
      zIndex: 50,
      pointerEvents: 'auto',
      cursor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...position,
    }}
  >
    <div
      style={{
        width: 9,
        height: 9,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #0F3460',
        boxShadow: '0 0.5px 2px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
      }}
    />
  </div>
);

interface RenderedWidgetProps {
  widget: WidgetData;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragUpdate?: (widget: WidgetData | null) => void;
  selectedWidgets: string[];
}

export const RenderedWidget: React.FC<RenderedWidgetProps> = ({
  widget,
  onContextMenu,
  onDragUpdate,
  selectedWidgets,
}) => {
  const {
    widgets,
    canvasSettings,
    selectedWidgetId,
    selectWidget,
    resizeWidget,
    moveWidget,
    previewMode,
    reparentWidget,
    updateWidget,
  } = useWidgets();

  const isSelected = selectedWidgetId === widget.id;
  const isHighlighted = isSelected || selectedWidgets.includes(widget.id);

  // Check if any descendant of this widget is the currently selected widget.
  // When true, this container must NOT drag or steal selection.
  const hasSelectedDescendant = useMemo(() => {
    if (!selectedWidgetId || selectedWidgetId === widget.id || !isContainerWidget(widget)) return false;
    // Walk up from selected widget to see if it sits inside this container
    let current = widgets.find(w => w.id === selectedWidgetId);
    while (current?.parentId) {
      if (current.parentId === widget.id) return true;
      current = widgets.find(w => w.id === current?.parentId);
    }
    return false;
  }, [selectedWidgetId, widget, widgets]);

  // Check if the parent container has auto-layout enabled (children can't be freely dragged)
  const isInAutoLayout = useMemo(() => {
    if (!widget.parentId) return false;
    const parent = widgets.find(w => w.id === widget.parentId);
    return parent ? hasAutoLayout(parent) : false;
  }, [widget.parentId, widgets]);

  const [isResizing, setIsResizing] = useState(false);
  // Use ref instead of state for snap guides to avoid re-rendering the entire
  // widget tree (child → parent frame → siblings) on every drag frame.
  const snapGuidesRef = useRef<SnapGuide[]>([]);
  const snapDistancesRef = useRef<DistanceMeasure[]>([]);
  const [, forceGuideRender] = useState(0);
  const lastGuideUpdateRef = useRef(0);
  const frameSmartGuidesRef = useRef<FrameSmartGuidesData>({ guides: [], distances: [] });
  const isPreviewMode = previewMode === 'preview';

  // Refs for drag state (declared early so they're available in effects below)
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastSnappedPosRef = useRef({ x: 0, y: 0 });
  const isEscapingRef = useRef(false); // Tracks when child is dragged outside parent frame
  const snapLockRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const lastRootGuidesUpdateRef = useRef(0);

  // SnapEngine: keep a stable ref during drag so dragStartPos isn't lost on re-render
  const snapEngineRef = useRef<ReturnType<typeof createSnapEngine>>(createSnapEngine(widget, widgets, canvasSettings));
  // Update the engine when NOT dragging so it has fresh sibling data
  useEffect(() => {
    if (!isDraggingRef.current) {
      snapEngineRef.current = createSnapEngine(widget, widgets, canvasSettings);
    }
  }, [widget, widgets, canvasSettings]);
  const snapEngine = snapEngineRef.current;

  const parentBounds = useMemo(
    () => getParentContentBounds(widgets, widget.parentId, canvasSettings),
    [widgets, widget.parentId, canvasSettings]
  );
  const parentWidget = useMemo(
    () => (widget.parentId ? widgets.find((w) => w.id === widget.parentId) ?? null : null),
    [widgets, widget.parentId]
  );
  const parentOverflowPolicy = useMemo(
    () => getContainerOverflowPolicy(parentWidget),
    [parentWidget]
  );


  // Détecter si un enfant est EN TRAIN de drag ou resize
  const [isDraggingChild, setIsDraggingChild] = useState(false);
  const [isChildResizing, setIsChildResizing] = useState(false);
  const lastDragUpdate = useRef(0);

  const x = useMotionValue(widget.position.x - parentBounds.left);
  const y = useMotionValue(widget.position.y - parentBounds.top);
  const widthVal = useMotionValue(widget.size.width);
  const heightVal = useMotionValue(widget.size.height);

  React.useLayoutEffect(() => {
    // Ne pas synchroniser pendant le drag/resize pour éviter le déchirement visuel
    if (isDraggingRef.current || isResizing || isDraggingChild || isChildResizing) return;

    x.set(widget.position.x - parentBounds.left);
    y.set(widget.position.y - parentBounds.top);
    widthVal.set(widget.size.width);
    heightVal.set(widget.size.height);
  }, [widget.position.x, widget.position.y, widget.size.width, widget.size.height, parentBounds.left, parentBounds.top, x, y, widthVal, heightVal, isResizing, isDraggingChild, isChildResizing]);

  const childWidgets = useMemo(
    () => widgets.filter(child => child.parentId === widget.id),
    [widgets, widget.id]
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const activeTab = useMemo(() => getActiveTabSlot(widget), [widget]);

  const handleTabChange = useCallback(
    (tab: string) => {
      updateWidget(widget.id, { properties: { [ACTIVE_TAB_STATE_KEY]: tab } }, false);
    },
    [updateWidget, widget.id]
  );

  const renderedChildren = useMemo(() => {
    if (!isContainerWidget(widget)) return [] as WidgetData[];
    if (widget.type === 'tabview') {
      return childWidgets.filter(child => {
        const slot = child.parentSlot || getDefaultTabSlot(widget);
        return slot === activeTab;
      });
    }
    return childWidgets;
  }, [childWidgets, widget, activeTab]);

  const parentOriginX = parentBounds.left;
  const parentOriginY = parentBounds.top;
  const parentMaxWidth = parentBounds.width;
  const parentMaxHeight = parentBounds.height;

  const handleDragStart = () => {
    isDraggingRef.current = true;
    snapLockRef.current = { x: null, y: null };
    lastRootGuidesUpdateRef.current = 0;

    // Démarrer le snap engine
    snapEngine.startDrag({
      x: widget.position.x,
      y: widget.position.y
    });

    // Track start position for minimum-movement check (root widgets)
    dragStartPosRef.current = { x: widget.position.x, y: widget.position.y };
    lastSnappedPosRef.current = { x: widget.position.x, y: widget.position.y };

    // For child widgets: notify parent that a child drag started so
    // FrameInternalGrid can be displayed. But do NOT propagate to Canvas
    // SmartGuides — only root widget drags should trigger SmartGuides.
    if (widget.parentId) {
      // Pass a minimal signal just to toggle isDraggingChild in the parent.
      // handleChildDragUpdate will handle this and NOT propagate further.
      onDragUpdate?.({ ...widget, position: widget.position });
    }
  };

  const handleDrag = () => {
    const stabilizeSnapAxis = (
      axis: 'x' | 'y',
      rawValue: number,
      snappedValue: number,
      isSnapped: boolean
    ) => {
      const ENTER_THRESHOLD = 5;
      const RELEASE_THRESHOLD = 9;
      const SWITCH_MARGIN = 1;
      const currentLock = snapLockRef.current[axis];

      if (currentLock !== null) {
        const distanceToLock = Math.abs(rawValue - currentLock);
        if (distanceToLock <= RELEASE_THRESHOLD) {
          if (isSnapped) {
            const distanceToCandidate = Math.abs(rawValue - snappedValue);
            if (distanceToCandidate + SWITCH_MARGIN < distanceToLock) {
              snapLockRef.current[axis] = snappedValue;
              return snappedValue;
            }
          }
          return currentLock;
        }
        snapLockRef.current[axis] = null;
      }

      if (isSnapped && Math.abs(rawValue - snappedValue) <= ENTER_THRESHOLD) {
        snapLockRef.current[axis] = snappedValue;
        return snappedValue;
      }

      return rawValue;
    };

    const currentX = x.get();
    const currentY = y.get();
    let rawAbsX = currentX + parentOriginX;
    let rawAbsY = currentY + parentOriginY;

    const maxAbsX = parentOriginX + Math.max(0, parentMaxWidth - widget.size.width);
    const maxAbsY = parentOriginY + Math.max(0, parentMaxHeight - widget.size.height);
    const minAbsX = parentOriginX;
    const minAbsY = parentOriginY;

    const now = performance.now();

    // ── Child widget: detect if escaping parent frame ──
    if (widget.parentId) {
      const centerX = rawAbsX + widget.size.width / 2;
      const centerY = rawAbsY + widget.size.height / 2;
      const escapesX =
        !parentOverflowPolicy.allowOverflowX &&
        (centerX < parentOriginX || centerX > parentOriginX + parentMaxWidth);
      const escapesY =
        !parentOverflowPolicy.allowOverflowY &&
        (centerY < parentOriginY || centerY > parentOriginY + parentMaxHeight);
      const isEscaping = escapesX || escapesY;
      isEscapingRef.current = isEscaping;

      if (isEscaping) {
        // Widget is escaping: free movement, no clamping, no snap
        if (frameSmartGuidesRef.current.guides.length > 0 || frameSmartGuidesRef.current.distances.length > 0) {
          frameSmartGuidesRef.current = { guides: [], distances: [] };
          forceGuideRender(c => c + 1);
        }
        const finalX = Math.round(rawAbsX);
        const finalY = Math.round(rawAbsY);
        x.set(finalX - parentOriginX);
        y.set(finalY - parentOriginY);
        lastSnappedPosRef.current = { x: finalX, y: finalY };
        if (now - lastDragUpdate.current > 32) {
          moveWidget(widget.id, { x: finalX, y: finalY }, false);
          lastDragUpdate.current = now;
        }
        return;
      }
    }

    // Constrain within bounds (normal behavior when NOT escaping)
    rawAbsX = parentOverflowPolicy.allowOverflowX
      ? Math.max(rawAbsX, minAbsX)
      : Math.min(Math.max(rawAbsX, minAbsX), Math.max(minAbsX, maxAbsX));
    rawAbsY = parentOverflowPolicy.allowOverflowY
      ? Math.max(rawAbsY, minAbsY)
      : Math.min(Math.max(rawAbsY, minAbsY), Math.max(minAbsY, maxAbsY));

    if (widget.parentId) {
      const snapResult = snapEngine.calculateSnap({ x: rawAbsX, y: rawAbsY });
      const snappedX = Math.abs(snapResult.x - rawAbsX) > 0.01;
      const snappedY = Math.abs(snapResult.y - rawAbsY) > 0.01;
      const stabilizedX = stabilizeSnapAxis('x', rawAbsX, snapResult.x, snappedX);
      const stabilizedY = stabilizeSnapAxis('y', rawAbsY, snapResult.y, snappedY);
      const finalX = Math.round(stabilizedX);
      const finalY = Math.round(stabilizedY);

      // Compute Figma-style frame smart guides (lines with extents + distances)
      if (now - lastGuideUpdateRef.current > 32) {
        lastGuideUpdateRef.current = now;
        const siblings = widgets.filter(w => w.parentId === widget.parentId && w.id !== widget.id);
        const newData = computeFrameSmartGuides(
          { x: finalX, y: finalY, width: widget.size.width, height: widget.size.height },
          siblings,
          parentBounds
        );
        const prev = frameSmartGuidesRef.current;
        const changed = newData.guides.length !== prev.guides.length ||
          newData.distances.length !== prev.distances.length ||
          newData.guides.some((g, i) => g.pos !== prev.guides[i]?.pos || g.orientation !== prev.guides[i]?.orientation) ||
          newData.distances.some((d, i) => d.value !== prev.distances[i]?.value);
        if (changed) {
          frameSmartGuidesRef.current = newData;
          forceGuideRender(c => c + 1);
        }
      }
      // Apply snap directly to motion values (no more snapOffset CSS transform)
      x.set(finalX - parentOriginX);
      y.set(finalY - parentOriginY);

      lastSnappedPosRef.current = { x: finalX, y: finalY };

      if (now - lastDragUpdate.current > 32) {
        moveWidget(widget.id, { x: finalX, y: finalY }, false);
        lastDragUpdate.current = now;
      }
    } else {
      const otherRoots = widgets
        .filter(w => w.id !== widget.id && !w.parentId && w.position && w.size)
        .map(w => ({ id: w.id, x: w.position.x, y: w.position.y, w: w.size.width, h: w.size.height }));

      const canvasContentH = canvasSettings.height - 40;
      const snap = calculateFigmaSnap(rawAbsX, rawAbsY, widget.size.width, widget.size.height, otherRoots, canvasSettings.width, canvasContentH);
      const stabilizedX = stabilizeSnapAxis('x', rawAbsX, snap.x, snap.xSnapped);
      const stabilizedY = stabilizeSnapAxis('y', rawAbsY, snap.y, snap.ySnapped);
      const finalX = Math.round(stabilizedX);
      const finalY = Math.round(stabilizedY);
      // Apply snap directly to motion values (no more snapOffset CSS transform)
      x.set(finalX - parentOriginX);
      y.set(finalY - parentOriginY);

      lastSnappedPosRef.current = { x: finalX, y: finalY };

      // Throttle root SmartGuides updates to reduce heavy recalculations and visual jitter.
      if (now - lastRootGuidesUpdateRef.current > 16) {
        lastRootGuidesUpdateRef.current = now;
        onDragUpdate?.({ ...widget, position: { x: finalX, y: finalY } });
      }

      if (now - lastDragUpdate.current > 32) {
        moveWidget(widget.id, { x: finalX, y: finalY }, false);
        lastDragUpdate.current = now;
      }
    }
  };

  const findDropTarget = useCallback(
    (absoluteX: number, absoluteY: number, width: number, height: number) => {
      const rect = {
        left: absoluteX,
        top: absoluteY,
        right: absoluteX + width,
        bottom: absoluteY + height,
      };

      const candidates = widgets.filter(candidate => {
        if (candidate.id === widget.id) return false;
        if (!isContainerWidget(candidate)) return false;
        if (isDescendant(widgets, widget.id, candidate.id)) return false;
        return true;
      });

      const containing = candidates.filter(candidate => {
        const bounds = getParentContentBounds(widgets, candidate.id, canvasSettings);
        return (
          rect.left >= bounds.left &&
          rect.top >= bounds.top &&
          rect.right <= bounds.left + bounds.width &&
          rect.bottom <= bounds.top + bounds.height
        );
      });

      if (containing.length === 0) return null;

      return containing.reduce((best, candidate) => {
        if (!best) return candidate;
        const bestDepth = getWidgetDepth(widgets, best.id);
        const candidateDepth = getWidgetDepth(widgets, candidate.id);
        return candidateDepth >= bestDepth ? candidate : best;
      }, containing[0] as WidgetData | null);
    },
    [widgets, widget.id, canvasSettings]
  );

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    snapLockRef.current = { x: null, y: null };
    const wasEscaping = isEscapingRef.current;
    isEscapingRef.current = false;

    let finalAbsX: number;
    let finalAbsY: number;

    if (widget.parentId && wasEscaping) {
      // ── Widget escaped its parent frame: use raw absolute position ──
      finalAbsX = Math.round(x.get() + parentOriginX);
      finalAbsY = Math.round(y.get() + parentOriginY);

      // Find if it landed inside a different container, or becomes a root widget
      const targetContainer = findDropTarget(finalAbsX, finalAbsY, widget.size.width, widget.size.height);
      const newParentId = targetContainer ? targetContainer.id : null;

      let targetSlot: string | undefined;
      if (targetContainer?.type === 'tabview') {
        targetSlot = getActiveTabSlot(targetContainer) || getDefaultTabSlot(targetContainer);
      }

      // Reparent to new container (or null = canvas root)
      reparentWidget(widget.id, newParentId, { x: finalAbsX, y: finalAbsY }, targetSlot);

    } else if (widget.parentId) {
      // ── Normal child drag end (within parent bounds) ──
      const currentX = x.get();
      const currentY = y.get();
      const rawEndAbsX = currentX + parentOriginX;
      const rawEndAbsY = currentY + parentOriginY;

      // Apply snap once at the end for a clean final position
      const snapResult = snapEngine.calculateSnap({ x: rawEndAbsX, y: rawEndAbsY });
      finalAbsX = snapResult.x;
      finalAbsY = snapResult.y;

      // Fallback if snap returned out of bounds (e.g. engine had no dragStart)
      if (!parentOverflowPolicy.allowOverflowX && (finalAbsX < parentOriginX || finalAbsX > parentOriginX + parentMaxWidth)) {
        finalAbsX = rawEndAbsX;
      }
      if (!parentOverflowPolicy.allowOverflowY && (finalAbsY < parentOriginY || finalAbsY > parentOriginY + parentMaxHeight)) {
        finalAbsY = rawEndAbsY;
      }

      const maxAbsX = parentOriginX + Math.max(0, parentMaxWidth - widget.size.width);
      const maxAbsY = parentOriginY + Math.max(0, parentMaxHeight - widget.size.height);
      const clampedAbsX = parentOverflowPolicy.allowOverflowX
        ? Math.max(finalAbsX, parentOriginX)
        : Math.min(Math.max(finalAbsX, parentOriginX), Math.max(parentOriginX, maxAbsX));
      const clampedAbsY = parentOverflowPolicy.allowOverflowY
        ? Math.max(finalAbsY, parentOriginY)
        : Math.min(Math.max(finalAbsY, parentOriginY), Math.max(parentOriginY, maxAbsY));

      moveWidget(widget.id, { x: Math.round(clampedAbsX), y: Math.round(clampedAbsY) }, false);
      x.set(Math.round(clampedAbsX) - parentOriginX);
      y.set(Math.round(clampedAbsY) - parentOriginY);

      const targetContainer = findDropTarget(clampedAbsX, clampedAbsY, widget.size.width, widget.size.height);
      const targetParentId = targetContainer && targetContainer.id !== widget.parentId
        ? targetContainer.id
        : (widget.parentId || null);

      let targetSlot: string | undefined;
      if (targetContainer && targetContainer.id !== widget.parentId && targetContainer.type === 'tabview') {
        targetSlot = getActiveTabSlot(targetContainer) || getDefaultTabSlot(targetContainer);
      } else if (widget.parentId && !targetContainer) {
        targetSlot = widget.parentSlot || undefined;
      }

      if (targetParentId !== widget.parentId || targetSlot !== widget.parentSlot) {
        reparentWidget(widget.id, targetParentId, { x: Math.round(clampedAbsX), y: Math.round(clampedAbsY) }, targetSlot);
      }

    } else {
      // ── Root widget drag end ──
      const currentX = x.get();
      const currentY = y.get();
      const rawAbsX = currentX + parentOriginX;
      const rawAbsY = currentY + parentOriginY;

      const otherRoots = widgets
        .filter(w => w.id !== widget.id && !w.parentId && w.position && w.size)
        .map(w => ({ id: w.id, x: w.position.x, y: w.position.y, w: w.size.width, h: w.size.height }));
      const canvasContentH = canvasSettings.height - 40;
      const snap = calculateFigmaSnap(
        rawAbsX, rawAbsY, widget.size.width, widget.size.height,
        otherRoots, canvasSettings.width, canvasContentH
      );
      finalAbsX = snap.x;
      finalAbsY = snap.y;

      const maxAbsX = parentOriginX + Math.max(0, parentMaxWidth - widget.size.width);
      const maxAbsY = parentOriginY + Math.max(0, parentMaxHeight - widget.size.height);
      const clampedAbsX = Math.min(Math.max(finalAbsX, parentOriginX), Math.max(parentOriginX, maxAbsX));
      const clampedAbsY = Math.min(Math.max(finalAbsY, parentOriginY), Math.max(parentOriginY, maxAbsY));

      moveWidget(widget.id, { x: Math.round(clampedAbsX), y: Math.round(clampedAbsY) }, false);
      x.set(Math.round(clampedAbsX) - parentOriginX);
      y.set(Math.round(clampedAbsY) - parentOriginY);

      const targetContainer = findDropTarget(clampedAbsX, clampedAbsY, widget.size.width, widget.size.height);
      if (targetContainer) {
        let targetSlot: string | undefined;
        if (targetContainer.type === 'tabview') {
          targetSlot = getActiveTabSlot(targetContainer) || getDefaultTabSlot(targetContainer);
        }
        reparentWidget(widget.id, targetContainer.id, { x: Math.round(clampedAbsX), y: Math.round(clampedAbsY) }, targetSlot);
      }
    }

    // Reset
    snapEngine.endDrag();
    snapGuidesRef.current = [];
    snapDistancesRef.current = [];
    frameSmartGuidesRef.current = { guides: [], distances: [] };
    forceGuideRender(c => c + 1);
    onDragUpdate?.(null);  // Notify parent that drag ended (toggles isDraggingChild off)
  };

  const handleResize = (handle: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    const startWidth = widget.size.width;
    const startHeight = widget.size.height;
    const startPosX = widget.position.x;
    const startPosY = widget.position.y;

    // Which edges move?
    const movesLeft = handle === 'left' || handle === 'top-left' || handle === 'bottom-left';
    const movesRight = handle === 'right' || handle === 'top-right' || handle === 'bottom-right';
    const movesTop = handle === 'top' || handle === 'top-left' || handle === 'top-right';
    const movesBottom = handle === 'bottom' || handle === 'bottom-left' || handle === 'bottom-right';

    // Notify parent that a child resize started
    if (widget.parentId) {
      onDragUpdate?.({ ...widget, id: '__resize_start__' + widget.id, position: widget.position });
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.stopPropagation();
      // Apply scale to dx/dy so the resize perfectly tracks the mouse regardless of zoom
      const scale = canvasSettings?.scaling || 1;
      const dx = (moveEvent.clientX - mouseStartX) / scale;
      const dy = (moveEvent.clientY - mouseStartY) / scale;

      let newX = startPosX;
      let newY = startPosY;
      let newWidth = startWidth;
      let newHeight = startHeight;

      // Horizontal resize
      if (movesLeft) {
        const targetX = startPosX + dx;
        const maxX = startPosX + startWidth - 20; // Cannot shrink below 20px
        const minX = parentOriginX; // Cannot go outside parent bounds
        newX = Math.max(minX, Math.min(targetX, maxX));
        newWidth = startWidth + (startPosX - newX);
      } else if (movesRight) {
        const targetWidth = startWidth + dx;
        if (parentOverflowPolicy.allowOverflowX) {
          newWidth = Math.max(20, targetWidth);
        } else {
          const maxWidth = (parentOriginX + parentMaxWidth) - startPosX;
          newWidth = Math.max(20, Math.min(targetWidth, maxWidth));
        }
      }

      // Vertical resize
      if (movesTop) {
        const targetY = startPosY + dy;
        const maxY = startPosY + startHeight - 20; // Cannot shrink below 20px
        const minY = parentOriginY; // Cannot go outside parent bounds
        newY = Math.max(minY, Math.min(targetY, maxY));
        newHeight = startHeight + (startPosY - newY);
      } else if (movesBottom) {
        const targetHeight = startHeight + dy;
        if (parentOverflowPolicy.allowOverflowY) {
          newHeight = Math.max(20, targetHeight);
        } else {
          const maxHeight = (parentOriginY + parentMaxHeight) - startPosY;
          newHeight = Math.max(20, Math.min(targetHeight, maxHeight));
        }
      }

      // ── Resize Snap: Figma-style real-time edge alignment ──
      const resizeSnap: ResizeSnapResult = snapEngineRef.current.calculateResizeSnap(
        { x: newX, y: newY, width: newWidth, height: newHeight },
        { left: movesLeft, right: movesRight, top: movesTop, bottom: movesBottom }
      );
      newX = resizeSnap.x;
      newY = resizeSnap.y;
      newWidth = resizeSnap.width;
      newHeight = resizeSnap.height;

      // Visual feedback: child → FrameSmartGuides, root → canvas SmartGuides
      const now = performance.now();
      if (widget.parentId) {
        // Child widget: compute Figma-style frame smart guides
        if (now - lastGuideUpdateRef.current > 32) {
          lastGuideUpdateRef.current = now;
          const siblings = widgets.filter(w => w.parentId === widget.parentId && w.id !== widget.id);
          const newData = computeFrameSmartGuides(
            { x: Math.round(newX), y: Math.round(newY), width: Math.round(newWidth), height: Math.round(newHeight) },
            siblings,
            parentBounds
          );
          frameSmartGuidesRef.current = newData;
          forceGuideRender(c => c + 1);
        }
      } else {
        // Root widget: send resize rect to canvas-level SmartGuides
        onDragUpdate?.({
          ...widget,
          position: { x: Math.round(newX), y: Math.round(newY) },
          size: { width: Math.round(newWidth), height: Math.round(newHeight) },
        });
      }

      // Instant visual update to bypass React state latency and Framer Motion async render
      widthVal.set(Math.round(newWidth));
      heightVal.set(Math.round(newHeight));
      x.set(Math.round(newX) - parentOriginX);
      y.set(Math.round(newY) - parentOriginY);

      // Skip history during continuous resize to avoid heavy re-renders
      resizeWidget(
        widget.id,
        { width: Math.round(newWidth), height: Math.round(newHeight) },
        { x: Math.round(newX), y: Math.round(newY) },
        false
      );
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.stopPropagation();
      upEvent.preventDefault();
      // Final resize with history save
      resizeWidget(
        widget.id,
        { width: Math.round(widthVal.get()), height: Math.round(heightVal.get()) },
        { x: Math.round(x.get() + parentOriginX), y: Math.round(y.get() + parentOriginY) },
        true
      );
      setIsResizing(false);
      // Clear resize snap guides
      snapGuidesRef.current = [];
      snapDistancesRef.current = [];
      frameSmartGuidesRef.current = { guides: [], distances: [] };
      forceGuideRender(c => c + 1);
      // Notify parent that child resize ended / clear SmartGuides for root
      if (widget.parentId) {
        onDragUpdate?.(null);
      } else {
        onDragUpdate?.(null);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const blockClick = (clickEvent: MouseEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
        document.removeEventListener('click', blockClick, true);
      };
      document.addEventListener('click', blockClick, true);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTapStart = (event: MouseEvent | TouchEvent | PointerEvent, _info: TapInfo) => {
    // Toujours stopper la propagation pour éviter la désélection par le canvas
    event.stopPropagation();
    // Don't steal selection from a child that is actively being dragged/resized
    if (!widget.locked && !isPreviewMode && !isDraggingChild && !isChildResizing) {
      selectWidget(widget.id);
    }
  };



  const handleChildDragUpdate = useCallback((draggedChild: WidgetData | null) => {
    // Simple toggle: show/hide FrameInternalGrid.
    // Called only on drag start (non-null) and drag end (null) — NOT every frame.
    // This avoids N re-renders of the parent Frame during continuous child drag.
    if (draggedChild && draggedChild.id.startsWith('__resize_start__')) {
      // Child resize started — guard parent motion values
      setIsChildResizing(true);
      return;
    }
    if (!draggedChild) {
      // Drag or resize ended
      setIsDraggingChild(false);
      setIsChildResizing(false);
      return;
    }
    setIsDraggingChild(draggedChild.parentId === widget.id);
    // We intentionally DO NOT call onDragUpdate?.(draggedChild) here.
    // We don't want child widget drags to propagate up to the Canvas and trigger SmartGuides.
    // SmartGuides are only for root widgets. Internal snapping is handled by SnapEngine.
  }, [widget.id]);

  const childElements = useMemo(() => {
    if (!isContainerWidget(widget)) return null;
    return renderedChildren.map(child => (
      <RenderedWidget
        key={child.id}
        widget={child}
        constraintsRef={contentRef}
        onContextMenu={onContextMenu}
        onDragUpdate={handleChildDragUpdate}
        selectedWidgets={selectedWidgets}
      />
    ));
  }, [renderedChildren, onContextMenu, handleChildDragUpdate, selectedWidgets, widget]);

  const hasVisibleChildren = renderedChildren.length > 0;
  const containerMetrics = useMemo(() => getContainerMetrics(widget), [widget]);

  // Compute numeric drag constraints instead of using a ref (avoids getBoundingClientRect issues with CSS transforms/scaling)
  // For child widgets: use very large bounds so framer-motion doesn't block escape drag.
  // Manual clamping in handleDrag enforces parent bounds when NOT escaping.
  const dragConstraintsComputed = useMemo(() => {
    if (widget.parentId) {
      return {
        left: -5000,
        top: -5000,
        right: 5000,
        bottom: 5000,
      };
    }
    return {
      left: -1,
      top: -1,
      right: Math.max(0, parentMaxWidth - widget.size.width) + 1,
      bottom: Math.max(0, parentMaxHeight - widget.size.height) + 1,
    };
  }, [widget.parentId, parentMaxWidth, parentMaxHeight, widget.size.width, widget.size.height]);

  // Drag simple : dragPropagation={false} empêche les conflits parent-enfant

  return (
    <motion.div
      drag={!isResizing && !widget.locked && !isPreviewMode && !hasSelectedDescendant && !isInAutoLayout}
      dragListener={true}
      onPointerDown={(e) => {
        // Prevent the parent frame's motion.div from also starting a drag simultaneously
        e.stopPropagation();
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      dragMomentum={false}
      dragConstraints={dragConstraintsComputed}
      dragElastic={0}
      style={{
        top: 0,
        left: 0,
        x,
        y,
        width: widthVal,
        height: heightVal,
        zIndex: isSelected ? (widget.parentId ? 30 : 20) : (widget.parentId ? 15 : 10),
        cursor: isPreviewMode ? 'default' : isResizing ? 'default' : widget.locked ? 'not-allowed' : 'grab',
        opacity: widget.locked ? 0.7 : 1,
        overflow: isContainerWidget(widget) ? ((isDraggingChild || (isSelected && !isPreviewMode)) ? 'visible' : 'hidden') : 'visible',
      }}
      className="absolute select-none"
      onTapStart={handleTapStart}
      onContextMenu={onContextMenu}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={'w-full h-full ' + (isHighlighted && !isPreviewMode ? 'rounded-md' : '')}
        style={{
          outline: isHighlighted && !isPreviewMode
            ? (isSelected ? '2px solid #0F3460' : '1.5px dashed #1F5AA0')
            : widget.locked ? '1.5px dashed #888' : 'none',
          outlineOffset: isSelected && !isPreviewMode ? '0px' : '1px',
          boxShadow: isSelected && !isPreviewMode
            ? '0 0 0 1px rgba(15, 52, 96, 0.15)'
            : 'none',
          pointerEvents: 'auto',
          cursor: isPreviewMode ? 'default' : isResizing ? 'default' : widget.locked ? 'not-allowed' : 'move',
          position: 'relative',
        }}
        data-widget-id={widget.id}
        onClick={(e) => {
          // Backup selection handler — ensures child widgets inside Frames
          // are always selectable even if Framer Motion's onTapStart misses
          e.stopPropagation();
          // Don't steal selection from a child that is actively being dragged/resized
          if (!widget.locked && !isPreviewMode && !isDraggingChild && !isChildResizing) {
            selectWidget(widget.id);
          }
        }}
      >
        <InteractiveWidget
          widget={widget}
          isSelected={isSelected}
          isPreviewMode={isPreviewMode}
          contentRef={contentRef}
          childElements={childElements}
          childWidgets={renderedChildren}
          hasChildren={hasVisibleChildren}
          containerMetrics={containerMetrics}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          updateWidget={updateWidget}
          isDraggingChild={isDraggingChild}
        />

        {/* Figma-style smart guides inside frames (drag & resize) */}
        {widget.parentId && (frameSmartGuidesRef.current.guides.length > 0 || frameSmartGuidesRef.current.distances.length > 0) && (
          <FrameSmartGuidesDisplay
            data={frameSmartGuidesRef.current}
            parentBounds={parentBounds}
            widgetAbsPos={{ x: x.get() + parentOriginX, y: y.get() + parentOriginY }}
          />
        )}

        {isSelected && !widget.locked && !isPreviewMode && (
          <>
            {/* 4 coins */}
            <ResizeHandle onMouseDown={handleResize('top-left')} cursor="nwse-resize" position={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }} />
            <ResizeHandle onMouseDown={handleResize('top-right')} cursor="nesw-resize" position={{ top: 0, right: 0, transform: 'translate(50%, -50%)' }} />
            <ResizeHandle onMouseDown={handleResize('bottom-left')} cursor="nesw-resize" position={{ bottom: 0, left: 0, transform: 'translate(-50%, 50%)' }} />
            <ResizeHandle onMouseDown={handleResize('bottom-right')} cursor="nwse-resize" position={{ bottom: 0, right: 0, transform: 'translate(50%, 50%)' }} />
            {/* 4 milieux de bords */}
            <ResizeHandle onMouseDown={handleResize('top')} cursor="ns-resize" position={{ top: 0, left: '50%', transform: 'translate(-50%, -50%)' }} />
            <ResizeHandle onMouseDown={handleResize('bottom')} cursor="ns-resize" position={{ bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }} />
            <ResizeHandle onMouseDown={handleResize('left')} cursor="ew-resize" position={{ left: 0, top: '50%', transform: 'translate(-50%, -50%)' }} />
            <ResizeHandle onMouseDown={handleResize('right')} cursor="ew-resize" position={{ right: 0, top: '50%', transform: 'translate(50%, -50%)' }} />
          </>
        )}
      </div>
    </motion.div>
  );
};
