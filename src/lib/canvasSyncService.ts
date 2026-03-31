import { supabase } from './supabase';
import { devWarn } from '@/lib/logger';
import type { CanvasSettings } from '@/types/widget';

export type CanvasSyncState = 'ok' | 'syncing' | 'degraded' | 'error';

export interface CanvasSyncSnapshot {
  status: CanvasSyncState;
  reason: string | null;
  pendingWritesCount: number;
  lastSyncedAt: number | null;
  lastErrorCode: string | null;
}

interface CanvasWritePayload {
  projectId: string;
  fileTree?: unknown[];
  canvasSettings?: CanvasSettings;
}

interface EnqueueCanvasWriteOptions {
  immediate?: boolean;
  debounceMs?: number;
}

const DEFAULT_SNAPSHOT: CanvasSyncSnapshot = {
  status: 'ok',
  reason: null,
  pendingWritesCount: 0,
  lastSyncedAt: null,
  lastErrorCode: null,
};

const queuedByProject = new Map<string, CanvasWritePayload>();
const timersByProject = new Map<string, ReturnType<typeof setTimeout>>();
const inFlightByProject = new Map<string, Promise<void>>();
const snapshotsByProject = new Map<string, CanvasSyncSnapshot>();
const listenersByProject = new Map<string, Set<(snapshot: CanvasSyncSnapshot) => void>>();
const telemetryTag = '[CanvasSync]';
const PENDING_QUEUE_STORAGE_KEY = 'notorious.canvas_sync_pending_writes_v1';

let onlineListenerRegistered = false;
let queueHydrated = false;

const canUseStorage = () => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

const persistQueuedWrites = () => {
  if (!canUseStorage()) return;
  try {
    if (queuedByProject.size === 0) {
      window.localStorage.removeItem(PENDING_QUEUE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(Array.from(queuedByProject.entries())));
  } catch (error) {
    devWarn(`${telemetryTag} Impossible de persister la queue locale`, error);
  }
};

const hydrateQueuedWrites = () => {
  if (queueHydrated) return;
  queueHydrated = true;
  if (!canUseStorage()) return;

  try {
    const raw = window.localStorage.getItem(PENDING_QUEUE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(PENDING_QUEUE_STORAGE_KEY);
      return;
    }

    parsed.forEach((entry) => {
      if (!Array.isArray(entry) || entry.length !== 2) return;
      const [projectId, payload] = entry as [unknown, unknown];
      if (typeof projectId !== 'string' || !projectId) return;
      if (!payload || typeof payload !== 'object') return;
      queuedByProject.set(projectId, {
        projectId,
        fileTree: (payload as CanvasWritePayload).fileTree,
        canvasSettings: (payload as CanvasWritePayload).canvasSettings,
      });
      publishSnapshot(projectId, {
        status: 'degraded',
        reason: 'Sauvegarde locale detectee. Synchronisation en attente...',
      });
    });
  } catch (error) {
    devWarn(`${telemetryTag} Impossible de restaurer la queue locale`, error);
    if (canUseStorage()) {
      window.localStorage.removeItem(PENDING_QUEUE_STORAGE_KEY);
    }
  }
};

const getSnapshot = (projectId: string): CanvasSyncSnapshot => {
  return snapshotsByProject.get(projectId) ?? DEFAULT_SNAPSHOT;
};

const getPendingCount = (projectId: string) => {
  hydrateQueuedWrites();
  return queuedByProject.has(projectId) ? 1 : 0;
};

const emitTelemetry = (detail: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('app-telemetry', {
      detail: {
        domain: 'canvas-sync',
        ...detail,
      },
    }),
  );
};

const publishSnapshot = (projectId: string, patch: Partial<CanvasSyncSnapshot>) => {
  const next: CanvasSyncSnapshot = {
    ...getSnapshot(projectId),
    ...patch,
    pendingWritesCount: getPendingCount(projectId),
  };
  snapshotsByProject.set(projectId, next);
  const listeners = listenersByProject.get(projectId);
  if (!listeners?.size) return;
  listeners.forEach((listener) => listener(next));
};

const classifySyncError = (error: unknown) => {
  const message = String((error as { message?: string })?.message ?? 'Erreur sync inconnue');
  const raw = message.toLowerCase();
  if (raw.includes('timeout') || raw.includes('timed out')) {
    return { code: 'TIMEOUT', retryable: true, reason: 'Timeout synchronisation canvas.' };
  }
  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('load failed')) {
    return { code: 'NETWORK', retryable: true, reason: 'Reseau indisponible. Sync en attente.' };
  }
  if (raw.includes('rate') || raw.includes('429')) {
    return { code: 'RATE_LIMIT', retryable: true, reason: 'Limite de requetes atteinte. Retry automatique.' };
  }
  if (raw.includes('jwt') || raw.includes('auth') || raw.includes('forbidden') || raw.includes('permission')) {
    return { code: 'AUTH', retryable: false, reason: 'Session invalide ou permissions insuffisantes.' };
  }
  if (raw.includes('column') || raw.includes('schema') || raw.includes('relation')) {
    return { code: 'SCHEMA', retryable: false, reason: 'Schema DB incompatible pour la synchronisation canvas.' };
  }
  return { code: 'UNKNOWN', retryable: true, reason: message };
};

const mergePayload = (current: CanvasWritePayload | undefined, incoming: CanvasWritePayload): CanvasWritePayload => {
  return {
    projectId: incoming.projectId,
    fileTree: incoming.fileTree ?? current?.fileTree,
    canvasSettings: incoming.canvasSettings ?? current?.canvasSettings,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const registerOnlineListener = () => {
  if (onlineListenerRegistered || typeof window === 'undefined') return;
  hydrateQueuedWrites();
  onlineListenerRegistered = true;
  window.addEventListener('online', () => {
    void flushPendingCanvasWrites();
  });
  window.addEventListener('focus', () => {
    void flushPendingCanvasWrites();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void flushPendingCanvasWrites();
    }
  });
};

const clearProjectTimer = (projectId: string) => {
  const timer = timersByProject.get(projectId);
  if (timer) {
    clearTimeout(timer);
    timersByProject.delete(projectId);
  }
};

const flushProjectWrites = async (projectId: string): Promise<void> => {
  hydrateQueuedWrites();
  const existingInFlight = inFlightByProject.get(projectId);
  if (existingInFlight) {
    await existingInFlight;
    return;
  }

  const run = (async () => {
    clearProjectTimer(projectId);

    while (queuedByProject.has(projectId)) {
      const payload = queuedByProject.get(projectId);
      if (!payload) break;
      queuedByProject.delete(projectId);
      persistQueuedWrites();
      publishSnapshot(projectId, {
        status: 'syncing',
        reason: 'Synchronisation canvas en cours...',
        lastErrorCode: null,
      });

      let saved = false;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (payload.fileTree !== undefined) updatePayload.file_tree = payload.fileTree;
          if (payload.canvasSettings !== undefined) updatePayload.canvas_settings = payload.canvasSettings;

          const { error } = await supabase
            .from('projects')
            .update(updatePayload)
            .eq('id', projectId);

          if (error) throw error;
          saved = true;
          publishSnapshot(projectId, {
            status: 'ok',
            reason: null,
            lastSyncedAt: Date.now(),
            lastErrorCode: null,
          });
          break;
        } catch (error) {
          lastError = error;
          const classified = classifySyncError(error);
          if (!classified.retryable || attempt >= 3) break;
          const waitMs = Math.min(2200, 400 * 2 ** (attempt - 1));
          await sleep(waitMs);
        }
      }

      if (!saved) {
        if (payload.fileTree !== undefined || payload.canvasSettings !== undefined) {
          const currentQueued = queuedByProject.get(projectId);
          queuedByProject.set(projectId, mergePayload(currentQueued, payload));
          persistQueuedWrites();
        }
        const classified = classifySyncError(lastError);
        const status: CanvasSyncState = classified.retryable ? 'degraded' : 'error';
        publishSnapshot(projectId, {
          status,
          reason: classified.reason,
          lastErrorCode: classified.code,
        });
        devWarn(`${telemetryTag} Echec write`, { projectId, code: classified.code, reason: classified.reason });
        emitTelemetry({
          level: status === 'error' ? 'error' : 'warn',
          action: 'canvas_write_failed',
          projectId,
          code: classified.code,
          reason: classified.reason,
        });
        break;
      }
    }

    publishSnapshot(projectId, {
      pendingWritesCount: getPendingCount(projectId),
    });
  })();

  inFlightByProject.set(projectId, run);
  try {
    await run;
  } finally {
    inFlightByProject.delete(projectId);
  }
};

const scheduleFlush = (projectId: string, debounceMs: number) => {
  clearProjectTimer(projectId);
  const timer = setTimeout(() => {
    void flushProjectWrites(projectId);
  }, debounceMs);
  timersByProject.set(projectId, timer);
};

export const enqueueCanvasWrite = (
  projectId: string,
  payload: Omit<CanvasWritePayload, 'projectId'>,
  options: EnqueueCanvasWriteOptions = {},
) => {
  if (!projectId || projectId.startsWith('temp-')) return;
  hydrateQueuedWrites();
  registerOnlineListener();

  const merged = mergePayload(queuedByProject.get(projectId), { ...payload, projectId });
  queuedByProject.set(projectId, merged);
  persistQueuedWrites();
  publishSnapshot(projectId, {
    status: 'syncing',
    reason: 'Sauvegarde des modifications...',
  });

  if (options.immediate) {
    void flushProjectWrites(projectId);
    return;
  }
  scheduleFlush(projectId, options.debounceMs ?? 450);
};

export const flushPendingCanvasWrites = async (projectId?: string): Promise<void> => {
  hydrateQueuedWrites();
  if (projectId) {
    await flushProjectWrites(projectId);
    return;
  }

  const keys = new Set<string>([
    ...queuedByProject.keys(),
    ...inFlightByProject.keys(),
  ]);

  for (const key of keys) {
    await flushProjectWrites(key);
  }
};

export const retryCanvasSync = async (projectId: string): Promise<void> => {
  if (!projectId) return;
  publishSnapshot(projectId, {
    status: 'syncing',
    reason: 'Nouvelle tentative de synchronisation...',
    lastErrorCode: null,
  });
  await flushProjectWrites(projectId);
};

export const checkCanvasSyncHealth = async (projectId: string): Promise<{ ok: boolean; reason?: string }> => {
  if (!projectId) return { ok: false, reason: 'Aucun projet actif.' };

  const { error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .limit(1);

  if (!error) return { ok: true };
  const classified = classifySyncError(error);
  return { ok: false, reason: classified.reason };
};

export const subscribeCanvasSyncState = (
  projectId: string,
  listener: (snapshot: CanvasSyncSnapshot) => void,
) => {
  const listeners = listenersByProject.get(projectId) ?? new Set<(snapshot: CanvasSyncSnapshot) => void>();
  listeners.add(listener);
  listenersByProject.set(projectId, listeners);
  listener(getSnapshot(projectId));

  return () => {
    const current = listenersByProject.get(projectId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listenersByProject.delete(projectId);
    }
  };
};

export const getCanvasSyncSnapshot = (projectId: string): CanvasSyncSnapshot => {
  return getSnapshot(projectId);
};
