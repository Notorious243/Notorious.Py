import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { ArrowRight, Sparkles, Code2, Layers, MousePointerClick } from 'lucide-react';

// ── SVG Illustration ──────────────────────────────────────────────────────────
const BuilderIllustration: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[420px]">
    <defs>
      <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={isDark ? '#0C2B52' : '#EBF0F7'} />
        <stop offset="100%" stopColor={isDark ? '#071A37' : '#D5E1EE'} />
      </linearGradient>
      <linearGradient id="window-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isDark ? '#1e293b' : '#ffffff'} />
        <stop offset="100%" stopColor={isDark ? '#0f172a' : '#f8fafc'} />
      </linearGradient>
      <linearGradient id="btn-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0F3460" />
        <stop offset="100%" stopColor="#1C4E82" />
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0F3460" />
        <stop offset="100%" stopColor="#1F5AA0" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor={isDark ? '#000000' : '#1e3a5f'} floodOpacity="0.25" />
      </filter>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Background blob */}
    <ellipse cx="240" cy="200" rx="220" ry="160" fill="url(#bg-grad)" opacity="0.5" />

    {/* Floating particles */}
    {[
      [60, 60, 5], [420, 80, 4], [380, 300, 6], [40, 280, 4],
      [200, 30, 3], [460, 200, 5], [100, 330, 4],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#1F5AA0" opacity={isDark ? 0.4 : 0.3}>
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
      </circle>
    ))}

    {/* Connector lines */}
    <line x1="80" y1="90" x2="150" y2="130" stroke="#1F5AA0" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
    <line x1="400" y1="110" x2="330" y2="140" stroke="#153E6E" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
    <line x1="90" y1="270" x2="160" y2="240" stroke="#1F5AA0" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

    {/* Main window */}
    <rect x="90" y="80" width="300" height="210" rx="14" fill="url(#window-grad)" filter="url(#shadow)" />

    {/* Titlebar */}
    <rect x="90" y="80" width="300" height="36" rx="14" fill={isDark ? '#1e293b' : '#f1f5f9'} />
    <rect x="90" y="100" width="300" height="16" fill={isDark ? '#1e293b' : '#f1f5f9'} />
    {/* Window dots */}
    <circle cx="112" cy="98" r="5" fill="#ef4444" />
    <circle cx="128" cy="98" r="5" fill="#f59e0b" />
    <circle cx="144" cy="98" r="5" fill="#22c55e" />
    {/* Title */}
    <rect x="190" y="93" width="80" height="9" rx="4" fill={isDark ? '#334155' : '#cbd5e1'} />

    {/* Sidebar panel */}
    <rect x="90" y="116" width="64" height="174" fill={isDark ? '#0f172a' : '#f8fafc'} />
    <line x1="154" y1="116" x2="154" y2="290" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />

    {/* Sidebar items */}
    {[130, 156, 182, 208, 234, 260].map((y, i) => (
      <g key={i}>
        <rect x="100" y={y} width="10" height="10" rx="2" fill={i === 2 ? '#0F3460' : (isDark ? '#334155' : '#cbd5e1')} />
        <rect x="116" y={y + 1} width="28" height="7" rx="3" fill={i === 2 ? '#0F3460' : (isDark ? '#334155' : '#e2e8f0')} opacity={i === 2 ? 1 : 0.6} />
      </g>
    ))}

    {/* Canvas area */}
    <rect x="158" y="120" width="228" height="166" rx="4" fill={isDark ? '#0d1829' : '#ffffff'} />

    {/* Grid dots on canvas */}
    {Array.from({ length: 7 }, (_, col) =>
      Array.from({ length: 5 }, (_, row) => (
        <circle
          key={`${col}-${row}`}
          cx={174 + col * 30}
          cy={138 + row * 30}
          r="1.2"
          fill={isDark ? '#1e3a5f' : '#e2e8f0'}
        />
      ))
    )}

    {/* Widget: Label */}
    <rect x="172" y="134" width="80" height="18" rx="4" fill={isDark ? '#1e293b' : '#f1f5f9'} />
    <rect x="178" y="140" width="48" height="6" rx="3" fill={isDark ? '#475569' : '#94a3b8'} />

    {/* Widget: Entry field */}
    <rect x="172" y="162" width="110" height="22" rx="5" fill={isDark ? '#0f172a' : '#ffffff'} stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1.5" />
    <rect x="180" y="170" width="60" height="6" rx="3" fill={isDark ? '#334155' : '#cbd5e1'} />
    <line x1="244" y1="163" x2="244" y2="183" stroke="#1F5AA0" strokeWidth="1.5" opacity="0.7">
      <animate attributeName="opacity" values="0;1;0" dur="1.1s" repeatCount="indefinite" />
    </line>

    {/* Widget: Button (gradient) */}
    <rect x="172" y="196" width="100" height="26" rx="6" fill="url(#btn-grad)" filter="url(#glow)" />
    <rect x="192" y="206" width="60" height="7" rx="3" fill="white" opacity="0.9" />

    {/* Widget: Slider */}
    <rect x="172" y="236" width="100" height="4" rx="2" fill={isDark ? '#1e3a5f' : '#bfdbfe'} />
    <rect x="172" y="236" width="60" height="4" rx="2" fill="url(#btn-grad)" />
    <circle cx="232" cy="238" r="6" fill="white" stroke="#0F3460" strokeWidth="2" filter="url(#glow)" />

    {/* Widget: Progress bar */}
    <rect x="172" y="260" width="100" height="6" rx="3" fill={isDark ? '#1e293b' : '#e0e7ff'} />
    <rect x="172" y="260" width="70" height="6" rx="3" fill="url(#accent)" />

    {/* Floating badge top-right */}
    <rect x="316" y="128" width="56" height="22" rx="11" fill="url(#accent)" filter="url(#shadow)" opacity="0.95">
      <animate attributeName="y" values="128;122;128" dur="3s" repeatCount="indefinite" />
    </rect>
    <rect x="324" y="135" width="40" height="7" rx="3" fill="white" opacity="0.9">
      <animate attributeName="y" values="135;129;135" dur="3s" repeatCount="indefinite" />
    </rect>

    {/* Floating code card */}
    <rect x="60" y="160" width="76" height="54" rx="8" fill={isDark ? '#1e293b' : '#ffffff'} filter="url(#shadow)" opacity="0.9">
      <animate attributeName="y" values="160;154;160" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="70" y="172" width="55" height="5" rx="2" fill="#0F3460" opacity="0.8">
      <animate attributeName="y" values="172;166;172" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="70" y="183" width="40" height="5" rx="2" fill={isDark ? '#334155' : '#cbd5e1'}>
      <animate attributeName="y" values="183;177;183" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="70" y="194" width="48" height="5" rx="2" fill={isDark ? '#334155' : '#e2e8f0'}>
      <animate attributeName="y" values="194;188;194" dur="4s" repeatCount="indefinite" />
    </rect>

    {/* Python logo small */}
    <circle cx="420" cy="255" r="22" fill={isDark ? '#1e293b' : '#EBF0F7'} opacity="0.9">
      <animate attributeName="r" values="22;20;22" dur="5s" repeatCount="indefinite" />
    </circle>
    <text x="420" y="262" textAnchor="middle" fontSize="18" fill="#0F3460">🐍</text>

    {/* Sparkle stars */}
    {[[355, 75], [115, 55], [445, 165]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x},${y})`} opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur={`${2 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" />
        <path d="M0-7L1.5-1.5L7 0L1.5 1.5L0 7L-1.5 1.5L-7 0L-1.5-1.5Z" fill="#f59e0b" />
      </g>
    ))}
  </svg>
);

// ── Feature pill ──────────────────────────────────────────────────────────────
const FeaturePill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 shadow-sm text-slate-700 dark:text-slate-300 text-sm font-medium backdrop-blur-sm">
    <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
    {label}
  </div>
);

// ── Welcome page ──────────────────────────────────────────────────────────────
export const WelcomePage: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'là';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden relative"
      style={{
        background: isDark
          ? 'radial-gradient(circle at 20% 20%, rgba(15,52,96,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(15,52,96,0.12), transparent 38%), linear-gradient(145deg,#060b14 0%,#0a1020 50%,#0d1327 100%)'
          : 'radial-gradient(circle at 18% 18%, rgba(15,52,96,0.12), transparent 38%), radial-gradient(circle at 80% 78%, rgba(15,52,96,0.10), transparent 36%), linear-gradient(135deg,#EBF0F7 0%,#D5E1EE 46%,#e8f0fa 100%)',
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18] dark:opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 0.7px, transparent 0.7px)', backgroundSize: '28px 28px' }}
      />

      {/* Orbs */}
      <div className="absolute top-[-10%] right-[-8%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0F3460, transparent 70%)', opacity: isDark ? 0.05 : 0.06 }} />
      <div className="absolute bottom-[-8%] left-[-6%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1F5AA0, transparent 70%)', opacity: isDark ? 0.04 : 0.05 }} />

      {/* Content */}
      <div
        className={`relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-10 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Left — Text */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg">
          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Compte créé avec succès
          </div>

          {/* Heading */}
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Bienvenu,{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              {firstName}
            </span>{' '}
            👋
          </h1>

          <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-md">
            Ton espace de création est prêt. Construis des interfaces Python CustomTkinter modernes, sans écrire une seule ligne de mise en page.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 mt-7 justify-center lg:justify-start">
            <FeaturePill icon={<MousePointerClick className="w-4 h-4" />} label="Glisser-déposer" />
            <FeaturePill icon={<Code2 className="w-4 h-4" />} label="Export Python" />
            <FeaturePill icon={<Layers className="w-4 h-4" />} label="Multi-écrans" />
          </div>

          {/* CTA */}
          <button
            onClick={onContinue}
            className="mt-10 group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base shadow-[0_12px_32px_rgba(15,52,96,0.40)] hover:shadow-[0_16px_40px_rgba(15,52,96,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            Accéder au canvas
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <p className="mt-4 text-xs text-slate-400 dark:text-slate-600">
            Tes projets sont sauvegardés automatiquement dans le cloud.
          </p>
        </div>

        {/* Right — Illustration */}
        <div
          className={`flex-1 flex items-center justify-center transition-all duration-1000 delay-200 ${
            visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
        >
          <BuilderIllustration isDark={isDark} />
        </div>
      </div>
    </div>
  );
};
