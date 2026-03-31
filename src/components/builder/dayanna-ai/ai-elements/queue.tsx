import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueueMessage {
  id: string;
  parts: Array<{ text?: string; type: "text" | "file"; filename?: string; mediaType?: string; url?: string }>;
}

export interface QueueTodo {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "completed";
}

export function Queue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 w-full max-w-md", className)}>
      {children}
    </div>
  );
}

export function QueueSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ isOpen: boolean; setIsOpen: (v: boolean) => void }>, { isOpen, setIsOpen });
        }
        return child;
      })}
    </div>
  );
}

export function QueueSectionTrigger({ children, isOpen, setIsOpen }: { children: React.ReactNode; isOpen?: boolean; setIsOpen?: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => setIsOpen?.(!isOpen)}
      className="flex items-center gap-2 w-full text-left"
    >
      {isOpen ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
      {children}
    </button>
  );
}

export function QueueSectionLabel({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
      <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-500">{count}</span>
    </div>
  );
}

export function QueueSectionContent({ children, isOpen }: { children: React.ReactNode; isOpen?: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QueueList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 pl-4 border-l border-zinc-800 ml-1.5", className)}>
      {children}
    </div>
  );
}

export function QueueItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group flex flex-col gap-1 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors", className)}>
      {children}
    </div>
  );
}

export function QueueItemIndicator({ completed }: { completed?: boolean }) {
  return (
    <div className="shrink-0">
      {completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
    </div>
  );
}

export function QueueItemContent({ children, completed }: { children: React.ReactNode; completed?: boolean }) {
  return (
    <span className={cn(
      "text-xs flex-1 truncate",
      completed ? "text-zinc-500 line-through" : "text-zinc-300"
    )}>
      {children}
    </span>
  );
}

export function QueueItemDescription({ children, completed }: { children: React.ReactNode; completed?: boolean }) {
  return (
    <p className={cn(
      "text-[10px] pl-5.5",
      completed ? "text-zinc-600" : "text-zinc-500"
    )}>
      {children}
    </p>
  );
}

export function QueueItemActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
}

export function QueueItemAction({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {children}
    </button>
  );
}

export function QueueItemAttachment({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1 pl-5.5">
      {children}
    </div>
  );
}

export function QueueItemImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-8 h-8 rounded object-cover border border-zinc-700"
      referrerPolicy="no-referrer"
    />
  );
}

export function QueueItemFile({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-400">
      {children}
    </div>
  );
}
