import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  ArrowUp,
  Copy,
  Trash2,
  Keyboard,
  MousePointer2,
  Zap,
  Sparkles
} from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ open, onOpenChange }) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'Essentiels',
      tone: 'amber',
      icon: <Zap className="h-4 w-4" />,
      items: [
        { keys: [modKey, 'Z'], description: 'Annuler' },
        { keys: [modKey, 'Shift', 'Z'], description: 'Rétablir' },
        { keys: [modKey, 'S'], description: 'Enregistrer' },
      ],
    },
    {
      category: 'Presse-papiers',
      tone: 'blue',
      icon: <Copy className="h-4 w-4" />,
      items: [
        { keys: [modKey, 'C'], description: 'Copier' },
        { keys: [modKey, 'X'], description: 'Couper' },
        { keys: [modKey, 'V'], description: 'Coller' },
      ],
    },
    {
      category: 'Édition & Suppression',
      tone: 'rose',
      icon: <Trash2 className="h-4 w-4" />,
      items: [
        { keys: ['Delete'], description: 'Supprimer' },
        { keys: ['Backspace'], description: 'Supprimer (alt)' },
        { keys: ['Esc'], description: 'Désélectionner' },
      ],
    },
    {
      category: 'Déplacement',
      tone: 'emerald',
      icon: <ArrowUp className="h-4 w-4" />,
      items: [
        { keys: ['↑', '↓', '←', '→'], description: 'Déplacer (1px)', separator: 'space' as const },
        { keys: ['Shift', 'Arrows'], description: 'Déplacer (10px)' },
      ],
    },
  ];

  const toneStyles: Record<string, { icon: string; badge: string; card: string }> = {
    amber: {
      icon: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
      badge: 'text-amber-700',
      card: 'border-amber-100',
    },
    blue: {
      icon: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
      badge: 'text-blue-700',
      card: 'border-blue-100',
    },
    rose: {
      icon: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
      badge: 'text-rose-700',
      card: 'border-rose-100',
    },
    emerald: {
      icon: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
      badge: 'text-emerald-700',
      card: 'border-emerald-100',
    },
  };

  const renderKey = (key: string) => {
    if (key === 'Arrows') return '← ↑ ↓ →';
    return key;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col w-[min(90vw,780px)] max-w-2xl max-h-[78vh] overflow-hidden p-0 gap-0 border border-[#89a9d6]/35 bg-[#f7fbff] shadow-[0_30px_80px_rgba(15,52,96,0.28)] [&>button]:right-3 [&>button]:top-3 [&>button]:z-30 [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center [&>button]:h-8 [&>button]:w-8 [&>button]:rounded-md [&>button]:border [&>button]:border-white/45 [&>button]:bg-[#0f3460]/80 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-[#0f3460] [&>button]:hover:text-white [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-white/70"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-[#7a9bc7]/35 bg-gradient-to-r from-[#1f4f8f] via-[#2f66ad] to-[#1f4f8f] p-3.5 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.38)_1px,transparent_0)] [background-size:14px_14px]" />
          <DialogHeader>
            <DialogTitle className="relative flex items-center justify-between gap-4 pr-10 text-base font-semibold tracking-tight">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/35">
                <Keyboard className="h-5 w-5" />
                </span>
                Raccourcis Clavier
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/95">
                <Sparkles className="h-3.5 w-3.5" />
                {isMac ? 'macOS' : 'Windows/Linux'}
              </span>
            </DialogTitle>
            <DialogDescription className="relative mt-1 text-xs text-blue-100/95">
              Commandes principales du builder pour travailler plus vite et sans friction.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="keyboard-shortcuts-scroll flex-1 min-h-0 overflow-y-scroll overflow-x-hidden px-3.5 py-3 pb-4 space-y-3.5">
          <div className="rounded-xl border border-[#c4d8f1] bg-white px-3.5 py-2 text-xs font-medium text-[#3f5f86]">
            Touche principale de votre système: <span className="font-bold text-[#1f4f8f]">{modKey}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {shortcuts.map((section) => (
              <div
                key={section.category}
                className={`rounded-2xl border bg-white p-3 shadow-[0_8px_22px_rgba(15,52,96,0.08)] transition-colors ${toneStyles[section.tone].card}`}
              >
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneStyles[section.tone].icon}`}>
                    {section.icon}
                  </span>
                  {section.category}
                </h3>
                <div className="space-y-1.5">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50/80"
                    >
                      <span className="text-sm font-medium text-slate-600">
                        {item.description}
                      </span>
                      <div className="flex items-center justify-end gap-1.5">
                        {item.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            {keyIdx > 0 && item.separator !== 'space' && (
                              <span className="text-[11px] font-bold text-slate-400">+</span>
                            )}
                            <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold tracking-tight text-slate-700 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]">
                              {renderKey(key)}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(31,90,160,0.15)]">
              <div className="shrink-0 pt-1">
                <MousePointer2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-700">Astuces Souris</h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Maintenez <kbd className="rounded border border-blue-200 bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-blue-700">Shift</kbd> lors du redimensionnement pour conserver les proportions, ou lors du déplacement pour aligner sur les axes.
                  Double-cliquez sur un widget pour éditer son texte rapidement.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#c9d9ef] bg-white px-3.5 py-2 text-center text-xs text-slate-500">
          Astuce: appuyez sur <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">F1</kbd> pour ouvrir rapidement cette fenêtre.
        </div>
      </DialogContent>
    </Dialog>
  );
};
