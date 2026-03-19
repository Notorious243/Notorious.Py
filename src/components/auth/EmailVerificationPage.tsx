import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MailCheck, RefreshCw, LogOut, Loader2 } from 'lucide-react';

interface EmailVerificationPageProps {
  onVerified: () => void;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ onVerified }) => {
  const { user, signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Poll for email confirmation every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser?.email_confirmed_at) {
        onVerified();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [onVerified]);

  // Also listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        onVerified();
      }
    });
    return () => subscription.unsubscribe();
  }, [onVerified]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!user?.email || cooldown > 0) return;
    setResending(true);
    setResent(false);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (!error) {
      setResent(true);
      setCooldown(60);
    }
  }, [user?.email, cooldown]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-100 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6"
        >
          <MailCheck className="w-10 h-10 text-indigo-500" />
        </motion.div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Vérifiez votre e-mail
        </h2>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed">
          Nous avons envoyé un lien de vérification à{' '}
          <strong className="text-slate-700">{user?.email}</strong>.
          <br />
          Cliquez dessus pour activer votre compte.
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Renvoyer dans {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Renvoyer l'e-mail
              </>
            )}
          </button>

          <button
            onClick={signOut}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>

        {resent && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-xs text-emerald-600 font-medium"
          >
            E-mail envoyé avec succès !
          </motion.p>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Vérifiez aussi vos spams si vous ne trouvez pas l'e-mail.
        </p>
      </motion.div>
    </div>
  );
};
