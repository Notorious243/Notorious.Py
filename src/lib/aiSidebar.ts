const AI_OPEN_KEY = 'ctk_open_ai_on_load';
const AI_FOCUS_KEY = 'ctk_focus_ai_prompt_on_load';
const AI_FORCE_NEW_CONVERSATION_KEY = 'ctk_force_new_ai_conversation_on_load';

export const OPEN_AI_SIDEBAR_EVENT = 'open-ai-sidebar';
export const OPEN_PROPERTIES_SIDEBAR_EVENT = 'open-properties-sidebar';
export const FOCUS_AI_PROMPT_EVENT = 'focus-ai-prompt';
export const OPEN_AI_WORKSPACE_PANELS_EVENT = 'open-ai-workspace-panels';
export interface OpenAIAssistantOptions {
  forceNewConversation?: boolean;
}

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
};

export const consumeOpenAIOnLoadFlag = (): boolean => {
  const shouldOpen = safeStorageGet(AI_OPEN_KEY) === 'true';
  if (shouldOpen) safeStorageRemove(AI_OPEN_KEY);
  return shouldOpen;
};

export const consumeFocusAIPromptOnLoadFlag = (): boolean => {
  const shouldFocus = safeStorageGet(AI_FOCUS_KEY) === 'true';
  if (shouldFocus) safeStorageRemove(AI_FOCUS_KEY);
  return shouldFocus;
};

export const consumeForceNewConversationOnLoadFlag = (): boolean => {
  const shouldForce = safeStorageGet(AI_FORCE_NEW_CONVERSATION_KEY) === 'true';
  if (shouldForce) safeStorageRemove(AI_FORCE_NEW_CONVERSATION_KEY);
  return shouldForce;
};

export const emitFocusAIPrompt = () => {
  window.dispatchEvent(new CustomEvent(FOCUS_AI_PROMPT_EVENT));
};

export const openAIAssistantForPrompt = (options?: OpenAIAssistantOptions) => {
  safeStorageSet(AI_OPEN_KEY, 'true');
  safeStorageSet(AI_FOCUS_KEY, 'true');
  if (options?.forceNewConversation) safeStorageSet(AI_FORCE_NEW_CONVERSATION_KEY, 'true');

  window.dispatchEvent(new CustomEvent(OPEN_AI_SIDEBAR_EVENT, { detail: { forceNewConversation: Boolean(options?.forceNewConversation) } }));
  window.dispatchEvent(new CustomEvent(OPEN_AI_WORKSPACE_PANELS_EVENT));

  // Retry focus after mount/transition to ensure the textarea is ready.
  window.setTimeout(() => emitFocusAIPrompt(), 60);
  window.setTimeout(() => emitFocusAIPrompt(), 220);
};
