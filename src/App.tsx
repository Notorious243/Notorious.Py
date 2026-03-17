import { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Index } from '@/pages/Index';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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

  // Detect PASSWORD_RECOVERY event from Supabase (user clicked reset link in email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
          ) : (
            <AuthPage onNewUser={() => setShowWelcome(true)} />
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
