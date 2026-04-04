import React, { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { devError } from '@/lib/logger';
import { useAuth } from '@/contexts/useAuth';
import { ProjectContext, ProjectMetadata } from '@/contexts/project-context';

const ACTIVE_PROJECT_KEY = 'ctk-active-project';

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
    const { user } = useAuth();
    const [projects, setProjects] = useState<ProjectMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoadedOnceRef = useRef(false);

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

    // Reset active project when user changes (logout/login)
    const prevUserRef = useRef<string | null>(null);
    useEffect(() => {
        const currentUserId = user?.id ?? null;
        if (prevUserRef.current !== null && prevUserRef.current !== currentUserId) {
            setActiveProjectId(null);
        }
        prevUserRef.current = currentUserId;
    }, [user]);

    // Fetch projects on mount / user change
    const fetchProjects = useCallback(async () => {
        if (!user) {
            // Guest mode: start with empty projects — user creates their own
            setProjects([]);
            setActiveProjectId(null);
            setLoading(false);
            hasLoadedOnceRef.current = false;
            return;
        }
        // Only show loading spinner on the very first fetch — never on refreshes
        // (setting loading=true unmounts the entire WidgetProvider tree)
        if (!hasLoadedOnceRef.current) setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (!error && data) setProjects((data as SupabaseProject[]).map(toMetadata));
        setLoading(false);
        hasLoadedOnceRef.current = true;
    }, [user]);

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
            // Guest mode: create a local-only project
            const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const meta: ProjectMetadata = { id, name, createdAt: Date.now(), updatedAt: Date.now() };
            setProjects(prev => [meta, ...prev]);
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
        setProjects(prev => [meta, ...prev]);
        setActiveProjectId(row.id);
        return row.id;
    }, [user]);

    const openProject = useCallback((id: string) => { setActiveProjectId(id); }, []);
    const closeProject = useCallback(() => { setActiveProjectId(null); }, []);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        setActiveProjectId(prev => (prev === id ? null : prev));
        supabase.from('projects').delete().eq('id', id).then(({ error }) => {
            if (error) devError('[ProjectContext] Failed to delete project:', error);
        });
    }, []);

    const renameProject = useCallback((id: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p));
        supabase.from('projects').update({ name: newName, updated_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
            if (error) devError('[ProjectContext] Failed to rename project:', error);
        });
    }, []);

    const updateProjectThumbnail = useCallback((id: string, thumbnail: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, thumbnail, updatedAt: Date.now() } : p));
        supabase.from('projects').update({ thumbnail, updated_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
            if (error) devError('[ProjectContext] Failed to update thumbnail:', error);
        });
    }, []);

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
