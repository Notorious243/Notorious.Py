import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Message as MessageType, type GenerationStage } from "./types";
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from "./ai-elements/chain-of-thought";
import { Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile } from "./ai-elements/task";
import { Plan, PlanContent, PlanDescription, PlanHeader, PlanTitle, PlanTrigger } from "./ai-elements/plan";
import { Conversation, ConversationContent } from "./ai-elements/conversation";
import { 
  Message, 
  MessageContent, 
  MessageResponse, 
  MessageActions, 
  MessageAction, 
  MessageToolbar,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector
} from "./ai-elements/message";
import { 
  Attachments, 
  Attachment, 
  AttachmentPreview 
} from "./ai-elements/attachments";
import { FileTree, FileTreeFile, FileTreeFolder } from "./ai-elements/file-tree";
import {
  StackTrace,
  StackTraceActions,
  StackTraceContent,
  StackTraceCopyButton,
  StackTraceError,
  StackTraceErrorMessage,
  StackTraceErrorType,
  StackTraceExpandButton,
  StackTraceFrames,
  StackTraceHeader,
} from "./ai-elements/stack-trace";
import { Shimmer } from "./ai-elements/shimmer";
import { 
  Bot,
  RotateCcw,
  CopyIcon,
  RefreshCcwIcon, 
  ThumbsUpIcon, 
  ThumbsDownIcon,
  MessageSquare,
  Code,
  Zap,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, Fragment, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

const STAGE_LABELS: Record<GenerationStage, string> = {
  queued: 'En file',
  analyzing: 'Analyse',
  composing: 'Composition',
  validating: 'Validation',
  applying: 'Application',
  completed: 'Termine',
  failed: 'Echec',
};

const formatDuration = (durationMs?: number) => {
  if (!durationMs || durationMs <= 0) return '0s';
  const totalSeconds = Math.floor(durationMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const extractPlanTitle = (content: string): string => {
  const match = content.match(/##\s*Plan de projet:\s*(.+)/i);
  if (!match?.[1]) return "Plan de projet";
  return match[1].trim();
};

type TreeNode = {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
};

const buildPreviewTree = (paths: string[]): TreeNode[] => {
  const root: TreeNode[] = [];

  const ensureFolder = (nodes: TreeNode[], name: string, path: string): TreeNode => {
    const existing = nodes.find((node) => node.name === name && node.type === 'folder');
    if (existing) return existing;
    const folder: TreeNode = { path, name, type: 'folder', children: [] };
    nodes.push(folder);
    return folder;
  };

  const ensureFile = (nodes: TreeNode[], name: string, path: string) => {
    const existing = nodes.find((node) => node.name === name && node.type === 'file');
    if (!existing) nodes.push({ path, name, type: 'file' });
  };

  paths.forEach((path) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return;

    let cursor = root;
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = index === parts.length - 1;
      if (isLeaf) {
        ensureFile(cursor, part, currentPath);
      } else {
        const folder = ensureFolder(cursor, part, currentPath);
        if (!folder.children) folder.children = [];
        cursor = folder.children;
      }
    });
  });

  const normalize = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((node) => ({
        ...node,
        children: node.children ? normalize(node.children) : undefined,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name, 'fr');
      });

  return normalize(Array.from(root.values()));
};

interface ChatAreaProps {
  messages: MessageType[];
  isTyping: boolean;
  onRestore?: (id: string) => void;
  onSendMessage?: (content: string) => void;
  onRegenerateAssistantMessage?: (assistantMessageId: string) => void;
  isRegenerateDisabled?: boolean;
}

const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      components={{
        pre({ children }: { children?: ReactNode }) {
          return <div className="my-4">{children}</div>;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <div className="group relative rounded-xl overflow-hidden bg-slate-900 border border-border shadow-lg my-4">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700/50">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  {match[1]}
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                    toast.success("Code copie");
                  }}
                  className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-primary transition-all"
                  title="Copier le code"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: "1.25rem",
                  fontSize: "0.85rem",
                  lineHeight: "1.7",
                  background: "transparent",
                }}
                codeTagProps={{
                  style: {
                    background: "transparent",
                  }
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className={cn("bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[0.9em]", className)} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export function ChatArea({
  messages,
  isTyping,
  onRestore,
  onSendMessage,
  onRegenerateAssistantMessage,
  isRegenerateDisabled = false,
}: ChatAreaProps) {
  const [confirmingRestoreId, setConfirmingRestoreId] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping, messages]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  useEffect(() => {
    const hasRunningGeneration = messages.some((message) => message.generation?.status === 'running');
    if (!hasRunningGeneration) return;
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [messages]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copié dans le presse-papier");
    } catch {
      toast.error("Impossible de copier le message");
    }
  };

  const handleRegenerate = (messageId: string) => {
    if (isRegenerateDisabled) return;
    onRegenerateAssistantMessage?.(messageId);
  };

  const handleRestoreClick = (id: string) => {
    setConfirmingRestoreId(id);
  };

  const confirmRestore = () => {
    if (confirmingRestoreId) {
      onRestore?.(confirmingRestoreId);
      setConfirmingRestoreId(null);
    }
  };

  const ActionTooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border border-border text-[11px] text-popover-foreground whitespace-nowrap opacity-0 group-hover/action:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px w-1.5 h-1.5 bg-popover border-r border-b border-border rotate-45" />
    </div>
  );

  return (
    <div 
      ref={scrollRef}
      className="relative flex-1 overflow-x-hidden overflow-y-auto px-2 py-2.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
    >
      <AnimatePresence>
        {confirmingRestoreId && (
          <div className="absolute inset-x-3.5 top-3.5 z-[100]">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="rounded-lg border border-border/30 bg-card/95 p-3 shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-tight">Restaurer ?</h3>
                    <p className="text-[11px] text-muted-foreground">Revenir a ce point.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setConfirmingRestoreId(null)}
                    className="px-2.5 py-1.5 rounded-md bg-secondary hover:bg-accent text-muted-foreground text-[11px] font-bold uppercase transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmRestore}
                    className="px-2.5 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold uppercase transition-colors shadow-sm"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Conversation className="mx-auto w-full max-w-[900px]">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex min-h-[320px] flex-col items-center justify-center p-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/30 bg-muted/40 shadow-sm">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="mb-4 space-y-1 text-center">
                <Shimmer className="text-lg font-bold tracking-tight text-foreground" duration={2} spread={2}>
                  Comment puis-je vous aider ?
                </Shimmer>
                <p className="mx-auto max-w-[220px] text-xs text-muted-foreground leading-relaxed">
                  Dayanna, assistante IA pour Notorious.PY
                </p>
              </div>

              <div className="grid w-full max-w-[280px] grid-cols-1 gap-2">
                {[
                  { icon: Code, label: "G\u00e9n\u00e9rer une interface", prompt: "Genere-moi une page de login moderne avec un formulaire complet." },
                  { icon: MessageSquare, label: "Modifier le design", prompt: "Change les couleurs du canvas actuel pour un theme sombre professionnel." },
                  { icon: Zap, label: "Ajouter des widgets", prompt: "Ajoute un tableau de bord avec des statistiques et un graphique." },
                  { icon: Globe, label: "G\u00e9n\u00e9rer du code Python", prompt: "Genere le code Python CustomTkinter pour le canvas actuel." },
                ].map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    onClick={() => onSendMessage?.(suggestion.prompt)}
                    className="group flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 p-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/40 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <suggestion.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {suggestion.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const planMessage = message.role === 'assistant' && /##\s*Plan de projet:/i.test(message.content);
              const fileTreePreview = message.generation?.fileTreePreview;
              const treePaths = (fileTreePreview?.nodes ?? []).map((node) => node.path);
              const tree = buildPreviewTree(treePaths);

              const renderTree = (nodes: TreeNode[]) => (
                <>
                  {nodes.map((node) =>
                    node.type === 'folder' ? (
                      <FileTreeFolder key={node.path} name={node.name} path={node.path}>
                        {renderTree(node.children ?? [])}
                      </FileTreeFolder>
                    ) : (
                      <FileTreeFile key={node.path} name={node.name} path={node.path} />
                    ),
                  )}
                </>
              );

              return (
              <Fragment key={message.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group/msg mx-auto flex w-full max-w-[900px] justify-center"
                >
                  <Message from={message.role} className="mb-3.5 w-full">
                    <div className={cn(
                      "relative flex w-full gap-2.5",
                      "flex-row"
                    )}>
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3 h-3" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex-1 min-w-0 space-y-2.5",
                        "text-left"
                      )}>
                        <div className={cn(
                          "flex items-center mb-1",
                          "justify-start gap-2"
                        )}>
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              {message.role === 'user' ? "Vous" : "Dayanna"}
                            </div>
                            <span className="text-[10px] text-muted-foreground/70 font-mono">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <Attachments className={cn(
                            "mb-2",
                            "justify-start"
                          )}>
                            {message.attachments.map((att) => (
                              <Attachment key={att.id} data={att}>
                                <AttachmentPreview />
                              </Attachment>
                            ))}
                          </Attachments>
                        )}

                        {message.role === 'assistant' && message.generation?.stage && (
                          <div className="w-full rounded-xl border border-border/60 bg-card/50 p-2.5">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <Shimmer className="text-[11px] font-semibold tracking-wide text-foreground" duration={2.2} spread={1.6}>
                                {`Processus IA · ${STAGE_LABELS[message.generation.stage]}`}
                              </Shimmer>
                              <span className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest",
                                message.generation.stage === 'failed'
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-primary/15 text-primary"
                              )}>
                                {message.generation.stage}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                              <span>
                                Duree: {formatDuration(
                                  message.generation.durationMs ??
                                  (message.generation.startedAt ? clockTick - message.generation.startedAt : 0)
                                )}
                              </span>
                              {message.generation.streaming?.enabled ? (
                                <span className="truncate text-primary">
                                  Streaming · {message.generation.streaming.tokenCount ?? 0} tokens
                                </span>
                              ) : null}
                              {message.generation.errorMessage ? (
                                <span className="max-w-[65%] truncate text-destructive">{message.generation.errorMessage}</span>
                              ) : null}
                            </div>
                            {message.generation.qualitySummary ? (
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                Qualite auto: {message.generation.qualitySummary.score}% ·
                                {` ${message.generation.qualitySummary.remainingIssues}`} issue(s) restante(s)
                              </div>
                            ) : null}
                          </div>
                        )}

                        {message.tasks && message.tasks.length > 0 && (
                          <div className="w-full rounded-xl border border-border/60 bg-card/45 px-2.5 py-2">
                            <Task 
                              className="my-0 w-full" 
                              defaultExpanded={message.tasks.some(t => t.status === 'running')}
                              isStreaming={message.tasks.some(t => t.status === 'running')}
                            >
                              <TaskTrigger title="AI Actions" />
                              <TaskContent>
                                {message.tasks.map((task) => (
                                  <TaskItem key={task.id} status={task.status}>
                                    <div className="flex flex-col">
                                      <span>{task.label}</span>
                                      {task.detail ? (
                                        <span className="text-[10px] text-muted-foreground/90">{task.detail}</span>
                                      ) : null}
                                      {(() => {
                                        const trace = message.generation?.taskTrace?.find((item) => item.id === task.id);
                                        if (!trace) return null;
                                        const duration = trace.startedAt
                                          ? Math.max(0, (trace.endedAt ?? clockTick) - trace.startedAt)
                                          : 0;
                                        const filesRead = trace.filesRead ?? [];
                                        const filesWritten = trace.filesWritten ?? [];
                                        const artifactFile = trace.artifactFile;

                                        return (
                                          <div className="mt-1.5 space-y-1">
                                            {duration > 0 ? (
                                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                                                {`Duree: ${formatDuration(duration)}`}
                                              </div>
                                            ) : null}
                                            {filesRead.length > 0 ? (
                                              <div className="flex flex-wrap items-center gap-1">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Read</span>
                                                {filesRead.slice(0, 6).map((file) => (
                                                  <TaskItemFile key={`${task.id}-read-${file}`}>{file}</TaskItemFile>
                                                ))}
                                              </div>
                                            ) : null}
                                            {filesWritten.length > 0 ? (
                                              <div className="flex flex-wrap items-center gap-1">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Write</span>
                                                {filesWritten.slice(0, 6).map((file) => (
                                                  <TaskItemFile key={`${task.id}-write-${file}`}>{file}</TaskItemFile>
                                                ))}
                                              </div>
                                            ) : null}
                                            {artifactFile ? (
                                              <div className="flex flex-wrap items-center gap-1">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Artifact</span>
                                                <TaskItemFile>{artifactFile}</TaskItemFile>
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </TaskItem>
                                ))}
                              </TaskContent>
                            </Task>
                          </div>
                        )}

                        {message.reasoning && (
                          <div className="w-full rounded-xl border border-border/60 bg-card/45 px-2.5 py-2">
                            <ChainOfThought 
                              isStreaming={message.isReasoningStreaming} 
                              defaultExpanded={message.isReasoningStreaming}
                              key={`${message.id}-thought-${message.isReasoningStreaming}`}
                            >
                              <ChainOfThoughtHeader />
                              <ChainOfThoughtContent>
                                <ChainOfThoughtStep status={message.isReasoningStreaming ? "in-progress" : "completed"}>
                                  {message.reasoning}
                                </ChainOfThoughtStep>
                              </ChainOfThoughtContent>
                            </ChainOfThought>
                          </div>
                        )}
                        
                        <div className={cn(
                          "flex gap-2 w-full",
                          "flex-col items-start"
                        )}>
                          {message.role === 'assistant' && message.generation?.errorTrace ? (
                            <StackTrace trace={message.generation.errorTrace} defaultOpen={false} className="w-full border-border/70 bg-card/85">
                              <StackTraceHeader>
                                <StackTraceError>
                                  <StackTraceErrorType />
                                  <StackTraceErrorMessage />
                                </StackTraceError>
                                <StackTraceActions>
                                  <StackTraceCopyButton />
                                  <StackTraceExpandButton />
                                </StackTraceActions>
                              </StackTraceHeader>
                              <StackTraceContent>
                                <StackTraceFrames showInternalFrames={false} />
                              </StackTraceContent>
                            </StackTrace>
                          ) : null}

                          {message.role === 'assistant' && fileTreePreview && treePaths.length > 0 ? (
                            <div className="w-full rounded-xl border border-border/60 bg-card/60 p-2.5">
                              <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                {fileTreePreview.rootLabel || 'File Tree Preview'}
                              </div>
                              <FileTree
                                defaultExpanded={new Set(tree.map((node) => node.path))}
                                selectedPath={fileTreePreview.highlightedPaths[0]}
                                className="border-border/60 bg-background/40"
                              >
                                {renderTree(tree)}
                              </FileTree>
                            </div>
                          ) : null}

                          {planMessage ? (
                            <Plan defaultOpen className="w-full border-border/70 bg-card/85">
                              <PlanHeader className="pb-3">
                                <div className="min-w-0">
                                  <PlanTitle>{extractPlanTitle(message.content)}</PlanTitle>
                                  <PlanDescription>
                                    Plan multi-interfaces propose par Dayanna
                                  </PlanDescription>
                                </div>
                                <PlanTrigger />
                              </PlanHeader>
                              <PlanContent className="pt-0">
                                <MessageResponse className="prose-ai max-w-none">
                                  <MarkdownContent content={message.content} />
                                </MessageResponse>
                              </PlanContent>
                            </Plan>
                          ) : (
                            <MessageContent className={cn(
                              "w-full rounded-xl border px-3 py-2.5 text-sm leading-relaxed",
                              message.role === 'assistant'
                                ? "border-border/70 bg-card/80 text-foreground"
                                : "border-border/50 bg-muted/30 text-foreground/95"
                            )}>
                              {message.versions && message.versions.length > 1 ? (
                                <MessageBranch>
                                  <MessageBranchContent>
                                    {message.versions.map((v) => (
                                      <MessageResponse key={v.id} className="prose-ai max-w-none">
                                        <MarkdownContent content={v.content} />
                                      </MessageResponse>
                                    ))}
                                  </MessageBranchContent>
                                  <MessageToolbar>
                                    <MessageBranchSelector>
                                      <MessageBranchPrevious />
                                      <MessageBranchPage />
                                      <MessageBranchNext />
                                    </MessageBranchSelector>
                                  </MessageToolbar>
                                </MessageBranch>
                              ) : (
                                <MessageResponse className="prose-ai max-w-none">
                                  <MarkdownContent content={message.content} />
                                </MessageResponse>
                              )}
                            </MessageContent>
                          )}

                          {/* Actions */}
                          <div className={cn(
                            "opacity-0 group-hover/msg:opacity-100 transition-opacity",
                            message.role === 'user' ? "flex flex-col gap-1 items-end" : "flex items-center gap-1 mt-1"
                          )}>
                            <MessageActions>
                              {message.role === 'user' ? (
                                <div className="relative group/action">
                                  <MessageAction 
                                    onClick={() => handleRestoreClick(message.id)}
                                    className="hover:text-primary"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </MessageAction>
                                  <ActionTooltip text="Restaurer à partir d'ici" />
                                </div>
                              ) : (
                                <>
                                  <div className="relative group/action">
                                    <MessageAction onClick={() => handleCopy(message.content)}>
                                      <CopyIcon className="w-3.5 h-3.5" />
                                    </MessageAction>
                                    <ActionTooltip text="Copier le message" />
                                  </div>
                                  <div className="relative group/action">
                                    <MessageAction
                                      onClick={() => handleRegenerate(message.id)}
                                      className={cn(
                                        isRegenerateDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                                      )}
                                    >
                                      <RefreshCcwIcon className="w-3.5 h-3.5" />
                                    </MessageAction>
                                    <ActionTooltip text="Régénérer la réponse" />
                                  </div>
                                  <div className="relative group/action">
                                    <MessageAction>
                                      <ThumbsUpIcon className="w-3.5 h-3.5" />
                                    </MessageAction>
                                    <ActionTooltip text="J'aime" />
                                  </div>
                                  <div className="relative group/action">
                                    <MessageAction>
                                      <ThumbsDownIcon className="w-3.5 h-3.5" />
                                    </MessageAction>
                                    <ActionTooltip text="Je n'aime pas" />
                                  </div>
                                </>
                              )}
                            </MessageActions>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Message>
                </motion.div>
              </Fragment>
            )})}
          </AnimatePresence>
          
          {isTyping && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex w-full max-w-[900px] gap-2"
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
              </div>
            </motion.div>
          )}
        </ConversationContent>
      </Conversation>
    </div>
  );
}
