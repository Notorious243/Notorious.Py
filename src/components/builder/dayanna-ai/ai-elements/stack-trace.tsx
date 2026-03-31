import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { AlertTriangleIcon, CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const STACK_FRAME_WITH_PARENS_REGEX = /^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/;
const STACK_FRAME_WITHOUT_FN_REGEX = /^at\s+(.+):(\d+):(\d+)$/;
const ERROR_TYPE_REGEX = /^(\w+Error|Error):\s*(.*)$/;
const AT_PREFIX_REGEX = /^at\s+/;

interface StackFrame {
  raw: string;
  functionName: string | null;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  isInternal: boolean;
}

interface ParsedStackTrace {
  errorType: string | null;
  errorMessage: string;
  frames: StackFrame[];
  raw: string;
}

interface StackTraceContextValue {
  trace: ParsedStackTrace;
  raw: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const StackTraceContext = createContext<StackTraceContextValue | null>(null);

const useStackTrace = () => {
  const context = useContext(StackTraceContext);
  if (!context) {
    throw new Error("StackTrace components must be used within StackTrace");
  }
  return context;
};

const parseStackFrame = (line: string): StackFrame => {
  const trimmed = line.trim();
  const withParensMatch = trimmed.match(STACK_FRAME_WITH_PARENS_REGEX);
  if (withParensMatch) {
    const [, functionName, filePath, lineNum, colNum] = withParensMatch;
    const isInternal =
      filePath.includes("node_modules") ||
      filePath.startsWith("node:") ||
      filePath.includes("internal/");
    return {
      raw: trimmed,
      functionName: functionName ?? null,
      filePath: filePath ?? null,
      lineNumber: lineNum ? Number.parseInt(lineNum, 10) : null,
      columnNumber: colNum ? Number.parseInt(colNum, 10) : null,
      isInternal,
    };
  }

  const withoutFnMatch = trimmed.match(STACK_FRAME_WITHOUT_FN_REGEX);
  if (withoutFnMatch) {
    const [, filePath, lineNum, colNum] = withoutFnMatch;
    const isInternal =
      (filePath?.includes("node_modules") ?? false) ||
      (filePath?.startsWith("node:") ?? false) ||
      (filePath?.includes("internal/") ?? false);
    return {
      raw: trimmed,
      functionName: null,
      filePath: filePath ?? null,
      lineNumber: lineNum ? Number.parseInt(lineNum, 10) : null,
      columnNumber: colNum ? Number.parseInt(colNum, 10) : null,
      isInternal,
    };
  }

  return {
    raw: trimmed,
    functionName: null,
    filePath: null,
    lineNumber: null,
    columnNumber: null,
    isInternal: trimmed.includes("node_modules") || trimmed.includes("node:"),
  };
};

const parseStackTrace = (trace: string): ParsedStackTrace => {
  const lines = trace.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return { errorType: null, errorMessage: trace, frames: [], raw: trace };
  }

  const firstLine = lines[0].trim();
  let errorType: string | null = null;
  let errorMessage = firstLine;
  const errorMatch = firstLine.match(ERROR_TYPE_REGEX);
  if (errorMatch) {
    errorType = errorMatch[1];
    errorMessage = errorMatch[2] || "";
  }

  const frames = lines
    .slice(1)
    .filter((line) => line.trim().startsWith("at "))
    .map(parseStackFrame);

  return { errorType, errorMessage, frames, raw: trace };
};

export type StackTraceProps = ComponentProps<"div"> & {
  trace: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const StackTrace = memo(
  ({
    trace,
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: StackTraceProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const parsedTrace = useMemo(() => parseStackTrace(trace), [trace]);
    const contextValue = useMemo(
      () => ({
        trace: parsedTrace,
        raw: trace,
        isOpen: isOpen ?? false,
        setIsOpen,
      }),
      [parsedTrace, trace, isOpen, setIsOpen],
    );

    return (
      <StackTraceContext.Provider value={contextValue}>
        <div
          className={cn(
            "not-prose w-full overflow-hidden rounded-lg border bg-background font-mono text-sm",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </StackTraceContext.Provider>
    );
  },
);

export const StackTraceHeader = memo(({ className, children, ...props }: ComponentProps<typeof CollapsibleTrigger>) => {
  const { isOpen, setIsOpen } = useStackTrace();

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger asChild {...props}>
        <div
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
            className,
          )}
        >
          {children}
        </div>
      </CollapsibleTrigger>
    </Collapsible>
  );
});

export const StackTraceError = memo(({ className, children, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-1 items-center gap-2 overflow-hidden", className)} {...props}>
    <AlertTriangleIcon className="size-4 shrink-0 text-destructive" />
    {children}
  </div>
));

export const StackTraceErrorType = memo(({ className, children, ...props }: ComponentProps<"span">) => {
  const { trace } = useStackTrace();
  return (
    <span className={cn("shrink-0 font-semibold text-destructive", className)} {...props}>
      {children ?? trace.errorType}
    </span>
  );
});

export const StackTraceErrorMessage = memo(({ className, children, ...props }: ComponentProps<"span">) => {
  const { trace } = useStackTrace();
  return (
    <span className={cn("truncate text-foreground", className)} {...props}>
      {children ?? trace.errorMessage}
    </span>
  );
});

export const StackTraceActions = memo(({ className, children, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("flex shrink-0 items-center gap-1", className)}
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") e.stopPropagation();
    }}
    role="group"
    {...props}
  >
    {children}
  </div>
));

export const StackTraceCopyButton = memo(
  ({
    onCopy,
    onError,
    timeout = 2000,
    className,
    children,
    ...props
  }: ComponentProps<typeof Button> & {
    onCopy?: () => void;
    onError?: (error: Error) => void;
    timeout?: number;
  }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { raw } = useStackTrace();

    const copyToClipboard = async () => {
      if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
        onError?.(new Error("Clipboard API not available"));
        return;
      }

      try {
        await navigator.clipboard.writeText(raw);
        setIsCopied(true);
        onCopy?.();
        setTimeout(() => setIsCopied(false), timeout);
      } catch (error) {
        onError?.(error as Error);
      }
    };

    const Icon = isCopied ? CheckIcon : CopyIcon;

    return (
      <Button
        className={cn("size-7", className)}
        onClick={copyToClipboard}
        size="icon"
        variant="ghost"
        {...props}
      >
        {children ?? <Icon size={14} />}
      </Button>
    );
  },
);

export const StackTraceExpandButton = memo(({ className, ...props }: ComponentProps<"div">) => {
  const { isOpen } = useStackTrace();
  return (
    <div className={cn("flex size-7 items-center justify-center", className)} {...props}>
      <ChevronDownIcon
        className={cn(
          "size-4 text-muted-foreground transition-transform",
          isOpen ? "rotate-180" : "rotate-0",
        )}
      />
    </div>
  );
});

export const StackTraceContent = memo(
  ({ className, maxHeight = 280, children, ...props }: ComponentProps<typeof CollapsibleContent> & { maxHeight?: number }) => {
    const { isOpen } = useStackTrace();
    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn("overflow-auto border-t bg-muted/30", className)}
          style={{ maxHeight }}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  },
);

export const StackTraceFrames = memo(
  ({ className, showInternalFrames = true, ...props }: ComponentProps<"div"> & { showInternalFrames?: boolean }) => {
    const { trace } = useStackTrace();
    const framesToShow = showInternalFrames ? trace.frames : trace.frames.filter((frame) => !frame.isInternal);

    return (
      <div className={cn("space-y-1 p-3", className)} {...props}>
        {framesToShow.map((frame, index) => (
          <div
            className={cn(
              "text-xs",
              frame.isInternal ? "text-muted-foreground/50" : "text-foreground/90",
            )}
            key={`${frame.raw}-${index}`}
          >
            <span className="text-muted-foreground">at </span>
            {frame.functionName && (
              <span className={frame.isInternal ? "" : "text-foreground"}>
                {frame.functionName}{" "}
              </span>
            )}
            {frame.filePath && (
              <>
                <span className="text-muted-foreground">(</span>
                <span>
                  {frame.filePath}
                  {frame.lineNumber !== null && `:${frame.lineNumber}`}
                  {frame.columnNumber !== null && `:${frame.columnNumber}`}
                </span>
                <span className="text-muted-foreground">)</span>
              </>
            )}
            {!(frame.filePath || frame.functionName) && (
              <span>{frame.raw.replace(AT_PREFIX_REGEX, "")}</span>
            )}
          </div>
        ))}
        {framesToShow.length === 0 && (
          <div className="text-muted-foreground text-xs">No stack frames</div>
        )}
      </div>
    );
  },
);

StackTrace.displayName = "StackTrace";
StackTraceHeader.displayName = "StackTraceHeader";
StackTraceError.displayName = "StackTraceError";
StackTraceErrorType.displayName = "StackTraceErrorType";
StackTraceErrorMessage.displayName = "StackTraceErrorMessage";
StackTraceActions.displayName = "StackTraceActions";
StackTraceCopyButton.displayName = "StackTraceCopyButton";
StackTraceExpandButton.displayName = "StackTraceExpandButton";
StackTraceContent.displayName = "StackTraceContent";
StackTraceFrames.displayName = "StackTraceFrames";
