import { MutableRefObject, useCallback } from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';

export const DRAG_TYPES = {
  WIDGET_TYPE: 'widget-type',      // Nouveau widget depuis sidebar
  EXISTING_WIDGET: 'existing-widget', // Widget existant sur canvas
};

export interface WidgetTypeDragItem {
  widgetType: string;
  transactionId?: string;
  [key: string]: unknown;
}

export const useWidgetTypeDrag = (widgetType: string) => {
  const [{ isDragging }, drag] = useDrag<WidgetTypeDragItem, void, { isDragging: boolean }>(() => ({
    type: DRAG_TYPES.WIDGET_TYPE,
    item: { widgetType },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return { isDragging, drag };
};

interface UseCanvasDropOptions {
  onDrop: (item: WidgetTypeDragItem, monitor: DropTargetMonitor) => void;
  onHover?: (item: WidgetTypeDragItem, monitor: DropTargetMonitor) => void;
  canvasRef: MutableRefObject<HTMLDivElement | null>;
}

export const useCanvasDrop = ({ onDrop, onHover, canvasRef }: UseCanvasDropOptions) => {
  const [{ isOver }, drop] = useDrop<WidgetTypeDragItem, void, { isOver: boolean }>(() => ({
    accept: [DRAG_TYPES.WIDGET_TYPE],
    drop: (item, monitor) => {
      // Ne traiter que si le drop est directement sur cette zone (pas sur un enfant)
      const didDrop = monitor.didDrop();
      if (didDrop) {
        // Un enfant a déjà traité le drop, on ignore
        return;
      }
      onDrop(item, monitor);
    },
    hover: onHover,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }), // Seulement si directement au-dessus
    }),
  }));

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      drop(node);
    },
    [canvasRef, drop]
  );

  return { isOver, attach };
};

// Hook pour les zones de drop des conteneurs (Frame, ScrollableFrame, TabView)
interface UseContainerDropOptions {
  containerId: string;
  onDrop: (item: WidgetTypeDragItem, monitor: DropTargetMonitor) => void;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export const useContainerDrop = ({ containerId, onDrop, containerRef }: UseContainerDropOptions) => {
  const [{ isOver, canDrop }, drop] = useDrop<WidgetTypeDragItem, { dropped: boolean }, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: [DRAG_TYPES.WIDGET_TYPE],
    drop: (item, monitor) => {
      // Ne traiter que si c'est directement dans CE conteneur (pas ses enfants)
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      
      onDrop(item, monitor);
      
      // Empêcher la propagation au Canvas parent
      return { dropped: true };
    },
    canDrop: (_item, _monitor) => {
      // Toujours accepter les widgets de la sidebar
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [containerId, onDrop]);

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      drop(node);
    },
    [containerRef, drop]
  );

  return { isOver: isOver && canDrop, attach };
};
