import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type FileSystemItem = {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileSystemItem[];
    isOpen?: boolean;
    content?: string;
};

const dedupeTree = (nodes: FileSystemItem[]): FileSystemItem[] => {
    const seen = new Set<string>();
    return nodes.filter(n => {
        if (seen.has(n.id)) {
            console.warn('[FileSystem] Duplicate node ID removed:', n.id);
            return false;
        }
        seen.add(n.id);
        return true;
    }).map(n => n.children ? { ...n, children: dedupeTree(n.children) } : n);
};

// Internal hook logic
const useFileSystemLogic = (projectId: string | null) => {
    const isValidId = Boolean(projectId && !projectId.startsWith('temp-'));

    const [data, setData] = useState<FileSystemItem[]>([]);
    const dataRef = useRef<FileSystemItem[]>([]);
    const isInitialLoad = useRef(true);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentProjectId = useRef(projectId);
    const hasPendingSaveRef = useRef(false);

    // Keep dataRef in sync with data
    useEffect(() => { dataRef.current = data; }, [data]);

    // Keep ref in sync with projectId
    useEffect(() => { currentProjectId.current = projectId; }, [projectId]);

    // Helper: persist file_tree to Supabase immediately
    const saveToSupabase = useCallback((tree: FileSystemItem[], { allowEmpty = false } = {}) => {
        const pid = currentProjectId.current;
        if (!pid || pid.startsWith('temp-')) return;
        // SAFETY: NEVER overwrite file_tree with [] unless explicitly allowed (only deleteNode)
        if (tree.length === 0 && !allowEmpty) {
            console.warn('[FileSystem] Blocked saving empty file_tree. pid=', pid);
            return;
        }
        console.log('[FileSystem] Saving file_tree:', tree.length, 'nodes, pid=', pid);
        supabase
            .from('projects')
            .update({ file_tree: tree, updated_at: new Date().toISOString() })
            .eq('id', pid)
            .then(({ error }) => {
                if (error) console.error('[FileSystem] Supabase save FAILED:', error);
            });
    }, []);

    // Load file_tree from Supabase when project changes
    useEffect(() => {
        if (!isValidId || !projectId) { setData([]); return; }
        isInitialLoad.current = true;
        supabase
            .from('projects')
            .select('file_tree')
            .eq('id', projectId)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row && Array.isArray(row.file_tree)) {
                    const loaded = dedupeTree(row.file_tree as FileSystemItem[]);
                    console.log('[FileSystem] Loaded file_tree:', loaded.length, 'nodes');
                    setData(loaded);
                    dataRef.current = loaded;
                } else {
                    setData([]);
                }
                isInitialLoad.current = false;
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Debounced auto-save whenever data changes (for content updates)
    useEffect(() => {
        if (!isValidId || isInitialLoad.current) return;
        hasPendingSaveRef.current = true;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            hasPendingSaveRef.current = false;
            saveToSupabase(dataRef.current);
        }, 300);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, projectId]);

    // Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (hasPendingSaveRef.current) saveToSupabase(dataRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Flush pending save before sign-out (session still valid at this point)
    useEffect(() => {
        const handlePreSignout = () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveToSupabase(dataRef.current);
        };
        window.addEventListener('app-pre-signout', handlePreSignout);
        return () => window.removeEventListener('app-pre-signout', handlePreSignout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveToSupabase]);

    const findNode = useCallback((nodes: FileSystemItem[], id: string): FileSystemItem | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const getNode = useCallback((id: string) => {
        return findNode(data, id);
    }, [data, findNode]);

    const addNode = useCallback((parentId: string | null, type: 'file' | 'folder', name: string) => {
        const newId = crypto.randomUUID();

        // Default content for new files
        const defaultContent = type === 'file' ? JSON.stringify({
            widgets: [],
            canvasSettings: {
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
            }
        }) : undefined;

        const newNode: FileSystemItem = {
            id: newId,
            name,
            type,
            children: type === 'folder' ? [] : undefined,
            content: defaultContent,
            isOpen: type === 'folder' ? true : undefined
        };

        // Compute new tree from the ref (always up-to-date, avoids React 18 batching issues)
        const prev = dataRef.current;
        let newData: FileSystemItem[];
        if (!parentId) {
            newData = [...prev, newNode];
        } else {
            const updateChildren = (nodes: FileSystemItem[]): FileSystemItem[] => {
                return nodes.map(node => {
                    if (node.id === parentId) {
                        return {
                            ...node,
                            children: [...(node.children || []), newNode],
                            isOpen: true
                        };
                    }
                    if (node.children) {
                        return { ...node, children: updateChildren(node.children) };
                    }
                    return node;
                });
            };
            newData = updateChildren(prev);
        }

        // Update state and ref synchronously
        setData(newData);
        dataRef.current = newData;

        // Immediately persist to Supabase — do not wait for the debounced effect
        saveToSupabase(newData);

        return newId;
    }, [saveToSupabase]);

    const updateNode = useCallback((id: string, updates: Partial<FileSystemItem>) => {
        const updateRecursive = (nodes: FileSystemItem[]): FileSystemItem[] => {
            return nodes.map(node => {
                if (node.id === id) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return { ...node, children: updateRecursive(node.children) };
                }
                return node;
            });
        };
        const newData = updateRecursive(dataRef.current);
        setData(newData);
        dataRef.current = newData;
    }, []);

    const deleteNode = useCallback((id: string) => {
        const prev = dataRef.current;
        const deleteRecursive = (nodes: FileSystemItem[]): FileSystemItem[] => {
            return nodes
                .filter(node => node.id !== id)
                .map(node => ({
                    ...node,
                    children: node.children ? deleteRecursive(node.children) : undefined
                }));
        };
        const newData = deleteRecursive(prev);

        setData(newData);
        dataRef.current = newData;

        // Allow saving empty tree here (user explicitly deleted)
        saveToSupabase(newData, { allowEmpty: true });
    }, [saveToSupabase]);

    const renameNode = useCallback((id: string, name: string) => {
        updateNode(id, { name });
        // Immediate save for rename (user-initiated action)
        saveToSupabase(dataRef.current);
    }, [updateNode, saveToSupabase]);

    const hasFiles = data.length > 0;
    const projectCreated = hasFiles;

    const IMAGES_FOLDER_ID = '__fs_images__';

    const addImage = useCallback((name: string): string => {
        const imageId = crypto.randomUUID();
        const newNode: FileSystemItem = { id: imageId, name, type: 'file' };
        const prev = dataRef.current;
        const hasFolder = prev.some(n => n.id === IMAGES_FOLDER_ID);
        let newData: FileSystemItem[];
        if (hasFolder) {
            newData = prev.map(n =>
                n.id === IMAGES_FOLDER_ID
                    ? { ...n, children: [...(n.children || []), newNode], isOpen: true }
                    : n
            );
        } else {
            newData = [...prev, {
                id: IMAGES_FOLDER_ID,
                name: 'Images',
                type: 'folder' as const,
                children: [newNode],
                isOpen: true,
            }];
        }
        setData(newData);
        dataRef.current = newData;
        return imageId;
    }, []);

    const createProject = useCallback((name: string) => {
        // Just creates a root folder or file, depending on usage, but usually we just want a root item
        // But for compatibility with existing code:
        addNode(null, 'file', name);
    }, [addNode]);

    const getAllFiles = useCallback(() => {
        const files: FileSystemItem[] = [];
        const traverse = (nodes: FileSystemItem[]) => {
            nodes.forEach(node => {
                if (node.type === 'file') {
                    files.push(node);
                }
                if (node.children) {
                    traverse(node.children);
                }
            });
        };
        traverse(data);
        return files;
    }, [data]);

    // Returns only .py workspace files, excluding images folder children
    const getPyFiles = useCallback(() => {
        const files: FileSystemItem[] = [];
        const traverse = (nodes: FileSystemItem[], insideImages: boolean) => {
            nodes.forEach(node => {
                if (node.id === IMAGES_FOLDER_ID) {
                    // Skip the entire Images folder and its children
                    return;
                }
                if (node.type === 'file' && !insideImages && node.name.toLowerCase().endsWith('.py')) {
                    files.push(node);
                }
                if (node.children) {
                    traverse(node.children, insideImages);
                }
            });
        };
        traverse(data, false);
        return files;
    }, [data]);

    const saveNow = useCallback((overrideData?: FileSystemItem[]) => {
        const treeToSave = overrideData ?? dataRef.current;
        saveToSupabase(treeToSave);
    }, [saveToSupabase]);

    return {
        data,
        dataRef,
        addNode,
        addImage,
        updateNode,
        renameNode,
        deleteNode,
        hasFiles,
        projectCreated,
        createProject,
        getNode,
        getAllFiles,
        getPyFiles,
        saveNow
    };
};

// Context definition
const FileSystemContext = createContext<ReturnType<typeof useFileSystemLogic> | null>(null);

// Provider component
export const FileSystemProvider = ({ children, projectId }: { children: ReactNode, projectId: string | null }) => {
    const fileSystem = useFileSystemLogic(projectId);
    return (
        <FileSystemContext.Provider value={fileSystem}>
            {children}
        </FileSystemContext.Provider>
    );
};

// Hook export variables
export const useFileSystem = () => {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error('useFileSystem must be used within a FileSystemProvider');
    }
    return context;
};
