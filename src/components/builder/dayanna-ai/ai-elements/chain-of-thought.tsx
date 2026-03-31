import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Search, Image as ImageIcon, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "./shimmer";

interface ChainOfThoughtContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isStreaming: boolean;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextType | undefined>(undefined);

export function ChainOfThought({ 
  children, 
  defaultExpanded = false,
  isStreaming = false
}: { 
  children: React.ReactNode; 
  defaultExpanded?: boolean;
  isStreaming?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <ChainOfThoughtContext.Provider value={{ isExpanded, setIsExpanded, isStreaming }}>
      <div className={cn("my-2 overflow-hidden transition-all duration-300")}>
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
}

export function ChainOfThoughtHeader({ title }: { title?: string }) {
  const context = useContext(ChainOfThoughtContext);
  if (!context) throw new Error("ChainOfThoughtHeader must be used within ChainOfThought");
  const { isExpanded, setIsExpanded, isStreaming } = context;

  const displayTitle = title || (isStreaming ? "Thinking..." : "Thought Process");

  return (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
    >
      <div className={cn(
        "transition-transform duration-200",
        isExpanded ? "rotate-0" : "-rotate-90"
      )}>
        <ChevronDown className="w-3 h-3" />
      </div>
      {isStreaming ? (
        <Shimmer className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {displayTitle}
        </Shimmer>
      ) : (
        <span>{displayTitle}</span>
      )}
      {isStreaming && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-1 h-1 bg-sky-500 rounded-full"
        />
      )}
    </button>
  );
}

export function ChainOfThoughtContent({ children }: { children: React.ReactNode }) {
  const context = useContext(ChainOfThoughtContext);
  if (!context) throw new Error("ChainOfThoughtContent must be used within ChainOfThought");
  const { isExpanded } = context;

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="ml-1.5 border-l border-border/60 pb-1 pl-3 pt-2 text-xs leading-relaxed text-muted-foreground">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChainOfThoughtStep({ 
  children, 
  status = "completed",
  title
}: { 
  children: React.ReactNode; 
  status?: "completed" | "in-progress" | "pending";
  title?: string;
}) {
  return (
    <div className="relative ml-2 space-y-1 border-l border-border/60 pl-6">
      <div className="absolute -left-[9px] top-0 rounded-full bg-card p-0.5">
        {status === "completed" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : status === "in-progress" ? (
          <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/50" />
        )}
      </div>
      {title && (
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      )}
      <div className="text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </div>
  );
}

export function ChainOfThoughtSearchResults({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {children}
    </div>
  );
}

export function ChainOfThoughtSearchResult({ 
  title, 
  url, 
  favicon 
}: { 
  title: string; 
  url: string; 
  favicon?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-2 transition-all hover:border-border hover:bg-accent/60"
    >
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-border/60 bg-card">
        {favicon ? (
          <img src={favicon} alt="" className="w-4 h-4" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-xs font-medium text-foreground/90 transition-colors group-hover:text-foreground">
          {title}
        </div>
        <div className="truncate text-[10px] uppercase tracking-tight text-muted-foreground">
          {new URL(url).hostname}
        </div>
      </div>
    </a>
  );
}

export function ChainOfThoughtImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div className="space-y-2 mt-2">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border/60 bg-card">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
          <ImageIcon className="w-3.5 h-3.5 text-white/70" />
        </div>
      </div>
      {caption && (
        <div className="px-1 text-[10px] italic text-muted-foreground">
          {caption}
        </div>
      )}
    </div>
  );
}
