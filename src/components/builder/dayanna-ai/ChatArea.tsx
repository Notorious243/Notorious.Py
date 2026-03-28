import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Message as MessageType } from "./types";
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from "./ai-elements/chain-of-thought";
import { Task, TaskTrigger, TaskContent, TaskItem } from "./ai-elements/task";
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
import { Shimmer } from "./ai-elements/shimmer";
import { 
  Bot,
  RotateCcw,
  CopyIcon,
  ArrowDown,
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

interface ChatAreaProps {
  messages: MessageType[];
  isTyping: boolean;
  onRestore?: (id: string) => void;
  onSendMessage?: (content: string) => void;
}

const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      components={{
        pre({ children }: { children?: ReactNode }) {
          return <div className="my-4">{children}</div>;
        },
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

export function ChatArea({ messages, isTyping, onRestore, onSendMessage }: ChatAreaProps) {
  const [confirmingRestoreId, setConfirmingRestoreId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
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

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copié dans le presse-papier");
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
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border border-border text-[10px] text-popover-foreground whitespace-nowrap opacity-0 group-hover/action:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px w-1.5 h-1.5 bg-popover border-r border-b border-border rotate-45" />
    </div>
  );

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-x-hidden overflow-y-auto p-2.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
    >
      <AnimatePresence>
        {confirmingRestoreId && (
          <div className="absolute inset-x-2.5 top-2.5 z-[100]">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="rounded-lg border border-border/30 bg-card/95 p-2.5 shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RotateCcw className="w-3 h-3" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-foreground uppercase tracking-tight">Restaurer ?</h3>
                    <p className="text-[9px] text-muted-foreground">Revenir a ce point.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setConfirmingRestoreId(null)}
                    className="px-2.5 py-1 rounded-md bg-secondary hover:bg-accent text-muted-foreground text-[9px] font-bold uppercase transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmRestore}
                    className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[9px] font-bold uppercase transition-colors shadow-sm"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Conversation className="max-w-none">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex min-h-[320px] flex-col items-center justify-center p-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/30 bg-muted/40 shadow-sm">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="mb-4 space-y-1 text-center">
                <Shimmer className="text-base font-bold tracking-tight text-foreground" duration={2} spread={2}>
                  Comment puis-je vous aider ?
                </Shimmer>
                <p className="mx-auto max-w-[200px] text-[10px] text-muted-foreground leading-relaxed">
                  Dayanna, assistante IA pour Notorious.PY
                </p>
              </div>

              <div className="grid w-full max-w-[260px] grid-cols-1 gap-1.5">
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
                    className="group flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 p-2 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/40 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <suggestion.icon className="h-3 w-3" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {suggestion.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <Fragment key={message.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full group/msg"
                >
                  <Message from={message.role} className="mb-3">
                    <div className={cn(
                      "relative flex w-full gap-2.5",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3 h-3" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex-1 min-w-0 space-y-2",
                        message.role === 'user' ? "text-right" : "text-left"
                      )}>
                        <div className={cn(
                          "flex items-center mb-1",
                          message.role === 'user' ? "justify-end gap-3" : "justify-start gap-2"
                        )}>
                          <div className="flex items-center gap-2">
                            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                              {message.role === 'user' ? "Vous" : "Dayanna"}
                            </div>
                            <span className="text-[9px] text-muted-foreground/60 font-mono">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <Attachments className={cn(
                            "mb-2",
                            message.role === 'user' ? "justify-end" : "justify-start"
                          )}>
                            {message.attachments.map((att) => (
                              <Attachment key={att.id} data={att}>
                                <AttachmentPreview />
                              </Attachment>
                            ))}
                          </Attachments>
                        )}

                        {message.tasks && message.tasks.length > 0 && (
                          <Task 
                            className="w-full" 
                            defaultExpanded={message.tasks.some(t => t.status === 'running')}
                            isStreaming={message.tasks.some(t => t.status === 'running')}
                          >
                            <TaskTrigger title="AI Actions" />
                            <TaskContent>
                              {message.tasks.map((task) => (
                                <TaskItem key={task.id} status={task.status}>{task.label}</TaskItem>
                              ))}
                            </TaskContent>
                          </Task>
                        )}

                        {message.reasoning && (
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
                        )}
                        
                        <div className={cn(
                          "flex gap-2 w-full",
                          message.role === 'user' ? "flex-row items-start justify-end" : "flex-col items-start"
                        )}>
                          <MessageContent className={cn(
                            "p-0 bg-transparent",
                            message.role === 'user' ? "text-foreground text-right" : "text-foreground/90"
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
                                    <MessageAction>
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
            ))}
          </AnimatePresence>
          
          {isTyping && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1 h-1 bg-primary rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1 h-1 bg-primary rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1 h-1 bg-primary rounded-full"
                />
              </div>
            </motion.div>
          )}
        </ConversationContent>
      </Conversation>

      {/* Jump to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-card text-muted-foreground shadow-md border border-border/30 hover:bg-accent hover:text-foreground transition-all z-50 group"
          >
            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
