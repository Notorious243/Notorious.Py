import React, { useState, useCallback, useMemo } from 'react';
import { WidgetData, CanvasSettings, WidgetStyle } from '@/types/widget';
import { devWarn, devError } from '@/lib/logger';
import { isContainerWidget, getParentContentBounds, collectDescendantIds, isDescendant, getDefaultTabSlot, getTabSlots } from '@/lib/widgetLayout';
import { computeAutoLayout, hasAutoLayout } from '@/lib/autoLayoutEngine';
import { WidgetContext } from '@/contexts/widget-context';

type ViewMode = 'design' | 'code';
type PreviewMode = 'edit' | 'preview';

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const sanitizeFileName = (rawName: string, fallback: string) => {
  const trimmed = rawName.trim();
  const base = trimmed || fallback;
  return base.endsWith('.py') ? base : `${base}.py`;
};

const makeUniqueFileName = (name: string, existingNames: Set<string>) => {
  if (!existingNames.has(name)) {
    return name;
  }

  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const extension = dotIndex > 0 ? name.slice(dotIndex) : '';
  let counter = 1;
  let candidate = `${base} (${counter})${extension}`;

  while (existingNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }

  return candidate;
};

export const WidgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('edit');
  const [snapLines, setSnapLines] = useState({ vertical: false, horizontal: false });
  const [clipboard, setClipboard] = useState<WidgetData[] | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>(() => {
    const timestamp = Date.now();
    return [{
      id: `file-${timestamp.toString(36)}`,
      name: 'main.py',
      content: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }];
  });
  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id ?? '');

  // History for undo/redo
  const [history, setHistory] = useState<WidgetData[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = React.useRef(historyIndex);
  const historyRef = React.useRef(history);
  React.useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
  React.useEffect(() => { historyRef.current = history; }, [history]);
  // Ref stable des widgets pour lecture synchrone sans updater fonctionnel
  const widgetsRef = React.useRef(widgets);
  React.useEffect(() => { widgetsRef.current = widgets; }, [widgets]);

  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    width: 800,
    height: 600,
    title: 'Mon Application',
    titleFontWeight: 'normal',
    resizable: false,  // ✅ CHANGÉ : false par défaut pour éviter déformation
    layoutMode: 'absolute',  // ✅ NOUVEAU : mode de positionnement
    scaling: 1,
    backgroundColor: '',
    headerBackgroundColor: '',
    gridVisible: true,
  });

  const selectedWidget = useMemo(
    () => widgets.find(w => w.id === selectedWidgetId),
    [widgets, selectedWidgetId]
  );



  // Save state to history
  // Appelé HORS des updaters fonctionnels (pas dans setWidgets(prev => ...)) pour
  // éviter les setState imbriqués et les mutations de ref dans des updaters.
  const saveToHistory = useCallback((newWidgets: WidgetData[]) => {
    const newIndex = Math.min(historyIndexRef.current + 1, 49);
    setHistory(prev => {
      const currentIndex = historyIndexRef.current;
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newWidgets)));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
  }, []);

  const snapToGrid = useCallback((value: number, gridSize: number = 10) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  const computeParentBounds = useCallback((list: WidgetData[], parentId: string | null | undefined) => {
    return getParentContentBounds(list, parentId ?? null, canvasSettings);
  }, [canvasSettings]);

  const clampWidgetToBounds = useCallback((list: WidgetData[], widget: WidgetData, parentIdOverride?: string | null): WidgetData => {
    try {
      if (!widget || !widget.position || !widget.size) {
        devError('[WidgetContext] Invalid widget structure:', widget);
        return widget;
      }

      const targetParentId = parentIdOverride !== undefined ? parentIdOverride : widget.parentId ?? null;
      const bounds = computeParentBounds(list, targetParentId);
      const minSize = 20;

      const availableWidth = bounds.width > 0 ? bounds.width : widget.size.width;
      const availableHeight = bounds.height > 0 ? bounds.height : widget.size.height;

      const width = Math.max(minSize, Math.min(widget.size.width, Math.max(minSize, availableWidth)));
      const height = Math.max(minSize, Math.min(widget.size.height, Math.max(minSize, availableHeight)));

      const maxX = bounds.left + Math.max(0, bounds.width - width);
      const maxY = bounds.top + Math.max(0, bounds.height - height);

      const clampedX = Math.min(Math.max(widget.position.x, bounds.left), maxX);
      const clampedY = Math.min(Math.max(widget.position.y, bounds.top), maxY);

      let parentSlot = widget.parentSlot;
      if (targetParentId) {
        const parent = list.find(w => w.id === targetParentId);
        if (parent?.type === 'tabview') {
          const slots = getTabSlots(parent);
          const defaultSlot = getDefaultTabSlot(parent);
          parentSlot = parentSlot && slots.includes(parentSlot) ? parentSlot : defaultSlot;
        } else {
          parentSlot = null;
        }
      } else {
        parentSlot = null;
      }

      return {
        ...widget,
        parentId: targetParentId ?? null,
        parentSlot: parentSlot ?? null,
        size: { width, height },
        position: { x: clampedX, y: clampedY },
      };
    } catch (error) {
      devError('[WidgetContext] Error in clampWidgetToBounds:', error, widget);
      return widget;
    }
  }, [computeParentBounds]);

  const applyAutoLayoutToWidgets = useCallback((widgetList: WidgetData[]): WidgetData[] => {
    const updated = [...widgetList];
    let changed = false;

    // Find all containers with auto-layout enabled
    const autoLayoutContainers = updated.filter(w => isContainerWidget(w) && hasAutoLayout(w));

    for (const container of autoLayoutContainers) {
      const children = updated.filter(c => c.parentId === container.id);
      if (children.length === 0) continue;

      const layoutMap = computeAutoLayout(container, children);

      for (const [childId, computed] of layoutMap.entries()) {
        const idx = updated.findIndex(w => w.id === childId);
        if (idx === -1) continue;

        const child = updated[idx];
        const posChanged = child.position.x !== computed.x || child.position.y !== computed.y;
        const sizeChanged = child.size.width !== computed.width || child.size.height !== computed.height;

        if (posChanged || sizeChanged) {
          updated[idx] = {
            ...child,
            position: { x: computed.x, y: computed.y },
            size: { width: computed.width, height: computed.height },
          };
          changed = true;
        }
      }
    }

    return changed ? updated : widgetList;
  }, []);

  const addWidget = useCallback((widget: WidgetData) => {
    try {
      if (!widget || !widget.id) {
        devError('[WidgetContext] Invalid widget in addWidget:', widget);
        return;
      }

      const prev = widgetsRef.current;
      if (prev.some(w => w.id === widget.id)) {
        devWarn('[WidgetContext] Widget already exists, skipping:', widget.id);
        return;
      }

      const sanitized = clampWidgetToBounds(prev, widget, widget.parentId ?? null);
      let newWidgets = [...prev, sanitized];
      newWidgets = applyAutoLayoutToWidgets(newWidgets);
      setWidgets(newWidgets);
      saveToHistory(newWidgets);
    } catch (error) {
      devError('[WidgetContext] Error in addWidget:', error, widget);
    }
  }, [clampWidgetToBounds, saveToHistory, applyAutoLayoutToWidgets]);

  const updateWidget = useCallback((id: string, updates: Partial<WidgetData>, saveHistory: boolean = true) => {
    const prev = widgetsRef.current;
    let hasChanged = false;
    const newWidgets = prev.map(w => {
      if (w.id !== id) return w;

      const { style, properties, size, position, parentId, parentSlot, ...rest } = updates;
      const next: WidgetData = { ...w, ...rest };

      if (style) {
        next.style = { ...w.style, ...style };
      }
      if (properties) {
        next.properties = { ...w.properties, ...properties };
      }
      if (size) {
        next.size = { ...w.size, ...size };
      }
      if (position) {
        next.position = { ...position };
      }
      if (parentId !== undefined) {
        next.parentId = parentId;
      }
      if (parentSlot !== undefined) {
        next.parentSlot = parentSlot;
      }

      const targetParentId = parentId !== undefined ? parentId : next.parentId;
      const clamped = clampWidgetToBounds(prev, next, targetParentId);
      hasChanged = true;
      return clamped;
    });

    if (!hasChanged) return;
    const finalWidgets = applyAutoLayoutToWidgets(newWidgets);
    setWidgets(finalWidgets);
    if (saveHistory) {
      saveToHistory(finalWidgets);
    }
  }, [clampWidgetToBounds, saveToHistory, applyAutoLayoutToWidgets]);

  const updateWidgetStyle = useCallback((id: string, styleUpdates: Partial<WidgetStyle>) => {
    const prev = widgetsRef.current;
    const newWidgets = prev.map(w =>
      w.id === id ? { ...w, style: { ...w.style, ...styleUpdates } } : w
    );
    setWidgets(newWidgets);
    saveToHistory(newWidgets);
  }, [saveToHistory]);

  const deleteWidget = useCallback((id: string) => {
    const prev = widgetsRef.current;
    const descendants = collectDescendantIds(prev, id);
    const candidates = new Set<string>([id, ...descendants]);
    const nextWidgets = prev.filter(w => !candidates.has(w.id));
    if (nextWidgets.length === prev.length) return;
    const finalWidgets = applyAutoLayoutToWidgets(nextWidgets);
    setWidgets(finalWidgets);
    saveToHistory(finalWidgets);
    setSelectedWidgetId(current => (current && candidates.has(current) ? null : current));
  }, [saveToHistory, applyAutoLayoutToWidgets]);

  const selectWidget = useCallback((id: string | null) => {
    setSelectedWidgetId(id);
  }, []);

  const moveWidget = useCallback((id: string, position: { x: number; y: number }, saveHistory: boolean = false) => {
    const prev = widgetsRef.current;
    const widget = prev.find(w => w.id === id);
    if (!widget) return;

    // Calculer le delta de déplacement
    const deltaX = position.x - widget.position.x;
    const deltaY = position.y - widget.position.y;

    // Si pas de mouvement, ignorer
    if (deltaX === 0 && deltaY === 0) return;

    // Trouver tous les descendants (enfants, petits-enfants, etc.)
    const descendants = collectDescendantIds(prev, id);

    // Mettre à jour le widget parent ET tous ses descendants
    const newWidgets = prev.map(w => {
      if (w.id === id) {
        // Déplacer le widget principal
        return { ...w, position: { x: position.x, y: position.y } };
      } else if (descendants.includes(w.id)) {
        // Déplacer les enfants du même delta (ils gardent leur position relative)
        return {
          ...w,
          position: {
            x: w.position.x + deltaX,
            y: w.position.y + deltaY
          }
        };
      }
      return w;
    });

    setWidgets(newWidgets);
    if (saveHistory) {
      saveToHistory(newWidgets);
    }
  }, [saveToHistory]);

  const resizeWidget = useCallback((id: string, size: { width: number; height: number }, position?: { x: number; y: number }, doSaveHistory: boolean = true) => {
    const prev = widgetsRef.current;
    const widget = prev.find(w => w.id === id);
    if (!widget) return;

    let newWidgets: WidgetData[];

    // Si la position change (resize depuis top-left par exemple)
    if (position && (position.x !== widget.position.x || position.y !== widget.position.y)) {
      const deltaX = position.x - widget.position.x;
      const deltaY = position.y - widget.position.y;

      // Déplacer aussi les enfants
      const descendants = collectDescendantIds(prev, id);
      newWidgets = prev.map(w => {
        if (w.id === id) {
          return { ...w, size, position };
        } else if (descendants.includes(w.id)) {
          return {
            ...w,
            position: {
              x: w.position.x + deltaX,
              y: w.position.y + deltaY
            }
          };
        }
        return w;
      });
    } else {
      // Juste changer la taille, pas la position
      newWidgets = prev.map(w => w.id === id ? { ...w, size } : w);
    }

    setWidgets(newWidgets);
    if (doSaveHistory) {
      saveToHistory(newWidgets);
    }
  }, [saveToHistory]);

  const setActiveFile = useCallback((id: string) => {
    setActiveFileId(id);
  }, []);

  const createFile = useCallback((rawName: string) => {
    const now = Date.now();
    const newId = `file-${now}-${Math.random().toString(36).substring(2, 8)}`;
    const desiredName = sanitizeFileName(rawName, 'nouveau_fichier.py');

    setFiles(prev => {
      const existingNames = new Set(prev.map(file => file.name));
      const uniqueName = makeUniqueFileName(desiredName, existingNames);
      const newFile: WorkspaceFile = {
        id: newId,
        name: uniqueName,
        content: '',
        createdAt: now,
        updatedAt: now,
      };
      setActiveFileId(newId);
      return [...prev, newFile];
    });

    return newId;
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => {
      if (prev.length <= 1) {
        return prev;
      }

      const index = prev.findIndex(file => file.id === id);
      if (index === -1) {
        return prev;
      }

      const next = prev.filter(file => file.id !== id);
      setActiveFileId(current => {
        if (current !== id) {
          return current;
        }
        const fallbackIndex = index > 0 ? index - 1 : 0;
        return next[fallbackIndex]?.id ?? next[0]?.id ?? '';
      });
      return next;
    });
  }, []);

  const renameFile = useCallback((id: string, rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    setFiles(prev => {
      const index = prev.findIndex(file => file.id === id);
      if (index === -1) {
        return prev;
      }

      const desiredName = sanitizeFileName(trimmed, prev[index].name);
      const existingNames = new Set(prev.filter(file => file.id !== id).map(file => file.name));
      const uniqueName = makeUniqueFileName(desiredName, existingNames);

      if (prev[index].name === uniqueName) {
        return prev;
      }

      const now = Date.now();
      const updated = [...prev];
      updated[index] = {
        ...prev[index],
        name: uniqueName,
        updatedAt: now,
      };
      return updated;
    });
  }, []);

  const reparentWidget = useCallback((id: string, parentId: string | null, position: { x: number; y: number }, parentSlot?: string) => {
    const prev = widgetsRef.current;
    const widgetIndex = prev.findIndex(w => w.id === id);
    if (widgetIndex === -1) return;

    const targetParentId = parentId ?? null;

    if (targetParentId) {
      if (targetParentId === id) return;
      if (isDescendant(prev, id, targetParentId)) return;
      const parentWidget = prev.find(w => w.id === targetParentId);
      if (!parentWidget || !isContainerWidget(parentWidget)) return;
    }

    const parentWidget = targetParentId ? prev.find(w => w.id === targetParentId) : undefined;
    let resolvedSlot: string | undefined;
    if (parentWidget?.type === 'tabview') {
      const slots = getTabSlots(parentWidget);
      const defaultSlot = getDefaultTabSlot(parentWidget);
      resolvedSlot = parentSlot && slots.includes(parentSlot) ? parentSlot : defaultSlot;
    }

    const candidate: WidgetData = {
      ...prev[widgetIndex],
      parentId: targetParentId,
      parentSlot: resolvedSlot ?? null,
      position: { x: position.x, y: position.y },
    };

    const newWidgets = [...prev];
    const sanitized = clampWidgetToBounds(newWidgets, candidate, targetParentId);
    const current = prev[widgetIndex];
    const hasChanges =
      current.parentId !== sanitized.parentId ||
      current.parentSlot !== sanitized.parentSlot ||
      current.position.x !== sanitized.position.x ||
      current.position.y !== sanitized.position.y ||
      current.size.width !== sanitized.size.width ||
      current.size.height !== sanitized.size.height;

    if (!hasChanges) return;

    newWidgets[widgetIndex] = sanitized;
    const finalWidgets = applyAutoLayoutToWidgets(newWidgets);
    setWidgets(finalWidgets);
    saveToHistory(finalWidgets);
  }, [clampWidgetToBounds, saveToHistory, applyAutoLayoutToWidgets]);

  const duplicateWidget = useCallback((id: string) => {
    const currentWidgets = widgetsRef.current;
    const widgetToDuplicate = currentWidgets.find(w => w.id === id);
    if (!widgetToDuplicate) return;

    const subtreeIds = [id, ...collectDescendantIds(currentWidgets, id)];
    const idMap = new Map<string, string>();
    const clones: WidgetData[] = subtreeIds.map(originalId => {
      const original = currentWidgets.find(w => w.id === originalId);
      if (!original) return null;
      const newId = `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      idMap.set(originalId, newId);
      return {
        ...original,
        id: newId,
        parentId: original.parentId ? (idMap.get(original.parentId) ?? original.parentId) : null,
        position: {
          x: original.position.x + 20,
          y: original.position.y + 20,
        },
      } as WidgetData;
    }).filter(Boolean) as WidgetData[];

    if (clones.length === 0) return;

    const combined = [...currentWidgets];
    clones.forEach(clone => {
      const sanitized = clampWidgetToBounds(combined, clone, clone.parentId ?? null);
      combined.push(sanitized);
    });
    setWidgets(combined);
    saveToHistory(combined);

    const newRootId = idMap.get(id);
    if (newRootId) {
      selectWidget(newRootId);
    }
  }, [clampWidgetToBounds, saveToHistory, selectWidget]);

  const copyWidget = useCallback((idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const allIds = new Set<string>();
    ids.forEach(id => {
      if (!widgets.find(w => w.id === id)) return;
      allIds.add(id);
      collectDescendantIds(widgets, id).forEach(d => allIds.add(d));
    });
    const snapshot = Array.from(allIds).map(widgetId => {
      const original = widgets.find(w => w.id === widgetId);
      return original ? JSON.parse(JSON.stringify(original)) as WidgetData : null;
    }).filter(Boolean) as WidgetData[];
    if (snapshot.length === 0) return;
    setClipboard(snapshot);
  }, [widgets]);

  const cutWidget = useCallback((idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const allIds = new Set<string>();
    ids.forEach(id => {
      if (!widgets.find(w => w.id === id)) return;
      allIds.add(id);
      collectDescendantIds(widgets, id).forEach(d => allIds.add(d));
    });
    const snapshot = Array.from(allIds).map(widgetId => {
      const original = widgets.find(w => w.id === widgetId);
      return original ? JSON.parse(JSON.stringify(original)) as WidgetData : null;
    }).filter(Boolean) as WidgetData[];
    if (snapshot.length === 0) return;
    setClipboard(snapshot);
    ids.forEach(id => deleteWidget(id));
  }, [widgets, deleteWidget]);

  const pasteWidget = useCallback(() => {
    if (!clipboard || clipboard.length === 0) return;
    const timestamp = Date.now();
    const idMap = new Map<string, string>();
    const clones = clipboard.map((item, index) => {
      const newId = `widget-${timestamp}-${index}-${Math.random().toString(36).substring(2, 8)}`;
      idMap.set(item.id, newId);
      return {
        ...item,
        id: newId,
        parentId: item.parentId ? idMap.get(item.parentId) ?? item.parentId : null,
        position: {
          x: item.position.x + 20,
          y: item.position.y + 20,
        },
      } as WidgetData;
    });

    if (clones.length === 0) return;

    const prev = widgetsRef.current;
    const combined = [...prev];
    clones.forEach(clone => {
      const sanitized = clampWidgetToBounds(combined, clone, clone.parentId ?? null);
      combined.push(sanitized);
    });
    setWidgets(combined);
    saveToHistory(combined);

    const newRootId = idMap.get(clipboard[0].id);
    if (newRootId) {
      selectWidget(newRootId);
    }
  }, [clipboard, clampWidgetToBounds, saveToHistory, selectWidget]);

  const toggleWidgetLock = useCallback((id: string) => {
    const prev = widgetsRef.current;
    const widget = prev.find(w => w.id === id);
    if (!widget) return;
    const newWidgets = prev.map(w =>
      w.id === id ? { ...w, locked: !w.locked } : w
    );
    setWidgets(newWidgets);
    saveToHistory(newWidgets);
  }, [saveToHistory]);

  const undo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
    // Lire via historyRef — évite d'appeler setWidgets dans un updater de setHistory
    const snapshot = historyRef.current[newIndex];
    if (snapshot) setWidgets(JSON.parse(JSON.stringify(snapshot)));
  }, []);

  const redo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex >= historyRef.current.length - 1) return;
    const newIndex = currentIndex + 1;
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
    const snapshot = historyRef.current[newIndex];
    if (snapshot) setWidgets(JSON.parse(JSON.stringify(snapshot)));
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateCanvasSettings = useCallback((settings: Partial<CanvasSettings>) => {
    setCanvasSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const clearCanvas = useCallback(() => {
    const hadWidgets = widgetsRef.current.length > 0;
    setWidgets([]);
    if (hadWidgets) {
      saveToHistory([]);
    }
    setSelectedWidgetId(null);
  }, [saveToHistory]);

  const loadWorkspaceState = useCallback((newWidgets: WidgetData[], newSettings: CanvasSettings) => {
    // Deduplicate widget IDs to prevent React duplicate key errors
    const seenIds = new Set<string>();
    const deduped = newWidgets.filter(w => {
      if (!w || !w.id) return false;
      if (seenIds.has(w.id)) {
        devWarn('[WidgetContext] Duplicate widget ID removed:', w.id);
        return false;
      }
      seenIds.add(w.id);
      return true;
    });
    setWidgets(deduped);
    setCanvasSettings(newSettings);
    // Reset history for new context
    setHistory([JSON.parse(JSON.stringify(deduped))]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
    setSelectedWidgetId(null);
  }, []);

  const contextValue = useMemo(() => ({
    widgets,
    selectedWidgetId,
    selectedWidget,
    canvasSettings,
    viewMode,
    previewMode,
    snapLines,
    setSnapLines,
    addWidget,
    updateWidget,
    updateWidgetStyle,
    deleteWidget,
    selectWidget,
    moveWidget,
    resizeWidget,
    reparentWidget,
    duplicateWidget,
    updateCanvasSettings,
    clearCanvas,
    setViewMode,
    setPreviewMode,
    snapToGrid,
    copyWidget,
    cutWidget,
    pasteWidget,
    toggleWidgetLock,
    clipboard,
    files,
    activeFileId,
    setActiveFile,
    createFile,
    deleteFile,
    renameFile,
    undo,
    redo,
    canUndo,
    canRedo,
    loadWorkspaceState,
  }), [
    widgets, selectedWidgetId, selectedWidget, canvasSettings,
    viewMode, previewMode, snapLines, setSnapLines,
    addWidget, updateWidget, updateWidgetStyle, deleteWidget,
    selectWidget, moveWidget, resizeWidget, reparentWidget,
    duplicateWidget, updateCanvasSettings, clearCanvas,
    setViewMode, setPreviewMode, snapToGrid,
    copyWidget, cutWidget, pasteWidget, toggleWidgetLock,
    clipboard, files, activeFileId, setActiveFile,
    createFile, deleteFile, renameFile,
    undo, redo, canUndo, canRedo, loadWorkspaceState,
  ]);

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  );
};
