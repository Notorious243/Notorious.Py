import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Mic, 
  Sparkles, 
  ChevronDown, 
  Plus, 
  CheckIcon, 
  Paperclip, 
  Image as ImageIcon,
  ArrowUp,
  X,
  MicOff,
  User,
  MessageSquare,
  FileText,
  Lock,
  Hash,
} from "lucide-react";
import { SiGoogle, SiOpenai, SiAnthropic, SiHuggingface } from "react-icons/si";
import { Model, InputStatus, Provider, ModelInfo, Attachment, ApiKeys, AIMode, TaggedFile } from "./types";
import type { Message } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { nanoid } from "nanoid";
import { FOCUS_AI_PROMPT_EVENT } from "@/lib/aiSidebar";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "./ai-elements/context";

interface AvailableFile {
  id: string;
  name: string;
  content?: string;
}

const OpenRouterLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const GroqLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

const DeepSeekLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PythonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 256 255" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pyBlue" x1="12.96" y1="12.04" x2="140" y2="130" gradientUnits="userSpaceOnUse">
        <stop stopColor="#387EB8"/>
        <stop offset="1" stopColor="#366994"/>
      </linearGradient>
      <linearGradient id="pyYellow" x1="115" y1="125" x2="243" y2="243" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFC836"/>
        <stop offset="1" stopColor="#FFD43B"/>
      </linearGradient>
    </defs>
    <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" fill="url(#pyBlue)"/>
    <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.132 11.12 11.12 0 0 1 11.13 11.131 11.12 11.12 0 0 1-11.13 11.13z" fill="url(#pyYellow)"/>
  </svg>
);

const isPythonFile = (name: string) => name.toLowerCase().endsWith('.py');

const PROVIDERS: { id: Provider; name: string; icon: any; free?: boolean }[] = [
  { id: 'google', name: 'Google Gemini', icon: SiGoogle },
  { id: 'openrouter', name: 'OpenRouter', icon: OpenRouterLogo, free: true },
  { id: 'groq', name: 'Groq', icon: GroqLogo, free: true },
  { id: 'openai', name: 'OpenAI', icon: SiOpenai },
  { id: 'anthropic', name: 'Anthropic', icon: SiAnthropic },
  { id: 'deepseek', name: 'DeepSeek', icon: DeepSeekLogo },
  { id: 'huggingface', name: 'Hugging Face', icon: SiHuggingface, free: true },
];

const MODELS_BY_PROVIDER: Record<Provider, ModelInfo[]> = {
  google: [
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", provider: 'google' },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", provider: 'google' },
    { id: "gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash", provider: 'google' },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: 'google' },
  ],
  openrouter: [
    { id: "openrouter/free", name: "Auto (Gratuit)", provider: 'openrouter', free: true },
    { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B", provider: 'openrouter', free: true },
    { id: "meta-llama/llama-3.2-11b-vision-instruct:free", name: "Llama 3.2 Vision", provider: 'openrouter', free: true },
    { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", provider: 'openrouter', free: true },
    { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", provider: 'openrouter', free: true },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: 'groq', free: true },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: 'groq', free: true },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: 'groq', free: true },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: 'groq', free: true },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", provider: 'openai' },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: 'openai' },
    { id: "o3-mini", name: "o3 Mini", provider: 'openai' },
  ],
  anthropic: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: 'anthropic' },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: 'anthropic' },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: 'anthropic' },
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek V3", provider: 'deepseek' },
    { id: "deepseek-reasoner", name: "DeepSeek R1", provider: 'deepseek' },
  ],
  huggingface: [
    { id: "Qwen/Qwen2.5-Coder-32B-Instruct", name: "Qwen 2.5 Coder 32B", provider: 'huggingface', free: true },
    { id: "mistralai/Mistral-Nemo-Instruct-2407", name: "Mistral Nemo 12B", provider: 'huggingface', free: true },
    { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "Llama 3.1 8B", provider: 'huggingface', free: true },
  ],
};

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "gemini-3-flash-preview": 1000000,
  "gemini-3.1-pro-preview": 1000000,
  "gemini-2.5-flash-preview-05-20": 1000000,
  "gemini-2.0-flash": 1000000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "o3-mini": 128000,
  "claude-sonnet-4-20250514": 200000,
  "claude-3-5-sonnet-20241022": 200000,
  "claude-3-haiku-20240307": 200000,
  "deepseek-chat": 64000,
  "deepseek-reasoner": 64000,
};
const DEFAULT_CONTEXT_WINDOW = 32000;

const MODE_CONFIG: Record<AIMode, { icon: any; label: string; description: string }> = {
  agent: { icon: User, label: 'Agent', description: 'Generation et modification du canvas' },
  discussions: { icon: MessageSquare, label: 'Discussion', description: 'Questions et reponses simples' },
  plan: { icon: FileText, label: 'Plan', description: 'Planification multi-interfaces' },
};

interface InputAreaProps {
  onSendMessage: (content: string, model: Model, attachments?: Attachment[], provider?: Provider, mode?: AIMode, taggedFiles?: TaggedFile[]) => void;
  disabled?: boolean;
  status?: InputStatus;
  restoreContent?: string | null;
  onClearRestoreContent?: () => void;
  onStopGeneration?: () => void;
  apiKeys: ApiKeys;
  availableFiles?: AvailableFile[];
  conversationMessages?: Message[];
}

export function InputArea({ onSendMessage, disabled, status = 'ready', restoreContent, onClearRestoreContent, onStopGeneration, apiKeys, availableFiles = [], conversationMessages = [] }: InputAreaProps) {
  const [content, setContent] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider>("google");
  const [selectedModel, setSelectedModel] = useState<Model>("gemini-3-flash-preview");
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [activeMode, setActiveMode] = useState<AIMode>('agent');
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [taggedFiles, setTaggedFiles] = useState<TaggedFile[]>([]);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setIsProviderSelectorOpen(false);
        setIsModelSelectorOpen(false);
        setIsMenuOpen(false);
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) setContent(prev => prev + event.results[i][0].transcript);
        }
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  const providerModels = MODELS_BY_PROVIDER[selectedProvider] ?? [];
  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);
  const currentModel = providerModels.find(m => m.id === selectedModel) ?? providerModels[0];
  const currentModeConfig = MODE_CONFIG[activeMode];
  const approximateTokens = useMemo(() => {
    const allText = conversationMessages.map(m => m.content).join('');
    return Math.ceil(allText.length / 4);
  }, [conversationMessages]);

  const maxTokens = MODEL_CONTEXT_WINDOWS[selectedModel] ?? DEFAULT_CONTEXT_WINDOW;

  const contextUsage = useMemo(() => ({
    cachedInputTokens: 0,
    inputTokens: Math.ceil(approximateTokens * 0.6),
    outputTokens: Math.ceil(approximateTokens * 0.3),
    reasoningTokens: Math.ceil(approximateTokens * 0.1),
    totalTokens: approximateTokens,
  }), [approximateTokens]);

  const filteredFiles = useMemo(() => {
    if (!fileSearchQuery) return availableFiles;
    const q = fileSearchQuery.toLowerCase();
    return availableFiles.filter(f => f.name.toLowerCase().includes(q));
  }, [availableFiles, fileSearchQuery]);

  const handleSend = useCallback(() => {
    if (content.trim() && !disabled && status === 'ready') {
      onSendMessage(content.trim(), selectedModel, attachments, selectedProvider, activeMode, taggedFiles.length > 0 ? taggedFiles : undefined);
      setContent("");
      setAttachments([]);
      setTaggedFiles([]);
    }
  }, [content, selectedModel, selectedProvider, disabled, status, onSendMessage, attachments, activeMode, taggedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s]*)$/);

    if (atMatch && availableFiles.length > 0) {
      setFileSearchQuery(atMatch[1]);
      setShowFileDropdown(true);
    } else {
      setShowFileDropdown(false);
      setFileSearchQuery('');
    }
  };

  const handleTagFile = (file: AvailableFile) => {
    if (taggedFiles.some(t => t.id === file.id)) return;
    setTaggedFiles(prev => [...prev, { id: file.id, name: file.name, content: file.content || '' }]);

    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const atIdx = textBeforeCursor.lastIndexOf('@');
    if (atIdx >= 0) {
      setContent(content.slice(0, atIdx) + content.slice(cursorPos));
    }
    setShowFileDropdown(false);
    setFileSearchQuery('');
    textareaRef.current?.focus();
  };

  const handleRemoveTag = (fileId: string) => {
    setTaggedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowFileDropdown(prev => !prev);
        setFileSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, { id: nanoid(), name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file', data: base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  useEffect(() => {
    if (restoreContent !== null && restoreContent !== undefined) {
      setContent(restoreContent);
      onClearRestoreContent?.();
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [restoreContent, onClearRestoreContent]);

  useEffect(() => {
    const handleFocusPrompt = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursor = textarea.value.length;
      textarea.setSelectionRange(cursor, cursor);
    };

    window.addEventListener(FOCUS_AI_PROMPT_EVENT, handleFocusPrompt);
    return () => window.removeEventListener(FOCUS_AI_PROMPT_EVENT, handleFocusPrompt);
  }, []);

  return (
    <div className="bg-background p-2">
      <div className="relative flex w-full flex-col rounded-lg border border-border/30 bg-muted/20 transition-all focus-within:border-primary/30 focus-within:shadow-sm focus-within:shadow-primary/5">
        {/* Tagged files chips */}
        <AnimatePresence>
          {taggedFiles.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-2.5 pt-1.5">
              <div className="flex flex-wrap gap-1">
                {taggedFiles.map(f => (
                  <motion.span key={f.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    {isPythonFile(f.name) ? <PythonIcon className="w-3 h-3" /> : <Hash className="w-2.5 h-2.5" />}
                    {f.name}
                    <button onClick={() => handleRemoveTag(f.id)} className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5">
                      <X className="w-2 h-2" />
                    </button>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-2.5 pt-2">
              <div className="grid grid-cols-3 gap-1">
                {attachments.map((file) => (
                  <motion.div key={file.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary p-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-muted-foreground">{isPythonFile(file.name || '') ? <PythonIcon className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</div>
                    <span className="mt-1.5 w-full truncate px-1 text-center text-[10px] text-muted-foreground">{file.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))} className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="relative flex flex-col gap-1 px-2.5 pt-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Ecoute en cours..." : "Demandez-moi quelque chose... (@fichier)"}
            className="min-h-[30px] max-h-[140px] flex-1 resize-none border-none bg-transparent p-0 text-[12px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:outline-none focus:ring-0"
            disabled={disabled}
          />

          {/* File Dropdown */}
          <AnimatePresence>
            {showFileDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full left-0 z-[230] mb-1 w-56 max-h-40 overflow-y-auto rounded-lg border border-border/30 bg-popover p-1 shadow-md"
              >
                <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Fichiers .py</div>
                {filteredFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleTagFile(f)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] transition-colors",
                      taggedFiles.some(t => t.id === f.id) ? "bg-primary/10 text-primary" : "text-popover-foreground hover:bg-accent"
                    )}
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    {taggedFiles.some(t => t.id === f.id) && <CheckIcon className="w-3 h-3 ml-auto shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — Row 1: Controls + Actions */}
        <div className="mt-0.5 flex min-w-0 items-center gap-1 px-2 py-1" ref={menuContainerRef}>
          {/* Left: Attach + Provider/Model */}
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {/* Attach */}
            <div className="relative shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,.pdf,.txt,.csv" />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                <Plus className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full left-0 z-[220] mb-1.5 w-44 rounded-lg border border-border/30 bg-popover p-1 shadow-md">
                    <button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-popover-foreground hover:bg-primary/10 transition-colors">
                      <Paperclip className="w-3 h-3" /> Ajouter un fichier
                    </button>
                    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-popover-foreground hover:bg-primary/10 transition-colors">
                      <ImageIcon className="w-3 h-3" /> Capture d'ecran
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-3.5 w-px shrink-0 bg-border/30" />

            {/* Provider + Model combined button */}
            <div className="relative shrink-0">
              <button
                onClick={() => { setIsProviderSelectorOpen(!isProviderSelectorOpen); setIsModelSelectorOpen(false); }}
                className="flex items-center gap-1 rounded-md border border-border/30 bg-muted/30 px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={`${currentProvider?.name} — ${currentModel?.name}`}
              >
                {currentProvider && <currentProvider.icon className="h-2.5 w-2.5 shrink-0 text-primary" />}
                <ChevronDown className={cn("h-2 w-2 shrink-0 transition-transform", isProviderSelectorOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProviderSelectorOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full left-0 z-[220] mb-1.5 w-48 max-w-[calc(100vw-2rem)] rounded-lg border border-border/30 bg-popover p-1 shadow-md">
                    <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Providers</div>
                    {PROVIDERS.map((p) => {
                      const hasKey = !!apiKeys[p.id as keyof ApiKeys];
                      const isDisabled = !hasKey && !p.free;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (isDisabled) return;
                            setSelectedProvider(p.id);
                            setIsProviderSelectorOpen(false);
                            const firstModel = MODELS_BY_PROVIDER[p.id]?.[0];
                            if (firstModel) setSelectedModel(firstModel.id);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                            isDisabled && "opacity-50 cursor-not-allowed",
                            selectedProvider === p.id ? "bg-primary/10 text-primary font-medium" :
                            hasKey ? "text-popover-foreground hover:bg-accent" :
                            p.free ? "text-popover-foreground hover:bg-accent" :
                            "text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <p.icon className={cn("w-3.5 h-3.5", selectedProvider === p.id ? "text-primary" : "text-muted-foreground")} />
                            <span>{p.name}</span>
                            {p.free && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold uppercase">Gratuit</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasKey && (
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Cle configuree" />
                            )}
                            {!hasKey && !p.free && (
                              <span className="flex items-center gap-1 text-[8px] text-amber-500 font-medium">
                                <Lock className="w-2.5 h-2.5" />
                                Cle requise
                              </span>
                            )}
                            {selectedProvider === p.id && <CheckIcon className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Model Selector */}
            <div className="relative min-w-0 shrink-0">
              <button
                onClick={() => { setIsModelSelectorOpen(!isModelSelectorOpen); setIsProviderSelectorOpen(false); }}
                className="flex items-center gap-0.5 rounded-md border border-border/30 bg-muted/30 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Sparkles className="h-2 w-2 shrink-0 text-primary/60" />
                <span className="max-w-[70px] truncate leading-none">{currentModel?.name ?? 'Modele'}</span>
                <ChevronDown className={cn("h-2 w-2 shrink-0 transition-transform", isModelSelectorOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isModelSelectorOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full left-0 z-[220] mb-1.5 w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border/30 bg-popover shadow-md">
                    <div className="p-1 space-y-0.5">
                      <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{currentProvider?.name}</div>
                      {providerModels.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setIsModelSelectorOpen(false); }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                            selectedModel === m.id ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground hover:bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className={cn("w-3.5 h-3.5", selectedModel === m.id ? "text-primary" : "text-muted-foreground")} />
                            {m.name}
                            {m.free && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">FREE</span>}
                          </div>
                          {selectedModel === m.id && <CheckIcon className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-3.5 w-px shrink-0 bg-border/30" />

            {/* Mode Selector — icon only */}
            <div className="relative shrink-0">
              <button
                onClick={() => { setIsModeSelectorOpen(!isModeSelectorOpen); setIsProviderSelectorOpen(false); setIsModelSelectorOpen(false); }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                  activeMode === 'agent' ? "bg-primary/10 text-primary" :
                  activeMode === 'plan' ? "bg-amber-500/10 text-amber-600" :
                  activeMode === 'discussions' ? "bg-secondary text-foreground" :
                  "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={currentModeConfig.label}
              >
                <currentModeConfig.icon className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {isModeSelectorOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full right-0 z-[220] mb-1.5 w-52 rounded-lg border border-border/30 bg-popover p-1 shadow-md">
                    <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Mode</div>
                    {(Object.entries(MODE_CONFIG) as [AIMode, typeof MODE_CONFIG[AIMode]][]).map(([mode, config]) => (
                      <button
                        key={mode}
                        onClick={() => { setActiveMode(mode); setIsModeSelectorOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                          activeMode === mode ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground hover:bg-accent"
                        )}
                      >
                        <config.icon className={cn("w-3.5 h-3.5", activeMode === mode ? "text-primary" : "text-muted-foreground")} />
                        <div className="flex flex-col items-start gap-0.5">
                          <span>{config.label}</span>
                          <span className="text-[9px] text-muted-foreground font-normal">{config.description}</span>
                        </div>
                        {activeMode === mode && <CheckIcon className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Context Circle */}
            <Context maxTokens={maxTokens} modelId={selectedModel} usage={contextUsage} usedTokens={approximateTokens}>
              <ContextTrigger />
              <ContextContent>
                <ContextContentHeader />
                <ContextContentBody>
                  <ContextInputUsage />
                  <ContextOutputUsage />
                  <ContextReasoningUsage />
                  <ContextCacheUsage />
                </ContextContentBody>
                <ContextContentFooter />
              </ContextContent>
            </Context>
          </div>

          {/* Right: Mic + Submit */}
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={toggleListening} className={cn("flex h-6 w-6 items-center justify-center rounded-md transition-colors", isListening ? "bg-destructive/10 text-destructive" : "hover:bg-primary/10 text-muted-foreground hover:text-primary")}>
              {isListening ? <MicOff className="h-3 w-3 animate-pulse" /> : <Mic className="h-3 w-3" />}
            </button>

            {status === 'streaming' ? (
              <button onClick={onStopGeneration} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/30 bg-secondary text-foreground transition-all hover:bg-accent" title="Arreter">
                <div className="w-1.5 h-1.5 bg-foreground rounded-sm" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!content.trim() || disabled || status !== 'ready'}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all",
                  content.trim() && !disabled && status === 'ready'
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20" 
                    : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                {status === 'ready' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles className="h-3 w-3 text-primary" />
                  </motion.div>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
