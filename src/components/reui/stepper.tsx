import * as React from 'react';

import { cn } from '@/lib/utils';

type StepperContextValue = {
  value: number;
  setValue: (next: number) => void;
};

const StepperContext = React.createContext<StepperContextValue | null>(null);

const StepperItemContext = React.createContext<{ step: number } | null>(null);

const useStepperContext = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('Stepper components must be used inside <Stepper>.');
  }
  return context;
};

const useStepperItemContext = () => {
  const context = React.useContext(StepperItemContext);
  if (!context) {
    throw new Error('Stepper item components must be used inside <StepperItem>.');
  }
  return context;
};

type StepperProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (next: number) => void;
};

export function Stepper({
  value,
  defaultValue = 1,
  onValueChange,
  className,
  children,
  ...props
}: StepperProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (next: number) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <StepperContext.Provider value={{ value: activeValue, setValue }}>
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        {children}
      </div>
    </StepperContext.Provider>
  );
}

export function StepperNav({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

type StepperItemProps = React.HTMLAttributes<HTMLDivElement> & {
  step: number;
};

export function StepperItem({ step, className, children, ...props }: StepperItemProps) {
  const { value } = useStepperContext();
  const state = step === value ? 'active' : step < value ? 'completed' : 'upcoming';

  return (
    <StepperItemContext.Provider value={{ step }}>
      <div
        data-state={state}
        className={cn('group/step flex items-center gap-2', className)}
        {...props}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  );
}

export function StepperTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setValue } = useStepperContext();
  const { step } = useStepperItemContext();

  return (
    <button
      type="button"
      onClick={() => setValue(step)}
      className={cn('inline-flex items-center justify-center rounded-full', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function StepperIndicator({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600 transition-colors group-data-[state=active]/step:border-[#0F3460] group-data-[state=active]/step:bg-[#0F3460] group-data-[state=active]/step:text-white group-data-[state=completed]/step:border-[#1F5AA0] group-data-[state=completed]/step:bg-[#1F5AA0] group-data-[state=completed]/step:text-white',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StepperSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'h-0.5 w-10 rounded-full bg-slate-200 transition-colors group-data-[state=completed]/step:bg-[#1F5AA0]',
        className
      )}
      {...props}
    />
  );
}

export function StepperPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative min-h-[265px]', className)} {...props}>
      {children}
    </div>
  );
}

type StepperContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
};

export function StepperContent({ value, className, children, ...props }: StepperContentProps) {
  const context = useStepperContext();
  const isActive = context.value === value;

  return (
    <div
      data-state={isActive ? 'active' : 'inactive'}
      hidden={!isActive}
      className={cn(
        'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
