import React, { useState, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Download, Undo2, Redo2, Keyboard, HelpCircle, History, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import { useWidgets } from '@/contexts/WidgetContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
const ExportModal = lazy(() => import('./ExportModal').then(m => ({ default: m.ExportModal })));
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
        className="group flex h-8 items-center gap-2 rounded-full border border-border/30 bg-muted/40 px-2.5 text-[10px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-accent"
        title={email}
      >
        {hasPhoto ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-6 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {initials}
          </span>
        )}
        <span className="max-w-[90px] truncate leading-none">{displayName}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60 transition-transform group-hover:translate-y-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] w-64 rounded-2xl border border-border bg-card p-1.5 shadow-2xl"
            style={{
              top: dropPos.top,
              right: dropPos.right,
            }}
          >

            {/* Header with avatar */}
            <div className="mb-1 flex items-center gap-3 rounded-xl border border-border bg-secondary px-3 py-3">
              {hasPhoto ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="size-10 shrink-0 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-primary/30">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
              </div>
            </div>

            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
  const { user } = useAuth();
  const isGuest = !user;
  const { viewMode, setViewMode, previewMode, setPreviewMode, undo, redo, canUndo, canRedo, widgets, canvasSettings, loadWorkspaceState, activeFileId } = useWidgets();
  const { activeProjectId } = useProjects();
  const { getNode } = useFileSystem();
  const activeFileName = activeFileId ? getNode(activeFileId)?.name ?? null : null;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [authPromptFeature, setAuthPromptFeature] = useState<string | null>(null);
  
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

  return (
    <>
      <div className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-muted/30 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost" 
            size="icon" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-projects-modal'))} 
            title="Ouvrir l'espace de travail" 
            className="h-8 w-8 rounded-lg border border-border/30 bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/40 px-2.5 py-1">
            <img src="/logo-128x128.png" alt="Logo" className="size-6 rounded-md shadow-sm" />
            <div className="flex flex-col">
              <h1 className="text-[13px] font-semibold tracking-tight text-foreground">Notorious.PY</h1>
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Builder</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!minimal && (
            <>
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-muted/40 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Annuler (Ctrl+Z)"
                  title="Annuler (Ctrl+Z)"
                  className="h-7 w-7 rounded-md"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
                <div className="h-4 w-px bg-border/30" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Rétablir (Ctrl+Shift+Z)"
                  title="Rétablir (Ctrl+Shift+Z)"
                  className="h-7 w-7 rounded-md"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Button
                onClick={() => isGuest ? setAuthPromptFeature('L\'exportation du code') : setIsExportModalOpen(true)}
                data-export-button
                className={`h-8 rounded-lg bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-3 text-white shadow-sm transition-all hover:brightness-110 ${isGuest ? 'opacity-75' : ''}`}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exporter
              </Button>

              {/* Preview/Edit Mode Toggle */}
              {viewMode === 'design' && (
                <div className="flex justify-center" data-preview-toggle>
                  <ToggleGroup
                    type="single"
                    value={previewMode}
                    onValueChange={(value: 'edit' | 'preview') => value && setPreviewMode(value)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/30 bg-muted/40 p-0.5"
                  >
                    <ToggleGroupItem 
                      value="edit" 
                      className="h-7 rounded-md px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      Édition
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="preview" 
                      className="h-7 rounded-md px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      Aperçu
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

              {viewMode === 'design' && previewMode === 'preview' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isGuest) {
                      setAuthPromptFeature('La vue code');
                      return;
                    }
                    setViewMode('code');
                  }}
                  className={`h-8 rounded-lg border border-border/30 bg-muted/40 px-2.5 text-[10px] font-medium text-foreground hover:bg-accent ${isGuest ? 'opacity-70' : ''}`}
                  title="Voir le code depuis l'aperçu"
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  Code
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    aria-label="Plus d'actions"
                    title="Outils"
                    className="h-8 rounded-lg border border-border/30 bg-muted/40 px-2.5 text-[10px] font-semibold text-foreground hover:bg-accent"
                  >
                    <HelpCircle className="h-4 w-4 mr-1.5" />
                    Outils
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">Actions</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={!activeProjectId}
                      onSelect={() => {
                        if (!activeProjectId) return;
                        if (isGuest) {
                          setAuthPromptFeature('L\'historique des versions');
                        } else {
                          setIsVersionModalOpen(true);
                        }
                      }}
                    >
                      <History />
                      Historique des versions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        import('./OnboardingTour').then(m => m.startOnboardingTour());
                      }}
                    >
                      <HelpCircle />
                      Relancer le tour guidé
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsShortcutsOpen(true)}>
                      <Keyboard />
                      Raccourcis clavier
                      <DropdownMenuShortcut>F1</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* TODO: Notifications — activer quand la fonctionnalité sera implémentée */}

          {isGuest ? (
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth-page'))}
              className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-4 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(15,52,96,0.20)] transition-all hover:brightness-110"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </Button>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
      <Suspense fallback={null}>
        {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} />}
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
      {/* Auth prompt dialog for locked features */}
      <AuthPromptDialog
        open={!!authPromptFeature}
        onOpenChange={(open) => { if (!open) setAuthPromptFeature(null); }}
        feature={authPromptFeature ?? ''}
      />
    </>
  );
};
