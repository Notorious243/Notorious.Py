import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Download, Undo2, Redo2, Keyboard, History, LogIn, Home, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import { useWidgets } from '@/contexts/useWidgets';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import DropdownMenuUserMenu07 from '@/components/shadcn-studio/dropdown-menu/dropdown-menu-07';
import { NotificationsFilter } from '@/components/builder/NotificationsFilter';
import { useProjects } from '@/contexts/useProjects';
import { useFileSystem } from '@/hooks/useFileSystemContext';
import { getFormattedDisplayName, getUserInitials } from '@/lib/userProfile';
import { lazyNamed } from '@/lib/lazy';

const ExportModal = lazyNamed(() => import('./ExportModal'), 'ExportModal');
const KeyboardShortcutsDialog = lazyNamed(
  () => import('./KeyboardShortcutsDialog'),
  'KeyboardShortcutsDialog'
);
const VersionHistoryModal = lazyNamed(() => import('./VersionHistoryModal'), 'VersionHistoryModal');

interface TopBarProps {
  minimal?: boolean;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ minimal, onOpenProfile, onOpenSettings }) => {
  const { user, signOut } = useAuth();
  const isGuest = !user;
  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = getUserInitials(user);
  const displayName = getFormattedDisplayName(user);
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
      <div className="z-20 grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border/40 bg-muted/35 px-3.5">
        <div className="col-start-1 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => window.dispatchEvent(new CustomEvent('open-projects-modal'))}
            title="Ouvrir l'espace de travail"
            className="h-10 w-10 rounded-xl border border-border/40 bg-card/85 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div className="flex h-10 items-center gap-2.5 rounded-xl border border-border/40 bg-card/85 px-3 shadow-sm">
            <img src="/logo-128x128.png" alt="Logo" className="size-7 rounded-md shadow-sm" />
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">Notorious.PY</h1>
          </div>
        </div>

        {!minimal && (
          <div className="col-start-2 flex items-center justify-center gap-2.5">
            <div className="flex items-center rounded-lg border border-border/40 bg-card/85 p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Annuler (Ctrl+Z)"
                title="Annuler (Ctrl+Z)"
                className="h-8 w-8 rounded-md"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <div className="mx-0.5 h-5 w-px bg-border/40" />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Rétablir (Ctrl+Shift+Z)"
                title="Rétablir (Ctrl+Shift+Z)"
                className="h-8 w-8 rounded-md"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center rounded-lg border border-border/40 bg-card/85 p-0.5 shadow-sm">
              <Button
                onClick={() => isGuest ? setAuthPromptFeature('L\'exportation du code') : setIsExportModalOpen(true)}
                data-export-button
                className={`h-8 rounded-md bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-3 text-[11px] font-semibold text-white shadow-sm transition-all hover:brightness-110 ${isGuest ? 'opacity-80' : ''}`}
                title="Exporter le code"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Exporter
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!activeProjectId) return;
                  if (isGuest) {
                    setAuthPromptFeature('L\'historique des versions');
                  } else {
                    setIsVersionModalOpen(true);
                  }
                }}
                disabled={!activeProjectId}
                className="h-8 rounded-md px-3 text-[11px] font-semibold text-foreground disabled:opacity-45"
                title="Historique des versions"
              >
                <History className="mr-1.5 h-4 w-4" />
                Historique
              </Button>
            </div>

            {viewMode === 'design' && (
              <div className="flex justify-center" data-preview-toggle>
                <ToggleGroup
                  type="single"
                  value={previewMode}
                  onValueChange={(value: 'edit' | 'preview') => value && setPreviewMode(value)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-card/85 p-0.5 shadow-sm"
                >
                  <ToggleGroupItem
                    value="edit"
                    className="h-8 rounded-md px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Édition
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="preview"
                    className="h-8 rounded-md px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Aperçu
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {viewMode === 'code' && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode('design');
                  setPreviewMode('edit');
                }}
                className="h-8 rounded-lg border border-border/40 bg-card/85 px-3 text-[11px] font-semibold text-foreground shadow-sm hover:bg-accent"
                title="Revenir en mode édition"
              >
                Édition
              </Button>
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
                className={`h-8 rounded-lg border border-border/40 bg-card/85 px-3 text-[11px] font-semibold text-foreground shadow-sm hover:bg-accent ${isGuest ? 'opacity-75' : ''}`}
                title="Voir le code depuis l'aperçu"
              >
                <Code className="mr-1.5 h-4 w-4" />
                Code
              </Button>
            )}

            <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-card/85 p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  window.dispatchEvent(new Event('dayanna:start-onboarding-tour'));
                }}
                className="h-8 w-8 rounded-md"
                title="Ouvrir le guide de demarrage"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsShortcutsOpen(true)}
                className="h-8 w-8 rounded-md"
                title="Raccourcis clavier (F1)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="col-start-3 flex items-center justify-end gap-2">
          {isGuest ? (
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth-page'))}
              className="flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-4 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(15,52,96,0.20)] transition-all hover:brightness-110"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </Button>
          ) : (
            <>
              <DropdownMenuUserMenu07
                email={email}
                displayName={displayName}
                initials={initials}
                avatarUrl={avatarUrl}
                onOpenProfile={() => onOpenProfile?.()}
                onOpenSettings={() => onOpenSettings?.()}
                onSignOut={signOut}
              />
              <NotificationsFilter />
            </>
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
