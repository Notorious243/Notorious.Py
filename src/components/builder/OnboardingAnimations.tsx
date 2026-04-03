import React from 'react';
import { motion } from 'framer-motion';

// ── Durée des boucles ───────────────────────────────────────────────────────────
const D = 7;           // secondes par boucle
const PD = 10;         // durée pour ProjectCreation (3 phases bien espacées)
const YELLOW = '#eab308';

// ── Primitives partagées ────────────────────────────────────────────────────────

const CursorSvg: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <svg width={13 * scale} height={17 * scale} viewBox="0 0 13 17" fill="none">
    <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="white" stroke="#07090f" strokeWidth="1" />
  </svg>
);

const PySvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 110 110" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M53.8,4.1c-24.8,0-23.3,10.7-23.3,10.7l0,11h23.8v3.4H30.4c0,0-15.3,2.4-15.3,21.8c0,19.4,13.3,20.6,13.3,20.6h6.7v-9.6c0,0-0.4-11.2,11.4-11.2h16c0,0,10.1-0.8,10.1-10.5V14.1C72.5,14.1,72.6,4.1,53.8,4.1z" />
    <path d="M55.7,105.8c24.8,0,23.3-10.7,23.3-10.7l0-11H55.2v-3.4h23.8c0,0,15.3-2.4,15.3-21.8c0-19.4-13.3-20.6-13.3-20.6H74.3v9.6c0,0,0.4,11.2-11.4,11.2H46.9c0,0-10.1,0.8-10.1,10.5v26.2C36.9,95.8,36.8,105.8,55.7,105.8z" />
  </svg>
);

// ── Dark dot-grid (canvas) ──────────────────────────────────────────────────────
const DotGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      opacity,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.24) 0.6px, transparent 0.6px)',
      backgroundSize: '16px 16px',
    }}
  />
);

// ── Light dot-grid (WelcomeScreen) ──────────────────────────────────────────────
const LightDotGrid: React.FC = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      opacity: 0.18,
      backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.25) 0.7px, transparent 0.7px)',
      backgroundSize: '18px 18px',
    }}
  />
);

// ════════════════════════════════════════════════════════════════════════════════
// 1. PROJECT CREATION — réplique fidèle de la WelcomeScreen (fond clair)
//    WelcomeScreen visible → cursor clique "Nouveau projet" → modal typing → canvas
// ════════════════════════════════════════════════════════════════════════════════

const ProjectCreationAnim: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden">

    {/* ══════════════════════════════════════════════════════════════════════
        PHASE A — Canvas vide : "Bienvenue dans Notorious.PY"
        Identique au composant Canvas.tsx (état sans projet ouvert)
    ══════════════════════════════════════════════════════════════════════ */}
    <motion.div
      className="absolute inset-0"
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: PD, repeat: 0, times: [0, 0.06, 0.46, 0.54] }}
    >
      {/* Fond surround du canvas (hsl 216 20% 97%) */}
      <div className="absolute inset-0 bg-[#f3f6fb]" />
      <LightDotGrid />

      {/* Canvas card blanc — reproduit le window chrome réel */}
      <div className="absolute inset-[8px] flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_8px_28px_rgba(15,52,96,0.12)]">
        {/* Chrome macOS dots */}
        <div className="flex h-[15px] shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-2">
          <div className="h-[5px] w-[5px] rounded-full bg-[#ff5f57]" />
          <div className="h-[5px] w-[5px] rounded-full bg-[#febc2e]" />
          <div className="h-[5px] w-[5px] rounded-full bg-[#28c840]" />
          <span className="mx-auto text-[4.5px] text-[#8a94a6]">Mon Application</span>
        </div>

        {/* Contenu centré identique Canvas.tsx empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-3">
          {/* Logo — rounded-3xl dark navy avec glow bleu */}
          <div className="relative mb-0.5">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#1F5AA0] to-[#0F3460] opacity-25 blur-[5px]" />
            <div
              className="relative flex h-[24px] w-[24px] items-center justify-center overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(15,52,96,0.32)]"
              style={{ background: 'linear-gradient(135deg,#1F5AA0,#0F3460)' }}
            >
              <PySvg className="h-[14px] w-[14px] text-white" />
            </div>
          </div>

          <span className="text-[7px] font-bold tracking-tight text-[#1a2940]">Bienvenue dans Notorious.PY</span>
          <span className="text-[4.5px] text-[#64748b] text-center">Créez un projet pour commencer à construire votre interface.</span>

          {/* 2 boutons côte à côte */}
          <div className="mt-1 flex w-full max-w-[210px] gap-1.5">
            <motion.div
              className="flex flex-1 items-center justify-center gap-0.5 rounded-lg py-1 shadow-[0_3px_10px_rgba(15,52,96,0.22)]"
              style={{ background: 'linear-gradient(90deg,#0F3460,#1F5AA0)' }}
              animate={{
                scale: [1,1,1,0.93,1.06,1,1],
                boxShadow: ['0 3px 10px rgba(15,52,96,0.22)','0 3px 10px rgba(15,52,96,0.22)','0 3px 10px rgba(15,52,96,0.22)','0 4px 18px rgba(15,52,96,0.55)','0 3px 10px rgba(15,52,96,0.22)','0 3px 10px rgba(15,52,96,0.22)','0 3px 10px rgba(15,52,96,0.22)'],
              }}
              transition={{ duration: PD, repeat: 0, times: [0,0.26,0.30,0.34,0.38,0.42,1] }}
            >
              <span className="text-[6.5px] font-bold text-white">+</span>
              <span className="text-[5px] font-bold text-white">Créer un projet</span>
            </motion.div>
            <div className="flex flex-1 items-center justify-center gap-0.5 rounded-lg border border-[#e2e8f0] bg-[#f8f9fb] py-1">
              <span className="text-[5px] text-[#3a506b]">✦</span>
              <span className="text-[5px] text-[#3a506b]">Générer avec l'IA</span>
            </div>
          </div>

          {/* Importer — ghost link comme dans le vrai Canvas.tsx */}
          <div className="mt-0.5 flex items-center gap-0.5">
            <span className="text-[4.5px] text-[#64748b]">↑ Importer projet Notorious.PY</span>
          </div>
          <span className="text-[3.8px] text-[#94a3b8]">Importez un fichier .zip d'un projet Notorious.PY existant.</span>
        </div>
      </div>

      {/* Curseur sombre qui arrive et clique sur "+ Créer un projet" */}
      <motion.div
        className="pointer-events-none absolute"
        animate={{ x: [300,240,130,105,105], y: [140,120,95,93,93], opacity: [0,0,1,1,0] }}
        transition={{ duration: PD, repeat: 0, times: [0,0.18,0.26,0.30,0.48] }}
      >
        <svg width="13" height="17" viewBox="0 0 13 17" fill="none">
          <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1" />
        </svg>
      </motion.div>
    </motion.div>

    {/* ══════════════════════════════════════════════════════════════════════
        PHASE B — Modal "Nouveau projet" sur fond canvas
        Identique Canvas.tsx showCreateModal (bg-white, border border-border)
    ══════════════════════════════════════════════════════════════════════ */}
    <motion.div
      className="absolute inset-0"
      animate={{ opacity: [0, 0, 1, 1, 0] }}
      transition={{ duration: PD, repeat: 0, times: [0, 0.48, 0.54, 0.87, 0.93] }}
    >
      {/* Fond canvas visible derrière */}
      <div className="absolute inset-0 bg-[#f3f6fb]" />
      <LightDotGrid />
      {/* Canvas card flouté */}
      <div className="absolute inset-[8px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white/60" />
      {/* Overlay bg-black/25 comme dans le vrai code */}
      <div className="absolute inset-[8px] rounded-xl bg-black/22" />

      {/* Dialog carte principale */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[180px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_16px_48px_rgba(15,52,96,0.20)]"
        style={{ translateX: '-50%', translateY: '-50%' }}
        animate={{ scale: [0.88,0.88,1,1,0.88], opacity: [0,0,1,1,0] }}
        transition={{ duration: PD, repeat: 0, times: [0,0.50,0.55,0.89,0.93] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f2f5] px-3 py-2">
          <span className="text-[8px] font-bold text-[#1a2940]">Nouveau projet</span>
          <span className="text-[8px] text-[#94a3b8]">✕</span>
        </div>

        {/* Input h-12 rounded-xl comme dans le vrai Canvas */}
        <div className="px-3 pt-2.5 pb-1.5">
          <div className="flex h-[22px] items-center overflow-hidden rounded-xl border-2 border-[#1F5AA0]/45 bg-[#f4f8fe] px-2.5 shadow-[0_0_0_3px_rgba(29,78,216,0.07)]">
            <motion.div
              className="shrink-0 whitespace-nowrap text-[7px] font-medium text-[#1a2940]"
              animate={{ clipPath: ['inset(0 100% 0 0)','inset(0 100% 0 0)','inset(0 0% 0 0)','inset(0 0% 0 0)'] }}
              transition={{ duration: PD, repeat: 0, times: [0, 0.55, 0.76, 0.97], ease: 'linear' }}
            >
              Mon Application
            </motion.div>
            <motion.div
              className="ml-0.5 h-[10px] w-[1px] shrink-0 rounded-full bg-[#1F5AA0]"
              animate={{ opacity: [1, 0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Boutons Annuler | Créer comme dans le vrai (flex gap-3) */}
        <div className="flex gap-2 px-3 pb-3 pt-1">
          <div className="flex h-[20px] flex-1 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8f9fb]">
            <span className="text-[5.5px] font-semibold text-[#64748b]">Annuler</span>
          </div>
          <motion.div
            className="flex h-[20px] flex-1 items-center justify-center rounded-xl shadow-[0_3px_10px_rgba(15,52,96,0.22)]"
            style={{ background: 'linear-gradient(90deg,#0F3460,#1F5AA0)' }}
            animate={{ scale: [1,1,1,0.92,1.06,1,1] }}
            transition={{ duration: PD, repeat: 0, times: [0,0.77,0.80,0.83,0.86,0.88,1] }}
          >
            <span className="text-[5.5px] font-bold text-white">Créer</span>
          </motion.div>
        </div>

        {/* Curseur vers bouton Créer */}
        <motion.div
          className="pointer-events-none absolute"
          style={{ bottom: 12, right: 18 }}
          animate={{ y: [20,20,0,0,20], opacity: [0,0,1,1,0] }}
          transition={{ duration: PD, repeat: 0, times: [0,0.77,0.81,0.87,0.91] }}
        >
          <svg width="13" height="17" viewBox="0 0 13 17" fill="none">
            <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>

    {/* ══════════════════════════════════════════════════════════════════════
        PHASE C — Canvas "Mon Application" ouvert (fond clair avec grille)
    ══════════════════════════════════════════════════════════════════════ */}
    <motion.div
      className="absolute inset-0 overflow-hidden"
      animate={{ opacity: [0, 0, 1, 1] }}
      transition={{ duration: PD, repeat: 0, times: [0, 0.89, 0.93, 1.0] }}
    >
      <div className="absolute inset-0 bg-[#f3f6fb]" />
      <LightDotGrid />

      <div className="absolute inset-[8px] flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_8px_28px_rgba(15,52,96,0.12)]">
        {/* Chrome — titre projet en vert "ouvert" */}
        <div className="flex h-[15px] shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-2">
          <div className="h-[5px] w-[5px] rounded-full bg-[#ff5f57]" />
          <div className="h-[5px] w-[5px] rounded-full bg-[#febc2e]" />
          <div className="h-[5px] w-[5px] rounded-full bg-[#28c840]" />
          <motion.span
            className="mx-auto text-[4.5px] font-semibold text-[#28a745]"
            animate={{ opacity: [0, 1, 1] }}
            transition={{ duration: PD, repeat: 0, times: [0, 0.94, 0.99] }}
          >
            Mon Application ✓
          </motion.span>
        </div>
        {/* Canvas body : prêt à drag-and-drop */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          <motion.div
            className="flex h-[22px] w-[22px] items-center justify-center rounded-xl border border-[#1F5AA0]/20"
            style={{ background: 'rgba(31,90,160,0.07)' }}
            animate={{ scale: [0.5, 1.1, 1], opacity: [0, 1, 1] }}
            transition={{ duration: PD, repeat: 0, times: [0, 0.94, 0.99] }}
          >
            <PySvg className="h-[13px] w-[13px] text-[#1F5AA0]/55" />
          </motion.div>
          <motion.span
            className="text-[5px] font-semibold text-[#64748b]"
            animate={{ opacity: [0, 1, 1] }}
            transition={{ duration: PD, repeat: 0, times: [0, 0.95, 0.99] }}
          >
            Canvas prêt — glissez vos composants
          </motion.span>
        </div>
      </div>
    </motion.div>

  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// 2. PYTHON FILE — onglet Explorateur, clic +, tape main.py, confirmé
// ════════════════════════════════════════════════════════════════════════════════

const PythonFileAnim: React.FC = () => (
  <div className="absolute inset-0 flex bg-[#0d1117]">
    {/* ── Sidebar Explorateur ── */}
    <div className="relative flex w-[148px] flex-col border-r border-white/[0.07] bg-[#0d1117]">
      <div className="flex shrink-0 gap-0.5 border-b border-white/[0.07] p-1.5">
        <div className="flex flex-1 items-center justify-center rounded-lg py-1">
          <span className="text-[6px] text-slate-500">Composants</span>
        </div>
        <div className="flex flex-1 items-center justify-center gap-0.5 rounded-lg bg-[#1d4ed8] py-1">
          <span className="text-[6px] font-bold text-white">Explorateur</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-2 py-1.5">
        <span className="text-[6px] font-bold uppercase tracking-widest text-slate-500">Fichiers</span>
        <motion.div
          className="relative flex h-[16px] w-[16px] items-center justify-center rounded-md"
          animate={{ backgroundColor: ['transparent','transparent','rgba(59,130,246,0.15)','transparent'], scale: [1,1,0.88,1.05,1] }}
          transition={{ duration: D, repeat: Infinity, times: [0,0.18,0.24,0.30,0.38] }}
        >
          <span className="text-[9px] text-slate-400">+</span>
          <motion.div className="pointer-events-none absolute inset-0 rounded-md border border-blue-400/50" animate={{ scale: [1,1,2.4,2.4], opacity: [0,0.8,0,0] }} transition={{ duration: D, repeat: Infinity, times: [0,0.24,0.34,0.42] }} />
        </motion.div>
      </div>

      <div className="flex-1 overflow-hidden p-1.5">
        <div className="flex h-full flex-col rounded-xl border border-white/[0.05] bg-[#080c14]">
          <div className="flex items-center gap-1 border-b border-white/[0.05] px-2 py-1.5">
            <span className="text-[7px] text-slate-500">▾</span>
            <span className="text-[7px] text-sky-600">📂</span>
            <span className="text-[6.5px] font-semibold text-slate-300">mon_projet</span>
          </div>

          <motion.div
            className="mx-2 mt-1.5 flex h-[18px] items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/[0.08] px-1.5"
            animate={{ opacity: [0,0,1,1,1,0], y: [4,4,0,0,0,0] }}
            transition={{ duration: D, repeat: Infinity, times: [0,0.28,0.34,0.66,0.88,0.95] }}
          >
            <PySvg className="h-2.5 w-2.5 text-blue-400" />
            <motion.div
              className="overflow-hidden whitespace-nowrap text-[7px] font-bold text-blue-200"
              animate={{ clipPath: ['inset(0 100% 0 0)','inset(0 100% 0 0)','inset(0 0% 0 0)','inset(0 0% 0 0)','inset(0 0% 0 0)'] }}
              transition={{ duration: D, repeat: Infinity, times: [0,0.34,0.52,0.82,0.95], ease: 'linear' }}
            >
              main.py
            </motion.div>
            <motion.div className="ml-0.5 h-[8px] w-[1px] bg-blue-300" animate={{ opacity: [1,0,1,0] }} transition={{ duration: 0.6, repeat: Infinity }} />
          </motion.div>

          <motion.div
            className="mx-2 mt-1 flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5"
            animate={{ opacity: [0,0,0,0,1,0] }}
            transition={{ duration: D, repeat: Infinity, times: [0,0.6,0.7,0.74,0.82,0.95] }}
          >
            <PySvg className="h-2.5 w-2.5 text-blue-400" />
            <span className="text-[7px] font-bold text-blue-200">main.py</span>
            <motion.div
              className="ml-auto flex h-[10px] w-[10px] items-center justify-center rounded-full bg-green-500/20"
              animate={{ scale: [0,0,0,1.3,1] }}
              transition={{ duration: D, repeat: Infinity, times: [0,0.72,0.78,0.82,0.88] }}
            >
              <span className="text-[6px] text-green-400">✓</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>

    {/* ── Canvas droit ── */}
    <div className="relative flex flex-1 items-center justify-center bg-[#080c14]">
      <DotGrid opacity={0.15} />
      <motion.div
        className="flex flex-col items-center gap-1.5"
        animate={{ opacity: [0.2,0.2,0.2,0.2,1,1,0.2] }}
        transition={{ duration: D, repeat: Infinity, times: [0,0.45,0.6,0.75,0.84,0.92,0.97] }}
      >
        <PySvg className="h-7 w-7 text-blue-400/50" />
        <span className="text-[6px] font-semibold text-slate-600">main.py prêt</span>
        <span className="text-[5.5px] text-slate-700">Glissez des composants ici</span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute"
        style={{ right: 0, bottom: 0 }}
        animate={{ x: [100,100,-105,-105,100], y: [80,60,14,14,80], opacity: [0,1,1,1,0] }}
        transition={{ duration: D, repeat: Infinity, times: [0,0.15,0.20,0.30,0.40] }}
      >
        <CursorSvg />
      </motion.div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// 3. SIDEBAR — design 100% réaliste identique au vrai WidgetSidebar (light theme)
//    Phase A : sidebar apparaît (fond clair, bg-card blanc, border, onglets vrais)
//    Phase B : cursor drag 3 widgets depuis sidebar → canvas blanc l'un après l'autre
//    Phase C : FREEZE — canvas avec 3 widgets déposés, sidebar visible
// ════════════════════════════════════════════════════════════════════════════════

const SD = 10;
const SB_W = 95;
const CB_X = SB_W + 8;   // x du bord gauche du canvas body dans le flex container
const CB_Y = 8 + 12;     // y du bord haut du canvas body (pt-2=8 + chrome=12)
const PICK_X = SB_W - 7; // x où le curseur hovère sur les rows de la sidebar

const sidebarWidgetRows = [
  { name: 'Label',              icon: 'T'  },
  { name: 'Bouton',             icon: '⬡'  },
  { name: 'Champ de texte',     icon: '▤'  },
  { name: 'Champ mot de passe', icon: '🔒' },
  { name: 'Zone de texte',      icon: '☰'  },
];

// Ordre des drags en désordre: Label → Champ mdp → Bouton → Champ de texte
// pickY = centre Y du row dans la sidebar (estimé sans zoom)
const dragDrops = [
  { name: 'Label',              pickY: 68,  dropX: 8,   dropY: 10,  w: 48,  h: 12 },
  { name: 'Champ mot de passe', pickY: 109, dropX: 118, dropY: 6,   w: 100, h: 12 },
  { name: 'Bouton',             pickY: 82,  dropX: 10,  dropY: 56,  w: 72,  h: 14 },
  { name: 'Champ de texte',     pickY: 95,  dropX: 22,  dropY: 106, w: 202, h: 12 },
];
const dropTimes = [0.12, 0.28, 0.47, 0.67]; // fraction de SD où chaque drag commence

// Un seul curseur — keyframes continus pour les 4 drags séquentiels (14 points)
const _DT = dropTimes;
const cursorPickY  = dragDrops.map(d => d.pickY);
const cursorDropX  = dragDrops.map(d => CB_X + d.dropX + d.w / 2);
const cursorDropY  = dragDrops.map(d => CB_Y + d.dropY + d.h / 2);
const cursorTimes  = [
  0,
  _DT[0],        _DT[0]+0.12,
  _DT[1]-0.02,   _DT[1],        _DT[1]+0.12,
  _DT[2]-0.02,   _DT[2],        _DT[2]+0.12,
  _DT[3]-0.02,   _DT[3],        _DT[3]+0.12,
  _DT[3]+0.16,   1.0,
];
const cursorX      = [
  PICK_X, PICK_X,       cursorDropX[0],
  PICK_X, PICK_X,       cursorDropX[1],
  PICK_X, PICK_X,       cursorDropX[2],
  PICK_X, PICK_X,       cursorDropX[3],
  cursorDropX[3],       cursorDropX[3],
];
const cursorY      = [
  cursorPickY[0], cursorPickY[0], cursorDropY[0],
  cursorPickY[1], cursorPickY[1], cursorDropY[1],
  cursorPickY[2], cursorPickY[2], cursorDropY[2],
  cursorPickY[3], cursorPickY[3], cursorDropY[3],
  cursorDropY[3], cursorDropY[3],
];
const cursorOpacity = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0];

const SidebarAnim: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#f3f6fb]" />
    <LightDotGrid />

    {/* Layout : sidebar + canvas, taille naturelle sans zoom */}
    <div className="absolute inset-0 flex">

      {/* ── SIDEBAR ── */}
      <motion.div
        className="relative flex flex-col overflow-hidden border-r border-[#d1d9e6] bg-white"
        style={{ width: SB_W }}
        animate={{ x: [-SB_W, 0, 0], opacity: [0, 1, 1] }}
        transition={{ duration: SD, repeat: 0, times: [0, 0.08, 1], ease: 'easeOut' }}
      >
        {/* Onglets — réplique exacte TabsList (Layers + Folder) */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] bg-white px-1.5 pb-1.5 pt-2">
          <div className="grid h-[22px] w-full grid-cols-2 rounded-xl border border-[#e2e8f0] bg-[#f1f4f8] p-[2px]">
            {/* Composants actif — icône Layers (couches empilées) */}
            <div className="flex items-center justify-center gap-[2px] rounded-[8px] bg-[#0F3460] shadow-sm">
              <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
              <span className="text-[4.5px] font-bold text-white">Composants</span>
            </div>
            {/* Explorateur inactif — icône Folder */}
            <div className="flex items-center justify-center gap-[2px] rounded-[8px]">
              <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[4.5px] text-[#64748b]">Explorateur</span>
            </div>
          </div>
        </div>

        {/* Bibliothèque + barre de recherche */}
        <div className="flex-shrink-0 space-y-1 px-1.5 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-[7px] w-[7px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="18"/><rect x="10" y="3" width="6" height="18"/><rect x="18" y="3" width="4" height="18"/></svg>
              <span className="text-[5px] font-medium text-[#64748b]">Bibliothèque</span>
            </div>
            <span className="rounded-full border border-[#e2e8f0] bg-[#f1f4f8] px-1 text-[4px] font-mono text-[#64748b]">26</span>
          </div>
          <div className="relative flex h-[14px] items-center rounded-xl border border-[#e2e8f0] bg-white px-1">
            <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] flex-shrink-0 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="ml-0.5 text-[4.5px] text-[#94a3b8]">Rechercher...</span>
          </div>
        </div>

        {/* Catégorie BASIQUES */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] px-1.5 py-[3px]">
          <span className="text-[4px] font-bold uppercase tracking-widest text-[#94a3b8]">Basiques</span>
        </div>

        {/* Rows widget */}
        <div className="flex flex-col gap-[2px] overflow-hidden px-1 py-1">
          {sidebarWidgetRows.map((w, i) => {
            const dragIdx = dragDrops.findIndex(d => d.name === w.name);
            return (
              <motion.div
                key={w.name}
                className="flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f5f7fa] px-1.5 py-[2.5px]"
                animate={
                  dragIdx >= 0
                    ? { opacity: [1, 1, 1, 0.25, 0.25, 1] }
                    : { opacity: [0, 0, 1, 1], x: [3, 3, 0, 0] }
                }
                transition={
                  dragIdx >= 0
                    ? { duration: SD, repeat: 0, times: [0, _DT[dragIdx]-0.01, _DT[dragIdx]+0.01, _DT[dragIdx]+0.11, _DT[dragIdx]+0.13, _DT[dragIdx]+0.15] }
                    : { duration: SD, repeat: 0, delay: i*0.05, times: [0, 0.06, 0.12, 1] }
                }
              >
                <div className="flex h-[10px] w-[10px] flex-shrink-0 items-center justify-center rounded text-[#0F3460]/70">
                  <span className="text-[6px]">{w.icon}</span>
                </div>
                <span className="truncate text-[4.5px] font-medium text-[#334155]">{w.name}</span>
              </motion.div>
            );
          })}

          {/* INTERACTIONS */}
          <div className="mt-0.5 border-b border-[#e2e8f0] pb-[2px]">
            <span className="text-[4px] font-bold uppercase tracking-widest text-[#94a3b8]">Interactions</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f5f7fa] px-1.5 py-[2.5px]">
            <span className="text-[6px] text-[#0F3460]/70">☑</span>
            <span className="text-[4.5px] font-medium text-[#334155]">Case à cocher</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f5f7fa] px-1.5 py-[2.5px]">
            <span className="text-[6px] text-[#0F3460]/70">◉</span>
            <span className="text-[4.5px] font-medium text-[#334155]">Bouton radio</span>
          </div>
        </div>
      </motion.div>

      {/* ── CANVAS ── */}
      <div className="relative flex-1 overflow-hidden bg-[#f3f6fb] pl-2 pt-2">
        <div
          className="relative flex flex-col overflow-hidden rounded-xl border border-[#d1d9e6] bg-white shadow-[0_6px_20px_rgba(15,52,96,0.10)]"
          style={{ width: 234, height: 152 }}
        >
          {/* Chrome macOS */}
          <div className="flex h-[12px] flex-shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-1.5">
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#ff5f57]" />
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#febc2e]" />
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#28c840]" />
            <span className="mx-auto text-[3.5px] text-[#8a94a6]">Mon Application</span>
          </div>

          {/* Canvas body */}
          <div className="relative flex-1 overflow-hidden bg-white">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: 0.35, backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.18) 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}
            />

            {/* Widgets déposés — rendu CTK fidèle */}
            {dragDrops.map((d, i) => {
              const isLabel    = d.name === 'Label';
              const isButton   = d.name === 'Bouton';
              const isInput    = !isLabel && !isButton;
              const isPassword = d.name === 'Champ mot de passe';
              const isSelected = i === dragDrops.length - 1;
              return (
                <motion.div
                  key={`drop-${d.name}`}
                  className="absolute overflow-hidden"
                  style={{
                    left: d.dropX, top: d.dropY, width: d.w, height: d.h,
                    backgroundColor: isButton ? '#0F3460' : isInput ? '#F9F9FA' : 'transparent',
                    border: isInput ? '0.5px solid #979DA2' : 'none',
                  }}
                  animate={{ opacity: [0, 0, 1, 1], scale: [1.06, 1.06, 1, 1], y: [-2, -2, 0, 0] }}
                  transition={{ duration: SD, repeat: 0, times: [0, _DT[i]+0.10, _DT[i]+0.13, 1] }}
                >
                  {isLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#000', fontSize: '4.5px', fontFamily: 'Roboto,sans-serif' }}>Label</div>
                  )}
                  {isButton && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#fff', fontSize: '4.5px', fontFamily: 'Roboto,sans-serif' }}>Bouton</div>
                  )}
                  {isInput && (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', color: '#A0A0A0', fontSize: '4px', fontFamily: 'Roboto,sans-serif', paddingLeft: 2 }}>
                      {isPassword ? '••••••' : 'Entrée...'}
                    </div>
                  )}
                  {isSelected && (
                    <>
                      <motion.div
                        className="pointer-events-none absolute"
                        style={{ inset: -1, border: '1px solid #0F3460', boxShadow: '0 0 0 1px rgba(15,52,96,0.15)' }}
                        animate={{ opacity: [0, 0, 0, 1] }}
                        transition={{ duration: SD, repeat: 0, times: [0, _DT[i]+0.11, _DT[i]+0.14, 1] }}
                      />
                      {[{top:-2,left:-2},{top:-2,right:-2},{bottom:-2,left:-2},{bottom:-2,right:-2}].map((pos, hi) => (
                        <motion.div
                          key={hi}
                          className="pointer-events-none absolute"
                          style={{ width: 3.5, height: 3.5, backgroundColor: '#fff', border: '0.7px solid #0F3460', borderRadius: 1, ...pos }}
                          animate={{ opacity: [0, 0, 0, 1] }}
                          transition={{ duration: SD, repeat: 0, times: [0, _DT[i]+0.11, _DT[i]+0.14, 1] }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── UN SEUL CURSEUR qui enchaine les 4 drags sidebar → canvas ── */}
      <motion.div
        className="pointer-events-none absolute z-30"
        style={{ left: 0, top: 0 }}
        animate={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}
        transition={{ duration: SD, repeat: 0, times: cursorTimes, ease: 'easeInOut' }}
      >
        <svg width="13" height="16" viewBox="0 0 13 17" fill="none">
          <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1.2" />
        </svg>
      </motion.div>

    </div>
  </div>
);


// ════════════════════════════════════════════════════════════════════════════════
// 4. CANVAS — 4 widgets en désordre → cursor les arrange en form login (JAUNE)
//    Phase A : canvas avec 4 widgets dispersés (suite directe de SidebarAnim)
//    Phase B : 1 curseur saisit chaque widget et le positionne dans l'ordre
//    Phase C : FREEZE — form login ordonnée, Bouton sélectionné (ring jaune)
// ════════════════════════════════════════════════════════════════════════════════

const CAD = 10; // durée boucle CanvasArrange

// 4 widgets — positions dispersées initiales + cibles ordonnées (form login)
// Réutilise SB_W=95, CB_X=103, CB_Y=20 définis dans la section SidebarAnim
// Tailles réalistes : label centré (90px), inputs et bouton pleine largeur (155px)
const caWidgets = [
  { name: 'Label',              scatter: { x: 120, y: 90  }, target: { x: 72, y: 10 }, w: 90,  h: 14 },
  { name: 'Champ de texte',     scatter: { x: 10,  y: 105 }, target: { x: 40, y: 30 }, w: 155, h: 14 },
  { name: 'Champ mot de passe', scatter: { x: 20,  y: 5   }, target: { x: 40, y: 50 }, w: 155, h: 14 },
  { name: 'Bouton',             scatter: { x: 20,  y: 58  }, target: { x: 40, y: 72 }, w: 155, h: 16 },
];

// Timings de déplacement par widget (fraction de CAD)
const caMoveStart = [0.08, 0.28, 0.48, 0.68];
const caMoveEnd   = [0.20, 0.40, 0.60, 0.80];

// Centres curseur dans le flex container (CB_X=103, CB_Y=20)
// scatter centers: Label(268,117) CdT(190,132) CdP(200,32) Btn(200,86)
// target  centers: Label(220,37)  CdT(220,57)  CdP(220,77) Btn(220,100)
const caCursorTimes   = [0, 0.08, 0.18, 0.26, 0.28, 0.38, 0.46, 0.48, 0.58, 0.66, 0.68, 0.78, 0.82, 1.0];
const caCursorX       = [268, 268, 220, 190, 190, 220, 200, 200, 220, 200, 200, 220, 220, 220];
const caCursorY       = [117, 117,  37, 132, 132,  57,  32,  32,  77,  86,  86, 100, 100, 100];
const caCursorOpacity = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0];

const CanvasArrangeAnim: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#f3f6fb]" />
    <LightDotGrid />

    {/* Layout : sidebar statique + canvas — 100% identique à SidebarAnim */}
    <div className="absolute inset-0 flex">

      {/* ── SIDEBAR statique (design identique à SidebarAnim) ── */}
      <div
        className="relative flex flex-col overflow-hidden border-r border-[#d1d9e6] bg-white"
        style={{ width: SB_W }}
      >
        {/* Onglets */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] bg-white px-1.5 pb-1.5 pt-2">
          <div className="grid h-[22px] w-full grid-cols-2 rounded-xl border border-[#e2e8f0] bg-[#f1f4f8] p-[2px]">
            <div className="flex items-center justify-center gap-[2px] rounded-[8px] bg-[#0F3460] shadow-sm">
              <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
              <span className="text-[4.5px] font-bold text-white">Composants</span>
            </div>
            <div className="flex items-center justify-center gap-[2px] rounded-[8px]">
              <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[4.5px] text-[#64748b]">Explorateur</span>
            </div>
          </div>
        </div>
        {/* Bibliothèque + recherche */}
        <div className="flex-shrink-0 space-y-1 px-1.5 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-[7px] w-[7px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="18"/><rect x="10" y="3" width="6" height="18"/><rect x="18" y="3" width="4" height="18"/></svg>
              <span className="text-[5px] font-medium text-[#64748b]">Bibliothèque</span>
            </div>
            <span className="rounded-full border border-[#e2e8f0] bg-[#f1f4f8] px-1 text-[4px] font-mono text-[#64748b]">26</span>
          </div>
          <div className="relative flex h-[14px] items-center rounded-xl border border-[#e2e8f0] bg-white px-1">
            <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] flex-shrink-0 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="ml-0.5 text-[4.5px] text-[#94a3b8]">Rechercher...</span>
          </div>
        </div>
        <div className="flex-shrink-0 border-b border-[#e2e8f0] px-1.5 py-[3px]">
          <span className="text-[4px] font-bold uppercase tracking-widest text-[#94a3b8]">Basiques</span>
        </div>
        <div className="flex flex-col gap-[2px] overflow-hidden px-1 py-1">
          {sidebarWidgetRows.map((w) => (
            <div key={w.name} className="flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f5f7fa] px-1.5 py-[2.5px]">
              <div className="flex h-[10px] w-[10px] flex-shrink-0 items-center justify-center rounded text-[#0F3460]/70">
                <span className="text-[6px]">{w.icon}</span>
              </div>
              <span className="truncate text-[4.5px] font-medium text-[#334155]">{w.name}</span>
            </div>
          ))}
          <div className="mt-0.5 border-b border-[#e2e8f0] pb-[2px]">
            <span className="text-[4px] font-bold uppercase tracking-widest text-[#94a3b8]">Interactions</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f5f7fa] px-1.5 py-[2.5px]">
            <span className="text-[6px] text-[#0F3460]/70">☑</span>
            <span className="text-[4.5px] font-medium text-[#334155]">Case à cocher</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f5f7fa] px-1.5 py-[2.5px]">
            <span className="text-[6px] text-[#0F3460]/70">◉</span>
            <span className="text-[4.5px] font-medium text-[#334155]">Bouton radio</span>
          </div>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div className="relative flex-1 overflow-hidden bg-[#f3f6fb] pl-2 pt-2">
        <div
          className="relative flex flex-col overflow-hidden rounded-xl border border-[#d1d9e6] bg-white shadow-[0_6px_20px_rgba(15,52,96,0.10)]"
          style={{ width: 234, height: 152 }}
        >
          {/* Chrome macOS */}
          <div className="flex h-[12px] flex-shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-1.5">
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#ff5f57]" />
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#febc2e]" />
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#28c840]" />
            <span className="mx-auto text-[3.5px] text-[#8a94a6]">Mon Application</span>
          </div>

          {/* Canvas body */}
          <div className="relative flex-1 overflow-hidden bg-white">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: 0.35, backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.18) 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}
            />

            {/* 4 widgets — partent dispersés → s'arrangent en form login avec accent jaune */}
            {caWidgets.map((w, i) => {
              const isLabel    = w.name === 'Label';
              const isBtn      = w.name === 'Bouton';
              const isPassword = w.name === 'Champ mot de passe';
              const isInput    = !isLabel && !isBtn;
              const isLast     = i === caWidgets.length - 1;
              const MS = caMoveStart[i];
              const ME = caMoveEnd[i];
              return (
                <motion.div
                  key={`ca-${w.name}`}
                  className="absolute overflow-hidden"
                  style={{
                    width: w.w,
                    height: w.h,
                    backgroundColor: isBtn ? YELLOW : isInput ? '#F9F9FA' : 'transparent',
                    border: isInput ? '0.5px solid #979DA2' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isInput ? 'flex-start' : 'center',
                    paddingLeft: isInput ? 2 : 0,
                  }}
                  animate={{
                    x: [w.scatter.x, w.scatter.x, w.target.x, w.target.x, w.scatter.x],
                    y: [w.scatter.y, w.scatter.y, w.target.y, w.target.y, w.scatter.y],
                    scale: [1, 1.05, 1, 1, 1],
                    opacity: [1, 1, 1, 1, 0],
                  }}
                  transition={{
                    duration: CAD,
                    repeat: Infinity,
                    times: [0, MS, ME, 0.90, 0.97],
                    ease: 'easeInOut',
                  }}
                >
                  {isLabel && <span style={{ color: '#000', fontSize: '4.5px', fontFamily: 'Roboto,sans-serif' }}>Label</span>}
                  {isBtn   && <span style={{ color: '#fff', fontSize: '4.5px', fontFamily: 'Roboto,sans-serif' }}>Bouton</span>}
                  {isInput && (
                    <span style={{ color: '#A0A0A0', fontSize: '4px', fontFamily: 'Roboto,sans-serif' }}>
                      {isPassword ? '••••••' : 'Entrée...'}
                    </span>
                  )}

                  {/* Ring jaune — s'allume pendant le drag, disparaît à l'arrivée */}
                  <motion.div
                    className="pointer-events-none absolute"
                    style={{ inset: -1.5, border: `1.5px solid ${YELLOW}`, borderRadius: 1 }}
                    animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
                    transition={{
                      duration: CAD, repeat: Infinity,
                      times: [0, MS, MS + 0.01, ME - 0.01, ME, ME + 0.02],
                    }}
                  />

                  {/* Ring permanent + handles jaunes sur le dernier widget (Bouton) après placement */}
                  {isLast && (
                    <>
                      <motion.div
                        className="pointer-events-none absolute"
                        style={{ inset: -1, border: `1px solid ${YELLOW}`, boxShadow: `0 0 0 1px rgba(234,179,8,0.20)` }}
                        animate={{ opacity: [0, 0, 1, 1, 0] }}
                        transition={{ duration: CAD, repeat: Infinity, times: [0, ME + 0.02, ME + 0.06, 0.90, 0.97] }}
                      />
                      {[{ top: -2.5, left: -2.5 }, { top: -2.5, right: -2.5 }, { bottom: -2.5, left: -2.5 }, { bottom: -2.5, right: -2.5 }].map((pos, hi) => (
                        <motion.div
                          key={hi}
                          className="pointer-events-none absolute"
                          style={{ width: 3.5, height: 3.5, backgroundColor: '#fff', border: `0.7px solid ${YELLOW}`, borderRadius: 1, ...pos }}
                          animate={{ opacity: [0, 0, 1, 1, 0] }}
                          transition={{ duration: CAD, repeat: Infinity, times: [0, ME + 0.03, ME + 0.07, 0.90, 0.97] }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── UN SEUL CURSEUR — enchaine les 4 arrangements canvas → canvas ── */}
      <motion.div
        className="pointer-events-none absolute z-30"
        style={{ left: 0, top: 0 }}
        animate={{ x: caCursorX, y: caCursorY, opacity: caCursorOpacity }}
        transition={{ duration: CAD, repeat: Infinity, times: caCursorTimes, ease: 'easeInOut' }}
      >
        <svg width="13" height="16" viewBox="0 0 13 17" fill="none">
          <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1.2" />
        </svg>
      </motion.div>

    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// 5. PROPERTIES — suite directe de CanvasArrangeAnim (LIGHT theme)
//    Sidebar + canvas form login figée → curseur clique sur widgets → édite propriétés
//    Label "Label"→"Se connecter" (noir gras) | Bouton "Bouton"→"Connexion" + #0F3460
//    Inputs : bordure renforcée | Réplique 100% fidèle du vrai panneau RightSidebar
// ════════════════════════════════════════════════════════════════════════════════

// Layout 360px total : sidebar 72 │ gap 8 │ canvas card 148 │ gap 8 │ props 124
const PPD   = 12;
const PP_SB = 72;            // sidebar compacte
const PP_CW = 148;           // canvas card width
const PP_CH = 115;           // canvas card height

// Positions des widgets dans le corps du canvas (body = 148 × 103 px)
// label centré (148−92)/2=28  |  inputs/btn centré (148−120)/2=14
const ppWl = { x: 28, y: 6,  w: 92,  h: 10 }; // Label
const ppWc = { x: 14, y: 22, w: 120, h: 10 }; // Champ de texte
const ppWp = { x: 14, y: 36, w: 120, h: 10 }; // Champ mot de passe
const ppWb = { x: 14, y: 52, w: 120, h: 12 }; // Bouton

// Positions curseur dans le panneau propriétés (RPX = 80+148+8 = 236)
const PP_FX = 283; // centre champ texte
const PP_FY = 66;  // y du champ texte Label/Bouton
const PP_KX = 250; // swatch couleur #0F3460
const PP_KY = 87;  // y des color swatches
const PP_DX = 283; // champ border-width
const PP_DY = 76;  // y section bordure

// Curseur 14 keyframes — Label → Bouton → Input
const ppCT  = [0,    0.07, 0.11, 0.20, 0.24, 0.40, 0.44, 0.52, 0.62, 0.66, 0.74, 0.78, 0.94, 1.0];
const ppCXk = [360,  154,  154,  PP_FX, PP_FX, PP_FX, 154, PP_FX, PP_KX, PP_KX, 154, 154, PP_DX, PP_DX];
const ppCYk = [80,   31,   31,   PP_FY, PP_FY, PP_FY, 78,  PP_FY, PP_KY, PP_KY, 47,  47,  PP_DY, PP_DY];
const ppCOp = [0,    0,    1,    1,     1,     1,     1,   1,     1,     1,     1,   1,   1,    0];

const PropertiesEditAnim: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#f3f6fb]" />
    <LightDotGrid />

    <div className="absolute inset-0 flex">

      {/* ── SIDEBAR compacte (même design, width réduite) ── */}
      <div className="relative flex flex-col overflow-hidden border-r border-[#d1d9e6] bg-white" style={{ width: PP_SB }}>
        {/* Onglets */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] bg-white px-1 pb-1 pt-1.5">
          <div className="grid h-[18px] w-full grid-cols-2 rounded-lg border border-[#e2e8f0] bg-[#f1f4f8] p-[2px]">
            <div className="flex items-center justify-center gap-[1.5px] rounded-md bg-[#0F3460] shadow-sm">
              <svg viewBox="0 0 24 24" className="h-[5px] w-[5px] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
              <span className="text-[3.5px] font-bold text-white">Composants</span>
            </div>
            <div className="flex items-center justify-center gap-[1.5px]">
              <svg viewBox="0 0 24 24" className="h-[5px] w-[5px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[3.5px] text-[#64748b]">Expl.</span>
            </div>
          </div>
        </div>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] px-1.5 py-1">
          <div className="flex items-center justify-between">
            <span className="text-[4px] font-medium text-[#64748b]">Bibliothèque</span>
            <span className="rounded-full border border-[#e2e8f0] bg-[#f1f4f8] px-0.5 text-[3.5px] text-[#94a3b8]">26</span>
          </div>
        </div>
        {/* BASIQUES rows */}
        <div className="flex-shrink-0 px-1 py-[2px]">
          <span className="text-[3px] font-bold uppercase tracking-widest text-[#94a3b8]">Basiques</span>
        </div>
        <div className="flex flex-col gap-[1.5px] overflow-hidden px-1 pb-1">
          {sidebarWidgetRows.map((w) => (
            <div key={w.name} className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-[#f5f7fa] px-1 py-[1px]">
              <span className="text-[5px] text-[#0F3460]/70">{w.icon}</span>
              <span className="truncate text-[3.5px] font-medium text-[#334155]">{w.name}</span>
            </div>
          ))}
          <div className="mt-0.5 border-b border-[#e2e8f0] pb-[1px]">
            <span className="text-[3px] font-bold uppercase tracking-widest text-[#94a3b8]">Interactions</span>
          </div>
          <div className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-[#f5f7fa] px-1 py-[1px]">
            <span className="text-[5px] text-[#0F3460]/70">☑</span>
            <span className="text-[3.5px] font-medium text-[#334155]">Case à cocher</span>
          </div>
          <div className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-[#f5f7fa] px-1 py-[1px]">
            <span className="text-[5px] text-[#0F3460]/70">◉</span>
            <span className="text-[3.5px] font-medium text-[#334155]">Bouton radio</span>
          </div>
        </div>
      </div>

      {/* ── CANVAS — état final form login + éditions en cours ── */}
      <div className="relative overflow-hidden bg-[#f3f6fb] pl-2 pt-2" style={{ width: PP_CW + 8 }}>
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-[#d1d9e6] bg-white shadow-[0_4px_16px_rgba(15,52,96,0.08)]"
          style={{ width: PP_CW, height: PP_CH }}>
          {/* Chrome macOS */}
          <div className="flex h-[12px] flex-shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-1.5">
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#ff5f57]" />
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#febc2e]" />
            <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#28c840]" />
            <span className="mx-auto text-[3.5px] text-[#8a94a6]">Mon Application</span>
          </div>
          {/* Canvas body */}
          <div className="relative flex-1 overflow-hidden bg-white">
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.30, backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.18) 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />

            {/* ── Label : "Label" → "Se connecter" (noir gras) ── */}
            <div className="absolute flex items-center justify-center overflow-hidden" style={{ left: ppWl.x, top: ppWl.y, width: ppWl.w, height: ppWl.h }}>
              <motion.span className="absolute text-center" style={{ fontSize: '4.5px', fontFamily: 'Roboto,sans-serif', fontWeight: 700, color: '#000000' }}
                animate={{ opacity: [1, 1, 0, 0, 1] }}
                transition={{ duration: PPD, repeat: Infinity, times: [0, 0.28, 0.33, 0.97, 1.0] }}
              >Label</motion.span>
              <motion.span className="absolute text-center" style={{ fontSize: '4.5px', fontFamily: 'Roboto,sans-serif', fontWeight: 700, color: '#000000' }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{ duration: PPD, repeat: Infinity, times: [0, 0.32, 0.35, 0.97, 1.0] }}
              >Se connecter</motion.span>
            </div>

            {/* ── Champ de texte — bordure se renforce ── */}
            <motion.div className="absolute flex items-center overflow-hidden" style={{ left: ppWc.x, top: ppWc.y, width: ppWc.w, height: ppWc.h, backgroundColor: '#F9F9FA', paddingLeft: 2 }}
              animate={{ outlineColor: ['rgba(149,157,162,0)', 'rgba(149,157,162,0)', 'rgba(51,65,85,0.8)'], outlineWidth: ['0px', '0px', '1.5px'], outlineStyle: 'solid', borderColor: ['#979DA2', '#979DA2', '#334155'], borderWidth: ['0.5px', '0.5px', '1.5px'], borderStyle: 'solid' }}
              transition={{ duration: PPD, repeat: Infinity, times: [0, 0.87, 0.93] }}
            >
              <span style={{ color: '#A0A0A0', fontSize: '4px', fontFamily: 'Roboto,sans-serif' }}>Entrée...</span>
            </motion.div>

            {/* ── Champ mot de passe — bordure se renforce ── */}
            <motion.div className="absolute flex items-center overflow-hidden" style={{ left: ppWp.x, top: ppWp.y, width: ppWp.w, height: ppWp.h, backgroundColor: '#F9F9FA', paddingLeft: 2 }}
              animate={{ borderColor: ['#979DA2', '#979DA2', '#334155'], borderWidth: ['0.5px', '0.5px', '1.5px'], borderStyle: 'solid' }}
              transition={{ duration: PPD, repeat: Infinity, times: [0, 0.87, 0.93] }}
            >
              <span style={{ color: '#A0A0A0', fontSize: '4px', fontFamily: 'Roboto,sans-serif' }}>••••••</span>
            </motion.div>

            {/* ── Bouton : "Bouton" → "Connexion", jaune → #0F3460 ── */}
            <motion.div className="absolute flex items-center justify-center overflow-hidden"
              style={{ left: ppWb.x, top: ppWb.y, width: ppWb.w, height: ppWb.h }}
              animate={{ backgroundColor: [YELLOW, YELLOW, YELLOW, '#0F3460', '#0F3460', YELLOW] }}
              transition={{ duration: PPD, repeat: Infinity, times: [0, 0.64, 0.68, 0.72, 0.97, 1.0] }}
            >
              <motion.span className="absolute" style={{ color: '#ffffff', fontSize: '4.5px', fontFamily: 'Roboto,sans-serif' }}
                animate={{ opacity: [1, 1, 0, 0, 1] }}
                transition={{ duration: PPD, repeat: Infinity, times: [0, 0.56, 0.60, 0.97, 1.0] }}
              >Bouton</motion.span>
              <motion.span className="absolute" style={{ color: '#ffffff', fontSize: '4.5px', fontFamily: 'Roboto,sans-serif' }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{ duration: PPD, repeat: Infinity, times: [0, 0.60, 0.63, 0.97, 1.0] }}
              >Connexion</motion.span>
            </motion.div>

            {/* ── Rings de sélection bleus ── */}
            {/* Ring Label */}
            <motion.div className="pointer-events-none absolute" style={{ left: ppWl.x - 1, top: ppWl.y - 1, width: ppWl.w + 2, height: ppWl.h + 2, border: '1px solid #0F3460', boxShadow: '0 0 0 1.5px rgba(15,52,96,0.15)' }}
              animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
              transition={{ duration: PPD, repeat: Infinity, times: [0, 0.09, 0.11, 0.39, 0.42, 1.0] }}
            />
            {/* Handles Label */}
            {[{ l: ppWl.x - 2.5, t: ppWl.y - 2.5 }, { l: ppWl.x + ppWl.w - 1, t: ppWl.y - 2.5 }, { l: ppWl.x - 2.5, t: ppWl.y + ppWl.h - 1 }, { l: ppWl.x + ppWl.w - 1, t: ppWl.y + ppWl.h - 1 }].map((pos, hi) => (
              <motion.div key={`lh${hi}`} className="pointer-events-none absolute" style={{ width: 3.5, height: 3.5, backgroundColor: '#fff', border: '0.7px solid #0F3460', borderRadius: 1, left: pos.l, top: pos.t }}
                animate={{ opacity: [0, 0, 1, 1, 0, 0] }} transition={{ duration: PPD, repeat: Infinity, times: [0, 0.10, 0.12, 0.39, 0.42, 1.0] }}
              />
            ))}
            {/* Ring Bouton */}
            <motion.div className="pointer-events-none absolute" style={{ left: ppWb.x - 1, top: ppWb.y - 1, width: ppWb.w + 2, height: ppWb.h + 2, border: '1px solid #0F3460', boxShadow: '0 0 0 1.5px rgba(15,52,96,0.15)' }}
              animate={{ opacity: [0, 0, 0, 1, 1, 0, 0] }}
              transition={{ duration: PPD, repeat: Infinity, times: [0, 0.42, 0.45, 0.47, 0.76, 0.80, 1.0] }}
            />
            {/* Ring CdT */}
            <motion.div className="pointer-events-none absolute" style={{ left: ppWc.x - 1, top: ppWc.y - 1, width: ppWc.w + 2, height: ppWc.h + 2, border: '1px solid #0F3460', boxShadow: '0 0 0 1.5px rgba(15,52,96,0.15)' }}
              animate={{ opacity: [0, 0, 0, 0, 1, 1, 0] }}
              transition={{ duration: PPD, repeat: Infinity, times: [0, 0.76, 0.80, 0.81, 0.83, 0.97, 1.0] }}
            />
          </div>
        </div>
      </div>

      {/* ── PANNEAU PROPRIÉTÉS — réplique fidèle de RightSidebar (light theme) ── */}
      <div className="relative flex flex-1 flex-col overflow-hidden border-l border-[#d1d9e6] bg-white">

        {/* Tabs — identique au vrai RightSidebar */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] bg-white px-1.5 pb-1.5 pt-2">
          <div className="grid h-[22px] w-full grid-cols-2 rounded-xl border border-[#e2e8f0] bg-[#f1f4f8] p-[2px]">
            {/* Propriétés ACTIF */}
            <div className="flex items-center justify-center gap-[2px] rounded-[8px] bg-[#0F3460] shadow-sm">
              <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
                <line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
                <line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
              </svg>
              <span className="text-[4px] font-bold text-white">Propriétés</span>
            </div>
            {/* IA inactif */}
            <div className="flex items-center justify-center gap-[2px] rounded-[8px]">
              <svg viewBox="0 0 24 24" className="h-[6px] w-[6px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.938A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
              </svg>
              <span className="text-[4px] text-[#64748b]">Assistant IA</span>
            </div>
          </div>
        </div>

        {/* Content — 3 phases */}
        <div className="relative flex-1 overflow-hidden px-1.5 pt-1.5">

          {/* Placeholder (pas de sélection) */}
          <motion.div className="flex h-full items-center justify-center px-2"
            animate={{ opacity: [1, 1, 0, 0, 0, 0, 0, 1] }}
            transition={{ duration: PPD, repeat: Infinity, times: [0, 0.08, 0.11, 0.42, 0.44, 0.80, 0.96, 1.0] }}
          >
            <p className="text-center text-[4.5px] leading-relaxed text-[#94a3b8]">Sélectionnez un widget<br />pour modifier ses propriétés</p>
          </motion.div>

          {/* Phase 1 — Label sélectionné */}
          <motion.div className="absolute inset-x-1.5 top-1.5 space-y-1.5"
            animate={{ opacity: [0, 0, 1, 1, 0, 0, 0] }}
            transition={{ duration: PPD, repeat: Infinity, times: [0, 0.09, 0.12, 0.40, 0.43, 0.97, 1.0] }}
          >
            {/* Accordion item */}
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
              <div className="flex items-center gap-1 border-b border-[#e2e8f0] px-2 py-1">
                <svg viewBox="0 0 24 24" className="h-[7px] w-[7px] flex-shrink-0 text-[#0F3460]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                <span className="text-[5px] font-semibold text-[#0F172A]">Propriétés</span>
              </div>
              <div className="space-y-1.5 px-2 py-1.5">
                {/* Badge widget */}
                <div className="flex items-center gap-1 rounded-md bg-[#f1f4f8] px-1.5 py-0.5">
                  <span className="text-[6px] font-bold text-[#0F3460]">T</span>
                  <span className="text-[4.5px] font-medium text-[#0F172A]">Label</span>
                  <span className="ml-0.5 text-[3.5px] text-[#94a3b8]">/ CTkLabel</span>
                </div>
                {/* Texte */}
                <div>
                  <span className="text-[3.5px] font-bold uppercase tracking-widest text-[#94a3b8]">Texte</span>
                  <div className="relative mt-0.5 flex h-[12px] items-center overflow-hidden rounded-md border border-[#e2e8f0] bg-white px-1">
                    <motion.span className="absolute text-[5px] text-[#334155]"
                      animate={{ opacity: [1, 1, 0, 0] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.16, 0.20, 0.97] }}
                    >Label</motion.span>
                    <motion.span className="overflow-hidden whitespace-nowrap text-[5px] text-[#0F172A]"
                      style={{ clipPath: 'inset(0 100% 0 0)' }}
                      animate={{ clipPath: ['inset(0 100% 0 0)', 'inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 0)'] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.18, 0.30, 0.97], ease: 'linear' }}
                    >Se connecter</motion.span>
                    {/* Caret clignote pendant la frappe */}
                    <motion.span className="absolute right-1 h-[7px] w-[0.8px] bg-[#0F3460]"
                      animate={{ opacity: [0, 0, 1, 0, 1, 0, 0] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.17, 0.20, 0.22, 0.24, 0.30, 0.32] }}
                    />
                  </div>
                </div>
                {/* Couleur texte */}
                <div>
                  <span className="text-[3.5px] font-bold uppercase tracking-widest text-[#94a3b8]">Couleur texte</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <div className="h-[10px] w-[10px] rounded border border-[#e2e8f0] bg-black" />
                    <span className="text-[4px] text-[#334155]">#000000</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase 2 — Bouton sélectionné */}
          <motion.div className="absolute inset-x-1.5 top-1.5 space-y-1.5"
            animate={{ opacity: [0, 0, 0, 1, 1, 0, 0] }}
            transition={{ duration: PPD, repeat: Infinity, times: [0, 0.43, 0.46, 0.48, 0.78, 0.82, 1.0] }}
          >
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
              <div className="flex items-center gap-1 border-b border-[#e2e8f0] px-2 py-1">
                <svg viewBox="0 0 24 24" className="h-[7px] w-[7px] flex-shrink-0 text-[#0F3460]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                <span className="text-[5px] font-semibold text-[#0F172A]">Propriétés</span>
              </div>
              <div className="space-y-1.5 px-2 py-1.5">
                <div className="flex items-center gap-1 rounded-md bg-[#f1f4f8] px-1.5 py-0.5">
                  <span className="text-[6px] text-[#0F3460]">⬡</span>
                  <span className="text-[4.5px] font-medium text-[#0F172A]">Bouton</span>
                  <span className="ml-0.5 text-[3.5px] text-[#94a3b8]">/ CTkButton</span>
                </div>
                {/* Texte */}
                <div>
                  <span className="text-[3.5px] font-bold uppercase tracking-widest text-[#94a3b8]">Texte</span>
                  <div className="relative mt-0.5 flex h-[12px] items-center overflow-hidden rounded-md border border-[#e2e8f0] bg-white px-1">
                    <motion.span className="absolute text-[5px] text-[#334155]"
                      animate={{ opacity: [1, 1, 0, 0] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.50, 0.53, 0.97] }}
                    >Bouton</motion.span>
                    <motion.span className="overflow-hidden whitespace-nowrap text-[5px] text-[#0F172A]"
                      style={{ clipPath: 'inset(0 100% 0 0)' }}
                      animate={{ clipPath: ['inset(0 100% 0 0)', 'inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 0)'] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.52, 0.62, 0.97], ease: 'linear' }}
                    >Connexion</motion.span>
                    <motion.span className="absolute right-1 h-[7px] w-[0.8px] bg-[#0F3460]"
                      animate={{ opacity: [0, 0, 1, 0, 1, 0, 0] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.51, 0.54, 0.56, 0.58, 0.63, 0.65] }}
                    />
                  </div>
                </div>
                {/* Couleur de fond */}
                <div>
                  <span className="text-[3.5px] font-bold uppercase tracking-widest text-[#94a3b8]">Couleur de fond</span>
                  <div className="mt-0.5 flex gap-[4px]">
                    {[{ c: YELLOW, isYellow: true }, { c: '#0F3460', isBlue: true }, { c: '#16a34a' }, { c: '#dc2626' }].map(({ c, isYellow, isBlue }, ci) => (
                      <div key={ci} className="relative">
                        <div className="h-[13px] w-[13px] rounded-full" style={{ background: c }} />
                        {/* Ring jaune actif initialement */}
                        {isYellow && (
                          <motion.div className="pointer-events-none absolute -inset-[2px] rounded-full border border-[#0F3460]"
                            animate={{ opacity: [1, 1, 0, 0] }}
                            transition={{ duration: PPD, repeat: Infinity, times: [0, 0.64, 0.68, 0.97] }}
                          />
                        )}
                        {/* Ring bleu devient actif au clic */}
                        {isBlue && (
                          <motion.div className="pointer-events-none absolute -inset-[2px] rounded-full border border-[#0F3460]"
                            animate={{ opacity: [0, 0, 1, 1] }}
                            transition={{ duration: PPD, repeat: Infinity, times: [0, 0.64, 0.68, 0.97] }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase 3 — Champ de texte sélectionné */}
          <motion.div className="absolute inset-x-1.5 top-1.5 space-y-1.5"
            animate={{ opacity: [0, 0, 0, 1, 1] }}
            transition={{ duration: PPD, repeat: Infinity, times: [0, 0.80, 0.83, 0.85, 1.0] }}
          >
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
              <div className="flex items-center gap-1 border-b border-[#e2e8f0] px-2 py-1">
                <svg viewBox="0 0 24 24" className="h-[7px] w-[7px] flex-shrink-0 text-[#0F3460]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                <span className="text-[5px] font-semibold text-[#0F172A]">Propriétés</span>
              </div>
              <div className="space-y-1.5 px-2 py-1.5">
                <div className="flex items-center gap-1 rounded-md bg-[#f1f4f8] px-1.5 py-0.5">
                  <span className="text-[6px] text-[#0F3460]">▤</span>
                  <span className="text-[4.5px] font-medium text-[#0F172A]">Champ de texte</span>
                </div>
                {/* Largeur de bordure */}
                <div>
                  <span className="text-[3.5px] font-bold uppercase tracking-widest text-[#94a3b8]">Largeur de bordure</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#f1f4f8] border border-[#e2e8f0]">
                      <motion.div className="h-full rounded-full bg-[#0F3460]"
                        animate={{ width: ['15%', '15%', '50%'] }}
                        transition={{ duration: PPD, repeat: Infinity, times: [0, 0.85, 0.93], ease: 'easeOut' }}
                      />
                    </div>
                    <motion.span className="text-[4px] font-mono tabular-nums text-[#334155]"
                      animate={{ children: undefined } as never}
                    >
                      <motion.span
                        animate={{ opacity: [1, 1, 0] }}
                        transition={{ duration: PPD, repeat: Infinity, times: [0, 0.85, 0.93] }}
                        className="absolute"
                      >0.5</motion.span>
                      <motion.span
                        animate={{ opacity: [0, 0, 1] }}
                        transition={{ duration: PPD, repeat: Infinity, times: [0, 0.85, 0.93] }}
                        className="absolute"
                      >2.0</motion.span>
                      <span className="invisible">2.0</span>
                    </motion.span>
                  </div>
                </div>
                {/* Couleur bordure */}
                <div>
                  <span className="text-[3.5px] font-bold uppercase tracking-widest text-[#94a3b8]">Couleur bordure</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <motion.div className="h-[10px] w-[10px] rounded border border-[#e2e8f0]"
                      animate={{ backgroundColor: ['#979DA2', '#979DA2', '#334155'] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.87, 0.93] }}
                    />
                    <motion.span className="absolute text-[4px] text-[#334155]"
                      animate={{ opacity: [1, 1, 0] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.87, 0.93] }}
                    >#979DA2</motion.span>
                    <motion.span className="absolute text-[4px] text-[#334155]"
                      animate={{ opacity: [0, 0, 1] }}
                      transition={{ duration: PPD, repeat: Infinity, times: [0, 0.87, 0.93] }}
                    >#334155</motion.span>
                    <span className="invisible text-[4px]">#334155</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CURSEUR unique — chemin Label → Bouton → CdT ── */}
      <motion.div className="pointer-events-none absolute z-30" style={{ left: 0, top: 0 }}
        animate={{ x: ppCXk, y: ppCYk, opacity: ppCOp }}
        transition={{ duration: PPD, repeat: Infinity, times: ppCT, ease: 'easeInOut' }}
      >
        <svg width="13" height="16" viewBox="0 0 13 17" fill="none">
          <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1.2" />
        </svg>
      </motion.div>

    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// 6. AI — onglet IA, frappe prompt, thinking, widgets construits 1 par 1 (LIGHT canvas)
//    Sidebar + canvas vide → clic «Assistant IA» → dark-blue panel → type prompt
//    → thinking dots → raisonnement ligne par ligne → 4 widgets construits dans canvas
// ════════════════════════════════════════════════════════════════════════════════

const AID = 15;  // durée totale (s)

// Timings normalisés (× AID = secondes réelles)
const AI_TAB_T  = 0.08;   // clic onglet «Assistant IA»
const AI_TYPE_S = 0.14;   // début frappe prompt
const AI_TYPE_E = 0.30;   // fin frappe prompt
const AI_SEND_T = 0.34;   // clic bouton envoyer
const AI_THINK_E = 0.50;  // fin thinking dots
const AI_W1_T   = 0.53;   // Label apparaît dans canvas
const AI_W2_T   = 0.62;   // Champ de texte apparaît
const AI_W3_T   = 0.71;   // Champ mot de passe apparaît
const AI_W4_T   = 0.80;   // Bouton apparaît
const AI_RESP_T = 0.85;   // bulle réponse IA
const AI_HOLD_T = 0.94;   // pause finale avant loop

// Positions absolues curseur — conteneur ≈ 350 × 152 px
// Panneau IA commence à x = PP_SB + PP_CW + 8 = 72 + 148 + 8 = 228
const AI_TX = 316; const AI_TY = 10;   // centre onglet «Assistant IA»
const AI_IX = 250; const AI_IY = 140;  // textarea saisie
const AI_SX = 330; const AI_SY = 140;  // bouton envoyer ↑

// Curseur 11 keyframes
const aiCT  = [0, 0.04, AI_TAB_T, AI_TAB_T+0.02, AI_TYPE_S-0.02, AI_TYPE_S, AI_SEND_T-0.03, AI_SEND_T, AI_SEND_T+0.03, AI_HOLD_T, 1.0];
const aiCXk = [360, AI_TX, AI_TX, AI_TX, AI_IX, AI_IX, AI_SX, AI_SX, AI_SX, AI_SX, 360];
const aiCYk = [60,  AI_TY, AI_TY, AI_TY, AI_IY, AI_IY, AI_SY, AI_SY, AI_SY, AI_SY, 60];
const aiCOp = [0,   1,     1,     1,     1,     1,     1,     1,     0,     0,     0];

const AIPanelAnim: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f3f6fb]">
      <LightDotGrid />
      <div className="absolute inset-0 flex">

        {/* ── SIDEBAR compacte (identique PropertiesEditAnim) ── */}
        <div className="relative flex flex-col overflow-hidden border-r border-[#d1d9e6] bg-white" style={{ width: PP_SB }}>
          <div className="flex-shrink-0 border-b border-[#e2e8f0] bg-white px-1 pb-1 pt-1.5">
            <div className="grid h-[18px] w-full grid-cols-2 rounded-lg border border-[#e2e8f0] bg-[#f1f4f8] p-[2px]">
              <div className="flex items-center justify-center gap-[1.5px] rounded-md bg-[#0F3460] shadow-sm">
                <svg viewBox="0 0 24 24" className="h-[5px] w-[5px] text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
                <span className="text-[3.5px] font-bold text-white">Composants</span>
              </div>
              <div className="flex items-center justify-center gap-[1.5px]">
                <svg viewBox="0 0 24 24" className="h-[5px] w-[5px] text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="text-[3.5px] text-[#64748b]">Expl.</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 border-b border-[#e2e8f0] px-1.5 py-1">
            <div className="flex items-center justify-between">
              <span className="text-[4px] font-medium text-[#64748b]">Bibliothèque</span>
              <span className="rounded-full border border-[#e2e8f0] bg-[#f1f4f8] px-0.5 text-[3.5px] text-[#94a3b8]">26</span>
            </div>
          </div>
          <div className="flex-shrink-0 px-1 py-[2px]">
            <span className="text-[3px] font-bold uppercase tracking-widest text-[#94a3b8]">Basiques</span>
          </div>
          <div className="flex flex-col gap-[1.5px] overflow-hidden px-1 pb-1">
            {sidebarWidgetRows.map((w) => (
              <div key={w.name} className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-[#f5f7fa] px-1 py-[1px]">
                <span className="text-[5px] text-[#0F3460]/70">{w.icon}</span>
                <span className="truncate text-[3.5px] font-medium text-[#334155]">{w.name}</span>
              </div>
            ))}
            <div className="mt-0.5 border-b border-[#e2e8f0] pb-[1px]">
              <span className="text-[3px] font-bold uppercase tracking-widest text-[#94a3b8]">Interactions</span>
            </div>
            <div className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-[#f5f7fa] px-1 py-[1px]">
              <span className="text-[5px] text-[#0F3460]/70">☑</span>
              <span className="text-[3.5px] font-medium text-[#334155]">Case à cocher</span>
            </div>
            <div className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-[#f5f7fa] px-1 py-[1px]">
              <span className="text-[5px] text-[#0F3460]/70">◉</span>
              <span className="text-[3.5px] font-medium text-[#334155]">Bouton radio</span>
            </div>
          </div>
        </div>

        {/* ── CANVAS — vide au départ, widgets construits 1 par 1 ── */}
        <div className="relative overflow-hidden bg-[#f3f6fb] pl-2 pt-2" style={{ width: PP_CW + 8 }}>
          <div className="relative flex flex-col overflow-hidden rounded-xl border border-[#d1d9e6] bg-white shadow-[0_4px_16px_rgba(15,52,96,0.08)]"
            style={{ width: PP_CW, height: PP_CH }}>
            {/* Chrome macOS */}
            <div className="flex h-[12px] flex-shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-1.5">
              <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#ff5f57]" />
              <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#febc2e]" />
              <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#28c840]" />
              <span className="mx-auto text-[3.5px] text-[#8a94a6]">Mon Application</span>
            </div>
            {/* Canvas body — vide + dot-grid */}
            <div className="relative flex-1 overflow-hidden bg-white">
              <div className="absolute inset-0 pointer-events-none"
                style={{ opacity: 0.30, backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.18) 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />

              {/* Label (1er) */}
              <motion.div className="absolute flex items-center justify-center overflow-hidden rounded-sm"
                style={{ left: ppWl.x, top: ppWl.y, width: ppWl.w, height: ppWl.h, border: '1px solid #cbd5e1', background: '#f8fafc' }}
                animate={{ scale: [0, 0, 1.1, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_W1_T-0.01, AI_W1_T+0.03, AI_W1_T+0.07, AI_HOLD_T, AI_HOLD_T+0.02] }}
              >
                <span style={{ fontSize: '4.5px', fontWeight: 700, color: '#0f172a' }}>Se connecter</span>
              </motion.div>

              {/* Champ de texte (2e) */}
              <motion.div className="absolute flex items-center overflow-hidden rounded-sm px-1"
                style={{ left: ppWc.x, top: ppWc.y, width: ppWc.w, height: ppWc.h, border: '1.5px solid #334155', background: '#F9F9FA' }}
                animate={{ scale: [0, 0, 1.1, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_W2_T-0.01, AI_W2_T+0.03, AI_W2_T+0.07, AI_HOLD_T, AI_HOLD_T+0.02] }}
              >
                <span style={{ fontSize: '4.5px', color: '#94a3b8' }}>Email</span>
              </motion.div>

              {/* Champ mot de passe (3e) */}
              <motion.div className="absolute flex items-center overflow-hidden rounded-sm px-1"
                style={{ left: ppWp.x, top: ppWp.y, width: ppWp.w, height: ppWp.h, border: '1.5px solid #334155', background: '#F9F9FA' }}
                animate={{ scale: [0, 0, 1.1, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_W3_T-0.01, AI_W3_T+0.03, AI_W3_T+0.07, AI_HOLD_T, AI_HOLD_T+0.02] }}
              >
                <span style={{ fontSize: '4.5px', color: '#94a3b8' }}>••••••</span>
              </motion.div>

              {/* Bouton (4e) */}
              <motion.div className="absolute flex items-center justify-center overflow-hidden rounded-sm"
                style={{ left: ppWb.x, top: ppWb.y, width: ppWb.w, height: ppWb.h, background: '#0F3460' }}
                animate={{ scale: [0, 0, 1.1, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_W4_T-0.01, AI_W4_T+0.03, AI_W4_T+0.07, AI_HOLD_T, AI_HOLD_T+0.02] }}
              >
                <span style={{ fontSize: '4.5px', fontWeight: 700, color: '#ffffff' }}>Connexion</span>
              </motion.div>

              {/* Flash ring jaune à chaque apparition */}
              {[
                { w: ppWl, t: AI_W1_T },
                { w: ppWc, t: AI_W2_T },
                { w: ppWp, t: AI_W3_T },
                { w: ppWb, t: AI_W4_T },
              ].map(({ w, t }, i) => (
                <motion.div key={i} className="pointer-events-none absolute rounded-sm"
                  style={{ left: w.x-2, top: w.y-2, width: w.w+4, height: w.h+4,
                    border: '1.5px solid #eab308', boxShadow: '0 0 6px 1px #eab30855' }}
                  animate={{ opacity: [0, 0, 1, 0, 0] }}
                  transition={{ duration: AID, repeat: Infinity, times: [0, t, t+0.02, t+0.07, 1] }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── PANNEAU IA (droite) ── */}
        <div className="relative flex flex-1 flex-col overflow-hidden">

          {/* Barre d'onglets — transitions light → dark au clic */}
          <motion.div className="flex shrink-0 gap-0.5 border-b p-1"
            animate={{
              backgroundColor: ['#f3f6fb', '#f3f6fb', '#0f325c', '#0f325c', '#0f325c', '#f3f6fb'],
              borderBottomColor: ['#d1d9e6', '#d1d9e6', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.25)', '#d1d9e6'],
            }}
            transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T-0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
          >
            {/* Onglet Propriétés — actif au départ, inactif après clic IA */}
            <motion.div className="flex flex-1 items-center justify-center gap-[2px] rounded py-0.5"
              animate={{
                backgroundColor: ['#0F3460', '#0F3460', 'transparent', 'transparent', 'transparent', '#0F3460'],
              }}
              transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T-0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
            >
              <span style={{ fontSize: '4px', color: '#ffffff' }}>⊝</span>
              <span style={{ fontSize: '4px', color: '#ffffff' }}>Propriétés</span>
            </motion.div>
            {/* Onglet Assistant IA — inactif au départ, actif après clic */}
            <motion.div className="flex flex-1 items-center justify-center gap-[2px] rounded py-0.5"
              animate={{
                backgroundColor: ['transparent', 'transparent', '#ffffff', '#ffffff', '#ffffff', 'transparent'],
              }}
              transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T-0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
            >
              <motion.span
                animate={{ color: ['#64748b', '#64748b', '#10345e', '#10345e', '#10345e', '#64748b'] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T-0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
                style={{ fontSize: '6px' }}
              >✦</motion.span>
              <motion.span
                animate={{ color: ['#64748b', '#64748b', '#10345e', '#10345e', '#10345e', '#64748b'] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T-0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
                style={{ fontSize: '4px', fontWeight: 700 }}
              >Assistant IA</motion.span>
            </motion.div>
          </motion.div>

          {/* Corps du panneau */}
          <motion.div className="relative flex flex-1 flex-col overflow-hidden"
            animate={{ backgroundColor: ['#f3f6fb', '#f3f6fb', '#0e2f57', '#0e2f57', '#0e2f57', '#f3f6fb'] }}
            transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T-0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
          >
            {/* Placeholder propriétés (mode light, avant bascule) */}
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
              animate={{ opacity: [1, 1, 0, 0, 0, 1] }}
              transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T-0.01, AI_TAB_T+0.04, AI_HOLD_T, AI_HOLD_T+0.02, 1] }}
            >
              <span className="text-[6px] text-[#94a3b8]">Propriétés</span>
              <span className="text-[5px] text-[#cbd5e1]">Sélectionnez un widget</span>
            </motion.div>

            {/* Header Dayanna */}
            <motion.div className="shrink-0 flex items-center gap-1 border-b border-white/20 bg-[#123a67] px-2 py-1"
              animate={{ opacity: [0, 0, 1, 1, 1, 0] }}
              transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T+0.03, AI_TAB_T+0.06, AI_HOLD_T, AI_HOLD_T+0.02, 1] }}
            >
              <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-blue-400/20">
                <span className="text-[7px] text-blue-200">✦</span>
              </div>
              <span className="text-[5.5px] font-bold text-white">Dayanna</span>
              <span className="ml-auto text-[4px] text-blue-300/50">co-pilote IA</span>
            </motion.div>

            {/* Zone chat */}
            <div className="relative flex flex-1 flex-col gap-1 overflow-hidden px-1.5 py-1">

              {/* Bulle utilisateur */}
              <motion.div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm px-1.5 py-0.5"
                style={{ background: '#1d4ed8' }}
                animate={{ opacity: [0, 0, 0, 1, 1, 0], y: [4, 4, 4, 0, 0, 4] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T+0.06, AI_SEND_T, AI_SEND_T+0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
              >
                <span className="text-[4.5px] text-white">Génère une interface de connexion</span>
              </motion.div>

              {/* Points thinking */}
              <motion.div className="flex items-center gap-1 rounded-xl rounded-tl-sm px-2 py-1"
                style={{ background: 'rgba(30,64,175,0.3)', border: '1px solid rgba(96,165,250,0.2)' }}
                animate={{ opacity: [0, 0, 1, 0, 0] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_SEND_T+0.02, AI_SEND_T+0.04, AI_THINK_E+0.02, AI_THINK_E+0.04] }}
              >
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="rounded-full"
                    style={{ width: 3.5, height: 3.5, background: 'rgba(147,197,253,0.85)' }}
                    animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
                <span className="ml-1 text-[4px]" style={{ color: 'rgba(147,197,253,0.7)' }}>Génération…</span>
              </motion.div>

              {/* Lignes de raisonnement */}
              {[
                { text: 'Analyse de la demande…',            t: AI_W1_T - 0.06 },
                { text: 'Label "Se connecter" ajouté',       t: AI_W1_T },
                { text: 'Champs Email & Mot de passe créés', t: AI_W2_T },
                { text: 'Bouton Connexion ajouté',           t: AI_W4_T },
              ].map(({ text, t }, i) => (
                <motion.div key={i} className="flex items-start gap-0.5"
                  animate={{ opacity: [0, 0, 1, 1, 0], x: [-4, -4, 0, 0, -4] }}
                  transition={{ duration: AID, repeat: Infinity, times: [0, t, t+0.02, AI_HOLD_T, AI_HOLD_T+0.02] }}
                >
                  <span className="mt-0.5 shrink-0 text-[5px] text-[#eab308]">✓</span>
                  <span className="text-[4px] leading-relaxed" style={{ color: 'rgba(186,230,253,0.85)' }}>{text}</span>
                </motion.div>
              ))}

              {/* Bulle réponse IA */}
              <motion.div className="rounded-xl rounded-tl-sm px-1.5 py-1"
                style={{ background: 'rgba(30,64,175,0.25)', border: '1px solid rgba(96,165,250,0.15)' }}
                animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 4] }}
                transition={{ duration: AID, repeat: Infinity, times: [0, AI_RESP_T-0.01, AI_RESP_T, AI_HOLD_T, AI_HOLD_T+0.02] }}
              >
                <span className="text-[4px] leading-relaxed" style={{ color: 'rgba(186,230,253,0.9)' }}>
                  Interface générée — 4 widgets ajoutés au canvas.
                </span>
              </motion.div>

            </div>

            {/* Zone de saisie */}
            <motion.div className="shrink-0 border-t border-white/10 px-1.5 py-1"
              animate={{ opacity: [0, 0, 1, 1, 1, 0] }}
              transition={{ duration: AID, repeat: Infinity, times: [0, AI_TAB_T+0.03, AI_TAB_T+0.06, AI_HOLD_T, AI_HOLD_T+0.02, 1] }}
            >
              <div className="relative flex items-center rounded-xl px-2 py-1"
                style={{ minHeight: 22, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {/* Texte tapé progressivement */}
                <motion.div className="overflow-hidden whitespace-nowrap"
                  animate={{ clipPath: ['inset(0 100% 0 0)', 'inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 0)', 'inset(0 100% 0 0)', 'inset(0 100% 0 0)'] }}
                  transition={{ duration: AID, repeat: Infinity, times: [0, AI_TYPE_S, AI_TYPE_E, AI_SEND_T+0.01, AI_SEND_T+0.03, 1], ease: 'linear' }}
                >
                  <span style={{ fontSize: '5.5px', color: 'rgba(186,230,253,0.9)' }}>Génère une interface de connexion</span>
                </motion.div>
                {/* Curseur clignotant */}
                <motion.div
                  style={{ width: 1, height: 8, borderRadius: 2, background: 'rgba(147,197,253,0.9)', marginLeft: 1, flexShrink: 0 }}
                  animate={{ opacity: [1, 0, 1, 0, 1, 0] }}
                  transition={{ duration: 0.65, repeat: Infinity }}
                />
                {/* Bouton envoyer ↑ */}
                <motion.div className="absolute right-1.5 flex items-center justify-center rounded-lg"
                  style={{ width: 16, height: 16, background: '#1d4ed8' }}
                  animate={{ scale: [1, 1, 1, 1.25, 1, 1], opacity: [0.35, 0.35, 1, 1, 0.35, 0.35] }}
                  transition={{ duration: AID, repeat: Infinity, times: [0, AI_TYPE_E, AI_SEND_T-0.03, AI_SEND_T, AI_SEND_T+0.03, 1] }}
                >
                  <span style={{ fontSize: '7px', fontWeight: 700, color: '#ffffff' }}>↑</span>
                </motion.div>
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* ── Curseur souris ── */}
        <motion.div className="pointer-events-none absolute z-50"
          animate={{ x: aiCXk, y: aiCYk, opacity: aiCOp }}
          transition={{ duration: AID, repeat: Infinity, times: aiCT, ease: 'easeInOut' }}
        >
          <svg width="13" height="16" viewBox="0 0 13 17" fill="none">
            <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1.2" />
          </svg>
        </motion.div>

      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// 7. PREVIEW — interactions réalistes : email, mdp masqué, hover, clic, succès
//    Light theme · formulaire généré par l'IA · curseur unique
// ════════════════════════════════════════════════════════════════════════════════

const PSD    = 16;
const PS_APP  = 0.05;
const PS_EF   = 0.11;   // focus email
const PS_ET_S = 0.13;   // frappe email début
const PS_ET_E = 0.35;   // frappe email fin
const PS_EB   = 0.38;   // email blur
const PS_PF   = 0.42;   // focus password
const PS_PT_S = 0.44;   // frappe mdp début
const PS_PT_E = 0.57;   // frappe mdp fin
const PS_PB   = 0.60;   // password blur
const PS_BH   = 0.64;   // hover bouton
const PS_BC   = 0.68;   // clic
const PS_BC_E = 0.71;   // clic retombé
const PS_SP   = 0.75;   // spinner (après que le bouton soit revenu normal)
const PS_SE   = 0.85;   // succès
const PS_HOLD = 0.93;

// Positions absolues curseur (card left=95, centre X=180)
const PS_MX = 180;
const PS_EY = 47;   // email centre Y
const PS_PY = 64;   // password centre Y
const PS_BY = 81;   // bouton centre Y

const psCT  = [0,    0.04,  PS_EF,  PS_EB,  PS_PF,  PS_PB,  PS_BH,  PS_BC_E, 1.0  ];
const psCXk = [360,  PS_MX, PS_MX,  PS_MX,  PS_MX,  PS_MX,  PS_MX,  PS_MX,   360  ];
const psCYk = [80,   PS_EY, PS_EY,  PS_PY,  PS_PY,  PS_BY,  PS_BY,  PS_BY,   80   ];
const psCOp = [0,    0,     1,      1,      1,      1,      1,      0,       0    ];

const PreviewSimAnim: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#f3f6fb]">
    <LightDotGrid />

    {/* Badge Aperçu */}
    <div className="absolute left-1/2 top-1.5 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#d1d9e6] bg-white px-2 py-0.5 shadow-sm">
      <span style={{ fontSize: '5px', color: '#0F3460' }}>👁</span>
      <span style={{ fontSize: '5px', fontWeight: 600, color: '#0F3460' }}>Aperçu</span>
    </div>

    {/* ── Fenêtre app (formulaire généré par l'IA) ── */}
    <motion.div
      className="absolute overflow-hidden rounded-xl border border-[#d1d9e6] bg-white shadow-[0_6px_28px_rgba(15,52,96,0.13)]"
      style={{ width: 170, left: 95, top: 13 }}
      animate={{ opacity: [0,0,1,1,0], scale: [0.93,0.93,1,1,0.96] }}
      transition={{ duration: PSD, repeat: Infinity, times: [0, PS_APP-0.01, PS_APP+0.04, PS_HOLD, PS_HOLD+0.02] }}
    >
      {/* Chrome macOS */}
      <div className="flex h-[12px] shrink-0 items-center gap-[3px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-1.5">
        <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#ff5f57]" />
        <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#febc2e]" />
        <div className="h-[3.5px] w-[3.5px] rounded-full bg-[#28c840]" />
        <span className="mx-auto text-[3.5px] text-[#8a94a6]">Mon Application</span>
      </div>

      {/* Corps formulaire */}
      <div className="flex flex-col items-center gap-[5px] px-3 pb-2 pt-2">
        <span style={{ fontSize: '7px', fontWeight: 700, color: '#0f172a' }}>Se connecter</span>

        {/* ── Champ Email ── */}
        <motion.div
          className="relative flex w-full items-center overflow-hidden rounded-sm px-1.5"
          style={{ height: 14, background: '#F9F9FA', borderWidth: '1.5px', borderStyle: 'solid' }}
          animate={{ borderColor: ['#334155','#334155','#1d4ed8','#1d4ed8','#334155','#334155'] }}
          transition={{ duration: PSD, repeat: Infinity, times: [0, PS_EF-0.01, PS_EF, PS_EB, PS_EB+0.02, 1] }}
        >
          {/* Focus glow */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-sm"
            animate={{ boxShadow: ['0 0 0 0px transparent','0 0 0 0px transparent','0 0 0 2px rgba(29,78,216,0.20)','0 0 0 2px rgba(29,78,216,0.20)','0 0 0 0px transparent','0 0 0 0px transparent'] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_EF-0.01, PS_EF, PS_EB, PS_EB+0.02, 1] }}
          />
          {/* Placeholder */}
          <motion.span
            style={{ fontSize: '4px', color: '#94a3b8', position: 'absolute' }}
            animate={{ opacity: [1,1,0,0,0,0] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_EF, PS_EF+0.01, PS_ET_E, PS_HOLD, 1] }}
          >Email</motion.span>
          {/* Texte tapé */}
          <motion.div
            className="overflow-hidden whitespace-nowrap"
            style={{ fontSize: '5px', color: '#334155' }}
            animate={{ clipPath: ['inset(0 100% 0 0)','inset(0 100% 0 0)','inset(0 0% 0 0)','inset(0 0% 0 0)'] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_ET_S, PS_ET_E, 1], ease: 'linear' }}
          >notorious@py.com</motion.div>
          {/* Caret clignotant */}
          <motion.div
            style={{ width: 1, height: 8, background: '#1d4ed8', borderRadius: 1, marginLeft: 1, flexShrink: 0 }}
            animate={{ opacity: [0,0,1,0,0] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_ET_S-0.01, PS_ET_S, PS_ET_E, 1] }}
          />
        </motion.div>

        {/* ── Champ Mot de passe ── */}
        <motion.div
          className="relative flex w-full items-center overflow-hidden rounded-sm px-1.5"
          style={{ height: 14, background: '#F9F9FA', borderWidth: '1.5px', borderStyle: 'solid' }}
          animate={{ borderColor: ['#334155','#334155','#1d4ed8','#1d4ed8','#334155','#334155'] }}
          transition={{ duration: PSD, repeat: Infinity, times: [0, PS_PF-0.01, PS_PF, PS_PB, PS_PB+0.02, 1] }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-sm"
            animate={{ boxShadow: ['0 0 0 0px transparent','0 0 0 0px transparent','0 0 0 2px rgba(29,78,216,0.20)','0 0 0 2px rgba(29,78,216,0.20)','0 0 0 0px transparent','0 0 0 0px transparent'] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_PF-0.01, PS_PF, PS_PB, PS_PB+0.02, 1] }}
          />
          <motion.span
            style={{ fontSize: '4px', color: '#94a3b8', position: 'absolute' }}
            animate={{ opacity: [1,1,0,0,0] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_PF, PS_PF+0.01, PS_HOLD, 1] }}
          >Mot de passe</motion.span>
          <motion.div
            className="overflow-hidden whitespace-nowrap"
            style={{ fontSize: '8px', letterSpacing: '1.5px', color: '#334155', lineHeight: 1 }}
            animate={{ clipPath: ['inset(0 100% 0 0)','inset(0 100% 0 0)','inset(0 0% 0 0)','inset(0 0% 0 0)'] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_PT_S, PS_PT_E, 1], ease: 'linear' }}
          >●●●●●●●●</motion.div>
          <motion.div
            style={{ width: 1, height: 8, background: '#1d4ed8', borderRadius: 1, marginLeft: 1, flexShrink: 0 }}
            animate={{ opacity: [0,0,1,0,0] }}
            transition={{ duration: PSD, repeat: Infinity, times: [0, PS_PT_S-0.01, PS_PT_S, PS_PT_E, 1] }}
          />
        </motion.div>

        {/* ── Bouton Connexion — hover + clic ── */}
        <motion.div
          className="flex w-full items-center justify-center rounded-sm"
          style={{ height: 17 }}
          animate={{
            backgroundColor: ['#0F3460','#0F3460','#0F3460','#1a5499','#1a5499','#0b2848','#0F3460','#0F3460'],
            scale:           [1,       1,       1,       1,       1,       0.93,    1,       1      ],
            boxShadow: [
              'none','none','none',
              '0 2px 8px rgba(15,52,96,0.22)',
              '0 2px 8px rgba(15,52,96,0.22)',
              'none','none','none',
            ],
          }}
          transition={{ duration: PSD, repeat: Infinity, times: [0, PS_PB, PS_BH-0.01, PS_BH, PS_BC-0.01, PS_BC, PS_BC_E, 1] }}
        >
          <span style={{ fontSize: '5.5px', fontWeight: 700, color: '#ffffff' }}>Connexion</span>
        </motion.div>

        {/* ── Spinner ── */}
        <motion.div
          className="rounded-full border-2 border-blue-200 border-t-[#0F3460]"
          style={{ width: 14, height: 14 }}
          animate={{ rotate: [0,0,360,720,1080,1080], opacity: [0,0,1,1,1,0] }}
          transition={{ duration: PSD, repeat: Infinity, times: [0, PS_SP-0.01, PS_SP, PS_SP+0.07, PS_SE-0.02, PS_SE] }}
        />

        {/* ── Succès ── */}
        <motion.div
          className="flex items-center gap-1"
          animate={{ opacity: [0,0,1,1,0], scale: [0.8,0.8,1,1,0.9] }}
          transition={{ duration: PSD, repeat: Infinity, times: [0, PS_SE-0.01, PS_SE+0.01, PS_HOLD, PS_HOLD+0.02] }}
        >
          <div className="flex h-[12px] w-[12px] items-center justify-center rounded-full bg-emerald-500">
            <span style={{ fontSize: '7px', fontWeight: 700, color: '#ffffff' }}>✓</span>
          </div>
          <span style={{ fontSize: '5px', fontWeight: 600, color: '#059669' }}>Connecté !</span>
        </motion.div>

      </div>
    </motion.div>

    {/* ── Curseur unique ── */}
    <motion.div
      className="pointer-events-none absolute z-50"
      animate={{ x: psCXk, y: psCYk, opacity: psCOp }}
      transition={{ duration: PSD, repeat: Infinity, times: psCT, ease: 'easeInOut' }}
    >
      <svg width="13" height="16" viewBox="0 0 13 17" fill="none">
        <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1.2" />
      </svg>
    </motion.div>

  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// 8. EXPORT — modal réelle : onglet Interface, curseur → Télécharger, animation ZIP
//    Réplique fidèle ExportModal.tsx — light/gradient header bleu + file tree
// ════════════════════════════════════════════════════════════════════════════════

const EXD       = 15;
const EX_MODAL  = 0.04;   // modale s'ouvre
const EX_DL_H   = 0.60;   // hover bouton Télécharger
const EX_DL_C   = 0.65;   // clic
const EX_PROG_S = 0.67;   // barre démarre
const EX_PROG_E = 0.83;   // 100%
const EX_TOAST  = 0.87;   // toast succès
const EX_HOLD   = 0.94;

// Curseur : off-screen → bouton Télécharger (x≈268, y≈143)
const exCT  = [0,    0.06, EX_DL_H,  EX_DL_C,  EX_DL_C+0.02, 1.0 ];
const exCXk = [360,  268,  268,       268,       360,           360 ];
const exCYk = [80,   143,  143,       143,       80,            80  ];
const exCOp = [0,    0,    1,         1,         0,             0   ];

const ExportAnim: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: '#f4f7fe' }}>
    {/* Quadrillage léger (même que la vraie modal) */}
    <div className="pointer-events-none absolute inset-0 opacity-20"
      style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

    {/* ── Modale Export ── */}
    <motion.div
      className="absolute overflow-hidden rounded-2xl border border-[#d6deec] shadow-[0_16px_48px_rgba(15,23,42,0.20)]"
      style={{ left: 14, right: 14, top: 6, bottom: 6 }}
      animate={{ opacity: [0,0,1,1,0], scale:[0.93,0.93,1,1,0.97] }}
      transition={{ duration: EXD, repeat: Infinity, times:[0, EX_MODAL-0.01, EX_MODAL+0.04, EX_HOLD, EX_HOLD+0.02] }}
    >

      {/* ── Header gradient bleu (exact ExportModal) ── */}
      <div className="relative shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1d4d8f, #255ea3, #2f6bb2)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 50%)' }} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-1.5 px-2.5 pt-2 pb-1">
          {/* Icone */}
          <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-[9px] w-[9px]">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '6px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>Exporter le Code Python</p>
            <p style={{ fontSize: '3.5px', color: 'rgba(186,230,253,0.9)' }}>Projet : <span style={{ fontWeight: 600, color: '#fff' }}>Mon Application</span></p>
          </div>
        </div>
        {/* Stats mini-badges */}
        <div className="relative flex gap-1 px-2.5 pb-2">
          {[
            { label: 'Lignes de code', value: '23' },
            { label: 'Widgets',        value: '4'  },
            { label: 'Images',         value: '0'  },
            { label: 'Fichiers ZIP',   value: '3'  },
            { label: 'Interfaces',     value: '1'  },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-0.5 rounded-lg border border-white/20 bg-white/14 px-1 py-0.5">
              <div className="flex flex-col">
                <span style={{ fontSize: '3px', color: 'rgba(186,230,253,0.8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                <span style={{ fontSize: '5px', fontWeight: 700, color: '#fff' }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toggle Interface / Code ── */}
      <div className="shrink-0 flex items-center justify-between border-b border-[#d7deeb] bg-white/90 px-2.5 py-1">
        <div className="flex items-center gap-1">
          <span className="rounded-md bg-[#e8eefb] px-1.5 py-0.5" style={{ fontSize: '4px', fontWeight: 600, color: '#2a5288' }}>app.py</span>
          <span style={{ fontSize: '3.5px', color: '#60739a' }}>Interface 1/1</span>
        </div>
        <div className="flex items-center rounded-lg border border-[#cfdbef] bg-[#f6f9ff] p-0.5">
          <div className="rounded-md px-1.5 py-0.5" style={{ background: '#2f6bb2' }}>
            <span style={{ fontSize: '4px', fontWeight: 600, color: '#fff' }}>Interface</span>
          </div>
          <div className="rounded-md px-1.5 py-0.5">
            <span style={{ fontSize: '4px', color: '#5f7397' }}>Code</span>
          </div>
        </div>
      </div>

      {/* ── Corps : arbre fichiers + prévisualisation ── */}
      <div className="flex overflow-hidden" style={{ height: 82 }}>

        {/* ─ Arbre fichiers gauche ─ */}
        <div className="shrink-0 flex flex-col overflow-hidden rounded-bl-none border-r border-[#d7deeb] bg-white/92 p-1.5" style={{ width: 80 }}>
          {/* Header arbre */}
          <div className="mb-1 flex items-center justify-between rounded-xl border border-[#d6dfec] bg-[#f8faff] px-1.5 py-0.5">
            <div className="flex items-center gap-0.5">
              <div className="flex h-[10px] w-[10px] items-center justify-center rounded-sm" style={{ background: 'linear-gradient(135deg, #387EB8, #FFD43B)' }}>
                <span style={{ fontSize: '5px', fontWeight: 700, color: '#fff' }}>P</span>
              </div>
              <span style={{ fontSize: '3.5px', fontWeight: 600, color: '#274777' }}>Mon Application</span>
            </div>
            <div className="h-[7px] w-[7px] rounded-sm border border-[#3b82f6] bg-[#3b82f6] flex items-center justify-center">
              <span style={{ fontSize: '5px', color: '#fff', fontWeight: 700, lineHeight: 1 }}>✓</span>
            </div>
          </div>
          {/* Fichiers */}
          <div className="flex flex-col gap-0.5">
            {[
              { name: 'app.py',           badge: '4 w', checked: true, active: true },
              { name: 'requirements.txt', badge: '',    checked: true, active: false },
              { name: 'README.md',        badge: '',    checked: true, active: false },
            ].map(f => (
              <div key={f.name} className={`flex items-center gap-0.5 rounded-lg px-1 py-0.5 ${f.active ? 'bg-[#eef3fc] border border-[#c2d4f0]' : ''}`}>
                <div className="h-[6px] w-[6px] shrink-0 rounded-sm border border-[#3b82f6] bg-[#3b82f6] flex items-center justify-center">
                  <span style={{ fontSize: '4px', color: '#fff', fontWeight: 700, lineHeight: 1 }}>✓</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke={f.active ? '#2f6bb2' : '#94a3b8'} strokeWidth="2" className="h-[8px] w-[8px] shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style={{ fontSize: '3.5px', color: f.active ? '#1d4d8f' : '#64748b', fontWeight: f.active ? 600 : 400 }} className="truncate">{f.name}</span>
                {f.badge && <span className="ml-auto shrink-0 rounded border border-[#e2e8f0] bg-white px-0.5" style={{ fontSize: '3px', color: '#64748b' }}>{f.badge}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ─ Prévisualisation interface (onglet Interface actif) ─ */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f4f7fe]">
          {/* Grille de fond */}
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.2) 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
          {/* Fenêtre app */}
          <div className="relative overflow-hidden rounded-xl border border-[#d6dfec] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.10)]" style={{ width: 120, height: 72 }}>
            {/* Chrome */}
            <div className="flex h-[10px] shrink-0 items-center gap-[2.5px] border-b border-[#f0f2f5] bg-[#f7f8fb] px-1">
              <div className="h-[3px] w-[3px] rounded-full bg-[#ff5f57]" />
              <div className="h-[3px] w-[3px] rounded-full bg-[#febc2e]" />
              <div className="h-[3px] w-[3px] rounded-full bg-[#28c840]" />
              <span className="mx-auto" style={{ fontSize: '3px', color: '#8a94a6' }}>Mon Application</span>
            </div>
            {/* Formulaire */}
            <div className="flex flex-col items-center gap-[3px] px-2 pt-2 pb-1">
              <span style={{ fontSize: '5.5px', fontWeight: 700, color: '#0f172a' }}>Se connecter</span>
              <div className="w-full flex items-center rounded-sm border border-[#334155] bg-[#F9F9FA] px-1" style={{ height: 9 }}>
                <span style={{ fontSize: '3.5px', color: '#94a3b8' }}>Email</span>
              </div>
              <div className="w-full flex items-center rounded-sm border border-[#334155] bg-[#F9F9FA] px-1" style={{ height: 9 }}>
                <span style={{ fontSize: '4px', color: '#334155', letterSpacing: 1 }}>●●●●●●</span>
              </div>
              <div className="w-full flex items-center justify-center rounded-sm" style={{ height: 11, background: '#0F3460' }}>
                <span style={{ fontSize: '4px', fontWeight: 700, color: '#fff' }}>Connexion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de progression (après clic Télécharger) ── */}
      <motion.div
        className="shrink-0 overflow-hidden border-t border-[#e2e8f0] bg-[#f8fafc] px-2.5"
        style={{ height: 12 }}
        animate={{ opacity:[0,0,1,1,0] }}
        transition={{ duration: EXD, repeat: Infinity, times:[0, EX_PROG_S-0.01, EX_PROG_S, EX_TOAST, EX_TOAST+0.01] }}
      >
        <div className="flex h-full items-center gap-1.5">
          <span className="shrink-0" style={{ fontSize: '3.5px', color: '#64748b' }}>Création Mon_Application.zip…</span>
          <div className="flex-1 overflow-hidden rounded-full bg-[#e2e8f0]" style={{ height: 3.5 }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #1d4d8f, #3b82f6)' }}
              animate={{ width:['0%','0%','100%'] }}
              transition={{ duration: EXD, repeat: Infinity, times:[0, EX_PROG_S, EX_PROG_E], ease:'easeOut' }}
            />
          </div>
          <motion.span className="shrink-0" style={{ fontSize: '3.5px', fontWeight: 700, color: '#1d4d8f' }}
            animate={{ opacity:[0,0,1] }}
            transition={{ duration: EXD, repeat: Infinity, times:[0, EX_PROG_E-0.02, EX_PROG_E] }}
          >100%</motion.span>
        </div>
      </motion.div>

      {/* ── Footer : Copier + Télécharger ── */}
      <div className="flex shrink-0 items-center justify-between border-t border-[#d7deeb] bg-white/90 px-2.5 py-1">
        <span style={{ fontSize: '3.5px', color: '#94a3b8' }}>3 fichiers · ~8 KB</span>
        <div className="flex items-center gap-1.5">
          {/* Bouton Copier */}
          <div className="flex items-center gap-0.5 rounded-md border border-[#d1d9e6] bg-white px-1.5 py-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" className="h-[6px] w-[6px]">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span style={{ fontSize: '4px', color: '#334155' }}>Copier le code</span>
          </div>
          {/* Bouton Télécharger (.zip) — hover + clic */}
          <motion.div
            className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5"
            animate={{
              backgroundColor: ['#1d4d8f','#1d4d8f','#2563c4','#1a3d73','#1d4d8f','#1d4d8f'],
              scale:           [1,        1,        1,        0.90,     1.02,     1        ],
            }}
            transition={{ duration: EXD, repeat: Infinity, times:[0, EX_DL_H-0.01, EX_DL_H, EX_DL_C, EX_DL_C+0.04, EX_DL_C+0.06] }}
          >
            <motion.svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-[7px] w-[7px] shrink-0"
              animate={{ y:[0,0,2,0,0] }}
              transition={{ duration: EXD, repeat: Infinity, times:[0, EX_DL_H, EX_DL_C, EX_DL_C+0.04, 1] }}
            >
              <path d="M12 5v14m-7-7 7 7 7-7"/>
            </motion.svg>
            <span style={{ fontSize: '4.5px', fontWeight: 600, color: '#fff' }}>Télécharger (.zip)</span>
          </motion.div>
        </div>
      </div>
    </motion.div>

    {/* ── Animation de téléchargement (fichier quittant la modale vers le bas) ── */}
    <motion.div
      className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 overflow-hidden rounded-xl border border-[#d1fae5] bg-white px-2 shadow-[0_8px_24px_rgba(15,52,96,0.14)]"
      style={{ bottom: 10, padding: '5px 10px' }}
      animate={{ opacity:[0,0,1,1,0], y:[10,10,0,0,-4] }}
      transition={{ duration: EXD, repeat: Infinity, times:[0, EX_TOAST-0.01, EX_TOAST+0.01, EX_HOLD, EX_HOLD+0.02] }}
    >
      {/* icone ZIP */}
      <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-lg border border-[#3b82f6]/30" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="h-[10px] w-[10px]">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <span style={{ fontSize: '5.5px', fontWeight: 700, color: '#0f172a' }}>Mon_Application.zip</span>
        <span style={{ fontSize: '4px', color: '#64748b' }}>3 fichiers · téléchargé avec succès</span>
      </div>
      <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-emerald-500">
        <span style={{ fontSize: '7px', fontWeight: 700, color: '#fff' }}>✓</span>
      </div>
    </motion.div>

    {/* ── Curseur unique ── */}
    <motion.div
      className="pointer-events-none absolute z-50"
      animate={{ x: exCXk, y: exCYk, opacity: exCOp }}
      transition={{ duration: EXD, repeat: Infinity, times: exCT, ease: 'easeInOut' }}
    >
      <svg width="13" height="16" viewBox="0 0 13 17" fill="none">
        <path d="M0.5 0.5V13L3.5 10L6.2 16L8.4 15.1L5.6 9.2H9.5L0.5 0.5Z" fill="#0F3460" stroke="white" strokeWidth="1.2" />
      </svg>
    </motion.div>
  </div>
);
// ════════════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ════════════════════════════════════════════════════════════════════════════════

const ANIM_MAP: Record<string, React.FC> = {
  project:    ProjectCreationAnim,
  python:     PythonFileAnim,
  sidebar:    SidebarAnim,
  canvas:     CanvasArrangeAnim,
  properties: PropertiesEditAnim,
  ai:         AIPanelAnim,
  preview:    PreviewSimAnim,
  export:     ExportAnim,
};

export const StepAnimation: React.FC<{ animKey?: string }> = ({ animKey }) => {
  if (!animKey) return null;
  const Anim = ANIM_MAP[animKey];
  if (!Anim) return null;

  return (
    <div className="relative mx-5 mb-2 mt-1 h-[165px] overflow-hidden rounded-xl border border-white/[0.07] bg-[#070b16]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-indigo-500/[0.02]" />
      <Anim />
    </div>
  );
};
