import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  MousePointerClick,
  LayoutDashboard,
  Palette,
  Bot,
  FileCode2,
  Eye,
  Download,
  Rocket,
} from 'lucide-react';
import { OPEN_AI_SIDEBAR_EVENT, OPEN_AI_WORKSPACE_PANELS_EVENT, OPEN_PROPERTIES_SIDEBAR_EVENT } from '@/lib/aiSidebar';
import { StepAnimation } from './OnboardingAnimations';

// ── Types ───────────────────────────────────────────────────────────────────────

interface OnboardingTourProps {
  isFirstTime: boolean;
  onComplete: () => void;
}

interface TourStep {
  selector: string;
  title: string;
  subtitle: string;
  description: string;
  hint?: string;
  icon: React.ElementType;
  gradient?: boolean;
  onEnter?: () => void;
  animationKey?: string;
}

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Constants ───────────────────────────────────────────────────────────────────

const START_ONBOARDING_TOUR_EVENT = 'dayanna:start-onboarding-tour';
const SPOTLIGHT_PAD = 14;
const SPOTLIGHT_RADIUS = 16;
const CARD_GAP = 20;
const CARD_MAX_W = 400;

const openAiWorkspace = () => {
  window.dispatchEvent(new CustomEvent(OPEN_AI_WORKSPACE_PANELS_EVENT));
  window.dispatchEvent(new CustomEvent(OPEN_AI_SIDEBAR_EVENT));
};

// ── Python Glyph (shared visual) ────────────────────────────────────────────────

const PythonGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 110 110" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M53.8,4.1c-24.8,0-23.3,10.7-23.3,10.7l0,11h23.8v3.4H30.4c0,0-15.3,2.4-15.3,21.8c0,19.4,13.3,20.6,13.3,20.6h6.7v-9.6c0,0-0.4-11.2,11.4-11.2h16c0,0,10.1-0.8,10.1-10.5V14.1C72.5,14.1,72.6,4.1,53.8,4.1z M39.4,11.5c2.4,0,4.4,2,4.4,4.4c0,2.4-2,4.4-4.4,4.4c-2.4,0-4.4-2-4.4-4.4C35.1,13.5,37,11.5,39.4,11.5z" />
    <path d="M55.7,105.8c24.8,0,23.3-10.7,23.3-10.7l0-11H55.2v-3.4h23.8c0,0,15.3-2.4,15.3-21.8c0-19.4-13.3-20.6-13.3-20.6H74.3v9.6c0,0,0.4,11.2-11.4,11.2H46.9c0,0-10.1,0.8-10.1,10.5v26.2C36.9,95.8,36.8,105.8,55.7,105.8z M70.1,98.4c-2.4,0-4.4-2-4.4-4.4c0,2.4,2-4.4,4.4-4.4c2.4,0,4.4,2,4.4,4.4C74.5,96.4,72.5,98.4,70.1,98.4z" />
  </svg>
);

// ── Steps definition ────────────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  // ── 1. Bienvenue ─────────────────────────────────────────────────────────────
  {
    selector: 'body',
    title: 'Bienvenue',
    subtitle: 'Votre studio est pret',
    description:
      'Bienvenue dans Notorious.PY — le studio visuel pour creer des interfaces Python sans ecrire une seule ligne de code. En 2 minutes, decouvrez tout.',
    hint: 'Suivez le guide lumineux pas a pas',
    icon: Sparkles,
    gradient: true,
  },
  // ── 2. Creation de projet ────────────────────────────────────────────────────
  {
    selector: 'body',
    title: 'Creation de projet',
    subtitle: 'Votre espace de travail',
    description:
      'Cliquez sur l\'icone Accueil pour ouvrir l\'espace de travail. Creez un nouveau projet, donnez-lui un nom et votre canvas se deverrouille instantanement.',
    hint: 'Cliquez sur Nouveau projet pour démarrer votre interface.',
    icon: Rocket,
    animationKey: 'project',
  },
  // ── 3. Fichier Python ────────────────────────────────────────────────────────
  {
    selector: '[data-tour-first-py-file-button], [data-tour-create-file-button]',
    title: 'Fichier Python',
    subtitle: 'Creez votre premier .py',
    description:
      'Chaque ecran de votre application est un fichier .py. Cliquez sur + dans l\'onglet Explorateur, tapez le nom (ex: main.py) et confirmez.',
    hint: 'Onglet Explorateur → + → main.py',
    icon: FileCode2,
    animationKey: 'python',
  },
  // ── 4. Sidebar Composants ────────────────────────────────────────────────────
  {
    selector: '.widget-sidebar',
    title: 'Composants',
    subtitle: 'Glissez-deposez les widgets',
    description:
      'Glissez les composants depuis la sidebar vers le canvas. Ils apparaissent volontairement en desordre — c\'est le comportement normal. L\'objectif est de vous permettre de construire librement votre interface.',
    hint: 'Astuce : Ajoutez plusieurs widgets puis organisez-les ensuite.',
    icon: MousePointerClick,
    animationKey: 'sidebar',
  },
  // ── 5. Canvas — Arrangement ──────────────────────────────────────────────────
  {
    selector: '.canvas-container',
    title: 'Canvas',
    subtitle: 'Organisez votre interface',
    description:
      'Apres avoir ajoute vos widgets, reorganisez-les pour creer votre interface. Exemple : 1 Label, 2 Inputs, 1 Button — structure classique d\'un formulaire de connexion.',
    hint: 'Glissez → alignez → construisez votre interface.',
    icon: LayoutDashboard,
    animationKey: 'canvas',
  },
  // ── 6. Proprietes ────────────────────────────────────────────────────────────
  {
    selector: '.properties-panel-container',
    title: 'Proprietes',
    subtitle: 'Personnalisez chaque widget',
    description:
      'Selectionnez un widget et editez son texte, sa couleur, sa taille dans le panneau Proprietes. Renommez le label en "Connexion", changez la couleur du bouton en bleu.',
    hint: 'Selectionnez un widget → editez ses proprietes',
    icon: Palette,
    animationKey: 'properties',
    onEnter: () => window.dispatchEvent(new CustomEvent(OPEN_PROPERTIES_SIDEBAR_EVENT)),
  },
  // ── 7. Assistant IA ──────────────────────────────────────────────────────────
  {
    selector: '[data-tour-ai-tab]',
    title: 'Assistant IA',
    subtitle: 'Dayanna, votre co-pilote',
    description:
      'Activez l\'onglet IA, redigez votre besoin en francais ("Genere une interface de login") et regardez Dayanna construire les widgets un par un dans le canvas.',
    hint: 'Plus le prompt est precis, meilleur est le resultat',
    icon: Bot,
    onEnter: openAiWorkspace,
    animationKey: 'ai',
  },
  // ── 8. Apercu ────────────────────────────────────────────────────────────────
  {
    selector: '[data-preview-toggle]',
    title: 'Apercu',
    subtitle: 'Testez votre interface',
    description:
      'Basculez en mode Apercu pour simuler votre application. Tapez un email, un mot de passe (affiche en points), cliquez Connexion — et observez le retour visuel.',
    hint: 'Bouton Apercu dans la barre du haut',
    icon: Eye,
    animationKey: 'preview',
  },
  // ── 9. Export ────────────────────────────────────────────────────────────────
  {
    selector: '[data-export-button]',
    title: 'Export',
    subtitle: 'Code Python pret a deployer',
    description:
      'Exportez votre interface en code Python CustomTkinter propre. Le code est copie dans le presse-papier et le fichier .py est telecharge, pret a integrer.',
    hint: 'Bouton Exporter → copie + telechargement automatique',
    icon: Download,
    animationKey: 'export',
  },
  // ── 10. C\'est parti ! ───────────────────────────────────────────────────────
  {
    selector: 'body',
    title: 'C\'est parti !',
    subtitle: 'Vous etes pret a creer',
    description:
      'Vous connaissez desormais tout le flux : projet → fichier → widgets → proprietes → IA → apercu → export. Creez votre premiere interface professionnelle !',
    icon: Rocket,
    gradient: true,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────────

const resolveElement = (selector: string): Element | null => {
  if (selector === 'body') return null;
  const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const el = document.querySelector(part);
    if (el) return el;
  }
  return null;
};

const getRect = (el: Element | null): SpotlightRect | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return {
    x: r.left - SPOTLIGHT_PAD,
    y: r.top - SPOTLIGHT_PAD,
    width: r.width + SPOTLIGHT_PAD * 2,
    height: r.height + SPOTLIGHT_PAD * 2,
  };
};

type CardSide = 'right' | 'left' | 'bottom' | 'top' | 'center';

const computeCardPosition = (
  spot: SpotlightRect | null,
  cardW: number,
  cardH: number,
): { x: number; y: number; side: CardSide } => {
  if (!spot) {
    return {
      x: Math.round((window.innerWidth - cardW) / 2),
      y: Math.round((window.innerHeight - cardH) / 2),
      side: 'center',
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Try right
  const rightX = spot.x + spot.width + CARD_GAP;
  if (rightX + cardW < vw - 16) {
    return { x: rightX, y: Math.max(16, Math.min(spot.y, vh - cardH - 16)), side: 'right' };
  }

  // Try left
  const leftX = spot.x - CARD_GAP - cardW;
  if (leftX > 16) {
    return { x: leftX, y: Math.max(16, Math.min(spot.y, vh - cardH - 16)), side: 'left' };
  }

  // Try bottom
  const bottomY = spot.y + spot.height + CARD_GAP;
  if (bottomY + cardH < vh - 16) {
    return { x: Math.max(16, Math.min(spot.x, vw - cardW - 16)), y: bottomY, side: 'bottom' };
  }

  // Try top
  const topY = spot.y - CARD_GAP - cardH;
  if (topY > 16) {
    return { x: Math.max(16, Math.min(spot.x, vw - cardW - 16)), y: topY, side: 'top' };
  }

  // Fallback center
  return {
    x: Math.round((vw - cardW) / 2),
    y: Math.round((vh - cardH) / 2),
    side: 'center',
  };
};

// ── Spotlight Overlay ───────────────────────────────────────────────────────────

const SpotlightOverlay: React.FC<{ rect: SpotlightRect | null }> = ({ rect }) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return (
    <svg className="pointer-events-none fixed inset-0 z-[9998] h-full w-full" viewBox={`0 0 ${vw} ${vh}`}>
      <defs>
        <mask id="tour-spotlight-mask">
          <rect x="0" y="0" width={vw} height={vh} fill="white" />
          {rect && (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                rx: SPOTLIGHT_RADIUS,
                ry: SPOTLIGHT_RADIUS,
                opacity: 1,
              }}
              transition={{ type: 'spring', stiffness: 180, damping: 28 }}
              fill="black"
            />
          )}
        </mask>
      </defs>
      <rect
        x="0" y="0" width={vw} height={vh}
        fill="rgba(8, 12, 28, 0.72)"
        mask="url(#tour-spotlight-mask)"
      />
      {/* Glow ring around spotlight */}
      {rect && (
        <motion.rect
          initial={{ opacity: 0 }}
          animate={{
            x: rect.x - 3,
            y: rect.y - 3,
            width: rect.width + 6,
            height: rect.height + 6,
            rx: SPOTLIGHT_RADIUS + 3,
            ry: SPOTLIGHT_RADIUS + 3,
            opacity: 1,
          }}
          transition={{ type: 'spring', stiffness: 180, damping: 28 }}
          fill="none"
          stroke="rgba(59,130,246,0.45)"
          strokeWidth="2"
        />
      )}
      {rect && (
        <motion.rect
          initial={{ opacity: 0 }}
          animate={{
            x: rect.x - 8,
            y: rect.y - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            rx: SPOTLIGHT_RADIUS + 8,
            ry: SPOTLIGHT_RADIUS + 8,
            opacity: 0.5,
          }}
          transition={{ type: 'spring', stiffness: 180, damping: 28 }}
          fill="none"
          stroke="rgba(59,130,246,0.18)"
          strokeWidth="1.5"
        >
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.4s" repeatCount="indefinite" />
        </motion.rect>
      )}
    </svg>
  );
};

// ── Tour Card ───────────────────────────────────────────────────────────────────

interface TourCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  position: { x: number; y: number; side: CardSide };
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

const TourCard: React.FC<TourCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  position,
  onNext,
  onPrev,
  onClose,
}) => {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const Icon = step.icon;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  const enterDirection = position.side === 'left' ? 24 : position.side === 'right' ? -24 : 0;
  const enterY = position.side === 'top' ? 20 : position.side === 'bottom' ? -20 : enterDirection === 0 ? 30 : 0;

  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, x: enterDirection, y: enterY, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: 8 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-white/[0.14] shadow-[0_32px_80px_rgba(8,12,28,0.55),0_0_0_1px_rgba(255,255,255,0.06)]"
      style={{
        left: position.x,
        top: position.y,
        width: CARD_MAX_W,
        background: 'linear-gradient(165deg, rgba(15,20,38,0.97) 0%, rgba(22,30,52,0.96) 50%, rgba(15,20,38,0.98) 100%)',
        backdropFilter: 'blur(24px) saturate(1.6)',
      }}
    >
      {/* Radial glow accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className={`absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl ${isLast ? 'bg-emerald-500/[0.14]' : 'bg-blue-500/[0.12]'}`} />
        <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl ${isLast ? 'bg-blue-400/[0.10]' : 'bg-indigo-500/[0.08]'}`} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
            backgroundSize: '16px 16px',
          }}
        />
      </div>

      {isLast ? (
        /* ════════════════════════════════════════════════
         *  FINALE CARD — redesign complet
         * ════════════════════════════════════════════════ */
        <>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ── Hero ── */}
          <div className="flex flex-col items-center px-6 pb-3 pt-7 text-center">
            {/* Rocket flottant */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-4"
            >
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0.12, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl"
              />
              <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-[#054e2a] via-[#0a6e3a] to-[#0d9353] shadow-[0_12px_40px_rgba(13,147,83,0.5)]">
                <Rocket className="h-7 w-7 text-white" />
              </div>
            </motion.div>

            {/* Badge parcours terminé */}
            <motion.span
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 20 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Parcours terminé — 8 étapes
            </motion.span>

            {/* Titre */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-emerald-300 via-white to-blue-300 bg-clip-text text-[26px] font-extrabold leading-tight text-transparent"
            >
              C'est parti !
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mt-1.5 max-w-[270px] text-[12.5px] leading-relaxed text-slate-400"
            >
              Vous maîtrisez le flux complet. Créez votre première interface Python professionnelle.
            </motion.p>
          </div>

          {/* ── Grille étapes complétées ── */}
          <div className="mx-4 mb-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Étapes réalisées</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { SI: Rocket,            label: 'Projet'     },
                  { SI: FileCode2,         label: 'Fichier'    },
                  { SI: MousePointerClick, label: 'Widgets'    },
                  { SI: LayoutDashboard,   label: 'Canvas'     },
                  { SI: Palette,           label: 'Propriétés' },
                  { SI: Bot,               label: 'IA'         },
                  { SI: Eye,               label: 'Aperçu'     },
                  { SI: Download,          label: 'Export'     },
                ] as { SI: React.ElementType; label: string }[]
              ).map(({ SI, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.65 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i + 0.32, type: 'spring', stiffness: 300, damping: 22 }}
                  className="flex flex-col items-center gap-1 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.07] px-1 py-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20">
                    <SI className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="text-center text-[8px] leading-tight text-slate-400">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── 3 façons de démarrer ── */}
          <div className="mx-4 mb-5 flex flex-col gap-1.5">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Commencer par</p>
            {(
              [
                { color: '#3b82f6', mark: '✦', label: 'Nouveau projet vide',  sub: 'Partir d\'une page blanche'           },
                { color: '#8b5cf6', mark: '◈', label: 'Générer avec Dayanna', sub: 'Laisser l\'IA construire pour vous'    },
                { color: '#0d9353', mark: '◉', label: 'Cloner un template',   sub: 'Adapter un design existant'            },
              ] as { color: string; mark: string; label: string; sub: string }[]
            ).map(({ color, mark, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.55 }}
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[17px] font-bold"
                  style={{ color }}
                >
                  {mark}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-white">{label}</p>
                  <p className="text-[10.5px] text-slate-500">{sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </motion.div>
            ))}
          </div>

          {/* ── Footer finale ── */}
          <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                {totalSteps} / {totalSteps}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.10] px-3.5 text-[13px] font-medium text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Précédent
              </button>
              <button
                onClick={onNext}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-500 px-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(13,147,83,0.45)] transition-all hover:brightness-110 active:scale-[0.97]"
              >
                Commencer
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ════════════════════════════════════════════════
         *  CARTE STANDARD
         * ════════════════════════════════════════════════ */
        <>
          {/* Header */}
          <div className="relative flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -12, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-gradient-to-br from-[#0F3460] to-[#1F5AA0] shadow-[0_6px_20px_rgba(15,52,96,0.45)]"
              >
                <Icon className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md bg-blue-500/20 px-1.5 text-[10px] font-bold leading-none tracking-wider text-blue-300">
                    {String(stepIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                    {step.subtitle}
                  </span>
                </div>
                <h3
                  className={`mt-1 text-lg font-bold leading-tight ${
                    step.gradient
                      ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent'
                      : 'text-white'
                  }`}
                >
                  {step.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Micro-animation scene */}
          {step.animationKey && <StepAnimation animKey={step.animationKey} />}

          {/* Body */}
          <div className="relative px-5 py-4">
            <p className="text-[13.5px] leading-relaxed text-slate-300">{step.description}</p>
            {step.hint && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3 rounded-xl border border-blue-400/15 bg-blue-500/[0.08] px-3.5 py-2.5 text-[12px] font-medium text-blue-300"
              >
                {step.hint}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="relative flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#0F3460] to-[#3B82F6]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                {stepIndex + 1} / {totalSteps}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={onPrev}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.10] px-3.5 text-[13px] font-medium text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Precedent
                </button>
              )}
              <button
                onClick={onNext}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(15,52,96,0.4)] transition-all hover:shadow-[0_12px_32px_rgba(15,52,96,0.55)] hover:brightness-110 active:scale-[0.97]"
              >
                Suivant
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// ── Background decorations ──────────────────────────────────────────────────────

const TourBackground: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-[9997] overflow-hidden">
    <PythonGlyph className="absolute left-[6%] top-[12%] h-7 w-7 text-blue-400/[0.07]" />
    <PythonGlyph className="absolute right-[8%] top-[18%] h-6 w-6 text-blue-400/[0.05]" />
    <PythonGlyph className="absolute bottom-[16%] left-[12%] h-6 w-6 text-blue-400/[0.06]" />
    <PythonGlyph className="absolute bottom-[12%] right-[7%] h-7 w-7 text-blue-400/[0.05]" />
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────────

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isFirstTime, onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number; side: CardSide }>({
    x: 0,
    y: 0,
    side: 'center',
  });
  const cardRef = useRef<number>(0);

  // Build resolved steps (skip missing elements)
  const resolvedSteps = useMemo(() => {
    if (!isActive) return [];
    return TOUR_STEPS.filter((step) => {
      if (step.selector === 'body') return true;
      return resolveElement(step.selector) !== null;
    });
  }, [isActive]);

  const totalSteps = resolvedSteps.length;
  const step = resolvedSteps[currentStep] ?? null;

  // Position the card + spotlight for current step
  const updatePositions = useCallback(() => {
    if (!step) return;

    const el = resolveElement(step.selector);
    const rect = getRect(el);
    setSpotlightRect(rect);

    // Estimate card height (add 160px for animation scene)
    const hasAnim = !!step.animationKey;
    const baseH = step.hint ? 280 : 240;
    const estimatedH = hasAnim ? baseH + 160 : baseH;
    const pos = computeCardPosition(rect, CARD_MAX_W, estimatedH);
    setCardPosition(pos);
  }, [step]);

  // Recalc on step change & window resize
  useEffect(() => {
    if (!isActive || !step) return;

    // Fire onEnter callback
    step.onEnter?.();

    // Small delay to let DOM settle (e.g., after opening AI panel)
    const timer = window.setTimeout(() => {
      updatePositions();
    }, step.onEnter ? 200 : 50);

    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, currentStep, step, updatePositions]);

  // Start tour
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    cardRef.current += 1;
  }, []);

  // Close tour
  const closeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSpotlightRect(null);
    onComplete();
  }, [onComplete]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      closeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps, closeTour]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, goNext, goPrev, closeTour]);

  // Auto-start on first visit
  useEffect(() => {
    if (!isFirstTime) return;
    const timer = window.setTimeout(() => startTour(), 600);
    return () => window.clearTimeout(timer);
  }, [isFirstTime, startTour]);

  // Listen for manual trigger
  useEffect(() => {
    const handler = () => startTour();
    window.addEventListener(START_ONBOARDING_TOUR_EVENT, handler);
    return () => window.removeEventListener(START_ONBOARDING_TOUR_EVENT, handler);
  }, [startTour]);

  if (!isActive || !step) return null;

  return (
    <>
      {/* Clickable backdrop (click = close) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9996]"
        onClick={closeTour}
      />

      {/* Background decorations */}
      <TourBackground />

      {/* Spotlight overlay */}
      <SpotlightOverlay rect={spotlightRect} />

      {/* Tour card */}
      <AnimatePresence mode="wait">
        <TourCard
          key={`step-${currentStep}-${cardRef.current}`}
          step={step}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          position={cardPosition}
          onNext={goNext}
          onPrev={goPrev}
          onClose={closeTour}
        />
      </AnimatePresence>
    </>
  );
};

export default OnboardingTour;
