import { ChevronDownIcon, SearchIcon, CheckCircle2Icon, CircleIcon, XCircleIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({ children, className, ...props }: TaskItemFileProps) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-foreground text-xs",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<"div"> & {
  status?: "pending" | "running" | "completed" | "error";
};

export const TaskItem = ({ children, className, status = "completed", ...props }: TaskItemProps) => (
  <div className={cn("flex items-start gap-2 text-sm", className)} {...props}>
    <span className="mt-0.5 shrink-0">
      {status === "completed" && <CheckCircle2Icon className="size-3.5 text-emerald-500" />}
      {status === "running" && <CircleIcon className="size-3.5 animate-pulse text-blue-400" />}
      {status === "pending" && <CircleIcon className="size-3.5 text-muted-foreground/60" />}
      {status === "error" && <XCircleIcon className="size-3.5 text-destructive" />}
    </span>
    <div
      className={cn(
        "text-sm",
        status === "error" ? "text-destructive" : status === "completed" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {children}
    </div>
  </div>
);

export type TaskProps = ComponentProps<typeof Collapsible> & {
  defaultExpanded?: boolean;
  isStreaming?: boolean;
};

export const Task = ({ defaultExpanded = true, className, defaultOpen, isStreaming: _isStreaming, ...props }: TaskProps) => (
  <Collapsible className={cn(className)} defaultOpen={defaultOpen ?? defaultExpanded} {...props} />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
};

export const TaskTrigger = ({ children, className, title, ...props }: TaskTriggerProps) => (
  <CollapsibleTrigger asChild className={cn("group", className)} {...props}>
    {children ?? (
      <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
        <SearchIcon className="size-4" />
        <p className="text-sm">{title}</p>
        <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </div>
    )}
  </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({ children, className, ...props }: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className,
    )}
    {...props}
  >
    <div className="mt-4 space-y-2 border-muted border-l-2 pl-4">{children}</div>
  </CollapsibleContent>
);
