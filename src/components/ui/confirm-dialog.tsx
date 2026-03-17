import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {variant === 'danger' && (
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-slate-900">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-slate-500">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="px-4"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="px-4"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
