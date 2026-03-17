import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useTheme } from 'next-themes';
import { TopBar } from '@/components/builder/TopBar';
import { WidgetSidebar } from '@/components/builder/WidgetSidebar';
import { Canvas } from '@/components/builder/Canvas';
import { RightSidebar } from '@/components/builder/RightSidebar';
import { WidgetProvider, useWidgets } from '@/contexts/WidgetContext';
import { DragProvider } from '@/contexts/DragContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose, Lock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FileSystemProvider } from '@/hooks/useFileSystem';
import { ProjectProvider, useProjects } from '@/contexts/ProjectContext';
const WelcomeScreen = lazy(() => import('@/components/builder/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));

// Lazy load des composants lourds non critiques
const CodeView = lazy(() => import('@/components/builder/CodeView'));
const OnboardingTour = lazy(() => import('@/components/builder/OnboardingTour'));

const AppLayout: React.FC<{ isNoProject?: boolean }> = ({ isNoProject }) => {
  const { resolvedTheme } = useTheme();
  const { viewMode, previewMode, setViewMode, setPreviewMode } = useWidgets();
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const { projects } = useProjects();
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  // Listen for Home button click from TopBar — only open when projects exist (otherwise stay on Canvas)
  useEffect(() => {
    const handler = () => {
      if (projectsRef.current.length > 0) {
        setShowWelcomeOverlay(true);
      }
    };
    window.addEventListener('open-projects-modal', handler);
    return () => window.removeEventListener('open-projects-modal', handler);
  }, []);

  // Auto-close the WelcomeScreen overlay when all projects are deleted
  useEffect(() => {
    if (showWelcomeOverlay && projects.length === 0) {
      setShowWelcomeOverlay(false);
    }
  }, [showWelcomeOverlay, projects.length]);

  // Ne lancer le tour qu'après création/ouverture d'un projet
  const shouldStartOnboarding = isFirstTime && !isNoProject;

  // Détecter si c'est la toute première visite (jamais vu le onboarding)
  useEffect(() => {
    try {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setIsFirstTime(true);
      }
    } catch { /* localStorage unavailable */ }

    // Responsive : fermer les panels sur petit écran
    const checkResponsive = () => {
      if (window.innerWidth < 1024 && !shouldStartOnboarding) {
        setIsLeftPanelOpen(false);
        setIsRightPanelOpen(false);
      } else {
        setIsLeftPanelOpen(true);
        setIsRightPanelOpen(true);
      }
    };

    // Check initial
    checkResponsive();

    // Ecouter le resize
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, [shouldStartOnboarding]);

  // Marquer le onboarding comme vu
  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem('hasSeenOnboarding', 'true');
    } catch { /* ignore */ }
    setIsFirstTime(false);
  };

  // Quand le premier projet est créé et le onboarding n'a jamais été vu, on lance le tour
  useEffect(() => {
    if (isNoProject) return;
    try {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setIsFirstTime(true);
      }
    } catch { /* localStorage unavailable */ }
  }, [isNoProject]);

  useEffect(() => {
    if (!shouldStartOnboarding) return;

    // Assure une vue guidée visible et immersive
    setViewMode('design');
    setPreviewMode('edit');
    setIsLeftPanelOpen(true);
    setIsRightPanelOpen(true);
  }, [shouldStartOnboarding, setPreviewMode, setViewMode]);

  // Check if any file exists (from context)
  const { hasFiles } = useFileSystem();

  // En mode preview, cacher les panels
  const shouldShowPanels = previewMode !== 'preview';

  const darkThemeStyle: React.CSSProperties = {
    background: `
      radial-gradient(circle at 14% 16%, rgba(15, 52, 96, 0.12), transparent 34%),
      radial-gradient(circle at 82% 78%, rgba(15, 52, 96, 0.12), transparent 38%),
      linear-gradient(145deg, #060b14 0%, #0a1020 46%, #0d1327 100%)
    `,
  };

  const lightThemeStyle: React.CSSProperties = {
    background: `
      radial-gradient(circle at 18% 12%, rgba(15, 52, 96, 0.1), transparent 36%),
      radial-gradient(circle at 78% 82%, rgba(15, 52, 96, 0.08), transparent 34%),
      linear-gradient(135deg, #EBF0F7 0%, #D5E1EE 46%, #e8f0fa 100%)
    `,
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-background text-foreground transition-all duration-500 ease-in-out"
      style={resolvedTheme === 'dark' ? darkThemeStyle : lightThemeStyle}
    >
      {!showWelcomeOverlay && (
        <div className="relative z-[80] flex-shrink-0">
          <TopBar minimal={!hasFiles || isNoProject} />
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Widget Sidebar */}
        <div
          className="widget-sidebar relative transition-all duration-300 ease-in-out border-r border-slate-300/80 dark:border-slate-700/70 shadow-[4px_0_16px_rgba(15,23,42,0.06)] dark:shadow-[6px_0_18px_rgba(2,8,23,0.4)]"
          style={{
            width: shouldShowPanels && isLeftPanelOpen ? '280px' : '0px',
            minWidth: shouldShowPanels && isLeftPanelOpen ? '280px' : '0px',
            overflow: 'hidden'
          }}
        >
          <WidgetSidebar />
          {isNoProject && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/85 backdrop-blur-[1px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 shadow-inner">
                <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center px-4">Créez un projet pour débloquer</p>
            </div>
          )}
        </div>

        {/* Toggle Button Left Panel */}
        {shouldShowPanels && !showWelcomeOverlay && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-r-md rounded-l-none border-l-0 border-slate-300/90 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800 shadow-lg dark:shadow-[0_10px_28px_rgba(2,8,23,0.5)] hover:w-8 transition-all"
            style={{
              left: isLeftPanelOpen ? '280px' : '0px',
              transition: 'left 0.3s ease-in-out, width 0.2s ease-in-out'
            }}
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            title={isLeftPanelOpen ? 'Masquer les widgets' : 'Afficher les widgets'}
          >
            {isLeftPanelOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Center Panel - Canvas or Code */}
        <div className="canvas-container flex-1 overflow-hidden relative border-x border-slate-300/65 dark:border-slate-700/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(248,251,255,0.92))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.46),rgba(10,16,28,0.68))]">
          <ErrorBoundary>
            {viewMode === 'design' ? (
              <Canvas />
            ) : (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <CodeView />
              </Suspense>
            )}
          </ErrorBoundary>
        </div>

        {/* Toggle Button Right Panel */}
        {shouldShowPanels && !showWelcomeOverlay && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-l-md rounded-r-none border-r-0 border-slate-300/90 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800 shadow-lg dark:shadow-[0_10px_28px_rgba(2,8,23,0.5)] hover:w-8 transition-all"
            style={{
              right: isRightPanelOpen ? '320px' : '0px',
              transition: 'right 0.3s ease-in-out, width 0.2s ease-in-out'
            }}
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            title={isRightPanelOpen ? 'Masquer les propriétés' : 'Afficher les propriétés'}
          >
            {isRightPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Right Panel - Properties Sidebar */}
        <div
          className="properties-panel-container relative transition-all duration-300 ease-in-out border-l border-slate-300/80 dark:border-slate-700/70 shadow-[-4px_0_16px_rgba(15,23,42,0.06)] dark:shadow-[-6px_0_18px_rgba(2,8,23,0.4)]"
          style={{
            width: shouldShowPanels && isRightPanelOpen ? '320px' : '0px',
            minWidth: shouldShowPanels && isRightPanelOpen ? '320px' : '0px',
            overflow: 'hidden'
          }}
        >
          <RightSidebar />
          {(!hasFiles || isNoProject) && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/85 backdrop-blur-[1px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 shadow-inner">
                <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center px-4">{isNoProject ? 'Créez un projet pour débloquer' : 'Créez un fichier .py'}</p>
            </div>
          )}
        </div>
      </main>

      {/* WelcomeScreen full-page overlay (triggered by Home button) */}
      {showWelcomeOverlay && (
        <Suspense fallback={null}>
          <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
            <WelcomeScreen onClose={() => setShowWelcomeOverlay(false)} />
          </div>
        </Suspense>
      )}

      {/* Onboarding Tour */}
      <Suspense fallback={null}>
        <OnboardingTour isFirstTime={shouldStartOnboarding} onComplete={handleOnboardingComplete} />
      </Suspense>
    </div>
  );
};

export const Index: React.FC = () => {
  return (
    <ProjectProvider>
      <ProjectAwareApp />
    </ProjectProvider>
  );
};

const ProjectAwareApp: React.FC = () => {
  const { activeProjectId, loading } = useProjects();
  const isNoProject = !activeProjectId;

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <DragProvider>
      <WidgetProvider key={activeProjectId ?? 'no-project'}>
        <FileSystemProvider projectId={activeProjectId}>
          <div className="relative h-screen w-screen overflow-hidden">
            <AppLayout isNoProject={isNoProject} />
          </div>
        </FileSystemProvider>
      </WidgetProvider>
    </DragProvider>
  );
};
