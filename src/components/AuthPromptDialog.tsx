import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ShieldCheck, LogIn } from 'lucide-react';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  open,
  onOpenChange,
  feature,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6">
        <AlertDialogHeader className="items-center sm:items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
          <AlertDialogTitle className="text-center text-[17px] font-semibold tracking-tight">
            Fonctionnalité verrouillée
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">{feature}</strong> nécessite un compte.
            <br />
            Connectez-vous ou créez un compte gratuit pour y accéder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0 pt-2">
          <AlertDialogAction
            className="w-full h-11 rounded-xl bg-[#0F3460] hover:bg-[#1F5AA0] text-white font-semibold shadow-md transition-all"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-auth-page'));
            }}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter
          </AlertDialogAction>
          <AlertDialogCancel className="w-full h-10 rounded-xl mt-0 sm:mt-0 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all">
            Continuer en mode invité
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
