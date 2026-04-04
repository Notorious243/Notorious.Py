import React, { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { devError, devWarn } from '@/lib/logger';
import { useAuth } from '@/contexts/useAuth';
import { ProjectContext, ProjectMetadata } from '@/contexts/project-context';

const ACTIVE_PROJECT_KEY = 'ctk-active-project';
const PROJECT_CACHE_PREFIX = 'ctk-projects-cache-v1:';
const PROJECT_SNAPSHOT_PREFIX = 'ctk-project-snapshot-v1:';
const GUEST_CACHE_SCOPE = 'guest';

const DEFAULT_CANVAS = {
    width: 800,
    height: 600,
    title: 'Mon Application',
    titleFontWeight: 'normal' as const,
    resizable: false,
    layoutMode: 'absolute' as const,
    scaling: 1,
    backgroundColor: '',
    headerBackgroundColor: '',
    gridVisible: true,
};

type LocalProjectSnapshot = {
    fileTree?: unknown[];
    canvasSettings?: unknown;
    updatedAt?: number;
};

type SupabaseProject = {
    id: string;
    name: string;
    user_id: string;
    canvas_settings: unknown;
    file_tree: unknown[];
    thumbnail?: string | null;
    created_at: string;
    updated_at: string;
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getProjectCacheKey = (scope: string) => `${PROJECT_CACHE_PREFIX}${scope}`;
const getProjectSnapshotKey = (projectId: string) => `${PROJECT_SNAPSHOT_PREFIX}${projectId}`;

const readProjectCache = (scope: string): ProjectMetadata[] => {
    if (!canUseStorage()) return [];
    try {
        const raw = window.localStorage.getItem(getProjectCacheKey(scope));
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((entry): entry is ProjectMetadata => {
                if (!entry || typeof entry !== 'object') return false;
                const candidate = entry as Partial<ProjectMetadata>;
                return typeof candidate.id === 'string'
                    && typeof candidate.name === 'string'
                    && typeof candidate.createdAt === 'number'
                    && typeof candidate.updatedAt === 'number';
            })
            .map((entry) => ({
                id: entry.id,
                name: entry.name,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                thumbnail: entry.thumbnail,
            }));
    } catch {
        return [];
    }
};

const writeProjectCache = (scope: string, projects: ProjectMetadata[]) => {
    if (!canUseStorage()) return;
    try {
        window.localStorage.setItem(getProjectCacheKey(scope), JSON.stringify(projects));
    } catch (error) {
        devWarn('[ProjectContext] Impossible de persister le cache projets local:', error);
    }
};

const readProjectSnapshot = (projectId: string): LocalProjectSnapshot | null => {
    if (!projectId || !canUseStorage()) return null;
    try {
        const raw = window.localStorage.getItem(getProjectSnapshotKey(projectId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return null;
        const candidate = parsed as LocalProjectSnapshot;
        return {
            fileTree: Array.isArray(candidate.fileTree) ? candidate.fileTree : undefined,
            canvasSettings: candidate.canvasSettings,
            updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : undefined,
        };
    } catch {
        return null;
    }
};

function toMetadata(row: SupabaseProject): ProjectMetadata {
    return {
        id: row.id,
        name: row.name,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        thumbnail: row.thumbnail ?? undefined,
    };
}

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<ProjectMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoadedOnceRef = useRef(false);
    const hasAttemptedRecoveryRef = useRef(false);
    const projectsRef = useRef<ProjectMetadata[]>([]);
    useEffect(() => {
        projectsRef.current = projects;
    }, [projects]);

    const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
        try {
            const stored = localStorage.getItem(ACTIVE_PROJECT_KEY);
            // Never restore temp (guest) project IDs — guest data resets on refresh
            if (stored && stored.startsWith('temp-')) {
                localStorage.removeItem(ACTIVE_PROJECT_KEY);
                return null;
            }
            return stored;
        } catch { return null; }
    });
    const activeProjectIdRef = useRef<string | null>(activeProjectId);
    useEffect(() => {
        activeProjectIdRef.current = activeProjectId;
    }, [activeProjectId]);

    // Reset active project when user changes (logout/login)
    const prevUserRef = useRef<string | null>(null);
    useEffect(() => {
        const currentUserId = user?.id ?? null;
        if (prevUserRef.current !== null && prevUserRef.current !== currentUserId) {
            setActiveProjectId(null);
        }
        prevUserRef.current = currentUserId;
    }, [user]);

    const recoverProjectsFromSnapshots = useCallback(async (userId: string, cachedProjects: ProjectMetadata[]) => {
        if (!cachedProjects.length) return null;
        const payload = cachedProjects.map((project) => {
            const snapshot = readProjectSnapshot(project.id);
            return {
                id: project.id,
                name: project.name,
                user_id: userId,
                canvas_settings: snapshot?.canvasSettings ?? DEFAULT_CANVAS,
                file_tree: snapshot?.fileTree ?? [],
                thumbnail: project.thumbnail ?? null,
            };
        });

        const { data, error } = await supabase
            .from('projects')
            .upsert(payload, { onConflict: 'id' })
            .select('*');

        if (error || !data) {
            devError('[ProjectContext] Echec restauration projets depuis snapshot local:', error);
            return null;
        }

        return (data as SupabaseProject[]).map(toMetadata);
    }, []);

    // Fetch projects on mount / user change
    const fetchProjects = useCallback(async () => {
        if (authLoading) return;

        if (!user) {
            // Guest mode: restore locally cached projects
            const guestProjects = readProjectCache(GUEST_CACHE_SCOPE);
            setProjects(guestProjects);
            const currentActive = activeProjectIdRef.current;
            if (currentActive && !guestProjects.some((project) => project.id === currentActive)) {
                setActiveProjectId(null);
            }
            setLoading(false);
            hasLoadedOnceRef.current = false;
            hasAttemptedRecoveryRef.current = false;
            return;
        }
        // Only show loading spinner on the very first fetch — never on refreshes
        // (setting loading=true unmounts the entire WidgetProvider tree)
        if (!hasLoadedOnceRef.current) setLoading(true);

        const cachedProjects = readProjectCache(user.id);
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            devError('[ProjectContext] Erreur fetch projets:', error);
            if (cachedProjects.length > 0) {
                setProjects(cachedProjects);
                const currentActive = activeProjectIdRef.current;
                if (currentActive && !cachedProjects.some((project) => project.id === currentActive)) {
                    setActiveProjectId(null);
                }
            }
            setLoading(false);
            hasLoadedOnceRef.current = true;
            return;
        }

        const rows = (data as SupabaseProject[]) ?? [];
        if (rows.length === 0 && cachedProjects.length > 0) {
            if (!hasAttemptedRecoveryRef.current) {
                hasAttemptedRecoveryRef.current = true;
                const recovered = await recoverProjectsFromSnapshots(user.id, cachedProjects);
                if (recovered && recovered.length > 0) {
                    setProjects(recovered);
                    writeProjectCache(user.id, recovered);
                    setLoading(false);
                    hasLoadedOnceRef.current = true;
                    return;
                }
            }

            // Fallback local immédiat pour éviter une "perte totale" en UI
            setProjects(cachedProjects);
            setLoading(false);
            hasLoadedOnceRef.current = true;
            return;
        }

        hasAttemptedRecoveryRef.current = false;
        const mappedProjects = rows.map(toMetadata);
        setProjects(mappedProjects);
        writeProjectCache(user.id, mappedProjects);
        setLoading(false);
        hasLoadedOnceRef.current = true;
    }, [authLoading, user, recoverProjectsFromSnapshots]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // Real-time subscription on projects table (debounced to avoid redundant re-fetches after optimistic updates)
    const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('projects-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'projects',
                filter: `user_id=eq.${user.id}`,
            }, () => {
                if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
                realtimeTimerRef.current = setTimeout(() => { fetchProjects(); }, 1500);
            })
            .subscribe();
        return () => {
            if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
            supabase.removeChannel(channel);
        };
    }, [user, fetchProjects]);

    // Persist active project id locally (skip temp/guest project IDs)
    useEffect(() => {
        try {
            if (activeProjectId && !activeProjectId.startsWith('temp-')) {
                localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
            } else {
                localStorage.removeItem(ACTIVE_PROJECT_KEY);
            }
        } catch { /* ignore */ }
    }, [activeProjectId]);

    // Clear active project if it was deleted
    useEffect(() => {
        if (!loading && activeProjectId && projects.length > 0) {
            if (!projects.some(p => p.id === activeProjectId)) setActiveProjectId(null);
        }
    }, [loading, activeProjectId, projects]);

    const createProject = useCallback(async (name: string): Promise<string> => {
        if (!user) {
            // Guest mode: local-only project persisted in local cache
            const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const meta: ProjectMetadata = { id, name, createdAt: Date.now(), updatedAt: Date.now() };
            const nextProjects = [meta, ...projectsRef.current];
            setProjects(nextProjects);
            writeProjectCache(GUEST_CACHE_SCOPE, nextProjects);
            setActiveProjectId(id);
            return id;
        }
        const { data, error } = await supabase
            .from('projects')
            .insert({ name, user_id: user.id, canvas_settings: DEFAULT_CANVAS, file_tree: [] })
            .select()
            .single();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create project');
        const row = data as SupabaseProject;
        const meta = toMetadata(row);
        const nextProjects = [meta, ...projectsRef.current];
        setProjects(nextProjects);
        writeProjectCache(user.id, nextProjects);
        setActiveProjectId(row.id);
        return row.id;
    }, [user]);

    const openProject = useCallback((id: string) => { setActiveProjectId(id); }, []);
    const closeProject = useCallback(() => { setActiveProjectId(null); }, []);

    const deleteProject = useCallback((id: string) => {
        if (!id) return;
        const previousProjects = projectsRef.current;
        const previousActive = activeProjectIdRef.current;
        const nextProjects = previousProjects.filter((project) => project.id !== id);

        setProjects(nextProjects);
        setActiveProjectId((prev) => (prev === id ? null : prev));

        const cacheScope = user?.id ?? GUEST_CACHE_SCOPE;
        writeProjectCache(cacheScope, nextProjects);

        if (!user || id.startsWith('temp-')) return;

        supabase
            .from('projects')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .then(({ error }) => {
                if (error) {
                    devError('[ProjectContext] Failed to delete project:', error);
                    setProjects(previousProjects);
                    setActiveProjectId(previousActive);
                    writeProjectCache(user.id, previousProjects);
                }
            });
    }, [user]);

    const renameProject = useCallback((id: string, newName: string) => {
        if (!id || !newName.trim()) return;
        const previousProjects = projectsRef.current;
        const now = Date.now();
        const nextProjects = previousProjects.map((project) =>
            project.id === id ? { ...project, name: newName, updatedAt: now } : project,
        );

        setProjects(nextProjects);

        const cacheScope = user?.id ?? GUEST_CACHE_SCOPE;
        writeProjectCache(cacheScope, nextProjects);

        if (!user || id.startsWith('temp-')) return;

        supabase
            .from('projects')
            .update({ name: newName, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .then(({ error }) => {
                if (error) {
                    devError('[ProjectContext] Failed to rename project:', error);
                    setProjects(previousProjects);
                    writeProjectCache(user.id, previousProjects);
                }
            });
    }, [user]);

    const updateProjectThumbnail = useCallback((id: string, thumbnail: string) => {
        if (!id) return;
        const previousProjects = projectsRef.current;
        const now = Date.now();
        const nextProjects = previousProjects.map((project) =>
            project.id === id ? { ...project, thumbnail, updatedAt: now } : project,
        );
        setProjects(nextProjects);

        const cacheScope = user?.id ?? GUEST_CACHE_SCOPE;
        writeProjectCache(cacheScope, nextProjects);

        if (!user || id.startsWith('temp-')) return;

        supabase
            .from('projects')
            .update({ thumbnail, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .then(({ error }) => {
                if (error) {
                    devError('[ProjectContext] Failed to update thumbnail:', error);
                    setProjects(previousProjects);
                    writeProjectCache(user.id, previousProjects);
                }
            });
    }, [user]);

    const contextValue = useMemo(() => ({
      projects, activeProjectId, loading,
      createProject, openProject, closeProject,
      deleteProject, renameProject, updateProjectThumbnail,
    }), [
      projects, activeProjectId, loading,
      createProject, openProject, closeProject,
      deleteProject, renameProject, updateProjectThumbnail,
    ]);

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
};
