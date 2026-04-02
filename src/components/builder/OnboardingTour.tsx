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
  MessageSquareText,
  FileCode2,
  Eye,
  Download,
  Rocket,
} from 'lucide-react';
import { OPEN_AI_SIDEBAR_EVENT, OPEN_AI_WORKSPACE_PANELS_EVENT } from '@/lib/aiSidebar';

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
  {
    selector: 'body',
    title: 'Bienvenue',
    subtitle: 'Votre studio est pret',
    description:
      'Bienvenue dans Notorious.PY, votre studio de creation d\'interfaces Python. En moins de 2 minutes, decouvrez les zones essentielles.',
    hint: 'Suivez le guide lumineux pas a pas',
    icon: Sparkles,
    gradient: true,
  },
  {
    selector: '.widget-sidebar',
    title: 'Composants',
    subtitle: 'Bibliotheque de widgets',
    description:
      'Glissez-deposez les composants depuis cette palette pour construire votre interface. Boutons, champs, labels, sliders et bien plus.',
    hint: 'Glisser → deposer sur le canvas',
    icon: MousePointerClick,
  },
  {
    selector: '.canvas-container',
    title: 'Canvas',
    subtitle: 'Zone de design visuel',
    description:
      'Le canvas central est votre espace de creation. Positionnez et redimensionnez vos widgets en temps reel pour composer l\'ecran.',
    hint: 'Cliquez, deplacez, redimensionnez',
    icon: LayoutDashboard,
  },
  {
    selector: '.properties-panel-container',
    title: 'Proprietes',
    subtitle: 'Reglages et styles',
    description:
      'Ajustez finement les couleurs, dimensions, textes et comportements de chaque widget selectionne ou du canvas global.',
    hint: 'Selectionnez un widget pour voir ses options',
    icon: Palette,
  },
  {
    selector: '[data-tour-ai-tab]',
    title: 'Assistant IA',
    subtitle: 'Dayanna, votre co-pilote',
    description:
      'Activez l\'assistant IA pour generer des interfaces completes, modifier des layouts ou obtenir des suggestions intelligentes.',
    hint: 'Decrivez ce que vous voulez en francais',
    icon: Bot,
    onEnter: openAiWorkspace,
  },
  {
    selector: '[data-tour-ai-input], [data-tour-ai-tab]',
    title: 'Prompt IA',
    subtitle: 'Ecrivez, l\'IA construit',
    description:
      'Redigez votre besoin en langage naturel : layout, style, comportement. Plus votre prompt est precis, meilleur sera le resultat.',
    hint: 'Exemple : "Dashboard pharmacie avec sidebar et stats"',
    icon: MessageSquareText,
    onEnter: openAiWorkspace,
  },
  {
    selector: '[data-tour-first-py-file-button], [data-tour-create-file-button]',
    title: 'Fichier Python',
    subtitle: 'Point de depart du projet',
    description:
      'Initialisez votre premier fichier .py pour demarrer. Chaque fichier represente un ecran de votre application.',
    hint: 'Un clic pour commencer',
    icon: FileCode2,
  },
  {
    selector: '[data-preview-toggle]',
    title: 'Apercu',
    subtitle: 'Controle qualite visuel',
    description:
      'Basculez entre le mode edition et le mode apercu pour visualiser le rendu final de votre interface avant l\'export.',
    hint: 'Raccourci pratique pour valider le design',
    icon: Eye,
  },
  {
    selector: '[data-export-button]',
    title: 'Export',
    subtitle: 'Code Python pret',
    description:
      'Exportez votre interface en code Python CustomTkinter propre et fonctionnel, pret a integrer dans votre projet.',
    hint: 'Sortie vers la production en un clic',
    icon: Download,
  },
  {
    selector: 'body',
    title: 'C\'est parti !',
    subtitle: 'Vous etes pret a creer',
    description:
      'Votre environnement est configure. Concevez des interfaces professionnelles avec ou sans assistance IA. Bonne creation !',
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
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-blue-500/[0.12] blur-2xl" />
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-indigo-500/[0.08] blur-2xl" />
        {/* Dot grid subtle */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
            backgroundSize: '16px 16px',
          }}
        />
      </div>

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
        {/* Progress */}
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

        {/* Navigation */}
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
            {isLast ? 'Commencer' : 'Suivant'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
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

    // Estimate card height
    const estimatedH = step.hint ? 280 : 240;
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
        exit={{ opacity: 0 }}
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
