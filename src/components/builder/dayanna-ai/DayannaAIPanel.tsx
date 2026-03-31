import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import type { ApiKeys, Attachment, Conversation, InputStatus, Message, Model, Provider, AIMode, TaggedFile, GenerationStage } from './types';
import { SettingsModal } from './SettingsModal';
import { Sidebar } from './Sidebar';
import { useWidgets } from '@/contexts/WidgetContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useFileSystem } from '@/hooks/useFileSystem';
import {
  useAIGeneration,
  type ContextFile,
  type GenerationQualityCheck,
  type GenerationQualitySummary,
} from '@/hooks/useAIGeneration';
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
  touchConversation as touchConversationInDb,
  fetchApiKeysFromSupabase,
  saveApiKeysToSupabase,
  checkConversationSyncHealth,
  flushPendingConversationWrites,
  resetAllConversationsForUser,
  type PendingConversationWrite,
} from '@/lib/supabaseService';
import { OPEN_AI_SIDEBAR_EVENT, consumeForceNewConversationOnLoadFlag } from '@/lib/aiSidebar';

const REASONING_TEXT = [
  'Analyse de la demande.',
  '\n\nInspection du contexte projet et des fichiers utiles.',
  '\n\nComposition de la reponse et validation.',
  '\n\nApplication finale et sauvegarde.',
].join('');

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

interface PlanInterfaceSpec {
  name: string;
  purpose: string;
  canvas: {
    width: number;
    height: number;
  };
  widgets: string[];
  designNotes: string;
}

interface PlanDraft {
  title: string;
  objective: string;
  interfaces: PlanInterfaceSpec[];
}

interface PendingPlanExecution {
  plan: PlanDraft;
  model: string;
  provider: Provider;
  contextFiles: ContextFile[];
  nextInterfaceIndex: number;
  createdFiles: string[];
}

type AIErrorCode =
  | 'INVALID_KEY'
  | 'QUOTA_EXCEEDED'
  | 'PAID_MODEL'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'MODEL_UNAVAILABLE'
  | 'EMPTY_CONTENT'
  | 'JSON_INVALID'
  | 'UNKNOWN';

const MAX_PROVIDER_ATTEMPTS = 3;
const DEFAULT_FIDELITY_NOTES = [
  "Polices exactes: reproduction proche, selon les polices disponibles dans l'application.",
  "Assets/images/logo: import manuel requis si les fichiers source ne sont pas fournis.",
  "Icones proprietaires: remplacees par des equivalents compatibles si necessaire.",
  "Effets graphiques avances (ombres/flous/gradients complexes): approximation possible selon les widgets disponibles.",
];

interface MultimodalUserPayload {
  text: string;
  images?: Attachment[];
}

interface OpenAICompatibleCallOptions {
  stream?: boolean;
  onDelta?: (fullText: string, delta: string, tokenCount: number) => void;
}

interface VisionExecutionContext {
  provider: Provider;
  model: string;
  apiKey: string;
}

const PREMIUM_DESIGN_BASELINE = `
STYLE VISUEL OBLIGATOIRE (premium Notorious auth):
- Interface professionnelle, lisible, moderne, cohérente.
- Utiliser une structure claire: en-tête, zones de contenu, alignements nets.
- Espacement régulier (8/12/16/24), proportions harmonieuses, aucun chevauchement.
- Palette cohérente inspirée Notorious: bleus profonds et tons neutres élégants.
- Typographie lisible, hiérarchie claire (titres, sous-titres, contenu, actions).
- Les widgets doivent être utilisés intelligemment pour construire une vraie interface exploitable.
- Interdit: empiler des widgets sans composition; chaque élément doit appartenir à un bloc de layout clair.
- En demande "créer/générer", repartir d'une structure propre et cohérente, sans répliquer des blocs identiques.
`;

const PLAN_SCHEMA = `{
  "title": "Nom du plan",
  "objective": "Objectif global",
  "interfaces": [
    {
      "name": "Nom interface",
      "purpose": "Rôle principal",
      "canvas": { "width": 1200, "height": 800 },
      "widgets": ["widget 1", "widget 2", "widget 3"],
      "designNotes": "Lignes directrices design"
    }
  ]
}`;

const DEFAULT_CANVAS = {
  width: 800,
  height: 600,
};

const extractJsonObject = (text: string): Record<string, unknown> | null => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const source = (fenced?.[1] ?? text).trim();
  const firstBrace = source.indexOf('{');
  const lastBrace = source.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(source.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const normalizeWordsForPascal = (raw: string): string[] => {
  const ascii = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.py$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  return ascii.split(/\s+/).filter(Boolean);
};

const toPascalCaseStem = (raw: string): string => {
  const words = normalizeWordsForPascal(raw);
  if (words.length === 0) return `Interface${Date.now().toString().slice(-4)}`;
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

const toPascalCasePyName = (raw: string): string => {
  const stem = toPascalCaseStem(raw);
  return `${stem}.py`;
};

const looksLikeBuilderJson = (content: string): boolean => {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    return Boolean(parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).widgets));
  } catch {
    return false;
  }
};

const rewritePythonImports = (content: string, moduleRenameMap: Record<string, string>): string => {
  if (!content || !Object.keys(moduleRenameMap).length || looksLikeBuilderJson(content)) return content;

  const rewriteModule = (moduleName: string): string => {
    const next = moduleRenameMap[moduleName];
    return next || moduleName;
  };

  const rewrittenLines = content.split('\n').map((line) => {
    const fromMatch = line.match(/^(\s*from\s+)([A-Za-z_][\w]*)(\s+import\s+.+)$/);
    if (fromMatch) {
      return `${fromMatch[1]}${rewriteModule(fromMatch[2])}${fromMatch[3]}`;
    }

    const importMatch = line.match(/^(\s*import\s+)(.+)$/);
    if (!importMatch) return line;

    const rewrittenTargets = importMatch[2]
      .split(',')
      .map((part) => {
        const segment = part.trim();
        if (!segment) return segment;
        const asMatch = segment.match(/^([A-Za-z_][\w]*)(\s+as\s+[A-Za-z_][\w]*)?$/);
        if (!asMatch) return segment;
        const rewritten = rewriteModule(asMatch[1]);
        return `${rewritten}${asMatch[2] ?? ''}`;
      })
      .join(', ');

    return `${importMatch[1]}${rewrittenTargets}`;
  });

  return rewrittenLines.join('\n');
};

const clampCanvasDimension = (value: unknown, fallback: number): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(1920, Math.max(360, Math.round(num)));
};

const normalizePlanDraft = (raw: Record<string, unknown> | null, userPrompt: string): PlanDraft | null => {
  if (!raw) return null;
  const maybeInterfaces = Array.isArray(raw.interfaces) ? raw.interfaces : [];
  if (maybeInterfaces.length === 0) return null;

  const normalizedInterfaces: PlanInterfaceSpec[] = maybeInterfaces.map((item, index) => {
    const obj = (item ?? {}) as Record<string, unknown>;
    const canvas = (obj.canvas ?? {}) as Record<string, unknown>;
    const widgets = Array.isArray(obj.widgets) ? obj.widgets.filter(Boolean).map(String) : [];
    return {
      name: String(obj.name ?? `Interface ${index + 1}`),
      purpose: String(obj.purpose ?? 'Interface principale'),
      canvas: {
        width: clampCanvasDimension(canvas.width, DEFAULT_CANVAS.width),
        height: clampCanvasDimension(canvas.height, DEFAULT_CANVAS.height),
      },
      widgets,
      designNotes: String(obj.designNotes ?? 'Design premium, lisible et moderne'),
    };
  });

  return {
    title: String(raw.title ?? 'Plan d\'interfaces'),
    objective: String(raw.objective ?? userPrompt),
    interfaces: normalizedInterfaces,
  };
};

const formatPlanMarkdown = (plan: PlanDraft): string => {
  const lines = [
    `## Plan de projet: ${plan.title}`,
    '',
    `**Objectif:** ${plan.objective}`,
    '',
    `### Interfaces a creer (${plan.interfaces.length})`,
  ];

  plan.interfaces.forEach((item, idx) => {
    const widgetList = item.widgets.length > 0 ? item.widgets.join(', ') : 'A definir';
    lines.push(
      `${idx + 1}. **${item.name}** - ${item.purpose}`,
      `   - Canvas: ${item.canvas.width}x${item.canvas.height}`,
      `   - Widgets: ${widgetList}`,
      `   - Style: ${item.designNotes}`
    );
  });

  lines.push('', 'Validez-vous ce plan ? (oui/non)');
  return lines.join('\n');
};

const isPositiveConfirmation = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  return /^(oui|ok|d'accord|valider|valide|go|lance|execute|exécute|confirm|yes)\b/.test(normalized);
};

const isNegativeConfirmation = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  return /^(non|annule|annuler|stop|pas maintenant|no)\b/.test(normalized);
};

const isMultiInterfaceRequest = (text: string): boolean => {
  const normalized = text.toLowerCase();
  const patterns = [
    /plusieurs (pages|ecrans|écrans|interfaces)/,
    /application complete|application complète/,
    /systeme complet|système complet/,
    /workflow complet/,
    /\b\d+\s*(pages|ecrans|écrans|interfaces)\b/,
    /de A a Z|de a z/,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
};

const detectAgentIntent = (text: string): 'create' | 'edit' | 'ask' | 'multi' => {
  if (isMultiInterfaceRequest(text)) return 'multi';

  const normalized = text.toLowerCase();
  const editPatterns = [
    /ameliore|améliore|modifier|modifie|corrige|ajuste|optimise|it[eé]ration|iteration/,
    /change|remplace|refait|restructure/,
  ];
  if (editPatterns.some((pattern) => pattern.test(normalized))) return 'edit';

  const createPatterns = [
    /cree|cr[eé]e|genere|g[eé]n[eé]re|construis|fabrique|nouveau|dashboard|page|interface|ecran|écran/,
  ];
  if (createPatterns.some((pattern) => pattern.test(normalized))) return 'create';

  return 'ask';
};

const getConversationSeedTitle = (seed?: string): string => {
  const titleSeed = (seed || 'Nouvelle conversation').trim();
  return titleSeed.length > 40 ? `${titleSeed.slice(0, 40)}...` : titleSeed;
};

const normalizeGeneratedTitle = (raw: string): string => {
  const singleLine = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const withoutPrefix = singleLine.replace(/^(titre|title)\s*[:-]\s*/i, '').trim();
  return withoutPrefix.slice(0, 64).trim();
};

const getFallbackConversationTitle = (prompt: string): string => {
  const cleaned = prompt
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^\wÀ-ÿ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Nouvelle conversation';
  const stopWords = new Set(['cree', 'crée', 'genere', 'génère', 'moi', 'une', 'un', 'de', 'la', 'le']);
  const words = cleaned
    .split(' ')
    .filter(Boolean)
    .filter((word) => !stopWords.has(word.toLowerCase()))
    .slice(0, 6);
  const title = words.join(' ');
  return title.length > 48 ? `${title.slice(0, 48).trim()}...` : title;
};

const normalizeInterfaceTitle = (raw: string): string => {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64);
};

const isGenericInterfaceTitle = (title: string): boolean => {
  const normalized = title.toLowerCase();
  if (!normalized) return true;

  const exactGeneric = new Set([
    'interface',
    'nouvelle interface',
    'new interface',
    'page',
    'nouvelle page',
    'untitled',
    'untitled interface',
  ]);

  return (
    exactGeneric.has(normalized) ||
    /^interface\s+\d+$/i.test(normalized) ||
    /^page\s+\d+$/i.test(normalized)
  );
};

const getGeneratedInterfaceTitle = (rawTitle: string, prompt: string): string => {
  const normalizedRaw = normalizeInterfaceTitle(rawTitle);
  if (!isGenericInterfaceTitle(normalizedRaw)) return normalizedRaw;
  return getFallbackConversationTitle(prompt) || 'Nouvelle Interface';
};

const toDataUri = (attachment: Attachment): string | null => {
  const raw = attachment.data?.trim();
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  const mime = attachment.mimeType || attachment.mediaType || 'image/png';
  return `data:${mime};base64,${raw}`;
};

const buildDesignReference = (images: Attachment[]) => ({
  attachmentIds: images.map((att) => att.id),
  attachmentNames: images.map((att) => att.name || att.filename || 'image'),
});

const buildFidelityReport = (notes: string[]): string => {
  const lines = ['### Rapport d\'ecarts (fidelite design)', ...notes.map((note) => `- ${note}`)];
  return lines.join('\n');
};

const withErrorCode = (code: AIErrorCode, message: string): string => `${code}:${message}`;

const parseErrorCode = (message: string): { code: AIErrorCode; detail: string } => {
  const idx = message.indexOf(':');
  if (idx <= 0) return { code: 'UNKNOWN', detail: message };
  const rawCode = message.slice(0, idx).trim().toUpperCase() as AIErrorCode;
  const detail = message.slice(idx + 1).trim() || message;
  const allowed = new Set<string>([
    'INVALID_KEY',
    'QUOTA_EXCEEDED',
    'PAID_MODEL',
    'NETWORK',
    'TIMEOUT',
    'RATE_LIMIT',
    'SERVER_ERROR',
    'MODEL_UNAVAILABLE',
    'EMPTY_CONTENT',
    'JSON_INVALID',
    'UNKNOWN',
  ]);
  return { code: allowed.has(rawCode) ? rawCode : 'UNKNOWN', detail };
};

const isRetryableCode = (code: AIErrorCode): boolean => {
  return ['NETWORK', 'TIMEOUT', 'RATE_LIMIT', 'SERVER_ERROR', 'EMPTY_CONTENT'].includes(code);
};

const normalizeHuggingFaceModel = (provider: AIProvider, model: string): string => {
  if (provider !== 'huggingface') return model;
  return model.includes(':') ? model : `${model}:hf-inference`;
};

const isPaidModelError = (message: string): boolean => {
  return /(payment|paid|billing|subscription|required|premium)/i.test(message);
};

const isQuotaError = (message: string): boolean => {
  return /(quota|credit|insufficient|exhausted|balance|limit reached)/i.test(message);
};

const formatProviderErrorForUser = (errorMessage: string): { code: AIErrorCode; text: string } => {
  const { code, detail } = parseErrorCode(errorMessage);
  switch (code) {
    case 'INVALID_KEY':
      return { code, text: detail || "Acces invalide. Verifiez votre cle API ou token d'acces." };
    case 'QUOTA_EXCEEDED':
      return { code, text: detail || 'Credits/tokens epuises. Choisissez un autre modele.' };
    case 'PAID_MODEL':
      return { code, text: detail || 'Modele payant indisponible. Choisissez un autre modele.' };
    case 'RATE_LIMIT':
      return { code, text: detail || 'Limite de requetes atteinte. Les tentatives automatiques ont echoue.' };
    case 'NETWORK':
      return { code, text: detail || 'Erreur reseau. Verifiez la connexion puis reessayez.' };
    case 'TIMEOUT':
      return { code, text: detail || 'Delai depasse pendant la generation.' };
    case 'SERVER_ERROR':
      return { code, text: detail || 'Erreur serveur temporaire.' };
    case 'MODEL_UNAVAILABLE':
      return { code, text: detail || 'Modele indisponible. Choisissez un autre modele.' };
    case 'EMPTY_CONTENT':
      return { code, text: detail || 'Le modele a renvoye une reponse vide.' };
    case 'JSON_INVALID':
      return { code, text: detail || "Le JSON renvoye par l'IA est invalide." };
    default:
      return { code: 'UNKNOWN', text: detail || 'Erreur IA inconnue.' };
  }
};

const computeWidgetImpact = (previousWidgets: { id: string; type: string }[], nextWidgets: { id: string; type: string }[]) => {
  const previousById = new Map(previousWidgets.map((w) => [w.id, w.type]));
  const nextById = new Map(nextWidgets.map((w) => [w.id, w.type]));
  let created = 0;
  let updated = 0;
  let deleted = 0;
  const touchedTypes = new Set<string>();

  for (const [id, type] of nextById.entries()) {
    if (!previousById.has(id)) {
      created += 1;
      touchedTypes.add(type);
      continue;
    }
    updated += 1;
    touchedTypes.add(type);
  }

  for (const [id] of previousById.entries()) {
    if (!nextById.has(id)) deleted += 1;
  }

  return {
    created,
    updated,
    deleted,
    touchedTypes: Array.from(touchedTypes),
  };
};

const mapQualityChecksToMessageMeta = (checks?: GenerationQualityCheck[]) => {
  if (!checks?.length) return undefined;
  return checks.map((check) => ({
    id: check.id,
    label: check.label,
    issueCount: check.issueCount,
    fixedCount: check.fixedCount,
    status: check.status,
    detail: check.detail,
  }));
};

const mapQualitySummaryToMessageMeta = (summary?: GenerationQualitySummary) => {
  if (!summary) return undefined;
  return {
    score: summary.score,
    hasBlockingIssues: summary.hasBlockingIssues,
    remainingIssues: summary.remainingIssues,
    notes: summary.notes,
  };
};

interface DbConversationRow {
  id: string;
  project_id?: string | null;
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
  const [pendingPlans, setPendingPlans] = useState<Record<string, PendingPlanExecution>>({});

  const [isTyping, setIsTyping] = useState(false);
  const [inputStatus, setInputStatus] = useState<InputStatus>('ready');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [restoreContent, setRestoreContent] = useState<string | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [dbSyncError, setDbSyncError] = useState<string | null>(null);
  const [dbSyncState, setDbSyncState] = useState<'ok' | 'syncing' | 'degraded' | 'error'>('syncing');
  const [dbSyncReason, setDbSyncReason] = useState<string | null>(null);
  const [dbReloadNonce, setDbReloadNonce] = useState(0);
  const [deletingConversationIds, setDeletingConversationIds] = useState<Set<string>>(new Set());

  const aiRef = useRef<unknown>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const currentConversationIdRef = useRef<string | null>(null);
  const activeProjectIdRef = useRef<string | null>(null);
  const loadedProjectIdRef = useRef<string | null>(null);
  const pendingConversationWritesRef = useRef<Map<string, PendingConversationWrite>>(new Map());
  const fileRenameMigrationDoneByProjectRef = useRef<Set<string>>(new Set());
  const [forceNewConversationRequested, setForceNewConversationRequested] = useState(false);

  const { user } = useAuth();
  const { activeProjectId } = useProjects();
  const { widgets, canvasSettings, loadWorkspaceState, setActiveFile, activeFileId } = useWidgets();
  const { data: files, getPyFiles, addNode, updateNode, renameNode } = useFileSystem();
  const { generateFromPrompt, generateFromImage, generateIteration, error: generationError, retryCount } = useAIGeneration();

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );
  const messages = currentConversation?.messages ?? [];

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  const mapDbConversation = useCallback((row: DbConversationRow): Conversation => ({
    id: row.id,
    title: row.title,
    firstMessage: row.first_message ?? undefined,
    messages: (row.messages ?? []) as Message[],
    timestamp: new Date(row.updated_at).getTime(),
  }), []);

  const sortConversationsByLatest = useCallback((items: Conversation[]) => {
    return [...items].sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const createBlankConversation = useCallback((seed?: string): Conversation => ({
    id: nanoid(),
    title: getConversationSeedTitle(seed),
    firstMessage: seed,
    messages: [],
    timestamp: Date.now(),
  }), []);

  const enqueueConversationWrite = useCallback((write: PendingConversationWrite) => {
    pendingConversationWritesRef.current.set(write.id, write);
    setDbSyncState((prev) => (prev === 'error' ? prev : 'degraded'));
    setDbSyncReason('Synchronisation differee. Les modifications seront envoyees automatiquement.');
  }, []);

  const flushConversationWriteQueue = useCallback(async () => {
    if (!dbReady || !user) return;
    const pending = Array.from(pendingConversationWritesRef.current.values());
    if (pending.length === 0) return;
    try {
      await flushPendingConversationWrites(pending);
      pendingConversationWritesRef.current.clear();
      setDbSyncState('ok');
      setDbSyncReason(null);
      setDbSyncError(null);
    } catch (error) {
      console.warn('[AI] Echec flush conversations en attente:', error);
      setDbSyncState('degraded');
      setDbSyncReason('Synchronisation en attente. Verification de la connexion...');
    }
  }, [dbReady, user]);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  const fetchProjectConversationsWithRetry = useCallback(async (projectId: string) => {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await withTimeout(
          fetchConversationsFromDb(projectId),
          7000,
          'Timeout synchronisation conversations projet.'
        );
      } catch (error) {
        lastError = error;
        if (attempt >= 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
      }
    }
    throw lastError;
  }, [withTimeout]);

  // Load API keys from Supabase on auth change
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setCurrentConversationId(null);
      setApiKeys({});
      setPendingPlans({});
      setDbReady(false);
      setIsLoadingDb(false);
      setDbSyncError(null);
      setDbSyncState('syncing');
      setDbSyncReason(null);
      pendingConversationWritesRef.current.clear();
      loadedProjectIdRef.current = null;
      return;
    }

    let cancelled = false;
    const projectChanged = loadedProjectIdRef.current !== activeProjectId;
    if (projectChanged) {
      setConversations([]);
      setCurrentConversationId(null);
    }
    setIsLoadingDb(true);
    setPendingPlans({});
    setDbSyncError(null);
    setDbSyncState('syncing');
    setDbSyncReason('Synchronisation des conversations...');

    (async () => {
      try {
        const dbKeys = await fetchApiKeysFromSupabase();

        if (cancelled) return;

        setApiKeys((dbKeys ?? {}) as ApiKeys);
        aiRef.current = null;
        setDbReady(true);
        setDbSyncState('ok');
        setDbSyncReason(null);
        loadedProjectIdRef.current = activeProjectId;
      } catch (error) {
        console.warn('[AI] Chargement initial depuis Supabase impossible:', error);
        setDbReady(false);
        setDbSyncError("Synchronisation IA indisponible. Verifiez la migration 'ai_conversations.project_id' et la connexion Supabase.");
        setDbSyncState('error');
        setDbSyncReason("Connexion base indisponible. Mode degrade active.");
      } finally {
        if (!cancelled) setIsLoadingDb(false);
      }
    })();

    return () => { cancelled = true; };
  }, [dbReloadNonce, user]);

  useEffect(() => {
    if (consumeForceNewConversationOnLoadFlag()) {
      setForceNewConversationRequested(true);
    }

    const handleOpenAiSidebar = (event: Event) => {
      const customEvent = event as CustomEvent<{ forceNewConversation?: boolean }>;
      if (customEvent.detail?.forceNewConversation) {
        setForceNewConversationRequested(true);
      }
    };

    window.addEventListener(OPEN_AI_SIDEBAR_EVENT, handleOpenAiSidebar);
    return () => window.removeEventListener(OPEN_AI_SIDEBAR_EVENT, handleOpenAiSidebar);
  }, []);

  const persistConversationToDb = useCallback(async (conversation: Conversation, projectId?: string | null) => {
    const targetProjectId = projectId ?? activeProjectIdRef.current;
    if (!user || !targetProjectId) return;

    const payload: PendingConversationWrite = {
      id: conversation.id,
      project_id: targetProjectId,
      title: conversation.title,
      first_message: conversation.firstMessage ?? null,
      messages: conversation.messages as unknown[],
    };

    if (!dbReady) {
      enqueueConversationWrite(payload);
      return;
    }
    try {
      await upsertConversation({
        id: conversation.id,
        project_id: targetProjectId,
        title: conversation.title,
        first_message: conversation.firstMessage ?? null,
        messages: conversation.messages as unknown[],
      });
      pendingConversationWritesRef.current.delete(conversation.id);
      setDbSyncError(null);
      if (pendingConversationWritesRef.current.size === 0) {
        setDbSyncState('ok');
        setDbSyncReason(null);
      }
    } catch (error) {
      console.warn('[AI] Echec persistance conversation:', error);
      enqueueConversationWrite(payload);
      setDbSyncError("Mode degrade actif: conversation en file d'attente locale.");
      setDbSyncState('degraded');
      setDbSyncReason("Synchronisation differee. Reconnexion automatique en cours.");
    }
  }, [dbReady, enqueueConversationWrite, user]);

  // Load project-scoped conversations from DB
  useEffect(() => {
    if (!user || !dbReady) return;
    if (!activeProjectId) {
      setConversations([]);
      setCurrentConversationId(null);
      setPendingPlans({});
      setDbSyncError(null);
      setDbSyncState('ok');
      setDbSyncReason(null);
      loadedProjectIdRef.current = null;
      return;
    }

    let cancelled = false;
    setIsLoadingDb(true);
    setPendingPlans({});
    setDbSyncError(null);
    setDbSyncState('syncing');
    setDbSyncReason('Synchronisation du projet actif...');

    (async () => {
      try {
        const dbConvos = await fetchProjectConversationsWithRetry(activeProjectId);
        if (cancelled) return;

        const mapped: Conversation[] = dbConvos.map((c) => mapDbConversation(c as DbConversationRow));
        const sorted = sortConversationsByLatest(mapped);
        const shouldCreateNew = forceNewConversationRequested || sorted.length === 0;

        if (shouldCreateNew) {
          const created = createBlankConversation();
          const next = sortConversationsByLatest([created, ...sorted.filter((conversation) => conversation.id !== created.id)]);
          setConversations(next);
          setCurrentConversationId(created.id);
          await persistConversationToDb(created, activeProjectId);
        } else {
          setConversations(sorted);
          setCurrentConversationId((prev) => {
            if (prev && sorted.some((conversation) => conversation.id === prev)) return prev;
            return sorted[0]?.id ?? null;
          });
        }
        setDbSyncState('ok');
        setDbSyncReason(null);
      } catch (error) {
        console.warn('[AI] Chargement conversations projet impossible:', error);
        if (!cancelled) {
          setDbSyncError("Echec synchronisation conversations. Mode degrade active.");
          setDbSyncState('degraded');
          setDbSyncReason("Le chargement DB a echoue. Vous pouvez continuer, resynchronisation automatique active.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDb(false);
          if (forceNewConversationRequested) {
            setForceNewConversationRequested(false);
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [
    activeProjectId,
    createBlankConversation,
    dbReloadNonce,
    dbReady,
    fetchProjectConversationsWithRetry,
    forceNewConversationRequested,
    mapDbConversation,
    persistConversationToDb,
    sortConversationsByLatest,
    user,
  ]);

  // Realtime sync: project conversations + API keys
  useEffect(() => {
    if (!user || !dbReady || !activeProjectId) return;

    const conversationsChannel = supabase
      .channel(`ai-conversations-${user.id}-${activeProjectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_conversations', filter: `project_id=eq.${activeProjectId}` },
        (payload) => {
          setConversations((prev) => {
            if (payload.eventType === 'DELETE') {
              const deletedRow = payload.old as { id?: string; user_id?: string } | null;
              if (deletedRow?.user_id && deletedRow.user_id !== user.id) return prev;
              const deletedId = deletedRow?.id;
              if (!deletedId) return prev;
              const next = prev.filter((c) => c.id !== deletedId);
              if (currentConversationIdRef.current === deletedId) {
                const fallbackId = next[0]?.id ?? null;
                setCurrentConversationId(fallbackId);
              }
              return next;
            }

            const row = payload.new as DbConversationRow | null;
            if (!row?.id) return prev;
            const rowUserId = (payload.new as { user_id?: string } | null)?.user_id;
            if (rowUserId && rowUserId !== user.id) return prev;
            const mapped = mapDbConversation(row);
            const withoutCurrent = prev.filter((c) => c.id !== mapped.id);
            return sortConversationsByLatest([mapped, ...withoutCurrent]);
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
  }, [user, dbReady, mapDbConversation, activeProjectId, sortConversationsByLatest]);

  useEffect(() => {
    if (!user || !activeProjectId) return;

    let cancelled = false;
    void (async () => {
      const health = await checkConversationSyncHealth(activeProjectId);
      if (cancelled) return;
      if (health.ok) {
        setDbSyncState((prev) => (prev === 'degraded' && pendingConversationWritesRef.current.size > 0 ? prev : 'ok'));
        if (pendingConversationWritesRef.current.size === 0) {
          setDbSyncReason(null);
          setDbSyncError(null);
        }
      } else {
        setDbSyncState('degraded');
        setDbSyncReason(health.reason || 'Synchronisation indisponible temporairement.');
      }
    })();

    return () => { cancelled = true; };
  }, [activeProjectId, dbReloadNonce, user]);

  useEffect(() => {
    if (!user || dbReady) return;
    if (isLoadingDb) return;

    const timer = window.setInterval(() => {
      setDbSyncState('syncing');
      setDbSyncReason('Tentative automatique de reconnexion...');
      setDbReloadNonce((prev) => prev + 1);
    }, 7000);

    return () => {
      window.clearInterval(timer);
    };
  }, [dbReady, isLoadingDb, user]);

  useEffect(() => {
    if (!dbReady || !user) return;
    let stopped = false;
    const run = async () => {
      if (stopped) return;
      await flushConversationWriteQueue();
    };
    void run();
    const timer = window.setInterval(() => {
      void run();
    }, 3500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [dbReady, flushConversationWriteQueue, user]);

  useEffect(() => {
    if (isLoadingDb || !user || !dbReady || !activeProjectId) return;
    if (conversations.length > 0) return;
    const created = createBlankConversation();
    setConversations([created]);
    setCurrentConversationId(created.id);
    void persistConversationToDb(created, activeProjectId);
  }, [activeProjectId, conversations.length, createBlankConversation, dbReady, isLoadingDb, persistConversationToDb, user]);

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
        return `Tu es Dayanna, l'assistante IA de Notorious.PY. Tu reponds en francais de facon claire, concise et utile.
MODE DISCUSSION:
- Aucune action sur les fichiers/canvas.
- Pas de generation JSON.
- Reponse conversationnelle uniquement.
\n${projectAwareness}\n${canvasContext}`;

      case 'plan':
        return `Tu es Dayanna en mode PLANIFICATION EXECUTABLE.
- Tu produis un plan multi-interfaces structuré, réaliste et premium.
- Le plan doit etre exploitable ensuite pour generer les interfaces via widgets.
- Pas de reponse vague, pas de bavardage inutile.
\n${PREMIUM_DESIGN_BASELINE}
\n${projectAwareness}
\n${canvasContext}`;

      case 'agent':
      default:
        return `Tu es Dayanna en mode AGENT pour Notorious.PY.
- Priorite: construire ou modifier des interfaces CustomTkinter de qualite premium.
- Reponses actionnables, concretes, sans remplissage.
- Si la demande est purement conversationnelle, reponds simplement.
\n${PREMIUM_DESIGN_BASELINE}
\n${projectAwareness}
\n${canvasContext}`;
    }
  }, [buildCanvasContext]);

  const callOpenAICompatible = useCallback(async (
    provider: AIProvider,
    apiKey: string,
    model: string,
    userInput: string | MultimodalUserPayload,
    signal?: AbortSignal,
    systemPromptOverride?: string,
    options?: OpenAICompatibleCallOptions
  ): Promise<string> => {
    const config = getProviderConfig(provider);
    const credentialLabel = provider === 'huggingface' ? "token d'acces Hugging Face" : `cle API ${config.label}`;
    const requestModel = normalizeHuggingFaceModel(provider, model);
    if (provider === 'huggingface' && !apiKey.trim().startsWith('hf_')) {
      throw new Error(withErrorCode('INVALID_KEY', "Token Hugging Face invalide. Utilisez un token 'hf_...'"));
    }

    const systemContent = systemPromptOverride || `Tu es Dayanna, l'assistante IA de Notorious.PY, un builder no-code pour creer des interfaces CustomTkinter en Python. Tu reponds en francais, de facon claire et concise. Tu as acces au contexte du canvas actuel et peux aider a modifier le design, ajouter des widgets, ou generer du code Python.\n\n${buildCanvasContext()}`;
    const normalizedUserInput = typeof userInput === 'string'
      ? { text: userInput, images: [] as Attachment[] }
      : userInput;
    const imageBlocks = (normalizedUserInput.images ?? [])
      .map((attachment) => toDataUri(attachment))
      .filter((url): url is string => Boolean(url))
      .map((url) => ({ type: 'image_url' as const, image_url: { url } }));
    const openAIUserContent: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> =
      imageBlocks.length > 0
        ? [{ type: 'text', text: normalizedUserInput.text }, ...imageBlocks]
        : normalizedUserInput.text;

    const runAttempt = async (): Promise<string> => {
      if (config.apiFormat === 'anthropic') {
        const anthropicContent = Array.isArray(openAIUserContent)
          ? openAIUserContent
              .map((block) => {
                if (block.type === 'text') return { type: 'text', text: block.text };
                const match = block.image_url.url.match(/^data:(image\/[^;]+);base64,(.+)$/);
                if (!match) return null;
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: match[1],
                    data: match[2],
                  },
                };
              })
              .filter(Boolean)
          : openAIUserContent;

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...config.authHeader(apiKey) },
          body: JSON.stringify({
            model: requestModel,
            max_tokens: config.maxTokens,
            system: systemContent,
            messages: [{ role: 'user', content: anthropicContent }],
            temperature: 0.7,
          }),
          signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const rawMessage = String(errData.error?.message || errData.error?.code || errData.message || '');
          if (response.status === 401 || response.status === 403) throw new Error(withErrorCode('INVALID_KEY', `${credentialLabel} invalide.`));
          if (response.status === 402 || isPaidModelError(rawMessage)) throw new Error(withErrorCode('PAID_MODEL', `Modele payant indisponible sur ${config.label}. Choisissez un autre modele.`));
          if (isQuotaError(rawMessage)) throw new Error(withErrorCode('QUOTA_EXCEEDED', `Credits/tokens epuises sur ${config.label}. Choisissez un autre modele.`));
          if (response.status === 429) throw new Error(withErrorCode('RATE_LIMIT', `Limite de requetes ${config.label} atteinte.`));
          if (response.status >= 500) throw new Error(withErrorCode('SERVER_ERROR', `Erreur serveur ${config.label} (${response.status}).`));
          throw new Error(withErrorCode('UNKNOWN', rawMessage || `Erreur ${config.label} (${response.status})`));
        }

        const data = await response.json();
        const content = data.content?.find((b: any) => b.type === 'text')?.text || '';
        if (!content) throw new Error(withErrorCode('EMPTY_CONTENT', `${config.label} a renvoye une reponse vide.`));
        return content;
      }

      const enableStreaming =
        Boolean(options?.stream) &&
        config.apiFormat === 'openai' &&
        provider !== 'huggingface' &&
        typeof openAIUserContent === 'string';

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.authHeader(apiKey) },
        body: JSON.stringify({
          model: requestModel,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: openAIUserContent },
          ],
          max_tokens: config.maxTokens,
          temperature: 0.7,
          stream: enableStreaming,
        }),
        signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const rawMessage = String(errData.error?.message || errData.error?.code || errData.message || '');
        if (response.status === 401 || response.status === 403) throw new Error(withErrorCode('INVALID_KEY', `${credentialLabel} invalide.`));
        if (response.status === 402 || isPaidModelError(rawMessage)) throw new Error(withErrorCode('PAID_MODEL', `Modele payant indisponible sur ${config.label}. Choisissez un autre modele.`));
        if (isQuotaError(rawMessage)) throw new Error(withErrorCode('QUOTA_EXCEEDED', `Credits/tokens epuises sur ${config.label}. Choisissez un autre modele.`));
        if (response.status === 429) throw new Error(withErrorCode('RATE_LIMIT', `Limite de requetes ${config.label} atteinte.`));
        if (response.status === 404 || response.status === 400) throw new Error(withErrorCode('MODEL_UNAVAILABLE', `Modele "${requestModel}" indisponible sur ${config.label}.`));
        if (response.status >= 500) throw new Error(withErrorCode('SERVER_ERROR', `Erreur serveur ${config.label} (${response.status}).`));
        throw new Error(withErrorCode('UNKNOWN', rawMessage || `Erreur ${config.label} (${response.status})`));
      }

      if (enableStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let tokenCount = 0;

        const extractDelta = (payload: Record<string, unknown>): string => {
          const choices = Array.isArray(payload.choices) ? payload.choices : [];
          const first = (choices[0] ?? {}) as Record<string, unknown>;
          const delta = (first.delta ?? {}) as Record<string, unknown>;
          const deltaContent = delta.content;

          if (typeof deltaContent === 'string') return deltaContent;
          if (Array.isArray(deltaContent)) {
            return deltaContent
              .map((part) => (typeof part === 'string'
                ? part
                : (part as Record<string, unknown>).text))
              .filter((part): part is string => typeof part === 'string')
              .join('');
          }

          const messageContent = ((first.message ?? {}) as Record<string, unknown>).content;
          if (typeof messageContent === 'string') return messageContent;
          return '';
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload) as Record<string, unknown>;
              const delta = extractDelta(parsed);
              if (!delta) continue;
              fullText += delta;
              tokenCount += 1;
              options?.onDelta?.(fullText, delta, tokenCount);
            } catch {
              // Ignore malformed stream chunks and continue.
            }
          }
        }

        if (fullText.trim()) {
          return fullText;
        }

        throw new Error(withErrorCode('EMPTY_CONTENT', `${config.label} a renvoye un flux vide.`));
      }

      const data = await response.json();
      const content = Array.isArray(data) && data[0]?.generated_text
        ? data[0].generated_text
        : data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || data.choices?.[0]?.text || '';
      if (!content) throw new Error(withErrorCode('EMPTY_CONTENT', `${config.label} a renvoye une reponse vide.`));
      return content;
    };

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
      try {
        return await runAttempt();
      } catch (attemptError: any) {
        if (attemptError?.name === 'AbortError') throw attemptError;
        const raw = String(attemptError?.message || 'Erreur IA');
        const { code: parsedCode, detail } = parseErrorCode(raw);
        const isNetworkLike = attemptError?.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(raw);
        const code = isNetworkLike ? 'NETWORK' : parsedCode;
        lastError = new Error(withErrorCode(code, detail));
        if (!isRetryableCode(code) || attempt >= MAX_PROVIDER_ATTEMPTS) {
          throw lastError;
        }
        const waitMs = Math.min(4200, 650 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 220);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    throw lastError || new Error(withErrorCode('UNKNOWN', 'Erreur IA inconnue.'));
  }, [buildCanvasContext]);

  const normalizeModelForGeneration = useCallback((modelId: string, provider: Provider): string => {
    if (ALL_MODELS.some((m) => m.id === modelId)) return modelId;

    const fallbackByProvider: Record<Provider, string> = {
      google: 'gemini-2.5-flash-preview-05-20',
      openrouter: 'openrouter/free',
      groq: 'llama-3.3-70b-versatile',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-sonnet-20241022',
      deepseek: 'deepseek-chat',
      huggingface: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    };

    return fallbackByProvider[provider] || 'gemini-2.5-flash-preview-05-20';
  }, []);

  const resolveVisionExecution = useCallback((preferredProvider: Provider, preferredModel: string): VisionExecutionContext | null => {
    const hasProviderKey = (providerId: Provider) => Boolean(apiKeys[providerId]?.trim());
    const toExecutionContext = (providerId: Provider, modelId: string): VisionExecutionContext | null => {
      const key = apiKeys[providerId]?.trim();
      if (!key) return null;
      return {
        provider: providerId,
        model: modelId,
        apiKey: key,
      };
    };

    const preferredModelDef = ALL_MODELS.find((item) => item.id === preferredModel);
    if (preferredModelDef?.supportsVision) {
      const context = toExecutionContext(preferredModelDef.provider as Provider, preferredModelDef.id);
      if (context) return context;
    }

    const sameProviderVision = ALL_MODELS.find(
      (item) => item.provider === preferredProvider && item.supportsVision && hasProviderKey(preferredProvider)
    );
    if (sameProviderVision) {
      const context = toExecutionContext(preferredProvider, sameProviderVision.id);
      if (context) return context;
    }

    const providerPriority = [
      preferredProvider,
      'google',
      'openai',
      'anthropic',
      'openrouter',
      'deepseek',
      'groq',
      'huggingface',
    ].filter((providerId, index, arr) => arr.indexOf(providerId) === index) as Provider[];

    for (const providerId of providerPriority) {
      if (!hasProviderKey(providerId)) continue;
      const visionModel = ALL_MODELS.find((item) => item.provider === providerId && item.supportsVision);
      if (!visionModel) continue;
      const context = toExecutionContext(providerId, visionModel.id);
      if (context) return context;
    }

    return null;
  }, [apiKeys]);

  const buildContextFiles = useCallback(
    (taggedFiles?: TaggedFile[], autoDetectedFiles?: { id: string; name: string; content?: string }[]): ContextFile[] => {
      const tagged = (taggedFiles ?? []).map((f) => ({ name: f.name, content: f.content || '' }));
      const taggedNames = new Set(tagged.map((f) => f.name));
      const detected = (autoDetectedFiles ?? [])
        .filter((f) => !taggedNames.has(f.name))
        .map((f) => ({ name: f.name, content: f.content || '' }));
      return [...tagged, ...detected];
    },
    []
  );

  const persistActiveWorkspaceToFile = useCallback(() => {
    if (!activeFileId) return;
    updateNode(activeFileId, {
      content: JSON.stringify({
        widgets,
        canvasSettings,
      }),
    });
  }, [activeFileId, updateNode, widgets, canvasSettings]);

  const getUniquePyFileName = useCallback((rawBaseName: string): string => {
    const safeBase = toPascalCasePyName(rawBaseName);
    const existing = new Set(getPyFiles().map((f) => f.name.toLowerCase()));
    if (!existing.has(safeBase.toLowerCase())) return safeBase;
    const baseNoExt = safeBase.replace(/\.py$/i, '');
    let i = 2;
    let candidate = `${baseNoExt}${i}.py`;
    while (existing.has(candidate.toLowerCase())) {
      i += 1;
      candidate = `${baseNoExt}${i}.py`;
    }
    return candidate;
  }, [getPyFiles]);

  const buildFileTreePreview = useCallback((targetFileName: string, action: 'created' | 'updated' | 'deleted' = 'updated') => {
    const names = new Set(getPyFiles().map((file) => file.name));
    if (targetFileName && action !== 'deleted') names.add(targetFileName);
    const nodes = Array.from(names)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map((name) => ({ path: name, type: 'file' as const }));

    const actionLabel = action === 'created'
      ? 'crees/modifies (creation)'
      : action === 'deleted'
        ? 'crees/modifies (suppression)'
        : 'crees/modifies (mise a jour)';

    return {
      rootLabel: `Fichiers ${actionLabel}`,
      highlightedPaths: targetFileName ? [targetFileName] : [],
      nodes,
    };
  }, [getPyFiles]);

  const migratePythonFilesToPascalCase = useCallback(() => {
    if (!activeProjectId) return;
    if (fileRenameMigrationDoneByProjectRef.current.has(activeProjectId)) return;

    const pyFiles = getPyFiles();
    fileRenameMigrationDoneByProjectRef.current.add(activeProjectId);
    if (pyFiles.length === 0) return;

    const reservedNames = new Set(pyFiles.map((file) => file.name.toLowerCase()));
    const renameById: Record<string, string> = {};
    const moduleRenameMap: Record<string, string> = {};

    pyFiles.forEach((file) => {
      const oldName = file.name;
      const oldModule = oldName.replace(/\.py$/i, '');
      if (!oldModule.includes('_')) return;

      let nextName = toPascalCasePyName(oldModule);
      if (nextName.toLowerCase() === oldName.toLowerCase()) return;

      reservedNames.delete(oldName.toLowerCase());
      if (reservedNames.has(nextName.toLowerCase())) {
        const baseStem = nextName.replace(/\.py$/i, '');
        let idx = 2;
        while (reservedNames.has(`${baseStem}${idx}.py`.toLowerCase())) {
          idx += 1;
        }
        nextName = `${baseStem}${idx}.py`;
      }
      reservedNames.add(nextName.toLowerCase());

      renameById[file.id] = nextName;
      moduleRenameMap[oldModule] = nextName.replace(/\.py$/i, '');
    });

    const renameEntries = Object.entries(renameById);
    if (renameEntries.length === 0) return;

    for (const [fileId, nextName] of renameEntries) {
      renameNode(fileId, nextName);
    }

    for (const file of pyFiles) {
      const nextContent = rewritePythonImports(file.content || '', moduleRenameMap);
      if (nextContent !== (file.content || '')) {
        updateNode(file.id, { content: nextContent });
      }
    }

    toast.success(`${renameEntries.length} fichier(s) .py renommes en PascalCase.`);
  }, [activeProjectId, getPyFiles, renameNode, updateNode]);

  useEffect(() => {
    if (!activeProjectId) return;
    if (files.length === 0) return;
    migratePythonFilesToPascalCase();
  }, [activeProjectId, files, migratePythonFilesToPascalCase]);

  const applyGeneratedInterface = useCallback((targetFileId: string, title: string, widgetsData: unknown[], nextSettings: Record<string, unknown>) => {
    const normalizedSettings = {
      ...canvasSettings,
      ...nextSettings,
      title: String(nextSettings.title ?? title ?? canvasSettings.title),
    };
    updateNode(targetFileId, {
      content: JSON.stringify({
        widgets: widgetsData,
        canvasSettings: normalizedSettings,
      }),
    });
    setActiveFile(targetFileId);
    loadWorkspaceState(widgetsData as Parameters<typeof loadWorkspaceState>[0], normalizedSettings as Parameters<typeof loadWorkspaceState>[1]);
  }, [canvasSettings, loadWorkspaceState, setActiveFile, updateNode]);

  const generatePlanDraft = useCallback(async (
    provider: AIProvider,
    providerKey: string,
    model: string,
    userPrompt: string,
    contextFiles: ContextFile[],
    systemPrompt: string,
    signal?: AbortSignal
  ): Promise<PlanDraft | null> => {
    const contextSnippet = contextFiles.length > 0
      ? `\n\nFICHIERS CONTEXTE:\n${contextFiles.map((f) => `- ${f.name}`).join('\n')}`
      : '';

    const planPrompt = `${userPrompt}

Genere un plan d'interfaces complet, premium et executable pour Notorious.PY.
Reponds UNIQUEMENT en JSON valide selon ce schema:
${PLAN_SCHEMA}

Contraintes:
- Nombre d'interfaces auto selon le besoin.
- Chaque interface doit etre une vraie page utilisable (pas un brouillon).
- Respecte un style premium cohérent.
${PREMIUM_DESIGN_BASELINE}
${contextSnippet}`;

    const raw = await callOpenAICompatible(provider, providerKey, model, planPrompt, signal, systemPrompt);
    const parsed = extractJsonObject(raw);
    return normalizePlanDraft(parsed, userPrompt);
  }, [callOpenAICompatible]);

  const updateConversationMessages = useCallback(
    (
      conversationId: string,
      updater: (prev: Message[]) => Message[],
      options?: { persist?: boolean; firstMessage?: string }
    ) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id !== conversationId
            ? c
            : {
                ...c,
                firstMessage: options?.firstMessage && !c.firstMessage ? options.firstMessage : c.firstMessage,
                messages: updater(c.messages),
                timestamp: Date.now(),
              }
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

  const applyConversationTitle = useCallback((
    conversationId: string,
    title: string,
    options?: { onlyIfDefault?: boolean }
  ) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setConversations((prev) => {
      let changed = false;
      const next = prev.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        if (options?.onlyIfDefault) {
          const currentTitle = (conversation.title || '').trim();
          const defaultTitle = getConversationSeedTitle(conversation.firstMessage);
          const isDefaultTitle = !currentTitle || currentTitle === defaultTitle || currentTitle === 'Nouvelle conversation';
          if (!isDefaultTitle) return conversation;
        }

        if (conversation.title === nextTitle) return conversation;
        changed = true;
        return { ...conversation, title: nextTitle, timestamp: Date.now() };
      });

      if (changed) {
        const updated = next.find((c) => c.id === conversationId);
        if (updated) void persistConversationToDb(updated);
      }

      return next;
    });
  }, [persistConversationToDb]);

  const simulateReasoning = useCallback(
    async (conversationId: string, assistantMessageId: string) => {
      updateConversationMessages(conversationId, (prev) =>
        prev.map((msg) => msg.id === assistantMessageId ? { ...msg, reasoning: REASONING_TEXT, isReasoningStreaming: true } : msg)
      );
      updateConversationMessages(conversationId, (prev) =>
        prev.map((msg) => msg.id === assistantMessageId ? { ...msg, isReasoningStreaming: false } : msg)
      );
    },
    [updateConversationMessages]
  );

  const ensureConversation = useCallback((seed?: string): string => {
    if (currentConversationId) {
      return currentConversationId;
    }
    const created = createBlankConversation(seed);
    setConversations((prev) => sortConversationsByLatest([created, ...prev]));
    setCurrentConversationId(created.id);
    void persistConversationToDb(created, activeProjectId);
    return created.id;
  }, [activeProjectId, createBlankConversation, currentConversationId, persistConversationToDb, sortConversationsByLatest]);

  const generateConversationTitle = useCallback(async (
    conversationId: string,
    prompt: string,
    provider: AIProvider,
    providerKey: string,
    model: string
  ) => {
    const fallback = getFallbackConversationTitle(prompt);
    const titleSystemPrompt = `Tu génères UNIQUEMENT des titres de conversation courts et précis en français.
Contraintes:
- 2 à 7 mots.
- Pas de guillemets.
- Pas de ponctuation finale.
- Renvoyer uniquement le titre brut.`;
    const titlePrompt = `Premier prompt utilisateur:\n${prompt}\n\nTitre:`;

    try {
      const rawTitle = await callOpenAICompatible(provider, providerKey, model, titlePrompt, undefined, titleSystemPrompt);
      const normalizedTitle = normalizeGeneratedTitle(rawTitle);
      const isWeakTitle = /^(nouvelle conversation|conversation|untitled|new chat)$/i.test(normalizedTitle);
      applyConversationTitle(conversationId, (!normalizedTitle || isWeakTitle) ? fallback : normalizedTitle, { onlyIfDefault: true });
    } catch {
      applyConversationTitle(conversationId, fallback, { onlyIfDefault: true });
    }
  }, [applyConversationTitle, callOpenAICompatible]);

  const isAuditRequest = useCallback((text: string): boolean => {
    const normalized = text.trim().toLowerCase();
    return /\baudit\b|go\/?no-?go|readiness|prete? production|pret pour/.test(normalized);
  }, []);

  const buildAuditReport = useCallback((): { verdict: 'GO' | 'NO_GO'; markdown: string } => {
    const configuredProviders = (Object.keys(apiKeys) as Provider[]).filter((providerId) => Boolean(apiKeys[providerId]?.trim()));
    const hasVisionConfigured = configuredProviders.some((providerId) =>
      ALL_MODELS.some((model) => model.provider === providerId && model.supportsVision)
    );
    const hasProjectScopedConversation = Boolean(activeProjectId && conversations.length > 0);
    const hasDbSync = Boolean(dbReady && user);
    const verdict: 'GO' | 'NO_GO' = hasDbSync && hasProjectScopedConversation && hasVisionConfigured ? 'GO' : 'NO_GO';

    const findings = [
      hasProjectScopedConversation
        ? '- P0 [OK] Conversations Dayanna scopees par projet actif (DB only).'
        : '- P0 [KO] Aucune conversation disponible pour le projet actif.',
      hasDbSync
        ? '- P0 [OK] Persistance conversation/API keys connectee a la base.'
        : '- P0 [KO] Persistance DB indisponible (connexion/auth).',
      hasVisionConfigured
        ? '- P0 [OK] Au moins un provider configure avec modele vision disponible.'
        : '- P0 [KO] Aucun provider vision configure: impossible de traiter les references image.',
      '- P1 [INFO] Retry/reprise: retries transitoires (max 3), reprise par checkpoint conversationnel, erreurs classees.',
      '- P1 [INFO] Alignement Dayanna vs AIGeneratorModal: provider layer/vision/retries partages via useAIGeneration.',
      '- P2 [INFO] Lint global (ESLint v9 flat config) a verifier cote projet pour readiness CI complete.',
    ];

    const markdown = [
      `## Audit IA consolide (${verdict})`,
      '',
      'Surfaces verifiees: Dayanna Sidebar, AIGeneratorModal, provider layer, persistance, retries, reprise.',
      '',
      ...findings,
    ].join('\n');

    return { verdict, markdown };
  }, [activeProjectId, apiKeys, conversations.length, dbReady, user]);

  const handleSendMessage = useCallback(
    async (content: string, model: Model, attachments?: Attachment[], provider?: Provider, mode?: AIMode, taggedFiles?: TaggedFile[]) => {
      const trimmed = content.trim();
      if (!trimmed || isTyping) return;
      if (!activeProjectId) {
        toast.error('Aucun projet actif. Creez ou ouvrez un projet avant de lancer Dayanna.');
        return;
      }
      if (!user) {
        toast.error('Connexion requise pour demarrer la conversation IA.');
        return;
      }
      if (!dbReady) {
        setDbSyncState('degraded');
        setDbSyncReason('Mode degrade actif: la conversation est utilisable, synchronisation en attente.');
      }

      const activeMode = mode || 'agent';
      const conversationId = ensureConversation(trimmed);
      const existingConversation = conversationsRef.current.find((c) => c.id === conversationId);
      const isFirstUserMessage = (existingConversation?.messages.length ?? 0) === 0;
      const hasPendingPlan = Boolean(pendingPlans[conversationId]);
      const effectiveMode: AIMode = hasPendingPlan && activeMode !== 'discussions' ? 'plan' : activeMode;
      const selectedProvider = provider || 'google';
      const resolvedProvider = resolveProvider(model, selectedProvider);
      const imageAttachments = (attachments ?? []).filter((att) => att.type === 'image' && Boolean(toDataUri(att)));
      const shouldUseVision = effectiveMode === 'agent' && imageAttachments.length > 0;
      const visionExecution = shouldUseVision ? resolveVisionExecution(selectedProvider, model) : null;

      const effectiveProvider: Provider = visionExecution?.provider || (resolvedProvider as Provider);
      const effectiveModel: string = visionExecution?.model || model;
      const providerKey = visionExecution?.apiKey || (apiKeys[resolvedProvider as keyof ApiKeys] || '').trim();
      if (shouldUseVision && !visionExecution) {
        toast.error("Aucun modele vision disponible avec vos cles API. Configurez un provider vision dans les parametres.");
        setIsSettingsOpen(true);
        return;
      }
      if (!providerKey) {
        const credentialLabel = resolvedProvider === 'huggingface'
          ? "token d'acces Hugging Face"
          : `cle API ${resolvedProvider}`;
        toast.error(`Aucun ${credentialLabel}. Configurez-le dans les parametres.`);
        setIsSettingsOpen(true);
        return;
      }

      const pyFiles = getPyFiles().map(f => ({ id: f.id, name: f.name, content: f.content || '' }));
      const autoDetected = detectMentionedFiles(trimmed, pyFiles);
      const contextFiles = buildContextFiles(taggedFiles, autoDetected);

      const systemPrompt = buildSystemPrompt(effectiveMode, taggedFiles, autoDetected);
      const designReference = shouldUseVision ? buildDesignReference(imageAttachments) : undefined;
      const fidelityNotes = shouldUseVision ? [...DEFAULT_FIDELITY_NOTES] : undefined;

      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content: trimmed,
        attachments,
        timestamp: Date.now(),
        generation: {
          provider: effectiveProvider,
          model: effectiveModel,
          resolvedModel: effectiveModel,
          mode: effectiveMode,
          usedVision: shouldUseVision,
          designReference,
          fidelityNotes,
        },
      };
      updateConversationMessages(conversationId, (prev) => [...prev, userMessage], { firstMessage: trimmed });

      if (isFirstUserMessage) {
        void generateConversationTitle(conversationId, trimmed, effectiveProvider as AIProvider, providerKey, effectiveModel);
      }

      setInputStatus('submitted');
      setIsTyping(true);

      const controller = new AbortController();
      setAbortController(controller);
      const generationStartedAt = Date.now();

      const assistantMessageId = nanoid();
      const initialTasks = [
        { id: nanoid(), label: 'Analyse de la demande', status: 'completed' as const },
        { id: nanoid(), label: 'Preparation du contexte projet', status: 'running' as const, detail: '' },
        { id: nanoid(), label: 'Generation IA', status: 'pending' as const, detail: '' },
        { id: nanoid(), label: 'Validation du resultat', status: 'pending' as const, detail: '' },
        { id: nanoid(), label: 'Application et sauvegarde', status: 'pending' as const, detail: '' },
      ];
      updateConversationMessages(conversationId, (prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          reasoning: '',
          isReasoningStreaming: true,
          generation: {
            provider: effectiveProvider,
            model: effectiveModel,
            resolvedModel: effectiveModel,
            mode: effectiveMode,
            promptMessageId: userMessage.id,
            status: 'running',
            stage: 'queued',
            stageStartedAt: generationStartedAt,
            startedAt: generationStartedAt,
            usedVision: shouldUseVision,
            designReference,
            fidelityNotes,
            attempt: 1,
            maxAttempts: 3,
            streaming: {
              enabled: false,
              source: 'fallback',
            },
            taskTrace: initialTasks.map((task) => ({
              id: task.id,
              label: String(task.label),
              status: task.status,
              startedAt: generationStartedAt,
              endedAt: task.status === 'completed' ? generationStartedAt : undefined,
              detail: task.detail,
            })),
          },
          tasks: initialTasks,
          timestamp: Date.now(),
        },
      ], { persist: true });

      try {
        const reasoningPromise = simulateReasoning(conversationId, assistantMessageId);
        setInputStatus('streaming');
        const updateAssistant = (newContent: string) => {
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) => msg.id === assistantMessageId ? { ...msg, content: newContent } : msg)
          );
        };

        const updateTask = (
          index: number,
          status: 'pending' | 'running' | 'completed' | 'error',
          label?: string,
          detail?: string,
          trace?: {
            filesRead?: string[];
            filesWritten?: string[];
            artifactFile?: string;
          }
        ) => {
          const now = Date.now();
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    tasks: msg.tasks?.map((t, i) =>
                      i === index ? { ...t, status, label: label ?? t.label, detail: detail ?? t.detail } : t
                    ),
                    generation: {
                      ...msg.generation,
                      taskTrace: msg.generation?.taskTrace?.map((task, i) => {
                        if (i !== index) return task;
                        return {
                          ...task,
                          status,
                          label: label ?? task.label,
                          detail: detail ?? task.detail,
                          filesRead: trace?.filesRead ?? task.filesRead,
                          filesWritten: trace?.filesWritten ?? task.filesWritten,
                          artifactFile: trace?.artifactFile ?? task.artifactFile,
                          startedAt: task.startedAt ?? now,
                          endedAt: status === 'running' || status === 'pending' ? undefined : now,
                        };
                      }),
                    },
                  }
                : msg
            )
          );
        };

        const updateGenerationMeta = (patch: Partial<NonNullable<Message['generation']>>) => {
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    generation: {
                      ...msg.generation,
                      ...patch,
                    },
                  }
                : msg
            )
          );
        };

        const setGenerationStage = (stage: GenerationStage, patch?: Partial<NonNullable<Message['generation']>>) => {
          updateGenerationMeta({
            stage,
            stageStartedAt: Date.now(),
            status: stage === 'failed' ? 'error' : stage === 'completed' ? 'completed' : 'running',
            ...patch,
          });
        };

        const normalizedGenerationModel = normalizeModelForGeneration(effectiveModel, effectiveProvider);
        const nonVisualAttachments = (attachments ?? []).filter((att) => att.type !== 'image');
        const promptWithAttachmentContext = nonVisualAttachments.length > 0
          ? `${trimmed}\n\nPieces jointes:\n${nonVisualAttachments.map((att) => `- ${att.name || att.filename || att.type || 'fichier'}`).join('\n')}`
          : trimmed;
        const primaryVisionImageData = shouldUseVision && imageAttachments[0] ? toDataUri(imageAttachments[0]) : null;
        const fidelityReport = shouldUseVision ? buildFidelityReport(fidelityNotes ?? DEFAULT_FIDELITY_NOTES) : '';
        let responseText = '';
        setGenerationStage('analyzing');
        updateTask(
          1,
          'completed',
          'Contexte prepare',
          `${contextFiles.length} fichier(s) contexte`,
          {
            filesRead: contextFiles.map((file) => file.name),
          }
        );
        setGenerationStage('composing');
        updateTask(2, 'running', 'Generation IA', undefined, {
          filesRead: contextFiles.map((file) => file.name),
        });

        if (effectiveMode === 'discussions') {
          let streamedTokenCount = 0;
          responseText = await callOpenAICompatible(
            effectiveProvider as AIProvider,
            providerKey,
            effectiveModel,
            promptWithAttachmentContext,
            controller.signal,
            systemPrompt,
            {
              stream: true,
              onDelta: (fullText, _delta, tokenCount) => {
                streamedTokenCount = tokenCount;
                updateAssistant(fullText);
              },
            }
          );
          updateAssistant(responseText);
          setGenerationStage('validating');
          updateTask(2, 'completed', 'Reponse generee');
          updateTask(3, 'completed', 'Validation du resultat');
          updateTask(4, 'completed', 'Termine');
          updateGenerationMeta({
            intent: 'ask',
            status: 'completed',
            resolvedModel: effectiveModel,
            usedVision: false,
            attempt: Math.max(1, retryCount + 1),
            maxAttempts: 3,
            streaming: {
              enabled: streamedTokenCount > 0,
              source: streamedTokenCount > 0 ? 'sse' : 'fallback',
              tokenCount: streamedTokenCount || undefined,
            },
          });
        } else if (effectiveMode === 'agent') {
          if (isAuditRequest(trimmed)) {
            const audit = buildAuditReport();
            responseText = audit.markdown;
            updateAssistant(responseText);
            setGenerationStage('validating');
            updateTask(2, 'completed', 'Audit IA consolide', audit.verdict);
            updateTask(3, 'completed', 'Classification blocants', 'P0/P1/P2');
            updateTask(4, 'completed', 'Termine');
            updateGenerationMeta({
              intent: 'ask',
              status: 'completed',
              resolvedModel: effectiveModel,
              usedVision: shouldUseVision,
              attempt: Math.max(1, retryCount + 1),
              maxAttempts: 3,
            });
            await reasoningPromise;
            const completedAt = Date.now();
            updateConversationMessages(conversationId, (prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                    ...msg,
                    generation: {
                      ...msg.generation,
                      status: 'completed',
                      stage: 'completed',
                      completedAt,
                      durationMs: completedAt - generationStartedAt,
                    },
                    tasks: msg.tasks?.map((t) => (t.status === 'running' ? { ...t, status: 'completed' } : t)),
                  }
                  : msg
              ),
              { persist: true }
            );
            setInputStatus('ready');
            return;
          }

          const detectedIntent = detectAgentIntent(trimmed);
          const shouldCreateFromEmptyWorkspace = detectedIntent === 'edit' && pyFiles.length === 0;
          const intent = shouldCreateFromEmptyWorkspace ? 'create' : detectedIntent;
          updateGenerationMeta({ intent });

          if (shouldCreateFromEmptyWorkspace) {
            updateTask(2, 'running', 'Aucun fichier .py detecte, creation initiale');
          }

          updateGenerationMeta({
            provider: effectiveProvider,
            model: effectiveModel,
            resolvedModel: effectiveModel,
            usedVision: shouldUseVision,
            designReference,
            fidelityNotes,
          });

          if (intent === 'multi') {
            const plan = await generatePlanDraft(
              effectiveProvider as AIProvider,
              providerKey,
              effectiveModel,
              trimmed,
              contextFiles,
              systemPrompt,
              controller.signal
            );
            if (!plan) {
              throw new Error(withErrorCode('JSON_INVALID', 'Impossible de generer un plan exploitable.'));
            }
            setPendingPlans((prev) => ({
              ...prev,
              [conversationId]: {
                plan,
                model: effectiveModel,
                provider: effectiveProvider,
                contextFiles,
                nextInterfaceIndex: 0,
                createdFiles: [],
              },
            }));
            responseText = [
              'Demande multi-interfaces detectee.',
              'Workflow Plan active automatiquement.',
              '',
              formatPlanMarkdown(plan),
            ].join('\n');
            updateAssistant(responseText);
            updateTask(2, 'completed', 'Plan multi-interfaces genere', `${plan.interfaces.length} interface(s)`);
            updateTask(3, 'completed', 'Validation utilisateur requise');
            updateTask(4, 'completed', 'En attente de confirmation');
            updateGenerationMeta({
              status: 'completed',
              resumeCheckpointId: conversationId,
              resolvedModel: effectiveModel,
              usedVision: shouldUseVision,
              attempt: Math.max(1, retryCount + 1),
              maxAttempts: 3,
            });
          } else if (intent === 'ask') {
            responseText = await callOpenAICompatible(
              effectiveProvider as AIProvider,
              providerKey,
              effectiveModel,
              shouldUseVision
                ? { text: promptWithAttachmentContext, images: imageAttachments }
                : promptWithAttachmentContext,
              controller.signal,
              systemPrompt
            );
            if (fidelityReport) {
              responseText = `${responseText}\n\n${fidelityReport}`;
            }
            updateAssistant(responseText);
            setGenerationStage('validating');
            updateTask(2, 'completed', 'Reponse generee');
            updateTask(3, 'completed', 'Validation du resultat');
            updateTask(4, 'completed', 'Termine');
            updateGenerationMeta({
              status: 'completed',
              resolvedModel: effectiveModel,
              usedVision: shouldUseVision,
              attempt: Math.max(1, retryCount + 1),
              maxAttempts: 3,
            });
          } else if (intent === 'edit') {
            const editPrompt = `${trimmed}\n\n${PREMIUM_DESIGN_BASELINE}`;
            const missingActiveFile = !activeFileId;
            if (missingActiveFile) {
              updateTask(2, 'running', 'Aucun fichier actif detecte, bascule en creation');
            }

            if (missingActiveFile) {
              if (shouldUseVision && !primaryVisionImageData) {
                throw new Error(withErrorCode('UNKNOWN', 'Reference image invalide pour la generation.'));
              }

              const createFromEditResult = shouldUseVision
                ? await generateFromImage(providerKey, primaryVisionImageData!, editPrompt, normalizedGenerationModel, contextFiles)
                : await generateFromPrompt(providerKey, editPrompt, normalizedGenerationModel, contextFiles);
              if (!createFromEditResult) {
                throw new Error(generationError || withErrorCode('UNKNOWN', 'Generation impossible pour la creation initiale.'));
              }
              setGenerationStage('validating');

              const rawTitle = getGeneratedInterfaceTitle(String(createFromEditResult.canvasSettings?.title || ''), trimmed);
              const fileName = getUniquePyFileName(rawTitle);
              const newFileId = addNode(null, 'file', fileName);
              const nextSettings = createFromEditResult.canvasSettings
                ? { ...canvasSettings, ...createFromEditResult.canvasSettings, title: rawTitle }
                : { ...canvasSettings, title: rawTitle };
              const qualityChecks = mapQualityChecksToMessageMeta(createFromEditResult.qualityChecks);
              const qualitySummary = mapQualitySummaryToMessageMeta(createFromEditResult.qualitySummary);

              const impact = computeWidgetImpact([], (createFromEditResult.widgets as Array<{ id: string; type: string }>).map((w) => ({ id: w.id, type: w.type })));
              persistActiveWorkspaceToFile();
              setGenerationStage('applying');
              applyGeneratedInterface(newFileId, rawTitle, createFromEditResult.widgets, nextSettings);

              const lines = [
                'Aucun fichier actif: creation d\'une nouvelle interface.',
                `Nouvelle interface creee dans **${fileName}**.`,
                `Widgets touches: +${impact.created} / ~${impact.updated} / -${impact.deleted}.`,
              ];
              if (qualitySummary) {
                lines.push(`Qualite auto: ${qualitySummary.score}% (${qualitySummary.remainingIssues} issue(s) restante(s)).`);
              }
              if (fidelityReport) lines.push('', fidelityReport);
              responseText = lines.join('\n');
              updateAssistant(responseText);
              updateTask(2, 'completed', 'Generation IA terminee', `${createFromEditResult.widgets.length} widgets proposes`);
              updateTask(3, 'completed', 'Validation widgets', `${impact.touchedTypes.slice(0, 6).join(', ') || 'widgets valides'}`);
              updateTask(4, 'completed', 'Application et sauvegarde', fileName, {
                filesWritten: [fileName],
                artifactFile: fileName,
              });
              updateGenerationMeta({
                status: 'completed',
                resolvedModel: effectiveModel,
                usedVision: shouldUseVision,
                attempt: Math.max(1, retryCount + 1),
                maxAttempts: 3,
                applyMode: 'create',
                artifact: {
                  fileId: newFileId,
                  fileName,
                  action: 'created',
                },
                fileTreePreview: buildFileTreePreview(fileName, 'created'),
                widgetImpact: impact,
                qualityChecks,
                qualitySummary,
              });
            } else {
              if (shouldUseVision && !primaryVisionImageData) {
                throw new Error(withErrorCode('UNKNOWN', 'Reference image invalide pour la generation.'));
              }
              const result = shouldUseVision
                ? await generateFromImage(providerKey, primaryVisionImageData!, editPrompt, normalizedGenerationModel, contextFiles)
                : await generateIteration(providerKey, editPrompt, widgets, normalizedGenerationModel, contextFiles);
              if (!result) {
                throw new Error(generationError || withErrorCode('UNKNOWN', 'Generation impossible pour la modification demandee.'));
              }
              setGenerationStage('validating');

              const previousWidgets = widgets.map((w) => ({ id: w.id, type: w.type }));
              const nextWidgets = (result.widgets as Array<{ id: string; type: string }>).map((w) => ({ id: w.id, type: w.type }));
              const impact = computeWidgetImpact(previousWidgets, nextWidgets);
              const qualityChecks = mapQualityChecksToMessageMeta(result.qualityChecks);
              const qualitySummary = mapQualitySummaryToMessageMeta(result.qualitySummary);

              const nextSettings = result.canvasSettings
                ? { ...canvasSettings, ...result.canvasSettings }
                : { ...canvasSettings };
              persistActiveWorkspaceToFile();
              setGenerationStage('applying');
              applyGeneratedInterface(
                activeFileId!,
                String(nextSettings.title || 'Interface modifiee'),
                result.widgets,
                nextSettings
              );

              const targetFileName = getPyFiles().find((f) => f.id === activeFileId)?.name || 'fichier actif';
              const lines = [
                'Modification appliquee sur le fichier actif.',
                `Fichier: **${targetFileName}**.`,
                `Widgets touches: +${impact.created} / ~${impact.updated} / -${impact.deleted}.`,
              ];
              if (qualitySummary) {
                lines.push(`Qualite auto: ${qualitySummary.score}% (${qualitySummary.remainingIssues} issue(s) restante(s)).`);
              }
              if (fidelityReport) lines.push('', fidelityReport);
              responseText = lines.join('\n');
              updateAssistant(responseText);
              updateTask(2, 'completed', 'Generation IA terminee', `${result.widgets.length} widgets proposes`);
              updateTask(3, 'completed', 'Validation widgets', `+${impact.created} / ~${impact.updated} / -${impact.deleted}`);
              updateTask(4, 'completed', 'Application et sauvegarde', targetFileName, {
                filesWritten: [targetFileName],
                artifactFile: targetFileName,
              });
              updateGenerationMeta({
                status: 'completed',
                resolvedModel: effectiveModel,
                usedVision: shouldUseVision,
                attempt: Math.max(1, retryCount + 1),
                maxAttempts: 3,
                applyMode: 'update',
                artifact: {
                  fileId: activeFileId,
                  fileName: targetFileName,
                  action: 'updated',
                },
                fileTreePreview: buildFileTreePreview(targetFileName, 'updated'),
                widgetImpact: impact,
                qualityChecks,
                qualitySummary,
              });
            }
          } else {
            const createPrompt = `${trimmed}\n\n${PREMIUM_DESIGN_BASELINE}`;
            if (shouldUseVision && !primaryVisionImageData) {
              throw new Error(withErrorCode('UNKNOWN', 'Reference image invalide pour la generation.'));
            }
            const result = shouldUseVision
              ? await generateFromImage(providerKey, primaryVisionImageData!, createPrompt, normalizedGenerationModel, contextFiles)
              : await generateFromPrompt(providerKey, createPrompt, normalizedGenerationModel, contextFiles);
            if (!result) {
              throw new Error(generationError || withErrorCode('UNKNOWN', 'Generation impossible pour la nouvelle interface.'));
            }
            setGenerationStage('validating');

            const rawTitle = getGeneratedInterfaceTitle(String(result.canvasSettings?.title || ''), trimmed);
            const nextSettings = result.canvasSettings
              ? { ...canvasSettings, ...result.canvasSettings, title: rawTitle }
              : { ...canvasSettings, title: rawTitle };
            const qualityChecks = mapQualityChecksToMessageMeta(result.qualityChecks);
            const qualitySummary = mapQualitySummaryToMessageMeta(result.qualitySummary);
            persistActiveWorkspaceToFile();
            setGenerationStage('applying');
            if (activeFileId) {
              const previousWidgets = widgets.map((w) => ({ id: w.id, type: w.type }));
              const nextWidgets = (result.widgets as Array<{ id: string; type: string }>).map((w) => ({ id: w.id, type: w.type }));
              const impact = computeWidgetImpact(previousWidgets, nextWidgets);
              applyGeneratedInterface(activeFileId, rawTitle, result.widgets, nextSettings);
              const targetFileName = getPyFiles().find((f) => f.id === activeFileId)?.name || 'fichier actif';

              const replaceResponseLines = [
                `Interface recreee depuis zero dans **${targetFileName}**.`,
                'Le style precedent a ete remplace completement.',
                `Widgets touches: +${impact.created} / ~${impact.updated} / -${impact.deleted}.`,
              ];
              if (qualitySummary) {
                replaceResponseLines.push(`Qualite auto: ${qualitySummary.score}% (${qualitySummary.remainingIssues} issue(s) restante(s)).`);
              }
              if (fidelityReport) {
                replaceResponseLines.push('', fidelityReport);
              }
              responseText = replaceResponseLines.join('\n');
              updateAssistant(responseText);
              updateTask(2, 'completed', 'Generation IA terminee', `${result.widgets.length} widgets proposes`);
              updateTask(3, 'completed', 'Validation widgets', `${impact.touchedTypes.slice(0, 6).join(', ') || 'widgets valides'}`);
              updateTask(4, 'completed', 'Application et sauvegarde', targetFileName, {
                filesWritten: [targetFileName],
                artifactFile: targetFileName,
              });
              updateGenerationMeta({
                status: 'completed',
                resolvedModel: effectiveModel,
                usedVision: shouldUseVision,
                attempt: Math.max(1, retryCount + 1),
                maxAttempts: 3,
                applyMode: 'replace',
                artifact: {
                  fileId: activeFileId,
                  fileName: targetFileName,
                  action: 'updated',
                },
                fileTreePreview: buildFileTreePreview(targetFileName, 'updated'),
                widgetImpact: impact,
                qualityChecks,
                qualitySummary,
              });
            } else {
              const fileName = getUniquePyFileName(rawTitle);
              const newFileId = addNode(null, 'file', fileName);
              const impact = computeWidgetImpact([], (result.widgets as Array<{ id: string; type: string }>).map((w) => ({ id: w.id, type: w.type })));

              applyGeneratedInterface(newFileId, rawTitle, result.widgets, nextSettings);
              const createResponseLines = [
                `Nouvelle interface creee dans **${fileName}**.`,
                `Widgets touches: +${impact.created} / ~${impact.updated} / -${impact.deleted}.`,
                'Le canvas a ete ouvert automatiquement.',
              ];
              if (shouldCreateFromEmptyWorkspace) {
                createResponseLines.unshift('Aucun fichier .py actif: creation d\'une premiere interface.');
              }
              if (qualitySummary) {
                createResponseLines.push(`Qualite auto: ${qualitySummary.score}% (${qualitySummary.remainingIssues} issue(s) restante(s)).`);
              }
              if (fidelityReport) {
                createResponseLines.push('', fidelityReport);
              }
              responseText = createResponseLines.join('\n');
              updateAssistant(responseText);
              updateTask(2, 'completed', 'Generation IA terminee', `${result.widgets.length} widgets proposes`);
              updateTask(3, 'completed', 'Validation widgets', `${impact.touchedTypes.slice(0, 6).join(', ') || 'widgets valides'}`);
              updateTask(4, 'completed', 'Application et sauvegarde', fileName, {
                filesWritten: [fileName],
                artifactFile: fileName,
              });
              updateGenerationMeta({
                status: 'completed',
                resolvedModel: effectiveModel,
                usedVision: shouldUseVision,
                attempt: Math.max(1, retryCount + 1),
                maxAttempts: 3,
                applyMode: 'create',
                artifact: {
                  fileId: newFileId,
                  fileName,
                  action: 'created',
                },
                fileTreePreview: buildFileTreePreview(fileName, 'created'),
                widgetImpact: impact,
                qualityChecks,
                qualitySummary,
              });
            }
          }
        } else {
          const pending = pendingPlans[conversationId];

          if (pending && isPositiveConfirmation(trimmed)) {
            const executionModel = normalizeModelForGeneration(pending.model, pending.provider);
            const executionProviderKey =
              apiKeys[resolveProvider(executionModel, pending.provider) as keyof ApiKeys] ||
              apiKeys[pending.provider as keyof ApiKeys] ||
              providerKey;

            if (!executionProviderKey) {
              throw new Error(withErrorCode('INVALID_KEY', `Cle API manquante pour executer le plan (${pending.provider}).`));
            }

            persistActiveWorkspaceToFile();
            const createdFiles: string[] = [...pending.createdFiles];
            const planQualityScores: number[] = [];
            const planQualityNotes: string[] = [];
            let firstCreatedFileId: string | null = null;
            let firstCreatedWorkspace: {
              widgets: Parameters<typeof loadWorkspaceState>[0];
              settings: Parameters<typeof loadWorkspaceState>[1];
            } | null = null;

            for (let i = pending.nextInterfaceIndex; i < pending.plan.interfaces.length; i += 1) {
              const spec = pending.plan.interfaces[i];
              setGenerationStage('composing');
              updateTask(2, 'running', `Generation interface ${i + 1}/${pending.plan.interfaces.length}`, spec.name, {
                filesRead: pending.contextFiles.map((file) => file.name),
              });
              const interfacePrompt = `
Objectif global du projet: ${pending.plan.objective}

Cree l'interface "${spec.name}".
Role: ${spec.purpose}
Canvas cible: ${spec.canvas.width}x${spec.canvas.height}
Widgets attendus: ${spec.widgets.join(', ')}
Contraintes design: ${spec.designNotes}

${PREMIUM_DESIGN_BASELINE}
              `.trim();

              const result = await generateFromPrompt(executionProviderKey, interfacePrompt, executionModel, pending.contextFiles);
              if (!result) {
                throw new Error(generationError || withErrorCode('UNKNOWN', `Echec generation pour ${spec.name}.`));
              }
              setGenerationStage('validating');
              if (result.qualitySummary) {
                planQualityScores.push(result.qualitySummary.score);
                if (result.qualitySummary.remainingIssues > 0) {
                  planQualityNotes.push(`${spec.name}: ${result.qualitySummary.remainingIssues} issue(s) restante(s)`);
                }
              }

              const fileName = getUniquePyFileName(spec.name);
              const newFileId = addNode(null, 'file', fileName);
              const nextSettings = {
                ...canvasSettings,
                ...result.canvasSettings,
                width: spec.canvas.width,
                height: spec.canvas.height,
                title: spec.name,
              };

              setGenerationStage('applying');
              applyGeneratedInterface(newFileId, spec.name, result.widgets, nextSettings);
              if (!firstCreatedFileId) firstCreatedFileId = newFileId;
              if (!firstCreatedWorkspace) {
                firstCreatedWorkspace = {
                  widgets: result.widgets as Parameters<typeof loadWorkspaceState>[0],
                  settings: nextSettings as unknown as Parameters<typeof loadWorkspaceState>[1],
                };
              }
              createdFiles.push(fileName);

              setPendingPlans((prev) => ({
                ...prev,
                [conversationId]: {
                  ...pending,
                  nextInterfaceIndex: i + 1,
                  createdFiles,
                },
              }));
              updateTask(3, 'running', 'Validation du resultat', `${i + 1}/${pending.plan.interfaces.length} interface(s)`);
            }

            if (firstCreatedFileId && firstCreatedWorkspace) {
              setActiveFile(firstCreatedFileId);
              loadWorkspaceState(firstCreatedWorkspace.widgets, firstCreatedWorkspace.settings);
            }

            setPendingPlans((prev) => {
              const next = { ...prev };
              delete next[conversationId];
              return next;
            });

            responseText = [
              `Plan execute avec succes: ${createdFiles.length} interface(s) creee(s).`,
              ...createdFiles.map((name, index) => `${index + 1}. ${name}`),
            ].join('\n');
            updateAssistant(responseText);
            updateTask(2, 'completed', 'Generation des interfaces terminee', `${createdFiles.length} fichier(s)`);
            updateTask(3, 'completed', 'Validation du resultat');
            updateTask(4, 'completed', 'Application et sauvegarde', `${createdFiles.length} fichier(s) crees`, {
              filesWritten: createdFiles,
              artifactFile: createdFiles[0],
            });
            updateGenerationMeta({
              status: 'completed',
              resumeCheckpointId: undefined,
              attempt: Math.max(1, retryCount + 1),
              maxAttempts: 3,
              qualitySummary: planQualityScores.length > 0
                ? {
                  score: Math.round(planQualityScores.reduce((sum, value) => sum + value, 0) / planQualityScores.length),
                  hasBlockingIssues: planQualityNotes.length > 0,
                  remainingIssues: planQualityNotes.length,
                  notes: planQualityNotes,
                }
                : undefined,
            });
          } else if (pending && isNegativeConfirmation(trimmed)) {
            setPendingPlans((prev) => {
              const next = { ...prev };
              delete next[conversationId];
              return next;
            });
            responseText = 'Plan annule. Donnez-moi de nouvelles instructions pour proposer un autre plan.';
            updateAssistant(responseText);
            setGenerationStage('validating');
            updateTask(2, 'completed', 'Plan annule');
            updateTask(3, 'completed', 'Validation utilisateur');
            updateTask(4, 'completed', 'Termine');
            updateGenerationMeta({ status: 'completed' });
          } else {
            const plan = await generatePlanDraft(
              resolvedProvider,
              providerKey,
              model,
              trimmed,
              contextFiles,
              systemPrompt,
              controller.signal
            );
            if (!plan) {
              throw new Error('Impossible de construire un plan valide. Reformulez votre demande.');
            }

            setPendingPlans((prev) => ({
              ...prev,
              [conversationId]: {
                plan,
                model,
                provider: selectedProvider,
                contextFiles,
                nextInterfaceIndex: 0,
                createdFiles: [],
              },
            }));
            responseText = formatPlanMarkdown(plan);
            updateAssistant(responseText);
            setGenerationStage('validating');
            updateTask(2, 'completed', 'Plan propose', `${plan.interfaces.length} interface(s)`);
            updateTask(3, 'completed', 'Validation utilisateur requise');
            updateTask(4, 'completed', 'En attente');
            updateGenerationMeta({
              status: 'completed',
              resumeCheckpointId: conversationId,
              attempt: Math.max(1, retryCount + 1),
              maxAttempts: 3,
            });
          }
        }

        await reasoningPromise;
        const completedAt = Date.now();

        updateConversationMessages(conversationId, (prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  generation: {
                    ...msg.generation,
                    status: msg.generation?.status === 'error' ? 'error' : 'completed',
                    stage: msg.generation?.status === 'error' ? 'failed' : 'completed',
                    completedAt,
                    durationMs: completedAt - generationStartedAt,
                  },
                  tasks: msg.tasks?.map((t) => (
                    t.status === 'running' ? { ...t, status: 'completed' } : t
                  )),
                }
              : msg
          ),
          { persist: true }
        );
        setInputStatus('ready');
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          toast.info('Generation interrompue');
          const completedAt = Date.now();
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  isReasoningStreaming: false,
                  generation: {
                    ...msg.generation,
                    status: 'error',
                    stage: 'failed',
                    errorCode: 'ABORTED',
                    errorMessage: 'Generation interrompue manuellement.',
                    completedAt,
                    durationMs: completedAt - generationStartedAt,
                  },
                }
                : msg
            ),
            { persist: true }
          );
        } else {
          const rawMessage = error instanceof Error ? error.message : withErrorCode('UNKNOWN', 'Erreur IA inconnue.');
          const formatted = formatProviderErrorForUser(rawMessage);
          toast.error(formatted.text);
          const completedAt = Date.now();
          updateConversationMessages(conversationId, (prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `${formatted.text}\n\nCliquez sur régénérer pour reprendre la génération.`,
                    isReasoningStreaming: false,
                    generation: {
                      ...msg.generation,
                      status: 'error',
                      stage: 'failed',
                      errorCode: formatted.code,
                      errorMessage: formatted.text,
                      errorTrace: error instanceof Error ? error.stack : undefined,
                      resumeCheckpointId: conversationId,
                      attempt: Math.max(1, retryCount + 1),
                      maxAttempts: 3,
                      completedAt,
                      durationMs: completedAt - generationStartedAt,
                    },
                    tasks: msg.tasks?.map((t) => (
                      t.status === 'completed'
                        ? t
                        : { ...t, status: 'error', detail: t.detail || 'Execution interrompue' }
                    )),
                  }
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
    [
      activeProjectId,
      activeFileId,
      addNode,
      apiKeys,
      applyGeneratedInterface,
      buildAuditReport,
      buildContextFiles,
      buildFileTreePreview,
      buildSystemPrompt,
      callOpenAICompatible,
      canvasSettings,
      dbReady,
      detectMentionedFiles,
      ensureConversation,
      generateConversationTitle,
      generateFromImage,
      generateFromPrompt,
      generateIteration,
      generatePlanDraft,
      generationError,
      getPyFiles,
      getUniquePyFileName,
      isAuditRequest,
      isTyping,
      normalizeModelForGeneration,
      pendingPlans,
      persistActiveWorkspaceToFile,
      resolveVisionExecution,
      retryCount,
      setActiveFile,
      simulateReasoning,
      user,
      updateConversationMessages,
      widgets
    ]
  );

  const handleRegenerateAssistantMessage = useCallback((assistantMessageId: string) => {
    if (isTyping || !currentConversationId) return;

    const conversation = conversationsRef.current.find((c) => c.id === currentConversationId);
    if (!conversation) return;

    const assistantIndex = conversation.messages.findIndex(
      (message) => message.id === assistantMessageId && message.role === 'assistant'
    );
    if (assistantIndex < 0) {
      toast.error('Message assistant introuvable pour regeneration.');
      return;
    }

    const assistantMessage = conversation.messages[assistantIndex];
    const linkedPromptId = assistantMessage.generation?.promptMessageId;
    let sourcePrompt: Message | undefined;

    if (linkedPromptId) {
      sourcePrompt = conversation.messages.find((message) => message.id === linkedPromptId && message.role === 'user');
    }

    if (!sourcePrompt) {
      for (let i = assistantIndex - 1; i >= 0; i -= 1) {
        if (conversation.messages[i].role === 'user') {
          sourcePrompt = conversation.messages[i];
          break;
        }
      }
    }

    if (!sourcePrompt || !sourcePrompt.content.trim()) {
      const pending = currentConversationId ? pendingPlans[currentConversationId] : undefined;
      if (pending) {
        void handleSendMessage(
          'oui',
          assistantMessage.generation?.model || pending.model,
          undefined,
          assistantMessage.generation?.provider || pending.provider,
          assistantMessage.generation?.mode || 'plan'
        );
        return;
      }
      toast.error('Prompt source introuvable pour regeneration.');
      return;
    }

    const regenModel = assistantMessage.generation?.model || sourcePrompt.generation?.model || 'gemini-3-flash-preview';
    const regenProvider = assistantMessage.generation?.provider || sourcePrompt.generation?.provider || 'google';
    const regenMode = assistantMessage.generation?.mode || sourcePrompt.generation?.mode || 'agent';

    void handleSendMessage(
      sourcePrompt.content,
      regenModel,
      sourcePrompt.attachments,
      regenProvider,
      regenMode
    );
  }, [currentConversationId, handleSendMessage, isTyping, pendingPlans]);

  const handleStopGeneration = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setIsTyping(false);
    setInputStatus('ready');
  }, [abortController]);

  const handleNewConversation = useCallback(() => {
    if (!activeProjectId) {
      toast.error('Aucun projet actif pour creer une conversation.');
      return;
    }
    const created = createBlankConversation();
    setConversations((prev) => sortConversationsByLatest([created, ...prev]));
    setCurrentConversationId(created.id);
    void persistConversationToDb(created, activeProjectId);
  }, [activeProjectId, createBlankConversation, persistConversationToDb, sortConversationsByLatest]);

  const handleSelectConversation = useCallback((id: string) => {
    setConversations((prev) => sortConversationsByLatest(
      prev.map((conversation) => (
        conversation.id === id
          ? { ...conversation, timestamp: Date.now() }
          : conversation
      ))
    ));
    setCurrentConversationId(id);
    void touchConversationInDb(id)
      .then(() => {
        setDbSyncError(null);
        if (pendingConversationWritesRef.current.size === 0) {
          setDbSyncState('ok');
          setDbSyncReason(null);
        }
      })
      .catch(() => {
        setDbSyncError("Impossible de mettre a jour la conversation active en base.");
        setDbSyncState('degraded');
        setDbSyncReason('Synchronisation differee. La selection locale est conservee.');
      });
  }, [sortConversationsByLatest]);

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
    setDeletingConversationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    void (async () => {
      try {
        await deleteConversationFromDb(id);

        setPendingPlans((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

        const filtered = conversationsRef.current.filter((conversation) => conversation.id !== id);
        let nextConversations = filtered;
        let fallbackConversationId: string | null = currentConversationIdRef.current;
        let createdFallback: Conversation | null = null;

        if (currentConversationIdRef.current === id) {
          if (filtered.length > 0) {
            fallbackConversationId = filtered[0].id;
          } else {
            createdFallback = createBlankConversation();
            nextConversations = [createdFallback];
            fallbackConversationId = createdFallback.id;
          }
        } else if (fallbackConversationId && !filtered.some((conversation) => conversation.id === fallbackConversationId)) {
          fallbackConversationId = filtered[0]?.id ?? null;
        }

        setConversations(nextConversations);
        setCurrentConversationId(fallbackConversationId);

        if (fallbackConversationId && !createdFallback) {
          void touchConversationInDb(fallbackConversationId).catch(() => {
            setDbSyncError("Impossible de mettre a jour la conversation active apres suppression.");
            setDbSyncState('degraded');
            setDbSyncReason('Synchronisation differee apres suppression.');
          });
        }
        if (createdFallback && activeProjectId) {
          void persistConversationToDb(createdFallback, activeProjectId);
        }

        setDbSyncError(null);
        if (pendingConversationWritesRef.current.size === 0) {
          setDbSyncState('ok');
          setDbSyncReason(null);
        }
      } catch (error) {
        console.warn('[AI] Suppression conversation echouee:', error);
        setDbSyncError("Impossible de supprimer la conversation en base.");
        setDbSyncState('degraded');
        setDbSyncReason('La conversation a ete conservee localement.');
        toast.error('Suppression echouee: la conversation est conservee.');
      } finally {
        setDeletingConversationIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  }, [activeProjectId, createBlankConversation, persistConversationToDb]);

  const handleHardResetSync = useCallback(() => {
    if (!user) {
      toast.error('Connectez-vous pour reinitialiser Dayanna.');
      return;
    }

    void (async () => {
      try {
        setIsLoadingDb(true);
        setDbSyncError(null);
        setDbSyncState('syncing');
        setDbSyncReason('Reinitialisation complete Dayanna...');
        setPendingPlans({});
        pendingConversationWritesRef.current.clear();

        await resetAllConversationsForUser();

        setConversations([]);
        setCurrentConversationId(null);

        if (activeProjectId) {
          const freshConversation = createBlankConversation();
          setConversations([freshConversation]);
          setCurrentConversationId(freshConversation.id);
          await persistConversationToDb(freshConversation, activeProjectId);
        }

        setDbSyncState('ok');
        setDbSyncReason(null);
        toast.success('Dayanna reinitialisee. Nouvelle conversation creee.');
      } catch (error) {
        console.warn('[AI] Reinitialisation complete impossible:', error);
        setDbSyncState('error');
        setDbSyncError('Reinitialisation impossible. Verifiez Supabase et vos permissions.');
        setDbSyncReason('La base refuse la suppression. Reessayez ou verifiez la migration.');
        toast.error('Echec de la reinitialisation Dayanna.');
      } finally {
        setIsLoadingDb(false);
      }
    })();
  }, [activeProjectId, createBlankConversation, persistConversationToDb, user]);

  const handleUpdateTitle = useCallback((id: string, title: string) => {
    applyConversationTitle(id, title.trim() || 'Sans titre');
  }, [applyConversationTitle]);

  const handleSaveApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    aiRef.current = null;

    if (!dbReady || !user) {
      toast.error('Connexion requise pour enregistrer les cles API en base.');
      return;
    }

    void saveApiKeysToSupabase(keys as unknown as Record<string, string | undefined>)
      .then(() => {
        setDbSyncError(null);
        if (pendingConversationWritesRef.current.size === 0) {
          setDbSyncState('ok');
          setDbSyncReason(null);
        }
        toast.success('Parametres enregistres');
      })
      .catch(() => toast.error('Echec enregistrement des cles API'));
  }, [dbReady, user]);

  const availableFiles = useMemo(() => {
    return getPyFiles().map(f => ({
      id: f.id,
      name: f.name,
      content: f.content || '',
    }));
  }, [getPyFiles]);

  return (
    <div className="dayanna-theme-dark relative h-full min-h-0 w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        messages={messages}
        isTyping={isTyping}
        inputStatus={inputStatus}
        onSendMessage={handleSendMessage}
        onRegenerateAssistantMessage={handleRegenerateAssistantMessage}
        onRestore={handleRestore}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        onUpdateTitle={handleUpdateTitle}
        restoreContent={restoreContent}
        onClearRestoreContent={() => setRestoreContent(null)}
        onStopGeneration={handleStopGeneration}
        onOpenSettings={() => setIsSettingsOpen(true)}
        apiKeys={apiKeys}
        availableFiles={availableFiles}
        dbSyncState={isLoadingDb ? 'syncing' : dbSyncState}
        dbSyncReason={dbSyncError || dbSyncReason}
        deletingConversationIds={Array.from(deletingConversationIds)}
        onRetrySync={() => {
          setDbSyncError(null);
          setDbSyncState('syncing');
          setDbSyncReason('Nouvelle tentative de synchronisation...');
          setIsLoadingDb(true);
          setDbReloadNonce((prev) => prev + 1);
          void flushConversationWriteQueue();
        }}
        onHardResetSync={handleHardResetSync}
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
