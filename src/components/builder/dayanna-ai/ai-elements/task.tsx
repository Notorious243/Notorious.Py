import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, CheckCircle2, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStreaming: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function Task({ 
  children, 
  className,
  defaultExpanded = false,
  isStreaming = false
}: { 
  children: React.ReactNode; 
  className?: string;
  defaultExpanded?: boolean;
  isStreaming?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <TaskContext.Provider value={{ isOpen, setIsOpen, isStreaming }}>
      <div className={cn("my-2 overflow-hidden", className)}>
        {children}
      </div>
    </TaskContext.Provider>
  );
}

export function TaskTrigger({ title }: { title: string }) {
  const context = useContext(TaskContext);
  if (!context) throw new Error("TaskTrigger must be used within Task");
  const { isOpen, setIsOpen, isStreaming } = context;

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors group"
    >
      <div className={cn(
        "transition-transform duration-200",
        isOpen ? "rotate-0" : "-rotate-90"
      )}>
        <ChevronDown className="w-3 h-3" />
      </div>
      <span>{title}</span>
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

export function TaskContent({ children }: { children: React.ReactNode }) {
  const context = useContext(TaskContext);
  if (!context) throw new Error("TaskContent must be used within Task");
  const { isOpen } = context;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-2 pb-1 space-y-1 border-l border-zinc-800 ml-1.5 pl-3">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TaskItem({ children, status = 'completed' }: { children: React.ReactNode; status?: 'pending' | 'running' | 'completed' | 'error' }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-zinc-800/30 transition-colors group">
      <div className={cn(
        "flex items-center justify-center shrink-0",
        status === 'completed' ? "text-emerald-500" : 
        status === 'running' ? "text-sky-500" : 
        status === 'error' ? "text-red-500" : "text-zinc-600"
      )}>
        {status === 'completed' ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : status === 'running' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Circle className="w-3.5 h-3.5 stroke-[3px] dash-array-10" />
          </motion.div>
        ) : status === 'error' ? (
          <XCircle className="w-3.5 h-3.5" />
        ) : (
          <Circle className="w-3.5 h-3.5" />
        )}
      </div>
      <div className={cn(
        "text-xs font-medium tracking-tight transition-colors",
        status === 'completed' ? "text-zinc-400" : 
        status === 'error' ? "text-red-400" : "text-zinc-200"
      )}>
        {children}
      </div>
    </div>
  );
}

export function TaskItemFile({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-sky-400 hover:border-sky-500/50 transition-all cursor-pointer">
      {children}
    </span>
  );
}
