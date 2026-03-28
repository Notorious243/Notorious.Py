import React, { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Message({ 
  children, 
  from, 
  className 
}: { 
  children: React.ReactNode; 
  from: "user" | "assistant";
  className?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col gap-2 w-full group",
      from === "user" ? "items-end" : "items-start",
      className
    )}>
      {children}
    </div>
  );
}

export function MessageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-full rounded-2xl", className)}>
      {children}
    </div>
  );
}

export function MessageResponse({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-sm leading-relaxed text-zinc-200", className)}>
      {children}
    </div>
  );
}

export function MessageActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {children}
    </div>
  );
}

export function MessageAction({ 
  children, 
  onClick, 
  label, 
  tooltip,
  className 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  label?: string;
  tooltip?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip || label}
      className={cn(
        "p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}

export function MessageToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mt-2", className)}>
      {children}
    </div>
  );
}

// Branching Context
interface BranchContextType {
  currentBranch: number;
  totalBranches: number;
  setBranch: (index: number) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function MessageBranch({ 
  children, 
  defaultBranch = 0,
  className 
}: { 
  children: React.ReactNode; 
  defaultBranch?: number;
  className?: string;
}) {
  const [currentBranch, setBranch] = useState(defaultBranch);
  
  // Find total branches by looking at MessageBranchContent children
  const contentChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === MessageBranchContent
  ) as React.ReactElement<{ children: React.ReactNode }> | undefined;
  
  const totalBranches = contentChild 
    ? React.Children.count(contentChild.props.children) 
    : 0;

  return (
    <BranchContext.Provider value={{ currentBranch, totalBranches, setBranch }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </BranchContext.Provider>
  );
}

export function MessageBranchContent({ children }: { children: React.ReactNode }) {
  const context = useContext(BranchContext);
  if (!context) return null;

  const branches = React.Children.toArray(children);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={context.currentBranch}
        initial={{ opacity: 0, x: 5 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -5 }}
        transition={{ duration: 0.2 }}
      >
        {branches[context.currentBranch]}
      </motion.div>
    </AnimatePresence>
  );
}

export function MessageBranchSelector({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {children}
    </div>
  );
}

export function MessageBranchPrevious() {
  const context = useContext(BranchContext);
  if (!context) return null;

  return (
    <button
      onClick={() => context.setBranch(Math.max(0, context.currentBranch - 1))}
      disabled={context.currentBranch === 0}
      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <ChevronLeft className="w-3.5 h-3.5" />
    </button>
  );
}

export function MessageBranchNext() {
  const context = useContext(BranchContext);
  if (!context) return null;

  return (
    <button
      onClick={() => context.setBranch(Math.min(context.totalBranches - 1, context.currentBranch + 1))}
      disabled={context.currentBranch === context.totalBranches - 1}
      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );
}

export function MessageBranchPage() {
  const context = useContext(BranchContext);
  if (!context) return null;

  return (
    <span className="text-[10px] font-mono text-zinc-500 px-1">
      {context.currentBranch + 1} / {context.totalBranches}
    </span>
  );
}
