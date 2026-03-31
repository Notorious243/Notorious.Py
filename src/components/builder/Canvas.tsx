import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WidgetData } from '@/types/widget';
import { useWidgets } from '@/contexts/WidgetContext';
import { useCanvasDrop } from '@/hooks/useDragDrop';
import { ALL_WIDGET_DEFINITIONS } from '@/constants/widgets';
import { isContainerWidget, getParentContentBounds, getWidgetDepth, getActiveTabSlot, getDefaultTabSlot } from '@/lib/widgetLayout';
import { CanvasGrid } from './CanvasGrid';
import { useProjects } from '@/contexts/ProjectContext';
import { RenderedWidget } from './RenderedWidget';
import { SmartGuides } from './SmartGuides';
import { DropTargetMonitor } from 'react-dnd';
import { CanvasHeader } from './CanvasHeader';
import { Plus, Copy, Scissors, Clipboard, Trash2, Lock, Unlock, Sparkles, Folder, LayoutGrid, X, Clock, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { openAIAssistantForPrompt } from '@/lib/aiSidebar';
import { useFileSystem } from '@/hooks/useFileSystem';

export const Canvas: React.FC = () => {
  const { widgets, canvasSettings, addWidget, selectWidget, selectedWidgetId, copyWidget, cutWidget, pasteWidget, deleteWidget, toggleWidgetLock, clipboard, undo, redo, updateWidget, moveWidget, previewMode, updateCanvasSettings } = useWidgets();
  const { getPyFiles } = useFileSystem();
  const { activeProjectId, createProject, projects, openProject } = useProjects();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; widgetId: string | null } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'manual' | 'ai'>('manual');
  const [newProjectName, setNewProjectName] = useState('');
  const importZipRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  // Mesurer l'espace disponible pour l'auto-scale en mode preview
  useEffect(() => {
    if (previewMode !== 'preview' || !containerRef.current) {
      setContainerSize(null);
      return;
    }
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [previewMode]);

  // Calculer le scale automatique en mode preview
  const previewScale = useMemo(() => {
    if (previewMode !== 'preview' || !containerSize) return null;
    const padding = 48; // 24px de marge de chaque côté
    const availW = containerSize.width - padding;
    const availH = containerSize.height - padding;
    const scaleX = availW / canvasSettings.width;
    const scaleY = availH / canvasSettings.height;
    const fitScale = Math.min(scaleX, scaleY);
    // Si le canvas tient déjà dans l'espace, ne pas zoomer au-delà de 1
    return Math.min(fitScale, 1);
  }, [previewMode, containerSize, canvasSettings.width, canvasSettings.height]);

  // Figma-like zoom: Ctrl/Cmd + wheel to zoom in/out
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState('');
  const zoomInputRef = useRef<HTMLInputElement>(null);
  const zoomIndicatorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPyFiles = useMemo(() => getPyFiles().length > 0, [getPyFiles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || previewMode === 'preview' || !hasPyFiles) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const currentScale = canvasSettings.scaling || 1;
        const zoomFactor = e.deltaY < 0 ? 1.01 : 0.99;
        const newScale = Math.min(3, Math.max(0.1, currentScale * zoomFactor));
        const rounded = Math.round(newScale * 100) / 100;

        updateCanvasSettings({ scaling: rounded });

        setShowZoomIndicator(true);
        if (zoomIndicatorTimeout.current) clearTimeout(zoomIndicatorTimeout.current);
        zoomIndicatorTimeout.current = setTimeout(() => setShowZoomIndicator(false), 1200);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [previewMode, canvasSettings.scaling, updateCanvasSettings, hasPyFiles]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const current = canvasSettings.scaling || 1;
    const newScale = Math.min(3, Math.round((current + 0.01) * 100) / 100);
    updateCanvasSettings({ scaling: newScale });
  }, [canvasSettings.scaling, updateCanvasSettings]);

  const handleZoomOut = useCallback(() => {
    const current = canvasSettings.scaling || 1;
    const newScale = Math.max(0.1, Math.round((current - 0.01) * 100) / 100);
    updateCanvasSettings({ scaling: newScale });
  }, [canvasSettings.scaling, updateCanvasSettings]);

  const handleZoomFit = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 80;
    const availW = rect.width - padding;
    const availH = rect.height - padding;
    const scaleX = availW / canvasSettings.width;
    const scaleY = availH / canvasSettings.height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    updateCanvasSettings({ scaling: Math.round(fitScale * 100) / 100 });
  }, [canvasSettings.width, canvasSettings.height, updateCanvasSettings]);

  // Get recent 4 projects sorted by most recently worked
  const recentProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  const fileToNode = async (name: string, content: string) => ({
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type: 'file' as const,
    content,
  });

  const processZipFile = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const tree: any[] = [];
      const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
      const paths = entries.map(([p]) => p);
      const commonPrefix = paths.length > 0 && paths.every(p => p.includes('/'))
        ? paths[0].split('/')[0] + '/'
        : '';
      for (const [path, zipFile] of entries) {
        const relativePath = commonPrefix ? path.replace(commonPrefix, '') : path;
        if (!relativePath) continue;
        const content = await zipFile.async('text');
        tree.push(await fileToNode(relativePath, content));
      }
      const projectName = commonPrefix
        ? commonPrefix.replace(/\/$/, '')
        : file.name.replace(/\.zip$/i, '');
      const newId = await createProject(projectName);
      await supabase.from('projects').update({ file_tree: tree, updated_at: new Date().toISOString() }).eq('id', newId);
    } catch (err) {
      console.error('Import ZIP error:', err);
    }
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processZipFile(file);
    e.target.value = '';
  };

  const handleCanvasCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    try {
      await createProject(name);
      if (createModalMode === 'ai') openAIAssistantForPrompt({ forceNewConversation: true });
      setShowCreateModal(false);
      setNewProjectName('');
    } catch (error) {
      console.error('Erreur creation projet:', error);
    }
  };
  // Drag updates go directly to SmartGuides via ref callback — NO Canvas re-render
  const smartGuidesSetterRef = useRef<(w: WidgetData | null) => void>(() => { });
  const handleDragUpdate = useCallback((w: WidgetData | null) => {
    smartGuidesSetterRef.current(w);
  }, []);
  const handleSmartGuidesRegister = useCallback((setter: (w: WidgetData | null) => void) => {
    smartGuidesSetterRef.current = setter;
  }, []);
  const justFinishedSelecting = useRef(false);
  const lastDropTimestamp = useRef<number>(0);
  const lastDropPosition = useRef<{ x: number; y: number } | null>(null);
  const isDropInProgress = useRef<boolean>(false);
  const processedTransactions = useRef<Set<string>>(new Set());

  const findContainerAtPoint = useCallback((absoluteX: number, absoluteY: number, width: number, height: number) => {
    const rect = {
      left: absoluteX,
      top: absoluteY,
      right: absoluteX + width,
      bottom: absoluteY + height,
    };

    const candidates = widgets.filter(candidate => isContainerWidget(candidate));
    const containing = candidates.filter(candidate => {
      const bounds = getParentContentBounds(widgets, candidate.id, canvasSettings);
      return (
        rect.left >= bounds.left &&
        rect.right <= bounds.left + bounds.width &&
        rect.top >= bounds.top &&
        rect.bottom <= bounds.top + bounds.height
      );
    });

    if (containing.length === 0) return null;

    return containing.reduce<WidgetData | null>((best, candidate) => {
      if (!best) return candidate;
      const bestDepth = getWidgetDepth(widgets, best.id);
      const candidateDepth = getWidgetDepth(widgets, candidate.id);
      return candidateDepth >= bestDepth ? candidate : best;
    }, null);
  }, [widgets, canvasSettings]);

  const handleDrop = (item: any, monitor: DropTargetMonitor) => {
    // LOCK: Empêcher les drops simultanés
    if (isDropInProgress.current) {
      console.warn('[Canvas] Drop ignored - another drop is in progress');
      return;
    }

    isDropInProgress.current = true;

    try {
      const now = Date.now();

      if (!canvasRef.current) {
        console.warn('[Canvas] canvasRef not available');
        isDropInProgress.current = false;
        return;
      }

      if (!item?.widgetType) {
        console.warn('[Canvas] No widgetType in dropped item');
        isDropInProgress.current = false;
        return;
      }

      // PROTECTION CRITIQUE: Ne traiter QUE les nouveaux widgets depuis la sidebar
      // Les widgets existants utilisent Framer Motion pour le reparenting
      if (!item.transactionId) {
        console.warn('[Canvas] Drop ignored - no transactionId (probably existing widget being moved)');
        isDropInProgress.current = false;
        return;
      }

      // PROTECTION PRINCIPALE: Vérifier l'ID de transaction
      const transactionId = item.transactionId;
      if (transactionId) {
        if (processedTransactions.current.has(transactionId)) {
          console.warn('[Canvas] Drop ignored - transaction already processed:', transactionId);
          isDropInProgress.current = false;
          return;
        }
        // Enregistrer cette transaction
        processedTransactions.current.add(transactionId);
        // Nettoyer les vieilles transactions (garder seulement les 100 dernières)
        if (processedTransactions.current.size > 100) {
          const transactions = Array.from(processedTransactions.current);
          processedTransactions.current = new Set(transactions.slice(-50));
        }
      }

      // Protection secondaire: ignorer les drops trop rapprochés (< 100ms)
      const timeSinceLastDrop = now - lastDropTimestamp.current;
      if (timeSinceLastDrop < 100) {
        console.warn('[Canvas] Drop ignored - too fast (debounce)', timeSinceLastDrop, 'ms');
        isDropInProgress.current = false;
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        console.warn('[Canvas] No client offset');
        isDropInProgress.current = false;
        return;
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();

      const scale = Number.isFinite(canvasSettings.scaling) && canvasSettings.scaling > 0
        ? canvasSettings.scaling
        : 1;

      // Positions absolues dans le canvas
      let absX = Math.round((clientOffset.x - canvasRect.left) / scale);
      let absY = Math.round((clientOffset.y - canvasRect.top) / scale);

      const widgetDef = ALL_WIDGET_DEFINITIONS.find(w => w.type === item.widgetType);
      if (!widgetDef) {
        console.error('[Canvas] Widget definition not found for type:', item.widgetType);
        isDropInProgress.current = false;
        return;
      }

      const width = Math.max(1, widgetDef.defaultSize?.width || 100);
      const height = Math.max(1, widgetDef.defaultSize?.height || 50);

      let targetParentId: string | null = null;
      let targetSlot: string | undefined;

      // Chercher un conteneur à ce point
      const containerTarget = findContainerAtPoint(absX, absY, width, height);

      if (containerTarget) {
        // Widget déposé dans un conteneur
        const bounds = getParentContentBounds(widgets, containerTarget.id, canvasSettings);

        // Clamp dans les limites du conteneur
        const maxX = bounds.left + Math.max(0, bounds.width - width);
        const maxY = bounds.top + Math.max(0, bounds.height - height);
        absX = Math.max(bounds.left, Math.min(absX, maxX));
        absY = Math.max(bounds.top, Math.min(absY, maxY));

        targetParentId = containerTarget.id;
        if (containerTarget.type === 'tabview') {
          targetSlot = getActiveTabSlot(containerTarget) || getDefaultTabSlot(containerTarget);
        }

      } else {
        // Widget déposé directement sur le canvas
        const maxX = canvasSettings.width - width;
        const maxY = (canvasSettings.height - 40) - height;
        absX = Math.max(0, Math.min(absX, maxX));
        absY = Math.max(0, Math.min(absY, maxY));

      }

      const newWidget: WidgetData = {
        id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: widgetDef.type,
        name: widgetDef.name,
        position: { x: absX, y: absY }, // Position absolue, sera convertie en relative par le context
        size: { width, height },
        style: {
          fontFamily: 'Roboto',
          backgroundColor: widgetDef.defaultProperties?.fg_color || '#FFFFFF',
          borderColor: widgetDef.defaultProperties?.border_color || '#000000',
          borderWidth: widgetDef.defaultProperties?.border_width ?? 0,
          borderRadius: widgetDef.defaultProperties?.corner_radius ?? 0,
        },
        properties: widgetDef.defaultProperties ? { ...widgetDef.defaultProperties } : {},
        parentId: targetParentId,
        parentSlot: targetSlot ?? null,
      };

      // Vérifier si un drop similaire vient de se produire (même position, même type)
      if (lastDropPosition.current) {
        const distX = Math.abs(lastDropPosition.current.x - absX);
        const distY = Math.abs(lastDropPosition.current.y - absY);
        if (distX < 5 && distY < 5 && timeSinceLastDrop < 500) {
          console.warn('[Canvas] Drop ignored - duplicate at same position');
          isDropInProgress.current = false;
          return;
        }
      }

      // Enregistrer ce drop
      lastDropTimestamp.current = now;
      lastDropPosition.current = { x: absX, y: absY };

      addWidget(newWidget);
      selectWidget(newWidget.id);

      // UNLOCK après un court délai pour être sûr que tout est fini
      setTimeout(() => {
        isDropInProgress.current = false;
      }, 50);

    } catch (error) {
      console.error('[Canvas] drop error:', error);
      console.error('[Canvas] Error details:', { item, widgets: widgets.length, canvasSettings });
      isDropInProgress.current = false;
    } finally {
      // SnapLines removed - SmartGuides handles all alignment visualization
    }
  };

  const { attach: attachCanvasRef } = useCanvasDrop({
    onDrop: handleDrop,
    canvasRef,
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't deselect if we just finished a selection drag
    if (justFinishedSelecting.current) {
      justFinishedSelecting.current = false;
      return;
    }

    // Check if the click is on the canvas itself, not on a widget
    if (e.target === e.currentTarget) {
      selectWidget(null);
      setSelectedWidgets([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if clicking on canvas background
    if (e.target === e.currentTarget && e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsSelecting(true);
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
        justFinishedSelecting.current = false;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectionBox) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Only update if mouse actually moved (not just a click)
        const hasMoved = Math.abs(x - selectionBox.startX) > 2 || Math.abs(y - selectionBox.startY) > 2;
        if (!hasMoved) return;

        setSelectionBox({ ...selectionBox, endX: x, endY: y });

        // Check which widgets intersect with selection box
        const selectedIds: string[] = [];
        widgets.forEach(widget => {
          const widgetRect = {
            left: widget.position.x,
            top: widget.position.y,
            right: widget.position.x + widget.size.width,
            bottom: widget.position.y + widget.size.height,
          };

          const boxLeft = Math.min(selectionBox.startX, x);
          const boxRight = Math.max(selectionBox.startX, x);
          const boxTop = Math.min(selectionBox.startY, y);
          const boxBottom = Math.max(selectionBox.startY, y);

          // Check intersection
          if (
            widgetRect.left < boxRight &&
            widgetRect.right > boxLeft &&
            widgetRect.top < boxBottom &&
            widgetRect.bottom > boxTop
          ) {
            selectedIds.push(widget.id);
          }
        });
        setSelectedWidgets(selectedIds);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isSelecting) {
      // Check if it was just a click (no drag)
      const wasDrag = selectionBox && (
        Math.abs(selectionBox.endX - selectionBox.startX) > 2 ||
        Math.abs(selectionBox.endY - selectionBox.startY) > 2
      );

      setIsSelecting(false);
      setSelectionBox(null);

      // If it was a drag, mark that we just finished selecting
      if (wasDrag) {
        justFinishedSelecting.current = true;
        // Reset after a short delay to allow normal clicks again
        setTimeout(() => {
          justFinishedSelecting.current = false;
        }, 100);
      } else if (e.target === e.currentTarget) {
        // If it was just a click, clear selection immediately
        setSelectedWidgets([]);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, widgetId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        widgetId,
      });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action: string) => {
    if (!contextMenu) return;

    const targetId = contextMenu.widgetId || selectedWidgetId;
    const hasMultipleSelection = selectedWidgets.length > 0;

    switch (action) {
      case 'copy':
        if (hasMultipleSelection) {
          copyWidget(selectedWidgets);
        } else if (targetId) {
          copyWidget(targetId);
        }
        break;
      case 'cut':
        if (hasMultipleSelection) {
          cutWidget(selectedWidgets);
          setSelectedWidgets([]);
        } else if (targetId) {
          cutWidget(targetId);
        }
        break;
      case 'paste':
        pasteWidget();
        break;
      case 'delete':
        if (hasMultipleSelection) {
          // Supprimer tous les widgets sélectionnés
          selectedWidgets.forEach(id => deleteWidget(id));
          setSelectedWidgets([]);
        } else if (targetId) {
          deleteWidget(targetId);
        }
        break;
      case 'lock':
        if (hasMultipleSelection) {
          // Verrouiller tous les widgets sélectionnés
          selectedWidgets.forEach(id => toggleWidgetLock(id));
        } else if (targetId) {
          toggleWidgetLock(targetId);
        }
        break;
    }

    handleCloseContextMenu();
  };  // Close context menu when clicking anywhere
  React.useEffect(() => {
    const handleClickOutside = () => handleCloseContextMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const hasMultipleSelection = selectedWidgets.length > 0;

      // Arrow keys - Move selected widget(s) - Figma-like behavior
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        const widgetsToMove = hasMultipleSelection ? selectedWidgets : (selectedWidgetId ? [selectedWidgetId] : []);

        if (widgetsToMove.length === 0) return;

        // Filtrer pour ne déplacer que les widgets de niveau supérieur (pas les descendants)
        const topLevelWidgets = widgetsToMove.filter(widgetId => {
          return !widgetsToMove.some(otherId => {
            if (otherId === widgetId) return false;
            const isChild = (parentId: string | null | undefined, childId: string): boolean => {
              if (!parentId) return false;
              if (parentId === childId) return true;
              const parent = widgets.find(w => w.id === parentId);
              if (!parent) return false;
              return isChild(parent.parentId, childId);
            };
            const widget = widgets.find(w => w.id === widgetId);
            return widget && isChild(widget.parentId, otherId);
          });
        });

        // Determine movement speed - Figma-like behavior
        let step = 1; // Default: 1 pixel (precision mode)
        if (e.shiftKey) {
          step = 10; // Shift: 10 pixels (large step)
        }

        topLevelWidgets.forEach(widgetId => {
          const widget = widgets.find(w => w.id === widgetId);
          if (!widget || widget.locked) return;

          // Calculer les limites en fonction du parent
          let minX = 0;
          let minY = 0;
          let maxX = canvasSettings.width - widget.size.width;
          let maxY = (canvasSettings.height - 40) - widget.size.height;

          // Si le widget a un parent, utiliser les limites du parent
          if (widget.parentId) {
            const parent = widgets.find(w => w.id === widget.parentId);
            if (parent) {
              // Calculer la zone de contenu du parent
              const parentPadding = typeof parent.style?.padding === 'number' ? parent.style.padding : 12;
              let offsetY = parentPadding;

              // Ajuster pour les headers spéciaux
              if (parent.type === 'tabview') {
                offsetY += 40; // Header des onglets
              }
              if (parent.type === 'scrollableframe' && parent.properties?.label_text) {
                offsetY += 28; // Label
              }

              minX = parent.position.x + parentPadding;
              minY = parent.position.y + offsetY;
              maxX = parent.position.x + parent.size.width - parentPadding - widget.size.width;
              maxY = parent.position.y + parent.size.height - parentPadding - widget.size.height;
            }
          }

          let newX = widget.position.x;
          let newY = widget.position.y;

          switch (e.key) {
            case 'ArrowUp':
              newY = Math.max(minY, widget.position.y - step);
              break;
            case 'ArrowDown':
              newY = Math.min(maxY, widget.position.y + step);
              break;
            case 'ArrowLeft':
              newX = Math.max(minX, widget.position.x - step);
              break;
            case 'ArrowRight':
              newX = Math.min(maxX, widget.position.x + step);
              break;
          }

          // Utiliser moveWidget pour la synchronisation correcte parent-enfant
          if (newX !== widget.position.x || newY !== widget.position.y) {
            moveWidget(widgetId, { x: newX, y: newY }, true);
          }
        });
      }

      // Delete key - delete selected widget(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (hasMultipleSelection) {
          // Supprimer tous les widgets sélectionnés
          selectedWidgets.forEach(id => deleteWidget(id));
          setSelectedWidgets([]);
        } else if (selectedWidgetId) {
          deleteWidget(selectedWidgetId);
        }
      }

      // Ctrl/Cmd + C - Copy
      if (ctrlOrCmd && e.key === 'c') {
        if (hasMultipleSelection) {
          e.preventDefault();
          copyWidget(selectedWidgets);
        } else if (selectedWidgetId) {
          e.preventDefault();
          copyWidget(selectedWidgetId);
        }
      }

      // Ctrl/Cmd + X - Cut
      if (ctrlOrCmd && e.key === 'x') {
        if (hasMultipleSelection) {
          e.preventDefault();
          cutWidget(selectedWidgets);
          setSelectedWidgets([]);
        } else if (selectedWidgetId) {
          e.preventDefault();
          cutWidget(selectedWidgetId);
        }
      }

      // Ctrl/Cmd + V - Paste
      if (ctrlOrCmd && e.key === 'v') {
        e.preventDefault();
        pasteWidget();
      }

      // Ctrl/Cmd + Z - Undo
      if (ctrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z - Redo
      if (ctrlOrCmd && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgetId, selectedWidgets, widgets, canvasSettings, copyWidget, cutWidget, pasteWidget, deleteWidget, updateWidget, moveWidget, undo, redo]);

  const defaultBg = '#ffffff';
  const bgColor = canvasSettings.backgroundColor || defaultBg;
  const backgroundImageSource = canvasSettings.background_image_data || canvasSettings.background_image;
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-auto pb-28 pt-6 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent"
    >
      <motion.div
        className={`relative z-10 border border-border bg-card shadow-[0_30px_72px_rgba(15,52,96,0.12)] ring-1 ring-black/[0.03] ${previewMode === 'preview' ? 'rounded-xl' : 'rounded-2xl'}`}
        style={{
          width: canvasSettings.width,
          height: canvasSettings.height,
        }}
        animate={{ scale: previewMode === 'preview' && previewScale !== null ? previewScale : canvasSettings.scaling }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <CanvasHeader />
        <div
          ref={attachCanvasRef}
          className={`relative h-[calc(100%-2.5rem)] w-full overflow-hidden text-foreground ${previewMode === 'preview' ? 'rounded-b-xl' : 'rounded-b-2xl'}`}
          style={{
            backgroundColor: bgColor,
            backgroundImage: backgroundImageSource
              ? `url(${backgroundImageSource})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          onClick={handleCanvasClick}
          onContextMenu={(e) => handleContextMenu(e, null)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {canvasSettings.gridVisible && previewMode !== 'preview' && <CanvasGrid width={canvasSettings.width} height={canvasSettings.height - 40} scale={canvasSettings.scaling} />}

          {/* Smart Guides - Guides d'alignement intelligents */}
          <SmartGuides
            allWidgets={widgets}
            canvasWidth={canvasSettings.width}
            canvasHeight={canvasSettings.height}
            onRegister={handleSmartGuidesRegister}
          />


          {/* Alignment controls are only in the Properties panel now */}

          {/* Selection Box */}
          {selectionBox && (
            <div
              className="absolute z-50 rounded-sm border-2 border-primary bg-primary/15 pointer-events-none"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
              }}
            />
          )}

          {/* Ne rendre QUE les widgets de niveau racine (sans parent) */}
          {/* Les widgets enfants sont rendus par leur conteneur parent */}
          {widgets
            .filter(widget => !widget.parentId || widget.parentId === null)
            .map((widget) => (
              <RenderedWidget
                key={widget.id}
                widget={widget}
                constraintsRef={canvasRef}
                onContextMenu={(e) => handleContextMenu(e, widget.id)}
                onDragUpdate={handleDragUpdate}
                selectedWidgets={selectedWidgets}
              />
            ))}

          {widgets.length === 0 && !activeProjectId && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-6 max-w-2xl px-6 w-full animate-in fade-in duration-500">
                <div className="relative mx-auto w-20 h-20 mb-2">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#1F5AA0] to-[#0F3460] opacity-30 blur-2xl" />
                  <div className="relative w-full h-full rounded-3xl shadow-[0_16px_40px_rgba(15,52,96,0.25)] flex items-center justify-center overflow-hidden">
                    <img src="/logo-128x128.png" alt="Logo" className="w-20 h-20 rounded-3xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    Bienvenue dans Notorious.PY
                  </h3>
                  <p className="text-[15px] text-muted-foreground">
                    {projects.length === 0
                      ? "Créez un projet pour commencer à construire votre interface."
                      : "Reprenez un projet ou explorez votre espace de travail."}
                  </p>
                </div>

                {/* Case 1: No projects — show create buttons */}
                {projects.length === 0 && (
                  <>
                    <div className="flex flex-row items-center justify-center gap-4 pt-4">
                      <Button
                        onClick={(e) => { e.stopPropagation(); setCreateModalMode('manual'); setNewProjectName(''); setShowCreateModal(true); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-11 rounded-xl bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-6 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(15,52,96,0.22)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Créer un projet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setCreateModalMode('ai'); setNewProjectName(''); setShowCreateModal(true); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-11 rounded-xl border border-border bg-secondary px-6 text-[14px] font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10"
                      >
                        <Sparkles className="mr-2 h-5 w-5 text-primary" />
                        Générer avec l'IA
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); importZipRef.current?.click(); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="mx-auto mt-8 h-10 rounded-full px-5 text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Upload className="w-4 h-4" />
                      Importer projet Notorious.PY
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Importez un fichier .zip d&apos;un projet Notorious.PY existant.
                    </p>
                  </>
                )}

                {/* Case 2: Has projects — show "Voir tous les projets" + recent projects */}
                {projects.length > 0 && (
                  <>
                    <div className="flex items-center justify-center gap-3 pt-4">
                      <Button
                        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-projects-modal')); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-11 rounded-xl bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-8 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(15,52,96,0.22)] transition-all hover:-translate-y-0.5 hover:brightness-110"
                      >
                        <LayoutGrid className="mr-2 h-5 w-5" />
                        Voir tous les projets
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); importZipRef.current?.click(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-11 rounded-xl border border-border bg-secondary px-8 text-[14px] font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10"
                      >
                        <Upload className="mr-2 h-5 w-5" />
                        Importer projet Notorious.PY
                      </Button>
                    </div>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Importez un fichier .zip d&apos;un projet Notorious.PY existant.
                    </p>

                    <div className="mt-16 w-full max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          Projets récents
                        </h4>
                        <span className="text-xs font-medium text-muted-foreground">
                          {Math.min(recentProjects.length, 4)}/{projects.length}
                        </span>
                      </div>
                      <div className="flex items-stretch justify-center gap-3 flex-wrap">
                        {recentProjects.slice(0, 4).map((project) => (
                          <button
                            key={project.id}
                            className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-secondary px-3 py-2.5 text-left transition-all duration-300 hover:border-primary/45 hover:bg-primary/10 hover:shadow-[0_6px_18px_rgba(15,52,96,0.20)]"
                            onClick={(e) => { e.stopPropagation(); openProject(project.id); }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="relative h-8 w-8 shrink-0 rounded-lg bg-accent text-muted-foreground transition-all duration-300 group-hover:bg-primary/20 group-hover:text-primary flex items-center justify-center">
                              <Folder className="w-4 h-4 absolute transition-all duration-300 opacity-100 group-hover:opacity-0 group-hover:scale-75" strokeWidth={1.5} />
                              <Folder className="w-4 h-4 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100" strokeWidth={1.5} fill="currentColor" />
                            </div>
                            <div className="shrink-0">
                              <span className="block whitespace-nowrap text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary">
                                {project.name}
                              </span>
                              <span className="mt-0.5 block whitespace-nowrap text-[10px] text-muted-foreground">
                                {format(new Date(project.updatedAt), "d MMM 'à' HH:mm", { locale: fr })}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {projects.length > 4 && (
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                          +{projects.length - 4} autres projets sur la page Home
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {widgets.length === 0 && activeProjectId && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <div className="text-center space-y-4">
                <Plus className="mx-auto h-16 w-16 text-muted-foreground/40" strokeWidth={1.5} />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    Déposez des widgets ici ou utilisez l'IA
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Commencez à construire votre interface CustomTkinter
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Context Menu */}
          {contextMenu && (
            <div
              className="absolute z-[100] min-w-[190px] rounded-xl border border-border bg-card py-1.5 shadow-2xl"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                boxShadow: '0 18px 42px rgba(15, 52, 96, 0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedWidgets.length > 0 && (
                <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
                  {selectedWidgets.length} widget{selectedWidgets.length > 1 ? 's' : ''} sélectionné{selectedWidgets.length > 1 ? 's' : ''}
                </div>
              )}
              {(contextMenu.widgetId || selectedWidgets.length > 0) && (
                <>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                    onClick={() => handleMenuAction('copy')}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="font-medium">Copier</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                    onClick={() => handleMenuAction('cut')}
                  >
                    <Scissors className="h-4 w-4" />
                    <span className="font-medium">Couper</span>
                  </button>
                </>
              )}
              <button
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleMenuAction('paste')}
                disabled={!clipboard}
              >
                <Clipboard className="h-4 w-4" />
                <span className="font-medium">Coller</span>
              </button>
              {(contextMenu.widgetId || selectedWidgets.length > 0) && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                    onClick={() => handleMenuAction('lock')}
                  >
                    {widgets.find(w => w.id === contextMenu.widgetId)?.locked ? (
                      <>
                        <Unlock className="h-4 w-4" />
                        <span className="font-medium">Déverrouiller</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span className="font-medium">Verrouiller{selectedWidgets.length > 1 ? ' tout' : ''}</span>
                      </>
                    )}
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2 transition-colors font-medium"
                    onClick={() => handleMenuAction('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">Supprimer{selectedWidgets.length > 1 ? ' tout' : ''}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>

      {/* Zoom Controls Dock — always visible in design mode */}
      {previewMode !== 'preview' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[110] flex justify-center pb-2">
          <div
            className="pointer-events-auto flex min-w-[214px] items-center gap-0.5 rounded-xl border border-border bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur-md"
            onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
            onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
            onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          >
            <button
              onClick={handleZoomOut}
              disabled={!hasPyFiles}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              title={hasPyFiles ? "Zoom arrière (Ctrl -)" : "Créez un fichier .py pour activer le zoom"}
            >
              −
            </button>
            {isEditingZoom ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = parseInt(zoomInputValue, 10);
                  if (!hasPyFiles) {
                    setIsEditingZoom(false);
                    return;
                  }
                  if (!isNaN(val) && val >= 10 && val <= 300) {
                    updateCanvasSettings({ scaling: val / 100 });
                  }
                  setIsEditingZoom(false);
                }}
                className="flex items-center"
              >
                <input
                  ref={zoomInputRef}
                  type="text"
                  value={zoomInputValue}
                  onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                  onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                  onChange={(e) => setZoomInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsEditingZoom((prev) => {
                        if (!prev || !hasPyFiles) return false;
                        const val = parseInt(zoomInputValue, 10);
                        if (!isNaN(val) && val >= 10 && val <= 300) {
                          updateCanvasSettings({ scaling: val / 100 });
                        }
                        return false;
                      });
                    }, 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsEditingZoom(false);
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!hasPyFiles) {
                        setIsEditingZoom(false);
                        return;
                      }
                      const val = parseInt(zoomInputValue, 10);
                      if (!isNaN(val) && val >= 10 && val <= 300) {
                        updateCanvasSettings({ scaling: val / 100 });
                      }
                      setIsEditingZoom(false);
                    }
                  }}
                  className="h-7 w-14 rounded-lg border border-primary/30 bg-background px-1 text-center text-[11px] font-semibold text-foreground outline-none focus:border-primary/60"
                  autoFocus
                  maxLength={3}
                />
              </form>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (!hasPyFiles) return;
                  setZoomInputValue(String(Math.round((canvasSettings.scaling || 1) * 100)));
                  setIsEditingZoom(true);
                  setTimeout(() => zoomInputRef.current?.select(), 10);
                }}
                onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
                className="flex h-7 min-w-[3rem] items-center justify-center rounded-lg px-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                title={hasPyFiles ? "Cliquer pour saisir un pourcentage" : "Créez un fichier .py pour activer le zoom"}
                disabled={!hasPyFiles}
              >
                {Math.round((canvasSettings.scaling || 1) * 100)}%
              </button>
            )}
            <button
              onClick={handleZoomIn}
              disabled={!hasPyFiles}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              title={hasPyFiles ? "Zoom avant (Ctrl +)" : "Créez un fichier .py pour activer le zoom"}
            >
              +
            </button>
            <div className="mx-0.5 h-4 w-px bg-border/50" />
            <button
              onClick={handleZoomFit}
              disabled={!hasPyFiles}
              className="flex h-7 items-center justify-center rounded-lg px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              title={hasPyFiles ? "Ajuster à l'écran" : "Créez un fichier .py pour activer le zoom"}
            >
              Fit
            </button>
          </div>
        </div>
      )}

      {/* Zoom Indicator (floating, on zoom change) */}
      {showZoomIndicator && hasPyFiles && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-40 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-lg bg-foreground/80 px-3 py-1.5 text-xs font-semibold text-background shadow-lg backdrop-blur-sm">
            {Math.round((canvasSettings.scaling || 1) * 100)}%
          </div>
        </div>
      )}

      <input ref={importZipRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />

      {/* Create Project Name Modal - outside canvas content to avoid mouse handler interference */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreateModal(false)}>
          <div className="mx-4 w-full max-w-md animate-in zoom-in-95 rounded-2xl border border-border bg-card p-8 shadow-2xl duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {createModalMode === 'ai' ? 'Nouveau projet IA' : 'Nouveau projet'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground transition-colors hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Input
              type="text"
              placeholder="Nom du projet..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCanvasCreateProject()}
              autoFocus
              className="h-12 rounded-xl border-border bg-background px-4 text-lg text-foreground"
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="h-11 flex-1 rounded-xl border-border bg-secondary font-semibold text-foreground hover:bg-accent"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCanvasCreateProject}
                disabled={!newProjectName.trim()}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] font-semibold text-white shadow-[0_10px_24px_rgba(15,52,96,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
