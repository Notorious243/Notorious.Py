import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Folder, Layers, Monitor, FilePlus, Trash2, PenLine, Image as ImageFileIcon } from 'lucide-react';
import { ALL_WIDGET_DEFINITIONS, WIDGET_CATEGORIES } from '@/constants/widgets';
import { DRAG_TYPES } from '@/hooks/useDragDrop';
import { useDrag } from 'react-dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tree, Folder as TreeFolder, File as TreeFile, TreeInput } from '@/components/ui/file-tree';
import { useFileSystem, FileSystemItem } from '@/hooks/useFileSystem';
import { useWidgets } from '@/contexts/WidgetContext';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import { Lock as LockIcon } from 'lucide-react';

const FolderFilledIcon = ({ className, color = '#0F3460' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6a2 2 0 0 1 2-4h5l2 2h7a2 2 0 0 1 2 2v2H2V6Z" />
    <path d="M2 8h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z" />
  </svg>
);

const FolderOpenFilledIcon = ({ className, color = '#0F3460' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H2V6Z" />
    <path d="M2 10h20l-2.5 10H4.5L2 10Z" opacity="0.85" />
  </svg>
);

const PythonIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 110 110"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M53.8,4.1c-24.8,0-23.3,10.7-23.3,10.7l0,11h23.8v3.4H30.4c0,0-15.3,2.4-15.3,21.8c0,19.4,13.3,20.6,13.3,20.6h6.7v-9.6c0,0-0.4-11.2,11.4-11.2h16c0,0,10.1-0.8,10.1-10.5V14.1C72.5,14.1,72.6,4.1,53.8,4.1z M39.4,11.5c2.4,0,4.4,2,4.4,4.4c0,2.4-2,4.4-4.4,4.4c-2.4,0-4.4-2-4.4-4.4C35.1,13.5,37,11.5,39.4,11.5z" />
    <path d="M55.7,105.8c24.8,0,23.3-10.7,23.3-10.7l0-11H55.2v-3.4h23.8c0,0,15.3-2.4,15.3-21.8c0-19.4-13.3-20.6-13.3-20.6H74.3v9.6c0,0,0.4,11.2-11.4,11.2H46.9c0,0-10.1,0.8-10.1,10.5v26.2C36.9,95.8,36.8,105.8,55.7,105.8z M70.1,98.4c-2.4,0-4.4-2-4.4-4.4c0-2.4,2-4.4,4.4-4.4c2.4,0,4.4,2,4.4,4.4C74.5,96.4,72.5,98.4,70.1,98.4z" />
  </svg>
);


interface DraggableWidgetProps {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ type, name, description, icon: Icon }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPES.WIDGET_TYPE,
    item: () => {
      const transactionId = `drag-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      return {
        widgetType: type,
        transactionId: transactionId
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [type]);

  return (
    <div
      ref={drag as any}
      className={`group flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-grab hover:border-violet-500 hover:shadow-sm transition-all duration-200 ${isDragging ? 'opacity-30' : ''
        }`}
    >
      <div className="text-slate-500 group-hover:text-violet-500 transition-colors">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-violet-600 transition-colors">{name}</p>
        <p className="text-[10px] text-slate-400 line-clamp-1 hidden">{description}</p>
      </div>
    </div>
  );
};

export const WidgetSidebar: React.FC = () => {
  const { user } = useAuth();
  const isGuest = !user;
  const [searchQuery, setSearchQuery] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { data, dataRef, addNode, deleteNode, renameNode, hasFiles, updateNode, getNode, saveNow } = useFileSystem();

  // Widget Context used for synchronization
  const {
    activeFileId,
    setActiveFile,
    widgets,
    canvasSettings,
    loadWorkspaceState
  } = useWidgets(); // Widget Context used for synchronization

  const { projects, activeProjectId } = useProjects(); // Project Context
  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectName = activeProject?.name || 'Projet';

  // UI State for Dialogs
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [itemDialogMode] = useState<'file' | 'folder'>('file');
  const [inputValue, setInputValue] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Inline creation state
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  const [creatingNode, setCreatingNode] = useState<{ parentId: string | null, type: 'file' | 'folder' } | null>(null);
  const [creationInputValue, setCreationInputValue] = useState('');

  // Track active tab: auto-switch to 'components' when first file is created
  const [currentTab, setCurrentTab] = useState<string>(!hasFiles ? 'explorer' : 'components');
  const prevHasFilesRef = useRef(hasFiles);

  useEffect(() => {
    if (!prevHasFilesRef.current && hasFiles) {
      // First file just created — switch to components tab
      setCurrentTab('components');
    }
    if (!hasFiles) {
      // No files — force explorer tab
      setCurrentTab('explorer');
    }
    prevHasFilesRef.current = hasFiles;
  }, [hasFiles]);

  // Auto-load first file when project file tree arrives from Supabase
  const hasAutoLoadedRef = useRef(false);
  useEffect(() => {
    if (data.length === 0) {
      hasAutoLoadedRef.current = false;
      return;
    }
    if (hasAutoLoadedRef.current) return;

    const allFiles: FileSystemItem[] = [];
    const traverse = (nodes: FileSystemItem[]) => {
      nodes.forEach(n => {
        if (n.type === 'file') allFiles.push(n);
        if (n.children) traverse(n.children);
      });
    };
    traverse(data);

    if (allFiles.length === 0) return;

    const isActiveInData = allFiles.some(f => f.id === activeFileId);
    if (isActiveInData) {
      hasAutoLoadedRef.current = true;
      return;
    }

    hasAutoLoadedRef.current = true;
    handleNodeSelect(allFiles[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Auto-save: save current workspace state every 1 second (Figma-like)
  const lastSavedRef = useRef<string>('');
  const lastCanvasSettingsSavedRef = useRef<string>('');
  const widgetsRef = useRef(widgets);
  const canvasSettingsRef = useRef(canvasSettings);
  const activeFileIdRef = useRef(activeFileId);
  const activeProjectIdRef = useRef(activeProjectId);
  const saveNowRef = useRef(saveNow);

  useEffect(() => { widgetsRef.current = widgets; }, [widgets]);
  useEffect(() => { canvasSettingsRef.current = canvasSettings; }, [canvasSettings]);
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);
  useEffect(() => { activeProjectIdRef.current = activeProjectId; }, [activeProjectId]);
  useEffect(() => { saveNowRef.current = saveNow; }, [saveNow]);

  // Save current file content into the tree node + push to Supabase
  const persistCurrentFile = useCallback(() => {
    const fid = activeFileIdRef.current;
    if (!fid) return;
    const state = JSON.stringify({ widgets: widgetsRef.current, canvasSettings: canvasSettingsRef.current });
    updateNode(fid, { content: state });
    // Build updated tree with new content and save directly to Supabase
    const updatedTree = dataRef.current.map(function patchNode(n: FileSystemItem): FileSystemItem {
      if (n.id === fid) return { ...n, content: state };
      if (n.children) return { ...n, children: n.children.map(patchNode) };
      return n;
    });
    saveNowRef.current(updatedTree);
    lastSavedRef.current = state;

    // Also persist canvas_settings directly to the projects table
    const pid = activeProjectIdRef.current;
    const csJson = JSON.stringify(canvasSettingsRef.current);
    if (pid && csJson !== lastCanvasSettingsSavedRef.current) {
      lastCanvasSettingsSavedRef.current = csJson;
      supabase
        .from('projects')
        .update({ canvas_settings: canvasSettingsRef.current, updated_at: new Date().toISOString() })
        .eq('id', pid)
        .then(({ error }) => {
          if (error) console.error('[AutoSave] canvas_settings save failed:', error);
        });
    }
  }, [updateNode, dataRef]);

  useEffect(() => {
    if (!activeFileId) return;

    const interval = setInterval(() => {
      const currentState = JSON.stringify({ widgets: widgetsRef.current, canvasSettings: canvasSettingsRef.current });
      if (currentState !== lastSavedRef.current) {
        persistCurrentFile();
      }
    }, 800);

    // Save on page unload (direct Supabase call, bypasses React state)
    const handleBeforeUnload = () => persistCurrentFile();
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Flush save before sign-out (session still valid at this point)
    const handlePreSignout = () => persistCurrentFile();
    window.addEventListener('app-pre-signout', handlePreSignout);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('app-pre-signout', handlePreSignout);
      // Save immediately when switching files or unmounting
      persistCurrentFile();
    };
  }, [activeFileId, persistCurrentFile]);

  const handleNodeSelect = (id: string | undefined) => {
    setSelectedNodeId(id ?? null);

    if (!id) return;

    // Check if it's a file (not a folder)
    const node = getNode(id);
    if (node && node.type === 'file') {

      // Only load workspace for .py files — skip images and other non-workspace files
      const isPyFile = node.name.toLowerCase().endsWith('.py');
      if (!isPyFile) return;

      // 1. SAVE current state to the active file
      if (activeFileId) {
        updateNode(activeFileId, {
          content: JSON.stringify({
            widgets,
            canvasSettings
          })
        });
      }

      // 2. LOAD new file content
      if (node.content) {
        try {
          const parsed = JSON.parse(node.content);
          if (parsed.widgets && parsed.canvasSettings) {
            loadWorkspaceState(parsed.widgets, parsed.canvasSettings);
          } else {
            // Fallback/Legacy or empty file
            loadWorkspaceState([], {
              width: 800,
              height: 600,
              title: 'Mon Application',
              titleFontWeight: 'normal',
              resizable: false,
              layoutMode: 'absolute',
              scaling: 1,
              backgroundColor: '',
              headerBackgroundColor: '',
              gridVisible: true,
            });
          }
        } catch (e) {
          console.error('Failed to parse file content', e);
          // Load empty
          loadWorkspaceState([], {
            width: 800,
            height: 600,
            title: 'Mon Application',
            titleFontWeight: 'normal',
            resizable: false,
            layoutMode: 'absolute',
            scaling: 1,
            backgroundColor: '',
            headerBackgroundColor: '',
            gridVisible: true,
          });
        }
      }

      // 3. SET active file
      setActiveFile(id);
    }
  };


  const startRenaming = (id: string, currentName: string) => {
    setRenamingNodeId(id);
    // For .py files, strip extension for easier editing; for other files keep full name
    if (currentName.toLowerCase().endsWith('.py')) {
      setRenameInputValue(currentName.replace(/\.py$/i, ''));
    } else {
      setRenameInputValue(currentName);
    }
  };

  const handleRenameConfirm = () => {
    if (renamingNodeId && renameInputValue.trim()) {
      let finalValue = renameInputValue.trim();
      // Only auto-append .py for files that don't already have a known extension
      const node = getNode(renamingNodeId);
      const isImageFile = node && /\.(png|jpg|jpeg|ico)$/i.test(node.name);
      if (!isImageFile && !finalValue.toLowerCase().endsWith('.py')) {
        finalValue += '.py';
      }
      renameNode(renamingNodeId, finalValue);
    }
    setRenamingNodeId(null);
    setRenameInputValue('');
  };

  const handleRenameCancel = () => {
    setRenamingNodeId(null);
    setRenameInputValue('');
  };

  const handleCreateConfirm = () => {
    if (!creatingNode || !creationInputValue.trim()) {
      setCreatingNode(null);
      setCreationInputValue('');
      return;
    }

    let finalValue = creationInputValue.trim();
    // Auto-append .py for files if missing
    if (creatingNode.type === 'file' && !finalValue.toLowerCase().endsWith('.py')) {
      finalValue += '.py';
    }

    const newId = addNode(creatingNode.parentId, creatingNode.type, finalValue);
    toast.success(`${creatingNode.type === 'file' ? 'File' : 'Folder'} created`);

    setCreatingNode(null);
    setCreationInputValue('');

    // Automatically select/open the new file
    if (creatingNode.type === 'file' && newId) {
      handleNodeSelect(newId);
    }
  };

  const handleCreateCancel = () => {
    setCreatingNode(null);
    setCreationInputValue('');
  };

  const startCreating = () => {
    // Always create at root level for now as per "just the file suffices" request, 
    // or keep parent logic if we want to allow creating files INSIDE existing folders (if any).
    // Given the request "supprime la possibilité de cree un dossier", I'll just default to 'file'.
    const type = 'file';

    // We need to know if selectedNodeId is a folder.
    const isSelectedFolder = (nodes: FileSystemItem[], id: string): boolean => {
      for (const node of nodes) {
        if (node.id === id) return node.type === 'folder';
        if (node.children) {
          if (isSelectedFolder(node.children, id)) return true;
        }
      }
      return false;
    };

    let parentId: string | null = null;
    if (selectedNodeId && isSelectedFolder(data, selectedNodeId)) {
      parentId = selectedNodeId;
    }

    setCreatingNode({ parentId, type });
    setCreationInputValue('');
  };


  const getNodeForRenaming = (nodes: FileSystemItem[], id: string): FileSystemItem | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = getNodeForRenaming(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Recursively render the file tree
  const renderTree = (nodes: FileSystemItem[], isInsideImagesFolder = false) => {
    return nodes.map((node) => {
      const isCreatingHere = creatingNode && creatingNode.parentId === node.id;
      const isImagesFolder = node.id === '__fs_images__';

      if (node.type === 'folder') {
        return (
          <TreeFolder
            key={node.id}
            value={node.id}
            element={node.name}
            folderIcon={<FolderFilledIcon className="size-4 shrink-0" color="#0ea5e9" />}
            folderOpenIcon={<FolderOpenFilledIcon className="size-4 shrink-0" color="#0ea5e9" />}
          >
            {isCreatingHere && (
              <TreeInput
                value={creationInputValue}
                onChange={(e) => setCreationInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateConfirm();
                  if (e.key === 'Escape') handleCreateCancel();
                }}
                onBlur={handleCreateConfirm}
                isFolder={creatingNode.type === 'folder'}
                fileIcon={creatingNode.type === 'file' ? <PythonIcon className="size-4 text-violet-500" /> : undefined}
                autoFocus
              />
            )}
            {renamingNodeId === node.id ? (
              <TreeInput
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameConfirm();
                  if (e.key === 'Escape') handleRenameCancel();
                }}
                onBlur={handleRenameConfirm}
                isFolder={true}
                autoFocus
              />
            ) : (
              node.children && renderTree(node.children, isImagesFolder)
            )}
          </TreeFolder>
        );
      }
      // Files inside Images folder always show image icon, regardless of extension
      const isImageNode = isInsideImagesFolder || /\.(png|jpg|jpeg|ico)$/i.test(node.name);
      const fileIconForNode = isImageNode
        ? <ImageFileIcon className="size-4 text-violet-400" />
        : node.name.toLowerCase().endsWith('.py')
          ? <PythonIcon className="size-4 text-violet-500" />
          : undefined;

      return renamingNodeId === node.id ? (
        <TreeInput
          key={`rename-${node.id}`}
          value={renameInputValue}
          onChange={(e) => setRenameInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameConfirm();
            if (e.key === 'Escape') handleRenameCancel();
          }}
          onBlur={handleRenameConfirm}
          isFolder={false}
          fileIcon={fileIconForNode}
          autoFocus
        />
      ) : (
        <TreeFile
          key={node.id}
          value={node.id}
          fileIcon={fileIconForNode}
          onDoubleClick={() => {
            startRenaming(node.id, node.name);
          }}
        >
          <span className="text-[13px] ml-1">{node.name}</span>
        </TreeFile>
      );
    });
  };

  const handleItemAction = () => {
    let finalValue = inputValue.trim();
    if (!finalValue) return;

    if (itemDialogMode === 'file' && !finalValue.toLowerCase().endsWith('.py')) {
      finalValue += '.py';
    }

    addNode(null, itemDialogMode === 'file' ? 'file' : 'folder', finalValue);
    toast.success(`${itemDialogMode === 'file' ? 'File' : 'Folder'} created`);
    
    setIsItemDialogOpen(false);
    setInputValue('');
  };

  const filteredCategories = WIDGET_CATEGORIES
    .map(category => ({
      name: category.name,
      widgets: category.widgets.filter(widget => {
        if (!searchQuery) return true;
        const haystack = `${widget.name} ${widget.description}`.toLowerCase();
        return haystack.includes(searchQuery.toLowerCase());
      }),
    }))
    .filter(category => category.widgets.length > 0);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDeleteConfirm = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);

      // If we deleted the active file, clear the workspace
      if (selectedNodeId === activeFileId) {
        loadWorkspaceState([], {
          width: 800,
          height: 600,
          title: 'Mon Application',
          titleFontWeight: 'normal',
          resizable: false,
          layoutMode: 'absolute',
          scaling: 1,
          backgroundColor: '',
          headerBackgroundColor: '',
          gridVisible: true,
        });
        setActiveFile('');
      }

      setSelectedNodeId(null);
      toast.success("Item deleted");
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="w-full border-r border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#0b1422] flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="explorer" value={currentTab} onValueChange={setCurrentTab} className="flex flex-col h-full">
        {/* ... existing tabs content ... */}
        <div className="px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700/70 flex-shrink-0 bg-white dark:bg-[#0c1728] z-10">
          <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-slate-100 dark:bg-[#121f34] text-slate-500 dark:text-slate-400">
            <TabsTrigger
              value="components"
              disabled={!hasFiles}
              className="text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a2b45] data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Layers className="h-3.5 w-3.5" />
              Composants
            </TabsTrigger>
            <TabsTrigger value="explorer" className="text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a2b45] data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm transition-all duration-300">
              <Folder className="h-3.5 w-3.5" />
              Explorateur
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="components" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
          <div className="p-4 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Bibliothèque
              </h2>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">{ALL_WIDGET_DEFINITIONS.length}</Badge>
            </div>
            <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background/50 border-border/50 focus:bg-background transition-all duration-200"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-4 pt-0">
              <div className="space-y-6">
                {filteredCategories.map((category) => {
                  const isLockedCategory = isGuest && category.name === 'Composites';
                  return (
                  <div key={category.name} className="space-y-3">
                    <div className="flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#0c1728]/95 backdrop-blur-sm py-2 z-10 border-b border-transparent">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {category.name}
                      </h3>
                      {isLockedCategory && (
                        <LockIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div className={`grid gap-3 relative ${isLockedCategory ? 'pointer-events-none' : ''}`}>
                      {isLockedCategory && (
                        <div
                          className="absolute inset-0 z-20 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center cursor-pointer pointer-events-auto"
                          onClick={() => setAuthPromptOpen(true)}
                        >
                          <LockIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-1" />
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Compte requis</span>
                        </div>
                      )}
                      <AnimatePresence>
                        {category.widgets.map((widget, index) => (
                          <motion.div
                            key={`${category.name}-${widget.type}-${index}`}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                          >
                            <DraggableWidget
                              type={widget.type}
                              name={widget.name}
                              description={widget.description}
                              icon={widget.icon}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="explorer" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden relative bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Fichiers</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:text-violet-400 dark:hover:bg-violet-500/10 rounded-md transition-colors"
                onClick={() => startCreating()}
                data-tour-first-py-file-button
                title="Nouveau Fichier"
              >
                <FilePlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30"
                onClick={() => {
                  if (selectedNodeId) {
                    const node = getNodeForRenaming(data, selectedNodeId);
                    if (node) startRenaming(node.id, node.name);
                  }
                }}
                disabled={!selectedNodeId}
                title="Renommer"
              >
                <PenLine className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30"
                onClick={() => {
                  if (selectedNodeId) {
                    setIsDeleteConfirmOpen(true);
                  }
                }}
                disabled={!selectedNodeId}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 px-1 py-1.5 overflow-hidden flex flex-col">
              <div className="h-full relative flex-1">
                <Tree
                  className="bg-transparent"
                  initialSelectedId={data[0]?.id}
                  initialExpandedItems={['__project-root__', data[0]?.id]}
                  elements={[]}
                  onSelectChange={(id) => {
                    if (id !== '__project-root__') handleNodeSelect(id);
                  }}
                >
                  <TreeFolder
                    value="__project-root__"
                    element={projectName}
                    folderIcon={<FolderFilledIcon className="size-4 shrink-0" color="#0F3460" />}
                    folderOpenIcon={<FolderOpenFilledIcon className="size-4 shrink-0" color="#0F3460" />}
                  >
                    {/* Render root level input if creating at root */}
                    {creatingNode && creatingNode.parentId === null && (
                      <TreeInput
                        value={creationInputValue}
                        onChange={(e) => setCreationInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateConfirm();
                          if (e.key === 'Escape') handleCreateCancel();
                        }}
                        onBlur={handleCreateConfirm}
                        isFolder={creatingNode.type === 'folder'}
                        fileIcon={creatingNode.type === 'file' ? <PythonIcon className="size-4 text-violet-500" /> : undefined}
                        data-tour-first-py-file-input
                      />
                    )}
                    {renderTree(data)}
                  </TreeFolder>
                </Tree>

                {/* Empty State with Button */}
                {data.length === 0 && !creatingNode && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 absolute inset-0 top-0">
                    <div className="p-4 rounded-full bg-muted shadow-inner animate-in fade-in zoom-in duration-300">
                      <FilePlus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Aucun fichier</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                        Créez un nouveau fichier pour commencer votre projet.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => startCreating()} data-tour-first-py-file-button>
                      <FilePlus className="mr-2 h-4 w-4" />
                      Nouveau Fichier
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for Files/Folders */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {itemDialogMode === 'file' ? 'Nouveau Fichier' : 'Nouveau Dossier'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-name" className="text-right">
                Nom
              </Label>
              <Input
                id="item-name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleItemAction();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleItemAction}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Auth prompt for locked widgets */}
      <AuthPromptDialog
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        feature="Les widgets composites"
      />
    </div >
  );
};
