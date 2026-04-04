import React, { useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { devWarn } from '@/lib/logger';
import type { User, Session } from '@supabase/supabase-js';
import { flushPendingCanvasWrites } from '@/lib/canvasSyncService';
import { AuthContext } from '@/contexts/auth-context';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = useCallback(async () => {
        // Flush all pending saves BEFORE invalidating the session (RLS needs a valid token)
        window.dispatchEvent(new Event('app-pre-signout'));
        try {
            await Promise.race([
                flushPendingCanvasWrites(),
                new Promise<void>((resolve) => setTimeout(resolve, 5000)),
            ]);
        } catch (error) {
            devWarn('[Auth] Flush pending canvas writes before sign-out failed:', error);
        }
        try { localStorage.removeItem('ctk-active-project'); } catch { /* ignore */ }
        await supabase.auth.signOut();
    }, []);

    const contextValue = useMemo(
        () => ({ user, session, loading, signOut }),
        [user, session, loading, signOut]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
