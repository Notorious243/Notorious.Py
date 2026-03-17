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
  Zap
} from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ open, onOpenChange }) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';


  const shortcuts = [
    {
      category: 'Essentiels',
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      items: [
        { keys: [modKey, 'Z'], description: 'Annuler' },
        { keys: [modKey, 'Shift', 'Z'], description: 'Rétablir' },
        { keys: [modKey, 'S'], description: 'Enregistrer' },
      ],
    },
    {
      category: 'Presse-papiers',
      icon: <Copy className="h-4 w-4 text-violet-500" />,
      items: [
        { keys: [modKey, 'C'], description: 'Copier' },
        { keys: [modKey, 'X'], description: 'Couper' },
        { keys: [modKey, 'V'], description: 'Coller' },
      ],
    },
    {
      category: 'Édition & Suppression',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      items: [
        { keys: ['Delete'], description: 'Supprimer' },
        { keys: ['Backspace'], description: 'Supprimer (alt)' },
        { keys: ['Esc'], description: 'Désélectionner' },
      ],
    },
    {
      category: 'Déplacement',
      icon: <ArrowUp className="h-4 w-4 text-emerald-500" />,
      items: [
        { keys: ['↑', '↓', '←', '→'], description: 'Déplacer (1px)' },
        { keys: ['Shift', 'Arrows'], description: 'Déplacer (10px)' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl bg-transparent ring-0">

        {/* Header Glassmorphism */}
        <div className="p-6 pb-4 bg-background/80 backdrop-blur-xl border-b border-white/10 dark:border-white/5 z-10 relative">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-light tracking-tight">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <Keyboard className="h-5 w-5" />
              </div>
              Raccourcis Clavier
            </DialogTitle>
            <DialogDescription className="text-base ml-1">
              Boostez votre productivité avec ces commandes.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 pt-6 overflow-y-auto bg-card/95 backdrop-blur-xl space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div
                key={section.category}
                className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors duration-300"
              >
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground/90 uppercase tracking-wider mb-2">
                  {section.icon}
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-1 group"
                    >
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all">
                        {item.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            {key === '+' ? (
                              <span className="text-muted-foreground/50 text-xs px-1">+</span>
                            ) : (
                              <kbd className="inline-flex items-center justify-center min-w-[24px] h-7 px-2 py-1 text-[11px] font-bold font-mono text-foreground bg-background border-b-2 border-border shadow-sm rounded-md tracking-widest whitespace-nowrap">
                                {key === 'Arrows' ? <span className="text-xs">⇤ ⇥</span> : key}
                              </kbd>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <div className="shrink-0 pt-1">
                <MousePointer2 className="h-5 w-5 text-violet-500" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-violet-600 dark:text-violet-400 text-sm">Astuces Souris</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Maintenez <kbd className="font-mono text-xs bg-background/50 px-1 rounded border border-border/50">Shift</kbd> lors du redimensionnement pour conserver les proportions, ou lors du déplacement pour aligner sur les axes.
                  Double-cliquez sur un widget pour éditer son texte rapidement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-3 px-6 bg-muted/40 border-t border-border/40 text-xs text-center text-muted-foreground">
          Appuyez sur <kbd className="font-mono bg-background px-1 rounded border border-border">?</kbd> à tout moment pour rouvrir la visite guidée.
        </div>

      </DialogContent>
    </Dialog>
  );
};
