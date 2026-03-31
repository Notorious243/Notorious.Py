import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Shimmer({ 
  children, 
  as: Component = "span", 
  className,
  duration = 2,
  spread = 2
}: { 
  children: React.ReactNode; 
  as?: any;
  className?: string;
  duration?: number;
  spread?: number;
}) {
  return (
    <Component
      className={cn(
        "relative inline-block overflow-hidden text-muted-foreground",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          repeat: Infinity,
          duration: duration,
          ease: "linear",
        }}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1) ${50/spread}%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) ${100 - 50/spread}%, transparent)`,
        }}
      />
    </Component>
  );
}
