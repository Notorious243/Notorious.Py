import { createContext } from 'react';
import { CanvasSettings, WidgetData, WidgetStyle } from '@/types/widget';

type ViewMode = 'design' | 'code';
type PreviewMode = 'edit' | 'preview';

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface WidgetContextType {
  widgets: WidgetData[];
  selectedWidgetId: string | null;
  selectedWidget: WidgetData | undefined;
  canvasSettings: CanvasSettings;
  viewMode: ViewMode;
  previewMode: PreviewMode;
  snapLines: { vertical: boolean; horizontal: boolean };
  setSnapLines: (lines: { vertical: boolean; horizontal: boolean }) => void;
  addWidget: (widget: WidgetData) => void;
  updateWidget: (id: string, updates: Partial<WidgetData>, saveHistory?: boolean) => void;
  updateWidgetStyle: (id: string, styleUpdates: Partial<WidgetStyle>) => void;
  deleteWidget: (id: string) => void;
  selectWidget: (id: string | null) => void;
  moveWidget: (id: string, position: { x: number; y: number }, saveHistory?: boolean) => void;
  resizeWidget: (id: string, size: { width: number; height: number }, position?: { x: number; y: number }, saveHistory?: boolean) => void;
  reparentWidget: (id: string, parentId: string | null, position: { x: number; y: number }, parentSlot?: string) => void;
  duplicateWidget: (id: string) => void;
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  clearCanvas: () => void;
  setViewMode: (mode: ViewMode) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  snapToGrid: (value: number) => number;
  copyWidget: (id: string | string[]) => void;
  cutWidget: (id: string | string[]) => void;
  pasteWidget: () => void;
  toggleWidgetLock: (id: string) => void;
  clipboard: WidgetData[] | null;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  files: WorkspaceFile[];
  activeFileId: string;
  setActiveFile: (id: string) => void;
  createFile: (name: string) => string;
  deleteFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  loadWorkspaceState: (widgets: WidgetData[], settings: CanvasSettings) => void;
}

export const WidgetContext = createContext<WidgetContextType | undefined>(undefined);
