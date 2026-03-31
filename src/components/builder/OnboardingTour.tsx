import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTheme } from 'next-themes';

interface OnboardingTourProps {
  isFirstTime: boolean;
  onComplete: () => void;
}

const START_ONBOARDING_TOUR_EVENT = 'dayanna:start-onboarding-tour';

// SVG Icons as strings for driver.js HTML content - Modern Software Style
const Icons = {
  Sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#sparkle-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0F3460"/><stop offset="100%" stop-color="#1F5AA0"/></linearGradient></defs><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  LayoutGrid: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#grid-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
  MousePointer: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#pointer-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="pointer-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>`,
  Sliders: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#slider-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="slider-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1F5AA0"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>`,
  FilePlus: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#fileplus-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="fileplus-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#14b8a6"/></linearGradient></defs><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>`,
  PlayCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#play-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="play-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  Download: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#download-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="download-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#f97316"/></linearGradient></defs><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  CheckCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#check-gradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="check-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#22c55e"/></linearGradient></defs><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
};

// ── Shared CSS builder ──────────────────────────────────────────────────
const buildTourCSS = (isDark: boolean): string => `
  .driver-popover.driverjs-theme {
    background: ${isDark
      ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'};
    color: ${isDark ? '#f8fafc' : '#0f172a'};
    border-radius: 20px;
    border: 1px solid ${isDark ? 'rgba(15, 52, 96, 0.2)' : 'rgba(15, 52, 96, 0.15)'};
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(15, 52, 96, 0.1);
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    max-width: 360px;
    overflow: hidden;
  }
  .driver-popover.driverjs-theme .driver-popover-title {
    font-size: 18px; font-weight: 700; margin: 0;
    padding: 24px 24px 12px 24px;
    display: flex; align-items: center; gap: 12px;
    background: ${isDark
      ? 'linear-gradient(135deg, rgba(15, 52, 96, 0.15) 0%, rgba(15, 52, 96, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(15, 52, 96, 0.08) 0%, rgba(15, 52, 96, 0.05) 100%)'};
    border-bottom: 1px solid ${isDark ? 'rgba(15, 52, 96, 0.1)' : 'rgba(15, 52, 96, 0.08)'};
  }
  .driver-popover.driverjs-theme .driver-popover-title svg {
    filter: drop-shadow(0 2px 4px rgba(15, 52, 96, 0.3));
  }
  .driver-popover.driverjs-theme .driver-popover-description {
    font-size: 15px; line-height: 1.7;
    color: ${isDark ? '#cbd5e1' : '#475569'};
    padding: 16px 24px; margin: 0;
  }
  .driver-popover.driverjs-theme .driver-popover-description p { margin: 0 0 10px 0; }
  .driver-popover.driverjs-theme .driver-popover-description p:last-child { margin-bottom: 0; }
  .driver-popover.driverjs-theme .driver-popover-description strong {
    color: ${isDark ? '#f8fafc' : '#0f172a'}; font-weight: 600;
  }
  .tour-focus {
    margin-top: 10px; padding: 10px 12px; border-radius: 10px;
    border: 1px solid ${isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(59, 130, 246, 0.22)'};
    background: ${isDark ? 'rgba(30, 64, 175, 0.15)' : 'rgba(239, 246, 255, 0.9)'};
    font-size: 12px; font-weight: 600;
    color: ${isDark ? '#bfdbfe' : '#1e40af'};
  }
  .driver-popover.driverjs-theme .driver-popover-footer {
    margin: 0; padding: 16px 24px 20px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: ${isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)'};
    border-top: 1px solid ${isDark ? 'rgba(15, 52, 96, 0.1)' : 'rgba(15, 52, 96, 0.08)'};
  }
  .driver-popover.driverjs-theme .driver-popover-progress-text {
    font-size: 13px; font-weight: 500;
    color: ${isDark ? '#94a3b8' : '#64748b'};
    background: ${isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)'};
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid ${isDark ? 'rgba(15, 52, 96, 0.15)' : 'rgba(15, 52, 96, 0.1)'};
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn {
    background: linear-gradient(135deg, #0F3460 0%, #1F5AA0 100%);
    color: white; text-shadow: none; border: none; border-radius: 12px;
    padding: 10px 20px; font-size: 14px; font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 14px rgba(15, 52, 96, 0.4);
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(15, 52, 96, 0.5);
    background: linear-gradient(135deg, #0C2B52 0%, #0F3460 100%);
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn:active {
    transform: translateY(0);
  }
  .driver-popover.driverjs-theme button.driver-popover-prev-btn {
    border: 1px solid ${isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.2)'};
    color: ${isDark ? '#94a3b8' : '#64748b'};
    background: transparent; border-radius: 12px;
    padding: 10px 18px; font-size: 14px; font-weight: 500;
    transition: all 0.2s ease;
  }
  .driver-popover.driverjs-theme button.driver-popover-prev-btn:hover {
    background: ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.08)'};
    color: ${isDark ? '#e2e8f0' : '#475569'};
  }
  .driver-popover.driverjs-theme button.driver-popover-close-btn {
    color: #94a3b8; width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s ease; top: 16px; right: 16px;
  }
  .driver-popover.driverjs-theme button.driver-popover-close-btn:hover {
    background: ${isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)'};
    color: #ef4444;
  }
  .driver-popover-arrow {
    border-top-color: ${isDark ? '#1e293b' : '#ffffff'} !important;
  }
  .driver-overlay {
    background: rgba(15, 23, 42, 0.56) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  .driver-active-element {
    outline: none !important; filter: none !important; opacity: 1 !important;
    box-shadow:
      0 0 0 2px ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.85)'},
      0 0 0 9px ${isDark ? 'rgba(15,52,96,0.45)' : 'rgba(15,52,96,0.32)'},
      0 0 36px ${isDark ? 'rgba(15,52,96,0.45)' : 'rgba(15,52,96,0.28)'} !important;
    border-radius: 12px !important;
    animation: driverPulse 1.6s ease-in-out infinite;
  }
  .driver-stage { filter: none !important; opacity: 1 !important; }
  @keyframes driverPulse {
    0%, 100% {
      box-shadow:
        0 0 0 2px ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.85)'},
        0 0 0 9px ${isDark ? 'rgba(15,52,96,0.45)' : 'rgba(15,52,96,0.32)'},
        0 0 36px ${isDark ? 'rgba(15,52,96,0.45)' : 'rgba(15,52,96,0.28)'};
    }
    50% {
      box-shadow:
        0 0 0 2px ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.85)'},
        0 0 0 11px ${isDark ? 'rgba(15,52,96,0.52)' : 'rgba(15,52,96,0.4)'},
        0 0 44px ${isDark ? 'rgba(15,52,96,0.5)' : 'rgba(15,52,96,0.34)'};
    }
  }
`;

// ── Shared tour steps builder ───────────────────────────────────────────
const buildTourSteps = (isDark: boolean) => [
  {
    element: 'body',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.Sparkles} <span style="background: linear-gradient(135deg, #0F3460 0%, #1F5AA0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Bienvenue</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p style="margin-bottom: 12px;">
            Bienvenue dans <strong>Notorious.PY</strong>, l'outil moderne pour créer des interfaces CustomTkinter.
          </p>
          <p style="margin-bottom: 0; color: ${isDark ? '#94a3b8' : '#64748b'};">
            Ce guide rapide vous présentera les fonctionnalités clés en <strong style="color: ${isDark ? '#f8fafc' : '#0f172a'};">moins de 2 minutes</strong>.
          </p>
          <div class="tour-focus">Focus: suivez le halo lumineux pour identifier la zone guidée.</div>
        </div>
      `,
      side: 'over' as const,
      align: 'center' as const
    }
  },
  {
    element: '.widget-sidebar',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.LayoutGrid} <span>Widgets</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p style="margin-bottom: 10px;">
            Votre boîte à outils. Glissez-déposez les composants depuis cette barre latérale vers le canvas.
          </p>
          <div class="tour-focus">Zone clé: bibliothèque des composants.</div>
        </div>
      `,
      side: 'right' as const,
      align: 'start' as const
    }
  },
  {
    element: '.canvas-container',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.MousePointer} <span>Canvas</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p style="margin-bottom: 10px;">
            Votre espace de travail principal. Positionnez, redimensionnez et organisez votre interface ici.
          </p>
          <div class="tour-focus">Zone clé: surface de construction de l'interface.</div>
        </div>
      `,
      side: 'left' as const,
      align: 'center' as const
    }
  },
  {
    element: '.properties-panel-container',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 10px;">${Icons.Sliders} <span>Propriétés</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p style="margin-bottom: 10px;">
            Sélectionnez un widget pour modifier ses propriétés : texte, couleurs, dimensions, etc.
          </p>
          <div class="tour-focus">Zone clé: panneau de configuration du widget actif.</div>
        </div>
      `,
      side: 'left' as const,
      align: 'start' as const
    }
  },
  {
    element: '[data-tour-first-py-file-button], [data-tour-create-file-button]',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.FilePlus} <span>Premier fichier .py</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p style="margin-bottom: 10px;">
            Créez maintenant votre premier fichier Python en cliquant sur <strong>Nouveau Fichier</strong>.
          </p>
          <p style="margin-bottom: 0;">
            Saisissez un nom (ex: <strong>main.py</strong>) puis validez avec <strong>Entrée</strong>.
          </p>
          <div class="tour-focus">Action guidée: cette étape initialise votre structure de projet Python.</div>
        </div>
      `,
      side: 'bottom' as const,
      align: 'start' as const
    }
  },
  {
    element: '[data-preview-toggle]',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.PlayCircle} <span>Aperçu</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p>
            Testez l'interactivité de votre interface en temps réel.
          </p>
          <div class="tour-focus">Zone clé: bascule édition/aperçu en un clic.</div>
        </div>
      `,
      side: 'bottom' as const,
      align: 'end' as const
    }
  },
  {
    element: '[data-export-button]',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.Download} <span>Exporter</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p>
            Générez et copiez le code Python final en un clic.
          </p>
          <div class="tour-focus">Zone clé: export direct vers votre projet Python.</div>
        </div>
      `,
      side: 'bottom' as const,
      align: 'center' as const
    }
  },
  {
    element: 'body',
    popover: {
      title: `<div style="display: flex; align-items: center; gap: 12px;">${Icons.CheckCircle} <span style="background: linear-gradient(135deg, #10b981 0%, #22c55e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Prêt !</span></div>`,
      description: `
        <div style="padding: 4px 0;">
          <p>
            Vous avez tout ce qu'il faut. Bon codage !
          </p>
        </div>
      `,
      side: 'over' as const,
      align: 'center' as const
    }
  }
];

// ── Shared driver launcher ──────────────────────────────────────────────
const launchTour = (isDark: boolean, onComplete?: () => void) => {
  const style = document.createElement('style');
  style.innerHTML = buildTourCSS(isDark);
  document.head.appendChild(style);

  const driverObj = driver({
    showProgress: true,
    stagePadding: 12,
    stageRadius: 12,
    animate: true,
    showButtons: ['next', 'previous', 'close'],
    nextBtnText: 'Suivant',
    prevBtnText: 'Précédent',
    doneBtnText: 'Commencer !',
    progressText: '{{current}} / {{total}}',
    popoverClass: 'driverjs-theme',
    onDestroyStarted: () => {
      driverObj.destroy();
      onComplete?.();
      document.head.removeChild(style);
    },
    steps: buildTourSteps(isDark),
  });

  driverObj.drive();
};

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isFirstTime, onComplete }) => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!isFirstTime) return;

    const timer = setTimeout(() => {
      launchTour(resolvedTheme === 'dark', onComplete);
    }, 500);

    return () => clearTimeout(timer);
  }, [isFirstTime, onComplete, resolvedTheme]);

  useEffect(() => {
    const handleStartTour = () => {
      launchTour(resolvedTheme === 'dark', onComplete);
    };

    window.addEventListener(START_ONBOARDING_TOUR_EVENT, handleStartTour);
    return () => window.removeEventListener(START_ONBOARDING_TOUR_EVENT, handleStartTour);
  }, [onComplete, resolvedTheme]);

  return null;
};

export default OnboardingTour;
