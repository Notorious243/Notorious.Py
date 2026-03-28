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

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  free?: boolean;
}

export type Model = string;

export type InputStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export type AIMode = 'agent' | 'discussions' | 'plan';

export interface TaggedFile {
  id: string;
  name: string;
  content: string;
}
