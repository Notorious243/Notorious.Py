import { motion, AnimatePresence } from "motion/react";
import { X, History, Settings, Plus, Search as SearchIcon, Trash2, ChevronLeft, Edit2, Check, Loader2 } from "lucide-react";
import { ChatArea } from "./ChatArea";
import { InputArea } from "./InputArea";
import { Message, Model, InputStatus, Conversation, ApiKeys, Provider, Attachment, AIMode, TaggedFile } from "./types";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AvailableFile {
  id: string;
  name: string;
  content?: string;
}

interface SidebarProps {
  messages: Message[];
  isTyping: boolean;
  inputStatus: InputStatus;
  onSendMessage: (content: string, model: Model, attachments?: Attachment[], provider?: Provider, mode?: AIMode, taggedFiles?: TaggedFile[]) => void;
  onRegenerateAssistantMessage: (assistantMessageId: string) => void;
  onRestore: (id: string) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onUpdateTitle: (id: string, title: string) => void;
  restoreContent: string | null;
  onClearRestoreContent: () => void;
  onStopGeneration?: () => void;
  onOpenSettings: () => void;
  apiKeys: ApiKeys;
  availableFiles?: AvailableFile[];
  dbSyncState?: 'ok' | 'syncing' | 'degraded' | 'error';
  dbSyncReason?: string | null;
  onRetrySync?: () => void;
  onHardResetSync?: () => void;
  deletingConversationIds?: string[];
}

export function Sidebar({ 
  messages, 
  isTyping, 
  inputStatus, 
  onSendMessage, 
  onRegenerateAssistantMessage,
  onRestore,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onUpdateTitle,
  restoreContent,
  onClearRestoreContent,
  onStopGeneration,
  onOpenSettings,
  apiKeys,
  availableFiles,
  dbSyncState = 'ok',
  dbSyncReason,
  onRetrySync,
  onHardResetSync,
  deletingConversationIds = [],
}: SidebarProps) {
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'latest'>('all');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showSyncingBanner, setShowSyncingBanner] = useState(false);

  const filteredConversations = useMemo(() => {
    let result = conversations.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firstMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filter === 'latest') {
      result = result.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    } else {
      result = result.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    return result;
  }, [conversations, searchQuery, filter]);
  const deletingSet = useMemo(() => new Set(deletingConversationIds), [deletingConversationIds]);
  const isSyncing = dbSyncState === 'syncing';

  useEffect(() => {
    if (!isSyncing) {
      setShowSyncingBanner(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSyncingBanner(true), 1100);
    return () => window.clearTimeout(timer);
  }, [isSyncing, dbSyncReason]);

  const shouldShowSyncBanner = isSyncing && showSyncingBanner;
  const syncTitle = isSyncing
    ? 'Connexion base en cours...'
    : 'Synchronisation Dayanna en attente';
  const syncDescription = dbSyncReason || (isSyncing
    ? 'Chargement des conversations du projet actif.'
    : 'Les changements restent visibles et seront resynchronises automatiquement.');

  const handleStartEdit = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingTitleId(conv.id);
    setEditTitleValue(conv.title);
  };

  const handleSaveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdateTitle(id, editTitleValue);
    setEditingTitleId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex h-full w-full min-w-0 flex-col overflow-hidden bg-background text-foreground text-sm",
        "shadow-sm"
      )}
    >
            {/* Header */}
            <div className="flex shrink-0 flex-col border-b border-white/20 bg-[#123a67] backdrop-blur-md">
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  {view === 'history' ? (
                    <Button 
                      variant="ghost" size="icon"
                      onClick={() => setView('chat')}
                      className="h-7 w-7 shrink-0 rounded-md text-white/90 hover:bg-white/10 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  ) : null}
                  <div className="min-w-0 flex items-center gap-1.5">
                    {view === 'chat' ? (
                      <>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/35 bg-white/10 text-white shadow-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.14)"/>
                            <path d="M9 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#fff"/>
                            <path d="M12 17.5c2.33 0 4.32-1.45 5.12-3.5H6.88c.8 2.05 2.79 3.5 5.12 3.5z" fill="#fff"/>
                            <path d="M3 12h2M19 12h2M12 3v2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <span className="truncate text-sm font-bold tracking-tight text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                          Dayanna
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <span className="truncate text-xs font-semibold tracking-tight text-white">
                          Historique
                        </span>
                        <span className="truncate text-[10px] font-mono uppercase tracking-widest text-white/70">
                          {conversations.length} conv.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="icon" onClick={onNewConversation} className="h-7 w-7 rounded-md text-white/75 hover:bg-white/10 hover:text-white" title="Nouvelle conversation">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
                    className={cn("h-7 w-7 rounded-md", view === 'history' ? "bg-white/20 text-white" : "text-white/75 hover:bg-white/10 hover:text-white")}
                    title="Historique"
                  >
                    <History className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-7 w-7 rounded-md text-white/75 hover:bg-white/10 hover:text-white" title="Paramètres">
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Conversation tabs */}
              {view === 'chat' && (
                <div className="flex w-full items-center gap-1 overflow-x-auto px-3 pb-2 scrollbar-none no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {conversations.slice(0, 5).map((conv) => (
                      (() => {
                        const isDeleting = deletingSet.has(conv.id);
                        return (
                      <motion.div
                        key={conv.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "group flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 transition-all cursor-pointer min-w-[90px] max-w-[150px]",
                          currentConversationId === conv.id 
                            ? "bg-white/15 border-white/60 text-white" 
                            : "bg-white/[0.07] border-white/35 text-white/80 hover:bg-white/12 hover:text-white"
                        )}
                        onClick={() => {
                          if (isDeleting) return;
                          onSelectConversation(conv.id);
                        }}
                      >
                        <span className="text-[11px] font-medium truncate flex-1">{conv.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDeleting) return;
                            onDeleteConversation(conv.id);
                          }}
                          className={cn(
                            "p-0.5 rounded hover:bg-destructive/10 transition-opacity",
                            isDeleting ? "opacity-100 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
                          )}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />}
                        </button>
                      </motion.div>
                        );
                      })()
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {shouldShowSyncBanner && (
              <div className="border-b border-white/20 bg-[#0b2a4d] px-3 py-2 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white/95" />
                    </div>
                    <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wider">
                      {syncTitle}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-white/85">
                      {syncDescription}
                    </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={onRetrySync}
                      title={onHardResetSync ? 'Reessayer la synchronisation (reset disponible dans les options admin).' : 'Reessayer la synchronisation'}
                      className="rounded-md border border-white/55 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      Reessayer
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {view === 'chat' ? (
                <>
                  {/* Chat Content */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentConversationId || 'empty'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-1 overflow-hidden flex flex-col"
                      >
                        <ChatArea 
                          messages={messages} 
                          isTyping={isTyping} 
                          onRestore={onRestore} 
                          onSendMessage={(content) => onSendMessage(content, 'gemini-3-flash-preview', undefined, 'google')}
                          onRegenerateAssistantMessage={onRegenerateAssistantMessage}
                          isRegenerateDisabled={isTyping || inputStatus !== 'ready'}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  {/* Input Footer */}
                  <InputArea 
                    onSendMessage={onSendMessage} 
                    disabled={isTyping} 
                    status={inputStatus} 
                    restoreContent={restoreContent}
                    onClearRestoreContent={onClearRestoreContent}
                    onStopGeneration={onStopGeneration}
                    onOpenSettings={onOpenSettings}
                    apiKeys={apiKeys}
                    availableFiles={availableFiles}
                    conversationMessages={messages}
                  />
                </>
              ) : (
                /* History View */
                <div className="flex-1 flex flex-col bg-background">
                  {/* Search and Filter */}
                  <div className="p-3 space-y-2 border-b border-border/30 bg-muted/20">
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-sm bg-background/50"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant={filter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className={cn("h-7 px-3 text-xs rounded-md", filter === 'all' && "bg-primary/10 text-primary hover:bg-primary/15")}
                      >
                        Tous
                      </Button>
                      <Button
                        variant={filter === 'latest' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('latest')}
                        className={cn("h-7 px-3 text-xs rounded-md", filter === 'latest' && "bg-primary/10 text-primary hover:bg-primary/15")}
                      >
                        Récents
                      </Button>
                    </div>
                  </div>

                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {filteredConversations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-1.5">
                        <History className="w-7 h-7 opacity-20" />
                        <p className="text-sm">Aucune conversation</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => {
                        const isDeleting = deletingSet.has(conv.id);
                        return (
                        <motion.div
                          key={conv.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "group relative p-2.5 rounded-lg border transition-all cursor-pointer",
                            currentConversationId === conv.id 
                              ? "bg-primary/5 border-primary/20" 
                              : "bg-muted/20 border-border/30 hover:bg-accent/50"
                          )}
                          onClick={() => {
                            if (isDeleting) return;
                            onSelectConversation(conv.id);
                            setView('chat');
                          }}
                        >
                          <div className="flex flex-col gap-0.5 pr-10">
                            {editingTitleId === conv.id ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  autoFocus
                                  value={editTitleValue}
                                  onChange={(e) => setEditTitleValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      onUpdateTitle(conv.id, editTitleValue);
                                      setEditingTitleId(null);
                                    }
                                    if (e.key === 'Escape') setEditingTitleId(null);
                                  }}
                                  className="h-7 flex-1 text-xs"
                                />
                                <Button variant="default" size="icon" onClick={(e) => handleSaveEdit(e, conv.id)} className="h-7 w-7 rounded-md">
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <h3 className={cn(
                                "text-xs font-semibold truncate",
                                currentConversationId === conv.id ? "text-primary" : "text-foreground"
                              )}>
                                {conv.title}
                              </h3>
                            )}
                            
                            {conv.firstMessage && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 leading-tight">
                                {conv.firstMessage}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider mt-0.5">
                              <span>{conv.messages.length} msg</span>
                              <span>·</span>
                              <span>{new Date(conv.timestamp).toLocaleDateString()}</span>
                              <span>·</span>
                              <span>{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all",
                            isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}>
                            <Button variant="ghost" size="icon" onClick={(e) => handleStartEdit(e, conv)} className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary" title="Modifier" disabled={isDeleting}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDeleting) return;
                                onDeleteConversation(conv.id);
                              }}
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive"
                              title="Supprimer"
                              disabled={isDeleting}
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </Button>
                          </div>
                        </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
    </motion.div>
  );
}
