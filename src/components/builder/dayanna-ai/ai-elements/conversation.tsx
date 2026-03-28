import React from "react";
import { cn } from "@/lib/utils";

export function Conversation({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-3xl mx-auto", className)}>
      {children}
    </div>
  );
}

export function ConversationContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {children}
    </div>
  );
}
