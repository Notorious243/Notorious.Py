import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

let tickAudioContext: AudioContext | null = null;
let tickAudioBuffer: AudioBuffer | null = null;

const TICK_CSS = `
.ni{
  --ni-glass:linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.66));
  --ni-border:rgba(15,23,42,0.08);
  --ni-shadow:0 0 1px rgba(15,23,42,0.04),0 2px 8px rgba(15,23,42,0.06),inset 0 1px 0 rgba(255,255,255,0.85);
  --ni-dim:rgba(15,23,42,0.46);
  --ni-mid:rgba(15,23,42,0.62);
  --ni-hi:rgba(15,23,42,0.9);
  --ni-focus:rgba(14,165,233,0.35);
  --ni-btn:rgba(15,23,42,0.03);
  --ni-btn-h:rgba(14,165,233,0.12);
  --ni-sep:rgba(15,23,42,0.08);
}
.dark .ni,[data-theme="dark"] .ni{
  --ni-glass:linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03));
  --ni-border:rgba(255,255,255,0.08);
  --ni-shadow:0 1px 3px rgba(2,8,23,0.35),inset 0 1px 0 rgba(255,255,255,0.06);
  --ni-dim:rgba(226,232,240,0.42);
  --ni-mid:rgba(226,232,240,0.65);
  --ni-hi:rgba(248,250,252,0.92);
  --ni-focus:rgba(56,189,248,0.38);
  --ni-btn:rgba(255,255,255,0.03);
  --ni-btn-h:rgba(56,189,248,0.14);
  --ni-sep:rgba(255,255,255,0.08);
}
`;

const playTick = () => {
  if (typeof window === 'undefined') return;
  try {
    if (!tickAudioContext) {
      const WebAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!WebAudioContext) return;
      tickAudioContext = new WebAudioContext();
      tickAudioBuffer = tickAudioContext.createBuffer(1, Math.floor(tickAudioContext.sampleRate * 0.003), tickAudioContext.sampleRate);
      const channel = tickAudioBuffer.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length) ** 4;
      }
    }

    if (!tickAudioContext || !tickAudioBuffer) return;
    const source = tickAudioContext.createBufferSource();
    source.buffer = tickAudioBuffer;
    const gain = tickAudioContext.createGain();
    gain.gain.value = 0.08;
    source.connect(gain).connect(tickAudioContext.destination);
    source.start();
  } catch {
    // Silent fallback if WebAudio is unavailable
  }
};

interface LazyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onValueChange: (val: string) => void;
  sound?: boolean;
}

const parseNumber = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const LazyInput: React.FC<LazyInputProps> = ({
  value,
  onValueChange,
  className,
  min,
  max,
  step = 1,
  placeholder,
  onBlur,
  onFocus,
  onKeyDown,
  sound = false,
  disabled,
  style,
  ...props
}) => {
  const [localValue, setLocalValue] = React.useState<string>(value?.toString() ?? '');
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!focused) {
      setLocalValue(value?.toString() ?? '');
    }
  }, [value, focused]);

  const numericMin = typeof min === 'number' ? min : Number.isFinite(Number(min)) ? Number(min) : undefined;
  const numericMax = typeof max === 'number' ? max : Number.isFinite(Number(max)) ? Number(max) : undefined;
  const numericStep = Number.isFinite(Number(step)) && Number(step) !== 0 ? Number(step) : 1;

  const clamp = React.useCallback((n: number) => {
    let next = n;
    if (numericMin !== undefined) next = Math.max(numericMin, next);
    if (numericMax !== undefined) next = Math.min(numericMax, next);
    return next;
  }, [numericMax, numericMin]);

  const commit = React.useCallback((raw: string) => {
    const parsed = parseNumber(raw);
    if (parsed === null) {
      setLocalValue('');
      onValueChange('');
      return;
    }
    const next = clamp(parsed);
    const output = Number.isInteger(next) ? String(next) : String(Number(next.toFixed(4)));
    setLocalValue(output);
    onValueChange(output);
  }, [clamp, onValueChange]);

  const bump = React.useCallback((direction: 1 | -1) => {
    if (disabled) return;
    const current = parseNumber(localValue) ?? (Number.isFinite(Number(value)) ? Number(value) : 0);
    const next = clamp(current + numericStep * direction);
    const output = Number.isInteger(next) ? String(next) : String(Number(next.toFixed(4)));
    setLocalValue(output);
    onValueChange(output);
    if (sound) playTick();
  }, [clamp, disabled, localValue, numericStep, onValueChange, sound, value]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TICK_CSS }} />
      <motion.div
        className="ni inline-flex w-full flex-col"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        style={style}
      >
        <div
          className="relative flex w-full items-stretch overflow-hidden rounded-lg border transition-colors"
          style={{
            background: 'var(--ni-glass)',
            borderColor: focused ? 'var(--ni-focus)' : 'var(--ni-border)',
            boxShadow: 'var(--ni-shadow)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="relative flex-1 px-2.5">
            <input
              ref={inputRef}
              {...props}
              type="text"
              inputMode="numeric"
              value={localValue}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(event) => {
                const raw = event.target.value;
                if (/^-?\d*\.?\d*$/.test(raw) || raw === '') {
                  setLocalValue(raw);
                }
              }}
              onFocus={(event) => {
                setFocused(true);
                onFocus?.(event);
              }}
              onBlur={(event) => {
                setFocused(false);
                commit(localValue);
                onBlur?.(event);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commit(localValue);
                  event.currentTarget.blur();
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  bump(1);
                } else if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  bump(-1);
                }
                onKeyDown?.(event);
              }}
              className={cn(
                'h-8 w-full border-0 bg-transparent p-0 text-xs font-medium text-[color:var(--ni-hi)] outline-none placeholder:text-[color:var(--ni-dim)] disabled:cursor-not-allowed disabled:opacity-55',
                className
              )}
              style={{
                fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>

          <div style={{ width: 1, background: 'var(--ni-sep)' }} />

          <div className="flex w-7 flex-col">
            <StepButton direction="up" disabled={disabled} onClick={() => bump(1)} />
            <div style={{ height: 1, background: 'var(--ni-sep)' }} />
            <StepButton direction="down" disabled={disabled} onClick={() => bump(-1)} />
          </div>
        </div>
      </motion.div>
    </>
  );
};

function StepButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'up' | 'down';
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.86 }}
      className="flex-1"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ni-btn)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'var(--ni-mid)',
        transition: 'background 0.15s ease',
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={(event) => {
        if (!disabled) event.currentTarget.style.background = 'var(--ni-btn-h)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'var(--ni-btn)';
      }}
    >
      <svg
        width={11}
        height={11}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === 'up' ? <path d="M4 10l4-4 4 4" /> : <path d="M4 6l4 4 4-4" />}
      </svg>
    </motion.button>
  );
}
