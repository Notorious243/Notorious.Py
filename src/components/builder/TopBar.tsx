import React, { useState, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Sun, Moon, Code, Brush, Download, Undo2, Redo2, Eye, Edit, Keyboard, HelpCircle, Sparkles, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useWidgets } from '@/contexts/WidgetContext';
const ExportModal = lazy(() => import('./ExportModal').then(m => ({ default: m.ExportModal })));
const AIGeneratorModal = lazy(() => import('./AIGeneratorModal').then(m => ({ default: m.AIGeneratorModal })));
const KeyboardShortcutsDialog = lazy(() => import('./KeyboardShortcutsDialog').then(m => ({ default: m.KeyboardShortcutsDialog })));
const VersionHistoryModal = lazy(() => import('./VersionHistoryModal').then(m => ({ default: m.VersionHistoryModal })));

import { Home } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { useFileSystem } from '@/hooks/useFileSystem';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = React.useState({ top: 0, right: 0 });

  const email = user?.email ?? '';
  const firstName = user?.user_metadata?.first_name as string | undefined;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const initials = firstName
    ? firstName[0].toUpperCase()
    : email[0]?.toUpperCase() || '?';

  const displayName = firstName || email.split('@')[0] || 'Profil';

  const hasPhoto = !!avatarUrl;

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-2 h-9 px-3 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all ring-2 ring-indigo-500/20 hover:ring-indigo-500/50"
        title={email}
      >
        {hasPhoto ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-white/30"
          />
        ) : (
          <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </span>
        )}
        <span className="max-w-[90px] truncate leading-none">{displayName}</span>
        <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] w-60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5"
            style={{
              top: dropPos.top,
              right: dropPos.right,
              backgroundColor: 'var(--user-menu-bg, white)',
            }}
          >
            <style>{`
              :root { --user-menu-bg: #ffffff; }
              .dark { --user-menu-bg: #0f172a; }
            `}</style>

            {/* Header with avatar */}
            <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
              {hasPhoto ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-indigo-500/30">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{email}</p>
              </div>
            </div>

            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const TopBar: React.FC<{ minimal?: boolean }> = ({ minimal }) => {
  const { theme, setTheme } = useTheme();
  const { viewMode, setViewMode, previewMode, setPreviewMode, undo, redo, canUndo, canRedo, widgets, canvasSettings, loadWorkspaceState, activeFileId } = useWidgets();
  const { activeProjectId } = useProjects();
  const { getNode } = useFileSystem();
  const activeFileName = activeFileId ? getNode(activeFileId)?.name ?? null : null;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // F1 to open keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if we need to open AI modal automatically (triggered from dashboard)
  React.useEffect(() => {
    try {
      const shouldOpenAI = localStorage.getItem('ctk_open_ai_on_load');
      if (shouldOpenAI === 'true') {
        setIsAIModalOpen(true);
        localStorage.removeItem('ctk_open_ai_on_load');
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  return (
    <>
      <div className="h-16 border-b border-slate-300/90 dark:border-slate-700/80 bg-gradient-to-b from-white to-slate-50/80 dark:from-[#0b1422] dark:to-[#0a1320] flex items-center justify-between px-4 z-20 shrink-0 shadow-[0_1px_0_rgba(15,23,42,0.05)] dark:shadow-[0_10px_34px_rgba(2,8,23,0.45)] backdrop-blur">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-projects-modal'))} 
            title="Ouvrir l'espace de travail" 
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo-128x128.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-[0_6px_14px_rgba(15,52,96,0.35)]" />
            <h1 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Notorious.PY</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!minimal && (
            <>
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 border border-slate-300/80 dark:border-slate-700 rounded-lg bg-white/80 dark:bg-[#101a2b] shadow-sm dark:shadow-[0_6px_18px_rgba(2,8,23,0.35)]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Annuler (Ctrl+Z)"
                  title="Annuler (Ctrl+Z)"
                  className="h-9 w-9"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Rétablir (Ctrl+Shift+Z)"
                  title="Rétablir (Ctrl+Shift+Z)"
                  className="h-9 w-9"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Generation Button */}
              <Button
                onClick={() => setIsAIModalOpen(true)}
                className="gap-2 bg-[#0F3460] hover:bg-[#1F5AA0] text-white border-0 shadow-sm dark:shadow-[0_8px_24px_rgba(15,52,96,0.4)] transition-all"
              >
                <Sparkles className="h-4 w-4 text-white" />
                <span className="font-medium">Générer UI</span>
              </Button>

              <Button onClick={() => setIsExportModalOpen(true)} data-export-button className="dark:bg-[#0F3460] dark:hover:bg-[#1F5AA0] dark:text-white dark:border-0 dark:shadow-[0_8px_22px_rgba(15,52,96,0.4)]">
                <Download className="h-4 w-4 mr-2" />
                Exporter le Code
              </Button>

              {/* Version History Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsVersionModalOpen(true)}
                disabled={!activeProjectId}
                aria-label="Historique des versions"
                title="Historique des versions"
                className="h-9 w-9"
              >
                <History className="h-4 w-4" />
              </Button>

              {/* Onboarding Tour Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => import('./OnboardingTour').then(m => m.startOnboardingTour())}
                aria-label="Tour guidé"
                title="Relancer le tour guidé"
                className="h-9 w-9"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              {/* Keyboard Shortcuts Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsShortcutsOpen(true)}
                aria-label="Raccourcis clavier"
                title="Raccourcis clavier (F1)"
                className="h-9 w-9"
              >
                <Keyboard className="h-4 w-4" />
              </Button>

              {/* Preview/Edit Mode Toggle */}
              {viewMode === 'design' && (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={previewMode}
                  onValueChange={(value) => { if (value) setPreviewMode(value as 'edit' | 'preview') }}
                  data-preview-toggle
                >
                  <ToggleGroupItem value="edit" aria-label="Mode Édition">
                    <Edit className="h-4 w-4 mr-2" />
                    Édition
                  </ToggleGroupItem>
                  <ToggleGroupItem value="preview" aria-label="Mode Aperçu" className="relative">
                    {previewMode === 'preview' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </ToggleGroupItem>
                </ToggleGroup>
              )}

              <ToggleGroup
                type="single"
                variant="outline"
                value={viewMode}
                onValueChange={(value) => { if (value) setViewMode(value as 'design' | 'code') }}
              >
                <ToggleGroupItem value="design" aria-label="Vue Design">
                  <Brush className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="code" aria-label="Vue Code">
                  <Code className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Changer de thème"
            className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* TODO: Notifications — activer quand la fonctionnalité sera implémentée
          {!minimal && (
            <Button variant="ghost" size="icon" aria-label="Notifications" className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70">
              <Bell className="h-5 w-5" />
            </Button>
          )}
          */}

          <UserMenu />
        </div>
      </div>
      <Suspense fallback={null}>
        {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />}
        {isAIModalOpen && <AIGeneratorModal isOpen={isAIModalOpen} onOpenChange={setIsAIModalOpen} />}
        {isShortcutsOpen && <KeyboardShortcutsDialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />}
        {isVersionModalOpen && activeProjectId && (
          <VersionHistoryModal
            isOpen={isVersionModalOpen}
            onOpenChange={setIsVersionModalOpen}
            projectId={activeProjectId}
            currentWidgets={widgets}
            currentCanvasSettings={canvasSettings}
            onRestore={loadWorkspaceState}
            activeFileId={activeFileId}
            activeFileName={activeFileName}
          />
        )}
      </Suspense>
    </>
  );
};
