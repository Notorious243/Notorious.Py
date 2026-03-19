import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Lock, AtSign, User, Zap, MousePointerClick, Code2, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Logo component ──────────────────────────────────────────────────────────
const AppLogo = ({ size = 'md' }: { size?: 'md' | 'lg' }) => (
  <img src="/logo-512x512.png" alt="Notorious Py" className={`${size === 'lg' ? 'w-14 h-14' : 'w-11 h-11'} rounded-xl`} />
);

// ── Mock Browser Illustration ───────────────────────────────────────────────
const MockBrowser = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className="rounded-xl overflow-hidden shadow-xl border border-indigo-300/30 bg-white/90 backdrop-blur-sm"
  >
    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200/80">
      {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c, i) => (
        <motion.span
          key={c}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.1 + i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
          className={`w-2.5 h-2.5 rounded-full ${c}`}
        />
      ))}
    </div>
    <div className="p-4 space-y-2.5">
      {["w-3/5", "w-4/5", "w-2/5", "w-full"].map((w, i) => (
        <motion.div
          key={w + i}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.2 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`h-3 ${w} rounded-full ${i === 3 ? 'bg-indigo-300/40 h-4 mt-1' : i % 2 === 0 ? 'bg-indigo-200/70' : 'bg-indigo-100/70'}`}
        />
      ))}
    </div>
  </motion.div>
);

// ── Floating animation for blobs ─────────────────────────────────────────────
const floatAnimation = {
  y: [0, -18, 0, 12, 0],
  x: [0, 10, -8, 5, 0],
  transition: { duration: 12, repeat: Infinity, ease: "easeInOut" as const },
};

const floatAnimation2 = {
  y: [0, 14, -10, 8, 0],
  x: [0, -12, 6, -4, 0],
  transition: { duration: 15, repeat: Infinity, ease: "easeInOut" as const },
};

// ── Stagger children wrapper ─────────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// ── Alert banner ──────────────────────────────────────────────────────────────
const AlertBanner: React.FC<{ variant: 'error' | 'warning' | 'info'; children: React.ReactNode }> = ({ variant, children }) => {
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm leading-snug ${styles[variant]}`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
};

// ── Shared input component ──────────────────────────────────────────────────
const AuthInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon: React.ReactNode;
  showToggle?: boolean;
  rightLabel?: React.ReactNode;
}> = ({ label, type = 'text', value, onChange, placeholder, autoComplete, icon, showToggle, rightLabel }) => {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? 'text' : 'password') : type;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {rightLabel}
      </div>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
        />
        {showToggle && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Forgot Password form ────────────────────────────────────────────────────
const ForgotPasswordForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setError(error.message || 'Impossible d\'envoyer l\'e-mail de réinitialisation.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex flex-col items-center gap-4 py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center"
        >
          <CheckCircle className="w-9 h-9 text-blue-500" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">E-mail envoyé !</p>
          <p className="mt-1 text-sm text-slate-500 max-w-xs">
            Vérifiez votre boîte de réception à <strong className="text-slate-700">{email}</strong>. Cliquez sur le lien pour réinitialiser votre mot de passe.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex flex-col items-center text-center mb-2">
        <div className="w-16 h-16 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-center overflow-hidden mb-4 bg-white border border-slate-100">
          <AppLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mot de passe oublié</h2>
        <p className="mt-1.5 text-sm text-slate-500">Entrez votre e-mail pour recevoir un lien de réinitialisation.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Adresse e-mail" type="email" value={email} onChange={v => { setEmail(v); setError(''); }}
          placeholder="nom@exemple.com" autoComplete="email"
          icon={<AtSign className="w-4 h-4" />}
        />
      </motion.div>

      {error && <AlertBanner variant="error">{error}</AlertBanner>}

      <motion.button variants={staggerItem} type="submit" disabled={loading || !email}
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Envoi...' : 'Envoyer le lien'}
      </motion.button>

      <motion.p variants={staggerItem} className="text-center text-sm text-slate-500">
        <button type="button" onClick={onBack} className="text-indigo-600 font-bold hover:underline flex items-center gap-1.5 mx-auto">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </button>
      </motion.p>
    </motion.form>
  );
};

// ── Reset Password form (shown after clicking email link) ───────────────────
const ResetPasswordForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordErrors = getPasswordErrors(password);
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message || 'Impossible de mettre à jour le mot de passe.');
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex flex-col items-center gap-4 py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center"
        >
          <ShieldCheck className="w-9 h-9 text-emerald-500" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Mot de passe modifié !</p>
          <p className="mt-1 text-sm text-slate-500">Votre nouveau mot de passe est actif. Vous allez être redirigé.</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all"
        >
          Continuer
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex flex-col items-center text-center mb-2">
        <div className="w-16 h-16 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-center overflow-hidden mb-4 bg-white border border-slate-100">
          <AppLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nouveau mot de passe</h2>
        <p className="mt-1.5 text-sm text-slate-500">Choisissez un mot de passe sécurisé pour votre compte.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Nouveau mot de passe" value={password} onChange={v => { setPassword(v); setError(''); }}
          placeholder="8 caractères minimum" autoComplete="new-password" showToggle
          icon={<KeyRound className="w-4 h-4" />}
        />
        {password.length > 0 && <PasswordStrengthIndicator password={password} />}
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Confirmer le mot de passe" value={confirmPassword} onChange={v => { setConfirmPassword(v); setError(''); }}
          placeholder="Retapez le mot de passe" autoComplete="new-password" showToggle
          icon={<Lock className="w-4 h-4" />}
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="mt-1.5 text-xs text-red-500 font-medium">Les mots de passe ne correspondent pas.</p>
        )}
      </motion.div>

      {error && <AlertBanner variant="error">{error}</AlertBanner>}

      <motion.button variants={staggerItem} type="submit" disabled={loading || !isPasswordValid || !passwordsMatch}
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
      </motion.button>
    </motion.form>
  );
};

// ── Password strength utilities ─────────────────────────────────────────────
function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Au moins 8 caractères');
  if (!/[a-z]/.test(password)) errors.push('Une lettre minuscule');
  if (!/[A-Z]/.test(password)) errors.push('Une lettre majuscule');
  if (!/[0-9]/.test(password)) errors.push('Un chiffre');
  return errors;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const errors = getPasswordErrors(password);
  const passed = 4 - errors.length;
  if (passed <= 1) return { score: 25, label: 'Faible', color: 'bg-red-500' };
  if (passed === 2) return { score: 50, label: 'Moyen', color: 'bg-orange-500' };
  if (passed === 3) return { score: 75, label: 'Bon', color: 'bg-yellow-500' };
  return { score: 100, label: 'Fort', color: 'bg-emerald-500' };
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = getPasswordStrength(password);
  const errors = getPasswordErrors(password);
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full rounded-full ${strength.color}`}
          />
        </div>
        <span className={`text-xs font-semibold ${strength.score === 100 ? 'text-emerald-600' : strength.score >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
          {strength.label}
        </span>
      </div>
      {errors.length > 0 && (
        <ul className="space-y-0.5">
          {errors.map(err => (
            <li key={err} className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Sign In form ──────────────────────────────────────────────────────────────
const SignInForm: React.FC<{ onSwitch: () => void; onForgotPassword: () => void }> = ({ onSwitch, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message || 'Email ou mot de passe incorrect.');
    setLoading(false);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex flex-col items-center text-center mb-2">
        <div className="w-16 h-16 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-center overflow-hidden mb-4 bg-white border border-slate-100">
          <AppLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bon retour !</h2>
        <p className="mt-1.5 text-sm text-slate-500">Connectez-vous pour continuer à bâtir votre interface.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Adresse e-mail" type="email" value={email} onChange={v => { setEmail(v); setError(''); }}
          placeholder="nom@exemple.com" autoComplete="email"
          icon={<AtSign className="w-4 h-4" />}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Mot de passe" value={password} onChange={v => { setPassword(v); setError(''); }}
          placeholder="••••••••" autoComplete="current-password" showToggle
          icon={<Lock className="w-4 h-4" />}
          rightLabel={<button type="button" onClick={onForgotPassword} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">Oublié ?</button>}
        />
      </motion.div>

      <motion.label variants={staggerItem} className="flex items-center gap-2.5 cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
        />
        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Se souvenir de moi</span>
      </motion.label>

      {error && <AlertBanner variant="error">{error}</AlertBanner>}

      <motion.button variants={staggerItem} type="submit" disabled={loading || !email || !password}
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Connexion...' : 'Se connecter'}
      </motion.button>

      <motion.p variants={staggerItem} className="text-center text-sm text-slate-500">
        Vous n'avez pas de compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-indigo-600 font-bold hover:underline">S'inscrire gratuitement</button>
      </motion.p>
    </motion.form>
  );
};

// ── Sign Up form ──────────────────────────────────────────────────────────────
const SignUpForm: React.FC<{ onSwitch: () => void; onNewUser: () => void }> = ({ onSwitch, onNewUser }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordErrors = getPasswordErrors(password);
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message || "Erreur lors de la création du compte.");
    } else if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      // Supabase returns no error but empty identities when email already exists
      setError('Un compte existe déjà avec cette adresse e-mail. Essayez de vous connecter.');
    } else {
      localStorage.setItem('gui_builder_new_user', 'true');
      onNewUser();
      setStep('done');
    }
    setLoading(false);
  };

  if (step === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex flex-col items-center gap-4 py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center"
        >
          <CheckCircle className="w-9 h-9 text-emerald-500" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Compte créé !</p>
          <p className="mt-1 text-sm text-slate-500">Vérifiez votre e-mail pour confirmer votre inscription.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex flex-col items-center text-center mb-2">
        <div className="w-16 h-16 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-center overflow-hidden mb-4 bg-white border border-slate-100">
          <AppLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Créer un compte</h2>
        <p className="mt-1.5 text-sm text-slate-500">Inscrivez-vous pour commencer à construire vos interfaces.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Prénom" value={firstName} onChange={setFirstName}
          placeholder="Jean" autoComplete="given-name"
          icon={<User className="w-4 h-4" />}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Adresse e-mail" type="email" value={email} onChange={v => { setEmail(v); setError(''); }}
          placeholder="nom@exemple.com" autoComplete="email"
          icon={<AtSign className="w-4 h-4" />}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <AuthInput label="Mot de passe" value={password} onChange={v => { setPassword(v); setError(''); }}
          placeholder="8 caractères minimum" autoComplete="new-password" showToggle
          icon={<Lock className="w-4 h-4" />}
        />
        {password.length > 0 && <PasswordStrengthIndicator password={password} />}
      </motion.div>

      {error && <AlertBanner variant="error">{error}</AlertBanner>}

      <motion.button variants={staggerItem} type="submit" disabled={loading || !email || !isPasswordValid || !firstName}
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Création...' : "Créer mon compte"}
      </motion.button>

      <motion.p variants={staggerItem} className="text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-indigo-600 font-bold hover:underline">Se connecter</button>
      </motion.p>
    </motion.form>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
export const AuthPage: React.FC<{ onNewUser: () => void; forceResetPassword?: boolean; onResetComplete?: () => void }> = ({ onNewUser, forceResetPassword, onResetComplete }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(
    forceResetPassword ? 'reset' : 'signin'
  );

  // Update mode if forceResetPassword changes (e.g. from App.tsx detecting PASSWORD_RECOVERY)
  useEffect(() => {
    if (forceResetPassword) setMode('reset');
  }, [forceResetPassword]);

  const handleResetDone = () => {
    setMode('signin');
    onResetComplete?.();
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">

      {/* ─── Left Panel (Illustration) ─── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full md:w-[45%] flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #EBF0F7 0%, #D5E1EE 30%, #C0D5EA 60%, #DBE7F5 100%)',
        }}
      >
        {/* Decorative blobs (floating) */}
        <motion.div
          animate={floatAnimation}
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #A1BDE0, transparent 70%)' }}
        />
        <motion.div
          animate={floatAnimation2}
          className="absolute -bottom-28 -left-28 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #A8C0DC, transparent 70%)' }}
        />

        {/* Top: Logo + brand */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 rounded-2xl shadow-lg shadow-indigo-300/30 flex items-center justify-center overflow-hidden bg-white/90 backdrop-blur-sm"
            >
              <AppLogo />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-xl font-bold text-slate-800 tracking-tight"
            >
              Notorious Py
            </motion.span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold leading-tight tracking-tight text-slate-800"
          >
            Le builder visuel{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              pour vos apps Python.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-4 text-[15px] leading-relaxed text-slate-600/90 max-w-sm"
          >
            Glissez, déposez, personnalisez. Votre interface CustomTkinter est prête en quelques clics.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 space-y-3"
          >
            {[
              { icon: MousePointerClick, text: 'Drag & drop intuitif', color: 'text-indigo-600 bg-indigo-100' },
              { icon: Code2, text: 'Code Python généré automatiquement', color: 'text-indigo-500 bg-indigo-50' },
              { icon: Zap, text: 'Export instantané en .py + .zip', color: 'text-indigo-400 bg-indigo-50' },
            ].map(({ icon: Icon, text, color }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.12, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom: Mock Browser */}
        <div className="relative z-10 mt-10 md:mt-0 max-w-[380px]">
          <MockBrowser />
        </div>
      </motion.div>

      {/* ─── Right Panel (Form) ─── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full md:w-[55%] flex flex-col justify-between bg-white p-8 md:px-16 md:py-12 lg:px-20 lg:py-14"
      >
        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            {mode === 'signin' && (
              <motion.div key="signin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <SignInForm onSwitch={() => setMode('signup')} onForgotPassword={() => setMode('forgot')} />
              </motion.div>
            )}
            {mode === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <SignUpForm onSwitch={() => setMode('signin')} onNewUser={onNewUser} />
              </motion.div>
            )}
            {mode === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <ForgotPasswordForm onBack={() => setMode('signin')} />
              </motion.div>
            )}
            {mode === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <ResetPasswordForm onDone={handleResetDone} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 pt-5 border-t border-slate-100"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-400">
            <span>© 2026 Notorious Py</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Confidentialité</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Conditions</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Documentation</span>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
};
