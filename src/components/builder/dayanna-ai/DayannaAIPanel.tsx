import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import type { ApiKeys, Attachment, Conversation, InputStatus, Message, Model, Provider, AIMode, TaggedFile } from './types';
import { SettingsModal } from './SettingsModal';
import { Sidebar } from './Sidebar';
import { useWidgets } from '@/contexts/WidgetContext';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getProviderConfig,
  ALL_MODELS,
  type AIProvider,
} from '@/lib/aiPrompts';
import {
  fetchConversations as fetchConversationsFromDb,
  upsertConversation,
  deleteConversation as deleteConversationFromDb,
  fetchApiKeysFromSupabase,
  saveApiKeysToSupabase,
} from '@/lib/supabaseService';

const REASONING_TEXT = [
  'Analyse de la demande en cours...',
  '\n\nJe prepare les etapes de resolution.',
  '\n\nJe lance le workflow et je verifie la coherence.',
  '\n\nJe finalise la reponse et les actions associees.',
].join('');

const toGeminiModel = (model: Model): string => {
  if (model === 'auto') return 'gemini-3-flash-preview';
  if (model.startsWith('gemini-')) return model;
  return 'gemini-3-flash-preview';
};

const PROVIDER_MAP: Record<string, AIProvider> = {
  google: 'google',
  openai: 'openai',
  anthropic: 'anthropic',
  huggingface: 'huggingface',
  openrouter: 'openrouter',
  groq: 'groq',
  deepseek: 'deepseek',
};

function resolveProvider(modelId: string, selectedProvider: Provider): AIProvider {
  const modelDef = ALL_MODELS.find(m => m.id === modelId);
  if (modelDef) return modelDef.provider;
  return PROVIDER_MAP[selectedProvider] || 'google';
}

interface DbConversationRow {
  id: string;
  title: string;
  first_message: string | null;
  messages: unknown[];
  updated_at: string;
}

export const DayannaAIPanel = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [inputStatus, setInputStatus] = useState<InputStatus>('ready');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [restoreContent, setRestoreContent] = useState<string | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const aiRef = useRef<GoogleGenAI | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  const { user } = useAuth();
  const { widgets, canvasSettings, loadWorkspaceState } = useWidgets();
  const { data: files, getPyFiles, addNode } = useFileSystem();

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );
  const messages = currentConversation?.messages ?? [];

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const mapDbConversation = useCallback((row: DbConversationRow): Conversation => ({
    id: row.id,
    title: row.title,
    firstMessage: row.first_message ?? undefined,
    messages: (row.messages ?? []) as Message[],
    timestamp: new Date(row.updated_at).getTime(),
  }), []);

  // Load conversations + API keys from Supabase on mount
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setCurrentConversationId(null);
      setApiKeys({});
      setDbReady(false);
      setIsLoadingDb(false);
      return;
    }

    let cancelled = false;
    setIsLoadingDb(true);

    (async () => {
      try {
        const [dbConvos, dbKeys] = await Promise.all([
          fetchConversationsFromDb(),
          fetchApiKeysFromSupabase(),
        ]);

        if (cancelled) return;

        const mapped: Conversation[] = dbConvos.map((c) => mapDbConversation(c as DbConversationRow));
        const sorted = [...mapped].sort((a, b) => b.timestamp - a.timestamp);
        setConversations(sorted);
        setCurrentConversationId((prev) => {
          if (prev && sorted.some((c) => c.id === prev)) return prev;
          return sorted[0]?.id ?? null;
        });

        setApiKeys((dbKeys ?? {}) as ApiKeys);
        aiRef.current = null;
        setDbReady(true);
      } catch (error) {
        console.warn('[AI] Chargement initial depuis Supabase impossible:', error);
        setDbReady(false);
      } finally {
        if (!cancelled) setIsLoadingDb(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, mapDbConversation]);

  // Realtime sync: conversations + API keys
  useEffect(() => {
    if (!user || !dbReady) return;

    const conversationsChannel = supabase
      .channel(`ai-conversations-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_conversations', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setConversations((prev) => {
            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id?: string })?.id;
              if (!deletedId) return prev;
              const next = prev.filter((c) => c.id !== deletedId);
              setCurrentConversationId((current) => (current === deletedId ? (next[0]?.id ?? null) : current));
              return next;
            }

            const row = payload.new as DbConversationRow | null;
            if (!row?.id) return prev;
            const mapped = mapDbConversation(row);
            const withoutCurrent = prev.filter((c) => c.id !== mapped.id);
            return [mapped, ...withoutCurrent].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel(`user-settings-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setApiKeys({});
            aiRef.current = null;
            return;
          }
          const aiApiKeys = (payload.new as { ai_api_keys?: Record<string, string> | null })?.ai_api_keys;
          if (aiApiKeys && typeof aiApiKeys === 'object') {
            setApiKeys(aiApiKeys as ApiKeys);
            aiRef.current = null;
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(conversationsChannel);
      void supabase.removeChannel(settingsChannel);
    };
  }, [user, dbReady, mapDbConversation]);

  const persistConversationToDb = useCallback(async (conversation: Conversation) => {
    if (!dbReady || !user) return;
    await upsertConversation({
      id: conversation.id,
      title: conversation.title,
      first_message: conversation.firstMessage ?? null,
      messages: conversation.messages as unknown[],
    });
  }, [dbReady, user]);

  const getAI = useCallback(() => {
    const apiKey = apiKeys.google || '';
    if (!apiKey) {
      throw new Error('Aucune cle Google Gemini configuree. Ouvrez les parametres IA pour ajouter votre cle API.');
    }
    if (!aiRef.current) {
      aiRef.current = new GoogleGenAI({ apiKey });
    }
    return aiRef.current;
  }, [apiKeys.google]);

  const getFileSummary = useCallback((content: string, maxLines = 5): string => {
    if (!content) return '(vide)';
    const lines = content.split('\n').filter(l => l.trim());
    const summary = lines.slice(0, maxLines).join('\n');
    return lines.length > maxLines ? `${summary}\n... (+${lines.length - maxLines} lignes)` : summary;
  }, []);

  const detectMentionedFiles = useCallback((message: string, allFiles: { id: string; name: string; content?: string }[]): { id: string; name: string; content?: string }[] => {
    const lower = message.toLowerCase();
    const detected: { id: string; name: string; content?: string }[] = [];
    for (const f of allFiles) {
      const nameNoExt = f.name.replace(/\.py$/i, '').toLowerCase();
      const nameWithExt = f.name.toLowerCase();
      if (lower.includes(nameNoExt) || lower.includes(nameWithExt)) {
        detected.push(f);
      }
    }
    return detected;
  }, []);

  const buildCanvasContext = useCallback((taggedFiles?: TaggedFile[], autoDetectedFiles?: { name: string; content?: string }[]) => {
    const pyFiles = getPyFiles();
    const widgetSummary = widgets.map(w =>
      `- ${w.type}(id:${w.id}) "${(w as any).properties?.text || w.type}" at (${w.position.x},${w.position.y})${w.parentId ? ` inside ${w.parentId}` : ''}`
    ).join('\n');

    const fileSummaries = pyFiles.map(f =>
      `  - ${f.name}: ${getFileSummary(f.content || '', 3)}`
    ).join('\n');

    let context = `
CONTEXTE DU CANVAS ACTUEL:
- Taille du canvas: ${canvasSettings.width}x${canvasSettings.height}
- Titre: ${canvasSettings.title || 'Sans titre'}
- Nombre de widgets: ${widgets.length}

FICHIERS DU PROJET (${pyFiles.length} fichiers):
${fileSummaries || '  (Aucun fichier)'}

WIDGETS SUR LE CANVAS:
${widgetSummary || '(Aucun widget)'}`;

    if (taggedFiles && taggedFiles.length > 0) {
      context += '\n\nFICHIERS TAGGES PAR L\'UTILISATEUR:\n';
      taggedFiles.forEach(f => {
        context += `\n--- ${f.name} ---\n${f.content || '(vide)'}\n`;
      });
    }

    if (autoDetectedFiles && autoDetectedFiles.length > 0) {
      const alreadyTagged = new Set((taggedFiles || []).map(f => f.name));
      const newFiles = autoDetectedFiles.filter(f => !alreadyTagged.has(f.name));
      if (newFiles.length > 0) {
        context += '\n\nFICHIERS DETECTES AUTOMATIQUEMENT (mentionnes dans le message):\n';
        newFiles.forEach(f => {
          context += `\n--- ${f.name} ---\n${f.content || '(vide)'}\n`;
        });
      }
    }

    return context;
  }, [widgets, canvasSettings, files, getPyFiles, getFileSummary]);

  const buildSystemPrompt = useCallback((mode: AIMode, taggedFiles?: TaggedFile[], autoDetectedFiles?: { name: string; content?: string }[]) => {
    const canvasContext = buildCanvasContext(taggedFiles, autoDetectedFiles);

    const projectAwareness = `
COMPREHENSION DU PROJET:
- Tu connais TOUS les fichiers du projet et leur contenu resume ci-dessous.
- Quand l'utilisateur mentionne un fichier par son nom (meme sans extension .py), identifie-le automatiquement.
- Si l'utilisateur parle d'une page ou interface qui N'EXISTE PAS encore dans le projet, comprends qu'il faut la CREER.
- Tu dois toujours avoir une comprehension globale du projet et de son architecture.
- Ne demande JAMAIS a l'utilisateur quel fichier il veut dire si le contexte est clair.
`;

    switch (mode) {
      case 'discussions':
        return `Tu es Dayanna, l'assistante IA de Notorious.PY. Tu reponds en francais de facon claire et concise. Tu es en mode DISCUSSION: tu reponds aux questions de l'utilisateur sans modifier le canvas, sans generer de JSON de widgets, et sans effectuer d'actions sur le projet. Contente-toi de repondre a la question posee de facon naturelle et utile.\n${projectAwareness}\n${canvasContext}`;

      case 'plan':
        return `Tu es Dayanna, l'assistante IA de Notorious.PY, en mode PLANIFICATION.

Tu dois aider l'utilisateur a planifier un projet complet d'interfaces CustomTkinter.

PROCESSUS OBLIGATOIRE:
1. ANALYSE: Analyse la demande de l'utilisateur et identifie toutes les interfaces/ecrans necessaires.
2. PLAN: Presente un plan structure et numerote avec:
   - Le nombre total d'interfaces a creer
   - Pour chaque interface: nom, description, taille suggeree du canvas, widgets principaux
   - Les questions de clarification (taille du canvas, couleurs, etc.)
3. ATTENTE: Termine ta reponse par "Validez-vous ce plan ? (oui/non)" et ATTENDS la reponse.
4. GENERATION: Quand l'utilisateur confirme avec "oui", genere chaque interface UNE PAR UNE.
   - Pour chaque interface, genere le JSON des widgets dans un bloc \`\`\`json ... \`\`\`
   - Indique clairement "Interface X/N: [nom]" avant chaque bloc

FORMAT DE PLAN:
## Plan de projet: [titre]

### Interfaces a creer:
1. **[Nom de l'interface]** - [description courte]
   - Canvas: [largeur]x[hauteur]
   - Widgets principaux: [liste]
2. **[Nom de l'interface]** - ...

### Questions:
- [question 1]
- [question 2]

Validez-vous ce plan ? (oui/non)
${projectAwareness}
${canvasContext}`;

      case 'agent':
      default:
        return `Tu es Dayanna, l'assistante IA de Notorious.PY, un builder no-code pour creer des interfaces CustomTkinter en Python. Tu reponds en francais, de facon claire et concise. Tu as acces au contexte du canvas actuel et peux aider a modifier le design, ajouter des widgets, ou generer du code Python.\n${projectAwareness}\n${canvasContext}`;
    }
  }, [buildCanvasContext]);

  const callOpenAICompatible = useCallback(async (
    provider: AIProvider,
    apiKey: string,
    model: string,
    userMessage: string,
    signal?: AbortSignal,
    systemPromptOverride?: string
  ): Promise<string> => {
    const config = getProviderConfig(provider);

    const systemContent = systemPromptOverride || `Tu es Dayanna, l'assistante IA de Notorious.PY, un builder no-code pour creer des interfaces CustomTkinter en Python. Tu reponds en francais, de facon claire et concise. Tu as acces au contexte du canvas actuel et peux aider a modifier le design, ajouter des widgets, ou generer du code Python.\n\n${buildCanvasContext()}`;

    if (config.apiFormat === 'anthropic') {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.authHeader(apiKey) },
        body: JSON.stringify({
          model,
          max_tokens: config.maxTokens,
          system: systemContent,
          messages: [{ role: 'user', content: userMessage }],
          temperature: 0.7,
        }),
        signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Erreur ${config.label} (${response.status})`);
      }

      const data = await response.json();
      return data.content?.find((b: any) => b.type === 'text')?.text || '';
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.authHeader(apiKey) },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userMessage },
        ],
        max_tokens: config.maxTokens,
        temperature: 0.7,
      }),
      signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || errData.error?.code || '';
      if (response.status === 401 || response.status === 403) throw new Error(`Cle API ${config.label} invalide.`);
      if (response.status === 429) throw new Error(`Limite de requetes ${config.label} atteinte. Reessayez dans 30s.`);
      throw new Error(msg || `Erreur ${config.label} (${response.status})`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
    return data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || data.choices?.[0]?.text || '';
  }, [buildCanvasContext]);

  const updateConversationMessages = useCallback(
    (
      conversationId: string,
      updater: (prev: Message[]) => Message[],
      options?: { persist?: boolean }
    ) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id !== conversationId
            ? c
            : { ...c, messages: updater(c.messages), timestamp: Date.now() }
        );

        if (options?.persist) {
          const updatedConversation = next.find((c) => c.id === conversationId);
          if (updatedConversation) {
            void persistConversationToDb(updatedConversation);
          }
        }

        return next;
      });
    },
    [persistConversationToDb]
  );

  const simulateReasoning = useCallback(
    async (conversationId: string, assistantMessageId: string) => {
      const tokens = REASONING_TEXT.match(/.{1,5}/g) ?? [REASONING_TEXT];
      let rolling = '';
      for (const token of tokens) {
        rolling += token;
        updateConversationMessages(conversationId, (prev) =>
          prev.map((msg) => msg.id === assistantMessageId ? { ...msg, reasoning: rolling, isReasoningStreaming: true } : msg)
        );
        await new Promise((r) => setTimeout(r, 30));
      }
      updateConversationMessages(conversationId, (prev) =>
        prev.map((msg) => msg.id === assistantMessageId ? { ...msg, isReasoningStreaming: false } : msg)
      );
    },
    [updateConversationMessages]
  );

  const ensureConversation = useCallback((seed?: string): string => {
    if (currentConversationId) return currentConversationId;
    const id = nanoid();
    const titleSeed = (seed || 'Nouvelle conversation').trim();
    const title = titleSeed.length > 40 ? `${titleSeed.slice(0, 40)}...` : titleSeed;
    const created: Conversation = { id, title, messages: [], timestamp: Date.now(), firstMessage: seed };
    setConversations((prev) => [created, ...prev]);
    setCurrentConversationId(id);
    void persistConversationToDb(created);
    return id;
  }, [currentConversationId, persistConversationToDb]);

  const handleSendMessage = useCallback(
    async (content: string, model: Model, attachments?: Attachment[], provider?: Provider, mode?: AIMode, taggedFiles?: TaggedFile[]) => {
      const trimmed = content.trim();
      if (!trimmed || isTyping) return;

      const activeMode = mode || 'agent';
      const conversationId = ensureConversation(trimmed);
      const resolvedProvider = resolveProvider(model, provider || 'google');

      const providerKey = apiKeys[resolvedProvider as keyof ApiKeys] || '';
      if (!providerKey) {
        toast.error(`Aucune cle API pour ${resolvedProvider}. Configurez-la dans les parametres.`);
        setIsSettingsOpen(true);
        return;
      }

      const pyFiles = getPyFiles().map(f => ({ id: f.id, name: f.name, content: f.content || '' }));
      const autoDetected = detectMentionedFiles(trimmed, pyFiles);

      const systemPrompt = buildSystemPrompt(activeMode, taggedFiles, autoDetected);

      const userMessage: Message = { id: nanoid(), role: 'user', content: trimmed, attachments, timestamp: Date.now() };
      updateConversationMessages(conversationId, (prev) => [...prev, userMessage]);

      setInputStatus('submitted');
      setIsTyping(true);

      const controller = new AbortController();
      setAbortController(controller);

      const taskLabel = activeMode === 'plan' ? 'Elaboration du plan' :
                        activeMode === 'discussions' ? 'Reflexion' : 'Generation de la reponse';

      const assistantMessageId = nanoid();
      updateConversationMessages(conversationId, (prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          reasoning: '',
          isReasoningStreaming: true,
          tasks: [
            { id: nanoid(), label: 'Analyse du prompt', status: 'completed' as const },
            { id: nanoid(), label: 'Preparation des ressources', status: 'completed' as const },
            { id: nanoid(), label: taskLabel, status: 'running' as const },
          ],
          timestamp: Date.now(),
        },
      ], { persist: true });

      try {
        const reasoningPromise = simulateReasoning(conversationId, assistantMessageId);
        setInputStatus('streaming');

        let responseText = '';

        if (resolvedProvider === 'google') {
          const ai = getAI();
          const parts: Array<Record<string, unknown>> = [{ text: trimmed }];
          (attachments ?? []).forEach((att) => {
            if (att.data && att.mimeType) {
              parts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
            }
          });

          const stream = await ai.models.generateContentStream({
            model: toGeminiModel(model),
            contents: { parts },
            config: {
              systemInstruction: systemPrompt,
            },
          });

          for await (const chunk of stream) {
            if (controller.signal.aborted) break;
            const text = chunk.text;
            if (!text) continue;
            responseText += text;
            updateConversationMessages(conversationId, (prev) =>
              prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: responseText } : msg)
            );
          }
        } else {
          responseText = await callOpenAICompatible(resolvedProvider, providerKey, model, trimmed, controller.signal, systemPrompt);
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: responseText } : msg)
          );
        }

        await reasoningPromise;

        // Plan mode: detect JSON blocks and auto-create project files
        if (activeMode === 'plan' && responseText.includes('```json')) {
          const jsonBlocks = responseText.match(/```json\s*([\s\S]*?)```/g);
          if (jsonBlocks) {
            let interfaceIdx = 0;
            for (const block of jsonBlocks) {
              const jsonStr = block.replace(/```json\s*/, '').replace(/```$/, '').trim();
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.widgets && parsed.canvasSettings) {
                  interfaceIdx++;
                  const title = parsed.canvasSettings.title || `Interface ${interfaceIdx}`;
                  const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.py`;
                  addNode(null, 'file', fileName);
                  if (interfaceIdx === 1 && loadWorkspaceState) {
                    try { loadWorkspaceState(parsed.widgets, parsed.canvasSettings); } catch { /* best-effort */ }
                  }
                }
              } catch {
                // Not valid JSON, skip
              }
            }
          }
        }

        const doneLabel = activeMode === 'plan' ? 'Plan termine' :
                          activeMode === 'discussions' ? 'Reponse terminee' : 'Generation terminee';

        updateConversationMessages(conversationId, (prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, tasks: msg.tasks?.map((t, i) => i === 2 ? { ...t, status: 'completed', label: doneLabel } : t) }
              : msg
          ),
          { persist: true }
        );
        setInputStatus('ready');
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          toast.info('Generation interrompue');
        } else {
          const message = error instanceof Error ? error.message : 'Erreur IA inconnue.';
          toast.error(message);
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: 'Une erreur est survenue. Verifiez votre cle API dans les parametres.', isReasoningStreaming: false, tasks: msg.tasks?.map((t, i) => i === 2 ? { ...t, status: 'error', label: 'Echec' } : t) }
                : msg
            ),
            { persist: true }
          );
          setInputStatus('error');
          setTimeout(() => setInputStatus('ready'), 1800);
        }
      } finally {
        setIsTyping(false);
        setAbortController(null);
      }
    },
    [addNode, apiKeys, buildCanvasContext, buildSystemPrompt, callOpenAICompatible, ensureConversation, getAI, isTyping, loadWorkspaceState, simulateReasoning, updateConversationMessages]
  );

  const handleStopGeneration = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setIsTyping(false);
    setInputStatus('ready');
  }, [abortController]);

  const handleNewConversation = useCallback(() => {
    const id = nanoid();
    const created: Conversation = { id, title: 'Nouvelle conversation', messages: [], timestamp: Date.now() };
    setConversations((prev) => [created, ...prev]);
    setCurrentConversationId(id);
    void persistConversationToDb(created);
  }, [persistConversationToDb]);

  const handleRestore = useCallback((messageId: string) => {
    if (!currentConversationId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentConversationId) return c;
        const idx = c.messages.findIndex((m) => m.id === messageId);
        if (idx < 0) return c;
        setRestoreContent(c.messages[idx].content);
        const updated = { ...c, messages: c.messages.slice(0, idx), timestamp: Date.now() };
        void persistConversationToDb(updated);
        return updated;
      })
    );
  }, [currentConversationId, persistConversationToDb]);

  const handleDeleteConversation = useCallback((id: string) => {
    void deleteConversationFromDb(id);
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (currentConversationId === id) setCurrentConversationId(next[0]?.id ?? null);
      return next;
    });
  }, [currentConversationId]);

  const handleUpdateTitle = useCallback((id: string, title: string) => {
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, title: title.trim() || 'Sans titre', timestamp: Date.now() } : c
      );
      const updated = next.find((c) => c.id === id);
      if (updated) void persistConversationToDb(updated);
      return next;
    });
  }, [persistConversationToDb]);

  const handleSaveApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    aiRef.current = null;

    if (!dbReady || !user) {
      toast.error('Connexion requise pour enregistrer les cles API en base.');
      return;
    }

    void saveApiKeysToSupabase(keys as unknown as Record<string, string | undefined>)
      .then(() => toast.success('Parametres enregistres'))
      .catch(() => toast.error('Echec enregistrement des cles API'));
  }, [dbReady, user]);

  const availableFiles = useMemo(() => {
    return getPyFiles().map(f => ({
      id: f.id,
      name: f.name,
      content: f.content || '',
    }));
  }, [getPyFiles]);

  if (isLoadingDb) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
        Synchronisation Dayanna...
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        messages={messages}
        isTyping={isTyping}
        inputStatus={inputStatus}
        onSendMessage={handleSendMessage}
        onRestore={handleRestore}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        onUpdateTitle={handleUpdateTitle}
        restoreContent={restoreContent}
        onClearRestoreContent={() => setRestoreContent(null)}
        onStopGeneration={handleStopGeneration}
        onOpenSettings={() => setIsSettingsOpen(true)}
        apiKeys={apiKeys}
        availableFiles={availableFiles}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};
