import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function Plan({ 
  children, 
  defaultOpen = false,
  className 
}: { 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <PlanContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={cn("border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden", className)}>
        {children}
      </div>
    </PlanContext.Provider>
  );
}

export function PlanHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 flex items-start justify-between gap-4", className)}>
      {children}
    </div>
  );
}

export function PlanTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-sm font-semibold text-zinc-100", className)}>
      {children}
    </h2>
  );
}

export function PlanDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs text-zinc-400 mt-1 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function PlanTrigger() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("PlanTrigger must be used within Plan");
  
  return (
    <button 
      onClick={() => context.setIsOpen(!context.isOpen)}
      className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors"
    >
      {context.isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );
}

export function PlanContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const context = useContext(PlanContext);
  if (!context) throw new Error("PlanContent must be used within Plan");

  return (
    <AnimatePresence>
      {context.isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className={cn("p-4 pt-0 border-t border-zinc-800/50 mt-4", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PlanFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 border-t border-zinc-800 flex items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function PlanAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
