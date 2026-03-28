import { motion, AnimatePresence } from "motion/react";
import { X, History, Settings, Plus, Search as SearchIcon, Trash2, ChevronLeft, Edit2, Check } from "lucide-react";
import { ChatArea } from "./ChatArea";
import { InputArea } from "./InputArea";
import { Message, Model, InputStatus, Conversation, ApiKeys, Provider, Attachment, AIMode, TaggedFile } from "./types";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
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
}

export function Sidebar({ 
  messages, 
  isTyping, 
  inputStatus, 
  onSendMessage, 
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
  availableFiles
}: SidebarProps) {
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'latest'>('all');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

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
        "flex h-full w-full min-w-0 flex-col overflow-hidden bg-background text-foreground text-[12px]",
        "shadow-sm"
      )}
    >
            {/* Header */}
            <div className="flex flex-col border-b border-border/40 bg-muted/30 backdrop-blur-md shrink-0">
              <div className="flex min-h-9 flex-wrap items-center justify-between gap-1 px-2.5 py-1">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  {view === 'history' ? (
                    <Button 
                      variant="ghost" size="icon"
                      onClick={() => setView('chat')}
                      className="h-6 w-6 shrink-0 rounded-md"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  ) : null}
                  <div className="min-w-0 flex items-center gap-1.5">
                    {view === 'chat' ? (
                      <>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#0F3460] to-[#1F5AA0] shadow-sm">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.15)"/>
                            <path d="M9 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#fff"/>
                            <path d="M12 17.5c2.33 0 4.32-1.45 5.12-3.5H6.88c.8 2.05 2.79 3.5 5.12 3.5z" fill="#fff"/>
                            <path d="M3 12h2M19 12h2M12 3v2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <span className="truncate text-[11px] font-bold tracking-tight bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] bg-clip-text text-transparent" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                          Dayanna
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <span className="truncate text-[10px] font-semibold tracking-tight text-foreground">
                          Historique
                        </span>
                        <span className="truncate text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                          {conversations.length} conv.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="icon" onClick={onNewConversation} className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary" title="Nouvelle conversation">
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
                    className={cn("h-6 w-6 rounded-md", view === 'history' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
                    title="Historique"
                  >
                    <History className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground" title="Paramètres">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Conversation tabs */}
              {view === 'chat' && (
                <div className="flex w-full items-center gap-0.5 overflow-x-auto px-2.5 pb-1.5 scrollbar-none no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {conversations.slice(0, 5).map((conv) => (
                      <motion.div
                        key={conv.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "group flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 transition-all cursor-pointer min-w-[60px] max-w-[110px]",
                          currentConversationId === conv.id 
                            ? "bg-primary/10 border-primary/25 text-primary" 
                            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                        onClick={() => onSelectConversation(conv.id)}
                      >
                        <span className="text-[9px] font-medium truncate flex-1">{conv.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          className="p-0.5 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
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
                    apiKeys={apiKeys}
                    availableFiles={availableFiles}
                    conversationMessages={messages}
                  />
                </>
              ) : (
                /* History View */
                <div className="flex-1 flex flex-col bg-background">
                  {/* Search and Filter */}
                  <div className="p-2.5 space-y-2 border-b border-border/30 bg-muted/20">
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs bg-background/50"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant={filter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className={cn("h-6 px-2.5 text-[10px] rounded-md", filter === 'all' && "bg-primary/10 text-primary hover:bg-primary/15")}
                      >
                        Tous
                      </Button>
                      <Button
                        variant={filter === 'latest' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('latest')}
                        className={cn("h-6 px-2.5 text-[10px] rounded-md", filter === 'latest' && "bg-primary/10 text-primary hover:bg-primary/15")}
                      >
                        Récents
                      </Button>
                    </div>
                  </div>

                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {filteredConversations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-1.5">
                        <History className="w-6 h-6 opacity-20" />
                        <p className="text-xs">Aucune conversation</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => (
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
                                    if (e.key === 'Enter') onUpdateTitle(conv.id, editTitleValue), setEditingTitleId(null);
                                    if (e.key === 'Escape') setEditingTitleId(null);
                                  }}
                                  className="h-6 flex-1 text-xs"
                                />
                                <Button variant="default" size="icon" onClick={(e) => handleSaveEdit(e, conv.id)} className="h-6 w-6 rounded-md">
                                  <Check className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <h3 className={cn(
                                "text-[11px] font-semibold truncate",
                                currentConversationId === conv.id ? "text-primary" : "text-foreground"
                              )}>
                                {conv.title}
                              </h3>
                            )}
                            
                            {conv.firstMessage && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                                {conv.firstMessage}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/60 font-mono uppercase tracking-wider mt-0.5">
                              <span>{conv.messages.length} msg</span>
                              <span>·</span>
                              <span>{new Date(conv.timestamp).toLocaleDateString()}</span>
                              <span>·</span>
                              <span>{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <Button variant="ghost" size="icon" onClick={(e) => handleStartEdit(e, conv)} className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary" title="Modifier">
                              <Edit2 className="w-2.5 h-2.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive" title="Supprimer">
                              <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
    </motion.div>
  );
}
