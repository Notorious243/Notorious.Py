import { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Index } from '@/pages/Index';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MobileBlocker } from '@/components/MobileBlocker';
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const WelcomePage = lazy(() => import('@/components/auth/WelcomePage').then(m => ({ default: m.WelcomePage })));
const EmailVerificationPage = lazy(() => import('@/components/auth/EmailVerificationPage').then(m => ({ default: m.EmailVerificationPage })));
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
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (shareToken) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-zinc-950"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <SharedProjectView shareToken={shareToken} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          {isPasswordRecovery ? (
            <AuthPage onNewUser={() => {}} forceResetPassword onResetComplete={() => setIsPasswordRecovery(false)} />
          ) : user ? (
            !user.email_confirmed_at ? (
              <EmailVerificationPage onVerified={() => window.location.reload()} />
            ) : showWelcome ? (
              <WelcomePage onContinue={handleContinue} />
            ) : (
              <Index />
            )
          ) : showAuthPage ? (
            <div className="relative">
              <button
                onClick={() => setShowAuthPage(false)}
                className="absolute top-5 left-5 z-50 flex items-center gap-2 h-10 px-5 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300 shadow-md backdrop-blur-md transition-all duration-200 text-sm font-semibold"
              >
                ← Retour au canvas
              </button>
              <AuthPage onNewUser={() => setShowWelcome(true)} />
            </div>
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
      <MobileBlocker />
      <AppInner />
    </AuthProvider>
  );
}

export default App;
