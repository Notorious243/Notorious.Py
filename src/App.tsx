import { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Index } from '@/pages/Index';
import { Toaster } from '@/components/ui/sonner';
import { PythonLoadingScreen } from '@/components/ui/PythonLoadingScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const WelcomePage = lazy(() => import('@/components/auth/WelcomePage').then(m => ({ default: m.WelcomePage })));

const SharedProjectView = lazy(() => import('@/pages/SharedProjectView'));


function getShareToken(): string | null {
  const match = window.location.pathname.match(/^\/shared\/([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

function AppInner() {
  const shareToken = getShareToken();
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(() =>
    localStorage.getItem('gui_builder_new_user') === 'true'
  );
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Detect PASSWORD_RECOVERY event from Supabase (user clicked reset link in email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Listen for open-auth-page event from any component (TopBar, AuthPromptDialog, etc.)
  useEffect(() => {
    const handler = () => setShowAuthPage(true);
    window.addEventListener('open-auth-page', handler);
    return () => window.removeEventListener('open-auth-page', handler);
  }, []);

  // When user logs in, close the auth page overlay
  useEffect(() => {
    if (user) setShowAuthPage(false);
  }, [user]);

  const handleContinue = () => {
    localStorage.removeItem('gui_builder_new_user');
    setShowWelcome(false);
  };

  if (loading) {
    return <PythonLoadingScreen variant="auth" title="Connexion en cours..." subtitle="Verification de votre session securisee" />;
  }

  if (shareToken) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PythonLoadingScreen variant="shared" title="Chargement du projet partage..." subtitle="Recuperation des donnees de lecture seule" />}>
          <SharedProjectView shareToken={shareToken} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
        <Suspense fallback={<PythonLoadingScreen variant="project" title="Chargement de Notorious.PY..." subtitle="Initialisation du workspace et des outils IA" />}>
          {isPasswordRecovery ? (
            <AuthPage onNewUser={() => {}} forceResetPassword onResetComplete={() => setIsPasswordRecovery(false)} />
          ) : user ? (
            showWelcome ? (
              <WelcomePage onContinue={handleContinue} />
            ) : (
              <Index />
            )
          ) : showAuthPage ? (
            <AuthPage
              onNewUser={() => setShowWelcome(true)}
              onBackToCanvas={() => setShowAuthPage(false)}
            />
          ) : (
            <Index />
          )}
        </Suspense>
        <Toaster richColors />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
