"use client";

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnimatedDropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedDropdownProps {
  options: AnimatedDropdownOption[];
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };

    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

export const AnimatedDropdown: React.FC<AnimatedDropdownProps> = ({
  options,
  value,
  placeholder = 'Select option',
  onValueChange,
  className,
  buttonClassName,
  menuClassName,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setIsOpen(false));

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'group flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/85 px-3 text-left text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-800/70',
          buttonClassName
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          {selected?.icon}
          <span className={cn('truncate', !selected && 'text-slate-400 dark:text-slate-500')}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="shrink-0 text-slate-500 dark:text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 top-[calc(100%+0.45rem)] z-[70] min-w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/96 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/96',
              menuClassName
            )}
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => {
                    onValueChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2 text-left text-xs transition-colors last:border-b-0 dark:border-slate-800',
                    active
                      ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80'
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
