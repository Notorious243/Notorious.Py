import type { ReactNode } from 'react';

export type Role = 'user' | 'assistant';

export interface Step {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  content?: string;
}

export interface TaskItemData {
  id: string;
  label: string | ReactNode;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail?: string;
}

export interface Attachment {
  id: string;
  type: string;
  name?: string;
  filename?: string;
  url?: string;
  mediaType?: string;
  data?: string; // base64 data
  mimeType?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  steps?: Step[];
  tasks?: TaskItemData[];
  reasoning?: string;
  isReasoningStreaming?: boolean;
  timestamp: number;
  versions?: { id: string; content: string }[];
  attachments?: Attachment[];
  generation?: MessageGenerationMeta;
}

export interface Conversation {
  id: string;
  title: string;
  firstMessage?: string;
  messages: Message[];
  timestamp: number;
  tags?: string[];
}

export interface ApiKeys {
  google?: string;
  openai?: string;
  anthropic?: string;
  huggingface?: string;
  openrouter?: string;
  groq?: string;
  deepseek?: string;
}

export type Provider = 'google' | 'huggingface' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'deepseek';
export type ProviderToggleMap = Record<Provider, boolean>;

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  free?: boolean;
}

export type Model = string;

export type InputStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export type AIMode = 'agent' | 'discussions' | 'plan';

export type GenerationStage = 'queued' | 'analyzing' | 'composing' | 'validating' | 'applying' | 'completed' | 'failed';

export interface MessageQualityCheck {
  id: string;
  label: string;
  issueCount?: number;
  fixedCount?: number;
  status: 'passed' | 'fixed' | 'failed';
  detail?: string;
}

export interface MessageTaskTraceItem {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startedAt?: number;
  endedAt?: number;
  detail?: string;
  filesRead?: string[];
  filesWritten?: string[];
  artifactFile?: string;
}

export interface MessageFileTreePreviewNode {
  path: string;
  type: 'file' | 'folder';
}

export interface MessageGenerationMeta {
  provider?: Provider;
  model?: Model;
  resolvedModel?: Model;
  mode?: AIMode;
  promptMessageId?: string;
  intent?: 'create' | 'edit' | 'ask' | 'multi';
  status?: 'running' | 'completed' | 'error';
  usedVision?: boolean;
  designReference?: {
    attachmentIds: string[];
    attachmentNames: string[];
  };
  fidelityNotes?: string[];
  applyMode?: 'create' | 'update' | 'replace';
  stage?: GenerationStage;
  stageStartedAt?: number;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  qualityChecks?: MessageQualityCheck[];
  qualitySummary?: {
    score: number;
    hasBlockingIssues: boolean;
    remainingIssues: number;
    notes: string[];
  };
  qualityGate?: {
    status: 'passed' | 'failed';
    minScore: number;
    reason?: string;
  };
  streaming?: {
    enabled: boolean;
    source: 'sse' | 'fallback';
    tokenCount?: number;
  };
  errorTrace?: string;
  taskTrace?: MessageTaskTraceItem[];
  fileTreePreview?: {
    rootLabel: string;
    highlightedPaths: string[];
    nodes: MessageFileTreePreviewNode[];
  };
  attempt?: number;
  maxAttempts?: number;
  errorCode?: string;
  errorMessage?: string;
  resumeCheckpointId?: string;
  artifact?: {
    fileId?: string;
    fileName?: string;
    action?: 'created' | 'updated' | 'none';
  };
  widgetImpact?: {
    created: number;
    updated: number;
    deleted: number;
    touchedTypes: string[];
  };
}

export interface TaggedFile {
  id: string;
  name: string;
  content: string;
}
