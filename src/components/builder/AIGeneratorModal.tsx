import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,

} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIGeneration, ContextFile } from '@/hooks/useAIGeneration';
import {
    ALL_MODELS,
    MODELS_BY_PROVIDER,
    PROVIDER_CONFIGS,
    FREE_PROVIDERS,
    PREMIUM_PROVIDERS,
    type AIProvider,
} from '@/lib/aiPrompts';
import { useAuth } from '@/contexts/AuthContext';
import { useWidgets } from '@/contexts/WidgetContext';
import { useFileSystem } from '@/hooks/useFileSystem';
import {
    fetchApiKeysFromSupabase,
    saveApiKeysToSupabase,
    fetchAIGenerationHistoryFromSupabase,
    saveAIGenerationHistoryToSupabase,
} from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import {
    Sparkles,
    Upload,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    Image as ImageIcon,
    MessageSquare,
    X,
    FileCode,
    Bot,
    KeyRound,
    Pencil,
    Plus,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Badge } from '@/components/ui/badge';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

type GenerationMode = 'create' | 'iterate' | 'image';

interface GenerationHistoryItem {
    id: string;
    timestamp: number;
    prompt: string;
    provider: AIProvider;
    model: string;
    widgetCount: number;
    mode: GenerationMode;
}

const EMPTY_API_KEYS: Record<AIProvider, string> = {
    openrouter: '',
    groq: '',
    huggingface: '',
    google: '',
    openai: '',
    anthropic: '',
    deepseek: '',
};

// Provider color classes for UI styling
const PROVIDER_COLORS: Record<string, { active: string; ring: string; text: string }> = {
    indigo: { active: 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300', ring: 'focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50', text: 'text-indigo-500' },
    emerald: { active: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300', ring: 'focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50', text: 'text-emerald-500' },
    blue: { active: 'bg-blue-600/20 border-blue-500/40 text-blue-300', ring: 'focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50', text: 'text-blue-500' },
    green: { active: 'bg-green-600/20 border-green-500/40 text-green-300', ring: 'focus-visible:ring-green-500/50 focus-visible:border-green-500/50', text: 'text-green-500' },
    orange: { active: 'bg-orange-600/20 border-orange-500/40 text-orange-300', ring: 'focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50', text: 'text-orange-500' },
    violet: { active: 'bg-violet-600/20 border-violet-500/40 text-violet-300', ring: 'focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50', text: 'text-violet-500' },
    amber: { active: 'bg-amber-600/20 border-amber-500/40 text-amber-300', ring: 'focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50', text: 'text-amber-500' },
};

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onOpenChange }) => {
    const { user } = useAuth();
    const [activeProvider, setActiveProvider] = useState<AIProvider>('openrouter');
    const [selectedModel, setSelectedModel] = useState<string>(() => MODELS_BY_PROVIDER.openrouter[0].id);
    const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>(EMPTY_API_KEYS);
    const [showApiKey, setShowApiKey] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'prompt' | 'image'>('prompt');
    const [aiMode, setAiMode] = useState<'create' | 'iterate'>('create');
    const handleModeChange = useCallback((mode: 'create' | 'iterate') => {
        setAiMode(mode);
        if (mode === 'iterate') setActiveTab('prompt');
    }, []);
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
    const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
    const [dbReady, setDbReady] = useState(false);

    // Load API keys + generation history from Supabase
    useEffect(() => {
        if (!isOpen) return;
        if (!user) {
            setApiKeys(EMPTY_API_KEYS);
            setGenerationHistory([]);
            setDbReady(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const [dbKeys, dbHistory] = await Promise.all([
                    fetchApiKeysFromSupabase(),
                    fetchAIGenerationHistoryFromSupabase(),
                ]);

                if (cancelled) return;

                setApiKeys({
                    ...EMPTY_API_KEYS,
                    ...(dbKeys ?? {}),
                } as Record<AIProvider, string>);

                if (Array.isArray(dbHistory)) {
                    setGenerationHistory(dbHistory as GenerationHistoryItem[]);
                } else {
                    setGenerationHistory([]);
                }
                setDbReady(true);
            } catch {
                if (!cancelled) setDbReady(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isOpen, user]);

    // Persist generation history to Supabase
    useEffect(() => {
        if (!dbReady || !user) return;
        void saveAIGenerationHistoryToSupabase(generationHistory as unknown[]);
    }, [generationHistory, dbReady, user]);

    useEffect(() => {
        if (!dbReady || !user) return;

        const settingsChannel = supabase
            .channel(`ai-generator-settings-${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        setApiKeys(EMPTY_API_KEYS);
                        setGenerationHistory([]);
                        return;
                    }

                    const row = payload.new as {
                        ai_api_keys?: Record<string, string> | null;
                        ai_generation_history?: unknown[] | null;
                    } | null;

                    if (row?.ai_api_keys && typeof row.ai_api_keys === 'object') {
                        const nextKeys = { ...EMPTY_API_KEYS, ...row.ai_api_keys } as Record<AIProvider, string>;
                        setApiKeys((prev) => JSON.stringify(prev) === JSON.stringify(nextKeys) ? prev : nextKeys);
                    }
                    if (Array.isArray(row?.ai_generation_history)) {
                        const nextHistory = row.ai_generation_history as GenerationHistoryItem[];
                        setGenerationHistory((prev) => JSON.stringify(prev) === JSON.stringify(nextHistory) ? prev : nextHistory);
                    }
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(settingsChannel);
        };
    }, [dbReady, user]);

    const preGenSnapshotRef = useRef<{ widgets: any[]; settings: any } | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isGenerating, error, retryCount, generateFromPrompt, generateFromImage, generateIteration } = useAIGeneration();

    // Elapsed timer during generation
    useEffect(() => {
        if (!isGenerating) {
            setElapsedSeconds(0);
            return;
        }
        setElapsedSeconds(0);
        const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, [isGenerating]);
    const { widgets, loadWorkspaceState, canvasSettings } = useWidgets();
    const { getAllFiles } = useFileSystem();

    const allFiles = useMemo(() => getAllFiles(), [getAllFiles, isOpen]);

    const apiKey = apiKeys[activeProvider];
    const providerConfig = PROVIDER_CONFIGS[activeProvider];
    const colorTheme = PROVIDER_COLORS[providerConfig.color] || PROVIDER_COLORS.indigo;

    // Current models for selected provider
    const currentModels = useMemo(
        () => MODELS_BY_PROVIDER[activeProvider] || [],
        [activeProvider]
    );

    // Get vision support for currently selected model
    const currentModel = useMemo(
        () => ALL_MODELS.find(m => m.id === selectedModel),
        [selectedModel]
    );
    const supportsVision = currentModel?.supportsVision ?? false;

    // Switch model when provider changes
    const handleProviderChange = useCallback((provider: AIProvider) => {
        setActiveProvider(provider);
        const models = MODELS_BY_PROVIDER[provider];
        if (models && models.length > 0) {
            setSelectedModel(models[0].id);
        }
    }, []);

    const handleApiKeyChange = useCallback((value: string) => {
        setApiKeys(prev => {
            const next = { ...prev, [activeProvider]: value };
            if (dbReady && user) {
                void saveApiKeysToSupabase(next as Record<string, string | undefined>);
            }
            return next;
        });
    }, [activeProvider, dbReady, user]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const toggleFileSelection = (fileId: string) => {
        const newSet = new Set(selectedFileIds);
        if (newSet.has(fileId)) {
            newSet.delete(fileId);
        } else {
            newSet.add(fileId);
        }
        setSelectedFileIds(newSet);
    };

    const getSelectedFilesContent = (): ContextFile[] => {
        return allFiles
            .filter(f => selectedFileIds.has(f.id))
            .map(f => ({ name: f.name, content: f.content || '' }));
    };

    const handleGenerate = async () => {
        if (!apiKey.trim()) {
            toast.error(`Veuillez entrer votre clé API ${providerConfig.label}`);
            return;
        }

        const contextFiles = getSelectedFilesContent();
        let result;

        if (aiMode === 'iterate') {
            if (!prompt.trim()) {
                toast.error('Décrivez les modifications souhaitées');
                return;
            }
            if (widgets.length === 0) {
                toast.error('Aucun widget sur le canvas à modifier');
                return;
            }
            result = await generateIteration(apiKey, prompt, widgets, selectedModel, contextFiles);
        } else if (activeTab === 'image' && uploadedImage) {
            result = await generateFromImage(apiKey, uploadedImage, prompt || undefined, selectedModel, contextFiles);
        } else {
            if (!prompt.trim()) {
                toast.error('Veuillez décrire l\'interface souhaitée');
                return;
            }
            result = await generateFromPrompt(apiKey, prompt, selectedModel, contextFiles);
        }

        if (result) {
            // Save snapshot for undo
            preGenSnapshotRef.current = {
                widgets: JSON.parse(JSON.stringify(widgets)),
                settings: JSON.parse(JSON.stringify(canvasSettings)),
            };

            const newSettings = result.canvasSettings
                ? { ...canvasSettings, ...result.canvasSettings }
                : canvasSettings;

            loadWorkspaceState(result.widgets, newSettings);

            // Track in generation history
            const mode: 'create' | 'iterate' | 'image' = aiMode === 'iterate' ? 'iterate' : (activeTab === 'image' && uploadedImage ? 'image' : 'create');
            const modelName = ALL_MODELS.find(m => m.id === selectedModel)?.name || selectedModel;
            setGenerationHistory(prev => [{
                id: `gen-${Date.now()}`,
                timestamp: Date.now(),
                prompt: prompt.trim() || '(image)',
                provider: activeProvider,
                model: modelName,
                widgetCount: result.widgets.length,
                mode,
            }, ...prev].slice(0, 20));

            const action = aiMode === 'iterate' ? 'modifiés' : 'générés';
            const snapshot = preGenSnapshotRef.current;
            toast.success(`${result.widgets.length} widgets ${action} avec succès !`, {
                action: snapshot ? {
                    label: 'Annuler',
                    onClick: () => {
                        loadWorkspaceState(snapshot.widgets, snapshot.settings);
                        toast.info('Génération IA annulée — état précédent restauré');
                    },
                } : undefined,
                duration: 8000,
            });
            onOpenChange(false);

            setPrompt('');
            setUploadedImage(null);
            setSelectedFileIds(new Set());
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="max-w-[900px] h-[650px] p-0 gap-0 bg-[#09090b] border-white/10 text-zinc-100 shadow-2xl overflow-hidden flex flex-col sm:rounded-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <DialogTitle className="text-sm font-medium text-zinc-100">
                                Assistant IA
                            </DialogTitle>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                                {providerConfig.label} · {providerConfig.free ? 'Gratuit' : 'Premium'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/5">
                            <button
                                type="button"
                                onClick={() => handleModeChange('create')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                    aiMode === 'create'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <Plus className="h-3 w-3" />
                                Créer
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('iterate')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                    aiMode === 'iterate'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <Pencil className="h-3 w-3" />
                                Modifier
                                {widgets.length > 0 && (
                                    <span className={`text-[9px] px-1 py-0 rounded ${
                                        aiMode === 'iterate' ? 'bg-amber-500/30' : 'bg-white/10'
                                    }`}>
                                        {widgets.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-[280px] bg-[#0c0c0e] border-r border-white/5 flex flex-col">
                        <ScrollArea className="flex-1">
                            <div className="p-5 space-y-6">

                                {/* Provider Selector */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">
                                        Provider
                                    </Label>
                                    {/* Free tier */}
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider pl-1 font-medium">Gratuit</span>
                                        <div className="grid grid-cols-3 gap-1">
                                            {FREE_PROVIDERS.map(p => {
                                                const cfg = PROVIDER_CONFIGS[p];
                                                const colors = PROVIDER_COLORS[cfg.color] || PROVIDER_COLORS.indigo;
                                                const hasKey = !!apiKeys[p];
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => handleProviderChange(p)}
                                                        className={`flex items-center justify-center gap-1 px-1 py-1.5 rounded-lg text-[9px] font-medium transition-all border truncate ${
                                                            activeProvider === p
                                                                ? colors.active
                                                                : 'bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                                                        }`}
                                                    >
                                                        {p === 'groq' && <Zap className="h-2.5 w-2.5" />}
                                                        {cfg.label}
                                                        {hasKey && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* Premium tier */}
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider pl-1 font-medium">Premium</span>
                                        <div className="grid grid-cols-2 gap-1">
                                            {PREMIUM_PROVIDERS.map(p => {
                                                const cfg = PROVIDER_CONFIGS[p];
                                                const colors = PROVIDER_COLORS[cfg.color] || PROVIDER_COLORS.indigo;
                                                const hasKey = !!apiKeys[p];
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => handleProviderChange(p)}
                                                        className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                                                            activeProvider === p
                                                                ? colors.active
                                                                : 'bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                                                        }`}
                                                    >
                                                        {cfg.label}
                                                        {hasKey && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* API Key */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">
                                        Clé API {providerConfig.label}
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                                            <KeyRound className={`h-3.5 w-3.5 transition-colors ${
                                                apiKey ? colorTheme.text : 'text-zinc-600'
                                            }`} />
                                        </div>
                                        <Input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={apiKey}
                                            onChange={(e) => handleApiKeyChange(e.target.value)}
                                            placeholder={providerConfig.keyPrefix}
                                            autoComplete="off"
                                            spellCheck={false}
                                            className={`pl-8 pr-8 h-9 bg-black/30 border-white/10 text-xs font-mono placeholder:text-zinc-700 transition-all rounded-lg truncate focus-visible:ring-1 ${colorTheme.ring}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors z-10"
                                        >
                                            {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                    {apiKey && (
                                        <div className="flex items-center gap-1.5 pl-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                            <span className="text-[10px] text-green-400/70 truncate">Clé configurée</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pl-1 pr-1">
                                        <span className="text-[10px] text-zinc-500">
                                            Stockage sécurisé en base de données
                                        </span>
                                        <a
                                            href={providerConfig.keyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`text-[10px] underline underline-offset-2 transition-colors ${colorTheme.text} opacity-70 hover:opacity-100`}
                                        >
                                            Obtenir une clé
                                        </a>
                                    </div>
                                </div>

                                {/* Model Select */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">
                                        Modèle
                                    </Label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger className={`h-9 bg-black/30 border-white/10 text-xs rounded-lg text-zinc-300 focus:ring-1 ${colorTheme.ring}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#18181b] border-white/10 text-zinc-300 z-[80] min-w-[240px]">
                                            {currentModels.map((model) => (
                                                <SelectItem
                                                    key={model.id}
                                                    value={model.id}
                                                    className="text-xs py-2 focus:bg-white/10 focus:text-zinc-100"
                                                    extra={
                                                        <span className="ml-auto flex items-center gap-1 pl-2 shrink-0">
                                                            {model.free && (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">
                                                                    Gratuit
                                                                </span>
                                                            )}
                                                            {model.supportsVision && (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">
                                                                    Vision
                                                                </span>
                                                            )}
                                                        </span>
                                                    }
                                                >
                                                    {model.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Context Files */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                        Contexte <span className="bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] min-w-[16px] text-center">{selectedFileIds.size}</span>
                                    </Label>
                                    <div className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
                                        <ScrollArea className="h-[140px]">
                                            {allFiles.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full py-8 text-zinc-700 gap-2">
                                                    <FileCode className="h-6 w-6 opacity-20" />
                                                    <span className="text-[10px]">Aucun fichier</span>
                                                </div>
                                            ) : (
                                                <div className="p-1 space-y-0.5">
                                                    {allFiles.map(file => (
                                                        <div
                                                            key={file.id}
                                                            onClick={() => toggleFileSelection(file.id)}
                                                            className={`
                                                                flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-xs
                                                                ${selectedFileIds.has(file.id)
                                                                    ? 'bg-violet-500/10 text-violet-200'
                                                                    : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'}
                                                            `}
                                                        >
                                                            <div className={`w-3 h-3 rounded flex items-center justify-center border ${selectedFileIds.has(file.id) ? 'border-violet-500 bg-violet-500' : 'border-zinc-700 bg-transparent'}`}>
                                                                {selectedFileIds.has(file.id) && <Bot className="h-2 w-2 text-white" />}
                                                            </div>
                                                            <span className="truncate flex-1">{file.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>

                                {/* Generation History */}
                                {generationHistory.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            Historique <span className="bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] min-w-[16px] text-center">{generationHistory.length}</span>
                                        </Label>
                                        <div className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
                                            <ScrollArea className="h-[120px]">
                                                <div className="p-1.5 space-y-1">
                                                    {generationHistory.map(gen => {
                                                        const cfg = PROVIDER_CONFIGS[gen.provider];
                                                        const modeIcon = gen.mode === 'iterate' ? '✏️' : gen.mode === 'image' ? '🖼️' : '✨';
                                                        const timeAgo = Math.round((Date.now() - gen.timestamp) / 60000);
                                                        const timeStr = timeAgo < 1 ? 'à l\'instant' : timeAgo < 60 ? `il y a ${timeAgo}m` : `il y a ${Math.round(timeAgo / 60)}h`;
                                                        return (
                                                            <div
                                                                key={gen.id}
                                                                className="px-2 py-1.5 rounded-md bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
                                                            >
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className="text-[10px]">{modeIcon}</span>
                                                                    <span className="text-[10px] font-medium text-zinc-300 truncate flex-1">{gen.prompt.slice(0, 40)}{gen.prompt.length > 40 ? '...' : ''}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-600">
                                                                    <span>{cfg.label}</span>
                                                                    <span>·</span>
                                                                    <span>{gen.model}</span>
                                                                    <span>·</span>
                                                                    <span>{gen.widgetCount} widgets</span>
                                                                    <span className="ml-auto">{timeStr}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-[#09090b] relative">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'prompt' | 'image')} className="flex-1 flex flex-col">
                            {/* Input Area */}
                            <div className="flex-1 flex flex-col min-h-0 relative">
                                <TabsContent value="prompt" className="flex-1 m-0 p-0 flex flex-col h-full data-[state=inactive]:hidden">
                                    <div className="flex-1 relative flex flex-col">
                                        {aiMode === 'iterate' && (
                                            <div className="mx-6 mt-4 mb-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                <Pencil className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                <span className="text-[11px] text-amber-200/80">
                                                    Mode modification — {widgets.length} widget{widgets.length > 1 ? 's' : ''} sur le canvas seront envoyés comme contexte
                                                </span>
                                            </div>
                                        )}
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            onKeyDown={(e) => {
                                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating) {
                                                    e.preventDefault();
                                                    handleGenerate();
                                                }
                                            }}
                                            placeholder={aiMode === 'iterate'
                                                ? "Décrivez les modifications souhaitées..."
                                                : "Décrivez l'interface CustomTkinter à générer..."
                                            }
                                            className="w-full resize-none bg-transparent border-0 focus-visible:ring-0 text-base leading-relaxed p-6 pb-2 placeholder:text-zinc-700 text-zinc-200 font-light flex-1 overflow-y-auto"
                                            style={{ fontSize: '15px', minHeight: '80px' }}
                                        />

                                        {/* Empty state hint */}
                                        {!prompt.trim() && (
                                            <div className="px-6 pb-4 flex-1 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                                                <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                                    {aiMode === 'iterate'
                                                        ? <Pencil className="h-5 w-5 text-amber-500/40" />
                                                        : <Sparkles className="h-5 w-5 text-indigo-500/40" />
                                                    }
                                                </div>
                                                <p className="text-[12px] text-zinc-600 text-center max-w-[280px] leading-relaxed">
                                                    {aiMode === 'iterate'
                                                        ? `Décrivez les modifications souhaitées. ${widgets.length} widget${widgets.length > 1 ? 's' : ''} sur le canvas seront envoyés comme contexte.`
                                                        : 'Décrivez l\'interface CustomTkinter que vous souhaitez générer. Soyez précis sur la disposition, les couleurs et les widgets.'
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {prompt.trim() && (
                                            <div className="absolute bottom-4 right-4 flex gap-2">
                                                <Badge variant="outline" className="bg-black/40 backdrop-blur border-white/5 text-zinc-500 text-[10px] font-normal">
                                                    ⌘/Ctrl + Entrée pour générer
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="image" className="flex-1 m-0 p-6 data-[state=inactive]:hidden h-full">
                                    {uploadedImage ? (
                                        <div className="w-full h-full relative rounded-xl overflow-hidden border border-white/10 bg-black/40 group">
                                            <img
                                                src={uploadedImage}
                                                alt="Upload"
                                                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md"
                                                    onClick={() => setUploadedImage(null)}
                                                >
                                                    Changer l'image
                                                </Button>
                                                <Input
                                                    placeholder="Instructions supplémentaires..."
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    className="absolute bottom-4 left-4 right-4 w-auto bg-black/80 border-white/10 text-zinc-200 placeholder:text-zinc-600"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/30 hover:shadow-[0_0_30px_-10px_rgba(15,52,96,0.1)] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 group"
                                        >
                                            <div className="h-16 w-16 rounded-full bg-black/40 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-violet-500/30 transition-all duration-300">
                                                <Upload className="h-6 w-6 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                                            </div>
                                            <div className="text-center space-y-1.5">
                                                <h3 className="font-medium text-zinc-300 group-hover:text-violet-200 transition-colors">Déposez votre maquette</h3>
                                                <p className="text-xs text-zinc-600">ou cliquez pour parcourir</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.ico"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </TabsContent>
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 bg-[#0c0c0e] border-t border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                                    <TabsList className="bg-transparent h-auto p-0 gap-0">
                                        <TabsTrigger
                                            value="prompt"
                                            className="data-[state=active]:bg-white/10 data-[state=active]:text-zinc-100 text-zinc-500 px-3 py-1.5 h-auto text-xs rounded-md transition-all font-medium"
                                        >
                                            <MessageSquare className="h-3 w-3 mr-2" />
                                            Texte
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="image"
                                            disabled={!supportsVision || aiMode === 'iterate'}
                                            className="data-[state=active]:bg-white/10 data-[state=active]:text-zinc-100 text-zinc-500 px-3 py-1.5 h-auto text-xs rounded-md transition-all font-medium disabled:opacity-40"
                                        >
                                            <ImageIcon className="h-3 w-3 mr-2" />
                                            Vision
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex items-center gap-3">
                                    {error && !isGenerating && (
                                        <div className="flex items-center gap-2 max-w-[340px] animate-in fade-in slide-in-from-right-2">
                                            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                            <span className="text-[11px] text-red-400/90 leading-tight line-clamp-2">{error}</span>
                                        </div>
                                    )}
                                    {error && !isGenerating && (
                                        <Button
                                            onClick={handleGenerate}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 text-[11px] border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200 shrink-0"
                                        >
                                            <Loader2 className="h-3 w-3 mr-1.5" />
                                            Réessayer
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !apiKey.trim() || (aiMode === 'iterate' && (!prompt.trim() || widgets.length === 0)) || (aiMode === 'create' && activeTab === 'image' && !uploadedImage) || (aiMode === 'create' && activeTab === 'prompt' && !prompt.trim())}
                                        className={`
                                            h-9 px-6 font-medium text-xs transition-all duration-300
                                            ${isGenerating
                                                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                                : aiMode === 'iterate'
                                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40 hover:-translate-y-0.5'
                                                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 hover:-translate-y-0.5'}
                                        `}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                                {retryCount > 0
                                                    ? `Retry ${retryCount}...`
                                                    : aiMode === 'iterate' ? 'Modification...' : 'Génération...'}
                                                {elapsedSeconds > 0 && (
                                                    <span className="ml-1.5 text-[10px] opacity-60">{elapsedSeconds}s</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {aiMode === 'iterate' ? <Pencil className="h-3.5 w-3.5 mr-2" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
                                                {aiMode === 'iterate' ? 'Modifier' : 'Générer'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
