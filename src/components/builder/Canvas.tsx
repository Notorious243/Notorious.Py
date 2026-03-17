import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Canvas: React.FC = () => {
  const { widgets, canvasSettings, addWidget, selectWidget, selectedWidgetId, copyWidget, cutWidget, pasteWidget, deleteWidget, toggleWidgetLock, clipboard, undo, redo, updateWidget, moveWidget, previewMode } = useWidgets();
  const { activeProjectId, createProject, projects, openProject } = useProjects();
  const canvasRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; widgetId: string | null } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'manual' | 'ai'>('manual');
  const [newProjectName, setNewProjectName] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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
      setShowImportDialog(false);
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

  const handleImportDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      await processZipFile(file);
    }
  };

  const handleCanvasCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    createProject(name);
    if (createModalMode === 'ai') {
      try { localStorage.setItem('ctk_open_ai_on_load', 'true'); } catch { /* ignore */ }
    }
    setShowCreateModal(false);
    setNewProjectName('');
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

  const defaultBg = resolvedTheme === 'dark' ? '#242424' : '#ffffff';
  const bgColor = canvasSettings.backgroundColor || defaultBg;
  const backgroundImageSource = canvasSettings.background_image_data || canvasSettings.background_image;

  return (
    <div ref={containerRef} className="flex-1 relative p-8 flex items-center justify-center overflow-auto bg-slate-50/50 dark:bg-zinc-950/30">
      <motion.div
        className={`relative shadow-2xl shadow-slate-200/50 dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-zinc-800 ${previewMode === 'preview' ? 'rounded-lg' : 'rounded-xl'}`}
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
          className={`relative h-[calc(100%-2.5rem)] w-full overflow-hidden text-slate-800 dark:text-slate-200 ${previewMode === 'preview' ? 'rounded-b-lg' : 'rounded-b-xl'}`}
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
              className="absolute pointer-events-none border-2 border-primary bg-primary/10 dark:bg-primary/25 z-50 rounded-sm"
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
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl opacity-40 animate-pulse" />
                  <div className="relative w-full h-full rounded-3xl shadow-[0_16px_40px_rgba(15,52,96,0.4)] flex items-center justify-center overflow-hidden">
                    <img src="/logo-128x128.png" alt="Logo" className="w-20 h-20 rounded-3xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Bienvenue dans Notorious.PY
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[15px]">
                    {projects.length === 0
                      ? "Créez un projet pour commencer à construire votre interface."
                      : "Reprenez un projet ou explorez votre espace de travail."}
                  </p>
                </div>

                {/* Case 1: No projects — show create buttons */}
                {projects.length === 0 && (
                  <>
                    <div className="flex flex-row items-center justify-center gap-4 pt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreateModalMode('manual'); setNewProjectName(''); setShowCreateModal(true); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center h-12 px-6 text-[15px] font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_8px_24px_rgba(15,52,96,0.3)] hover:shadow-[0_12px_32px_rgba(15,52,96,0.4)] transition-all duration-300 hover:-translate-y-0.5 rounded-xl"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Créer un projet
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreateModalMode('ai'); setNewProjectName(''); setShowCreateModal(true); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center h-12 px-6 text-[15px] font-semibold border border-slate-200/80 bg-white/80 backdrop-blur-md hover:bg-slate-50 hover:border-slate-300 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5 rounded-xl shadow-sm"
                      >
                        <Sparkles className="mr-2 h-5 w-5 text-indigo-500" />
                        Générer avec l'IA
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowImportDialog(true); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="mt-8 text-[15px] font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2 mx-auto"
                    >
                      <Upload className="w-4 h-4" />
                      Importer un projet
                    </button>
                  </>
                )}

                {/* Case 2: Has projects — show "Voir tous les projets" + recent projects */}
                {projects.length > 0 && (
                  <>
                    <div className="flex items-center justify-center gap-3 pt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-projects-modal')); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center h-12 px-8 text-[15px] font-semibold bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:via-indigo-500 hover:to-purple-500 text-white shadow-[0_8px_24px_rgba(15,52,96,0.35)] hover:shadow-[0_12px_32px_rgba(15,52,96,0.45)] transition-all duration-300 hover:-translate-y-0.5 rounded-xl"
                      >
                        <LayoutGrid className="mr-2 h-5 w-5" />
                        Voir tous les projets
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowImportDialog(true); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center h-12 px-8 text-[15px] font-semibold border border-slate-200/80 bg-white/80 backdrop-blur-md hover:bg-slate-50 hover:border-slate-300 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5 rounded-xl shadow-sm"
                      >
                        <Upload className="mr-2 h-5 w-5" />
                        Importer un projet
                      </button>
                    </div>

                    <div className="mt-16 w-full max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Projets récents
                        </h4>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          {Math.min(recentProjects.length, 4)}/{projects.length}
                        </span>
                      </div>
                      <div className="flex items-stretch justify-center gap-3 flex-wrap">
                        {recentProjects.slice(0, 4).map((project) => (
                          <button
                            key={project.id}
                            className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm hover:border-indigo-400/60 hover:bg-indigo-50/60 hover:shadow-[0_6px_18px_rgba(15,52,96,0.12)] dark:border-slate-700/70 dark:bg-slate-800/50 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 transition-all duration-300 cursor-pointer text-left"
                            onClick={(e) => { e.stopPropagation(); openProject(project.id); }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="relative w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-500 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400 transition-all duration-300 shrink-0">
                              <Folder className="w-4 h-4 absolute transition-all duration-300 opacity-100 group-hover:opacity-0 group-hover:scale-75" strokeWidth={1.5} />
                              <Folder className="w-4 h-4 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100" strokeWidth={1.5} fill="currentColor" />
                            </div>
                            <div className="shrink-0">
                              <span className="block text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors whitespace-nowrap">
                                {project.name}
                              </span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                                {format(new Date(project.updatedAt), "d MMM 'à' HH:mm", { locale: fr })}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {projects.length > 4 && (
                        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
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
                <Plus className="w-16 h-16 text-slate-300 dark:text-slate-500 mx-auto" strokeWidth={1.5} />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-100">
                    Déposez des widgets ici ou utilisez l'IA
                  </h3>
                  <p className="text-slate-500 dark:text-slate-300/90 text-sm">
                    Commencez à construire votre interface CustomTkinter
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Context Menu */}
          {contextMenu && (
            <div
              className="absolute z-[100] bg-background border-2 border-border rounded-lg shadow-2xl py-1 min-w-[180px]"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedWidgets.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
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
                  <div className="h-px bg-border my-1" />
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
                  <div className="h-px bg-border my-1" />
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

      {/* Import Project Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 z-[70]">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900 dark:text-white">Importer un projet</DialogTitle>
          </DialogHeader>
          <div
            className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
            }`}
            onClick={() => importZipRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleImportDrop}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              isDragOver
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}>
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Glissez-d\u00e9posez votre fichier .zip ici
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ou cliquez pour parcourir</p>
          </div>
          <input ref={importZipRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />
        </DialogContent>
      </Dialog>

      {/* Create Project Name Modal - outside canvas content to avoid mouse handler interference */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {createModalMode === 'ai' ? 'Nouveau projet IA' : 'Nouveau projet'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nom du projet..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCanvasCreateProject()}
              autoFocus
              className="w-full h-12 px-4 text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCanvasCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-[0_8px_24px_rgba(15,52,96,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createModalMode === 'ai' ? 'Créer & Générer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
