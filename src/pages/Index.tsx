import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useFileSystem } from '@/hooks/useFileSystemContext';
import { TopBar } from '@/components/builder/TopBar';
import { WidgetSidebar } from '@/components/builder/WidgetSidebar';
import { Canvas } from '@/components/builder/Canvas';
import { RightSidebar } from '@/components/builder/RightSidebar';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { useWidgets } from '@/contexts/useWidgets';
import { DragProvider } from '@/contexts/DragContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose, Lock, Monitor } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FileSystemProvider } from '@/hooks/useFileSystem';
import { GridAnimation } from '@/components/ui/grid-animation';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { useProjects } from '@/contexts/useProjects';
import { OPEN_AI_WORKSPACE_PANELS_EVENT } from '@/lib/aiSidebar';
import { PythonLoadingScreen } from '@/components/ui/PythonLoadingScreen';
const WelcomeScreen = lazy(() => import('@/components/builder/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));

// Lazy load des composants lourds non critiques
const CodeView = lazy(() => import('@/components/builder/CodeView'));
const OnboardingTour = lazy(() => import('@/components/builder/OnboardingTour'));

const AppLayout: React.FC<{ isNoProject?: boolean }> = ({ isNoProject }) => {
  const { viewMode, previewMode, setViewMode, setPreviewMode } = useWidgets();
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<'properties' | 'ai'>('properties');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mobileBannerDismissed, setMobileBannerDismissed] = useState(false);
  const [isTopBarHovered, setIsTopBarHovered] = useState(false);
  const topBarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PROPERTIES_PANEL_WIDTH = 280;
  const AI_PANEL_WIDTH = 340;
  const rightPanelWidth = rightSidebarTab === 'ai' ? AI_PANEL_WIDTH : PROPERTIES_PANEL_WIDTH;
  const { projects } = useProjects();
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  // Listen for Home button click from TopBar — always open (allows project creation even with 0 projects)
  useEffect(() => {
    const handler = () => {
      setShowWelcomeOverlay(true);
    };
    window.addEventListener('open-projects-modal', handler);
    return () => window.removeEventListener('open-projects-modal', handler);
  }, []);

  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: 'properties' | 'ai' }>;
      const tab = customEvent.detail?.tab;
      if (tab === 'properties' || tab === 'ai') {
        setRightSidebarTab(tab);
      }
    };

    window.addEventListener('right-sidebar-tab-change', handleTabChange);
    return () => window.removeEventListener('right-sidebar-tab-change', handleTabChange);
  }, []);

  useEffect(() => {
    const handleOpenPanelsForAI = () => {
      if (isNoProject) return;
      setIsLeftPanelOpen(true);
      setIsRightPanelOpen(true);
    };

    window.addEventListener(OPEN_AI_WORKSPACE_PANELS_EVENT, handleOpenPanelsForAI);
    return () => window.removeEventListener(OPEN_AI_WORKSPACE_PANELS_EVENT, handleOpenPanelsForAI);
  }, [isNoProject]);

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

    // Responsive : fermer les panels sur petit écran réel (screen.width = taille physique)
    const checkResponsive = () => {
      const realWidth = window.screen.width;
      const isSmall = realWidth < 1024;
      setIsMobileDevice(isSmall);
      if (isSmall && !shouldStartOnboarding) {
        setIsLeftPanelOpen(false);
        setIsRightPanelOpen(false);
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

  const workspaceStyle: React.CSSProperties = {
    background: `
      radial-gradient(circle at 14% 14%, rgba(15, 52, 96, 0.10), transparent 34%),
      radial-gradient(circle at 88% 24%, rgba(31, 90, 160, 0.08), transparent 38%),
      radial-gradient(circle at 72% 84%, rgba(15, 52, 96, 0.06), transparent 32%),
      linear-gradient(135deg, #ebf0f7 0%, #d8e3ef 46%, #eaf1fa 100%)
    `,
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-background text-foreground transition-all duration-500 ease-in-out"
      style={workspaceStyle}
    >
      {!showWelcomeOverlay && previewMode !== 'preview' && (
        <div className="relative z-[80] flex-shrink-0">
          <TopBar minimal={!hasFiles || isNoProject} />
        </div>
      )}

      {/* TopBar hover zone in preview mode */}
      {!showWelcomeOverlay && previewMode === 'preview' && (
        <>
          {/* Invisible hover trigger zone at top of screen */}
          <div
            className="fixed inset-x-0 top-0 z-[90] h-5"
            onMouseEnter={() => {
              if (topBarTimeoutRef.current) clearTimeout(topBarTimeoutRef.current);
              setIsTopBarHovered(true);
            }}
          />
          {/* Sliding TopBar */}
          <div
            className={`fixed inset-x-0 top-0 z-[85] transition-all duration-300 ease-in-out ${
              isTopBarHovered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
            onMouseEnter={() => {
              if (topBarTimeoutRef.current) clearTimeout(topBarTimeoutRef.current);
              setIsTopBarHovered(true);
            }}
            onMouseLeave={() => {
              topBarTimeoutRef.current = setTimeout(() => setIsTopBarHovered(false), 400);
            }}
          >
            <div className="bg-card/95 shadow-lg backdrop-blur-md border-b border-border">
              <TopBar minimal={!hasFiles || isNoProject} />
            </div>
          </div>
        </>
      )}

      <main className="flex flex-1 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <GridAnimation
            spacing={28}
            strokeLength={10}
            strokeWidth={0.8}
            fillParent
            className="pointer-events-auto opacity-70"
          />
        </div>
        {/* Left Panel - Widget Sidebar */}
        <div
          className="widget-sidebar relative z-10 transition-all duration-300 ease-in-out border-r border-slate-300/70 bg-[#F7F9FC] shadow-[inset_-1px_0_0_rgba(255,255,255,0.92),12px_0_35px_rgba(15,23,42,0.06)]"
          style={{
            width: shouldShowPanels && isLeftPanelOpen ? '260px' : '0px',
            minWidth: shouldShowPanels && isLeftPanelOpen ? '260px' : '0px',
            overflow: 'hidden'
          }}
        >
          <WidgetSidebar />
          {isNoProject && (
            <div
              className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center bg-[#F7F9FC]/90 transition-colors hover:bg-[#F7F9FC]"
              onClick={() => setShowWelcomeOverlay(true)}
            >
              <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-slate-100 shadow-inner">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-slate-500 text-center px-4">Créez un projet pour débloquer</p>
            </div>
          )}
        </div>

        {/* Toggle Button Left Panel */}
        {shouldShowPanels && !showWelcomeOverlay && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 z-50 h-12 w-7 -translate-y-1/2 rounded-l-none rounded-r-xl border border-l-0 border-slate-300/80 bg-white/92 shadow-lg backdrop-blur-md transition-all hover:w-9"
            style={{
              left: isLeftPanelOpen ? '260px' : '0px',
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
        <div className="canvas-container relative z-10 flex-1 overflow-hidden border-x border-slate-300/60">
          <ErrorBoundary>
            {viewMode === 'design' ? (
              <Canvas />
            ) : (
              <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>}>
                <CodeView />
              </Suspense>
            )}
          </ErrorBoundary>

          {/* Mobile device warning — shown on the canvas */}
          {isMobileDevice && !mobileBannerDismissed && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-4">
              <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#1F5AA0]/25 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,52,96,0.22)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F5AA0]/12">
                    <Monitor className="w-5 h-5 text-[#0F3460]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 mb-1">Optimisé pour les grands écrans</p>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      <strong className="text-[#0F3460]">Notorious.PY</strong> est un outil de bureau.
                      Pour une meilleure expérience, utilisez un ordinateur.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileBannerDismissed(true)}
                  className="mt-3 w-full h-9 rounded-xl border border-[#1F5AA0]/25 bg-[#1F5AA0]/10 text-[#0F3460] text-xs font-semibold hover:bg-[#1F5AA0]/20 transition-colors"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button Right Panel */}
        {shouldShowPanels && !showWelcomeOverlay && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 z-50 h-12 w-7 -translate-y-1/2 rounded-l-xl rounded-r-none border border-r-0 border-slate-300/80 bg-white/92 shadow-lg backdrop-blur-md transition-all hover:w-9"
            style={{
              right: isRightPanelOpen ? `${rightPanelWidth}px` : '0px',
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
          className="properties-panel-container relative z-10 transition-all duration-300 ease-in-out border-l border-slate-300/70 bg-[#F7F9FC] shadow-[inset_1px_0_0_rgba(255,255,255,0.92),-12px_0_35px_rgba(15,23,42,0.06)]"
          style={{
            width: shouldShowPanels && isRightPanelOpen ? `${rightPanelWidth}px` : '0px',
            minWidth: shouldShowPanels && isRightPanelOpen ? `${rightPanelWidth}px` : '0px',
            overflow: 'hidden'
          }}
        >
          <RightSidebar />
          {isNoProject && (
            <div
              className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center bg-[#F7F9FC]/90 transition-colors hover:bg-[#F7F9FC]"
              onClick={() => setShowWelcomeOverlay(true)}
            >
              <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-slate-100 shadow-inner">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-slate-500 text-center px-4">Créez un projet pour débloquer</p>
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
      <PythonLoadingScreen
        variant="project"
        title="Chargement du projet..."
        subtitle="Preparation du canvas, des fichiers et des widgets"
      />
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
