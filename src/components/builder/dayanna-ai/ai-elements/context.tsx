import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, Database, Zap, Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Usage {
  cachedInputTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
}

interface ContextContextType {
  maxTokens: number;
  modelId: string;
  usage: Usage;
  usedTokens: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ContextContext = createContext<ContextContextType | undefined>(undefined);

export function Context({ 
  children, 
  maxTokens, 
  modelId, 
  usage, 
  usedTokens 
}: { 
  children: React.ReactNode; 
  maxTokens: number; 
  modelId: string; 
  usage: Usage; 
  usedTokens: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ContextContext.Provider value={{ maxTokens, modelId, usage, usedTokens, isOpen, setIsOpen }}>
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>
    </ContextContext.Provider>
  );
}

export function ContextTrigger() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextTrigger must be used within Context");
  const { usedTokens, maxTokens, isOpen } = context;
  const percentage = (usedTokens / maxTokens) * 100;
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1 py-1 rounded-full transition-all duration-300 group cursor-default bg-transparent border-none"
      )}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="10"
            cy="10"
            r={radius}
            className="stroke-border fill-none"
            strokeWidth="1.5"
          />
          <motion.circle
            cx="10"
            cy="10"
            r={radius}
            className="stroke-primary fill-none"
            strokeWidth="1.5"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Database className={cn("w-2 h-2 transition-colors", isOpen ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
        </div>
      </div>
      <span className={cn("text-[9px] font-bold transition-colors tabular-nums", isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export function ContextContent({ children }: { children: React.ReactNode }) {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextContent must be used within Context");
  const { isOpen } = context;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="absolute bottom-full right-[-12px] max-[420px]:right-0 z-[260] mb-4 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-lg pointer-events-auto"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ContextContentHeader() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextContentHeader must be used within Context");
  const { modelId } = context;

  return (
    <div className="px-4 py-3 border-b border-border bg-secondary/30">
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground tracking-tight">
          Model Context
        </span>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
        {modelId}
      </div>
    </div>
  );
}

export function ContextContentBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 space-y-3">
      {children}
    </div>
  );
}

function UsageItem({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3 h-3", color)} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-[11px] font-mono text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

export function ContextInputUsage() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextInputUsage must be used within Context");
  return <UsageItem icon={Zap} label="Input Tokens" value={context.usage.inputTokens} color="text-primary" />;
}

export function ContextOutputUsage() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextOutputUsage must be used within Context");
  return <UsageItem icon={Sparkles} label="Output Tokens" value={context.usage.outputTokens} color="text-purple-400" />;
}

export function ContextReasoningUsage() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextReasoningUsage must be used within Context");
  return <UsageItem icon={Info} label="Reasoning Tokens" value={context.usage.reasoningTokens} color="text-amber-400" />;
}

export function ContextCacheUsage() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextCacheUsage must be used within Context");
  return <UsageItem icon={History} label="Cached Tokens" value={context.usage.cachedInputTokens} color="text-emerald-400" />;
}

export function ContextContentFooter() {
  const context = useContext(ContextContext);
  if (!context) throw new Error("ContextContentFooter must be used within Context");
  const { usedTokens, maxTokens } = context;
  const percentage = (usedTokens / maxTokens) * 100;

  return (
    <div className="px-4 py-3 bg-secondary/20 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Total Usage</span>
        <span className="text-[10px] font-mono text-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}
