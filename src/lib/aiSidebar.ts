const AI_OPEN_KEY = 'ctk_open_ai_on_load';
const AI_FOCUS_KEY = 'ctk_focus_ai_prompt_on_load';

export const OPEN_AI_SIDEBAR_EVENT = 'open-ai-sidebar';
export const FOCUS_AI_PROMPT_EVENT = 'focus-ai-prompt';

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

export const emitFocusAIPrompt = () => {
  window.dispatchEvent(new CustomEvent(FOCUS_AI_PROMPT_EVENT));
};

export const openAIAssistantForPrompt = () => {
  safeStorageSet(AI_OPEN_KEY, 'true');
  safeStorageSet(AI_FOCUS_KEY, 'true');

  window.dispatchEvent(new CustomEvent(OPEN_AI_SIDEBAR_EVENT));

  // Retry focus after mount/transition to ensure the textarea is ready.
  window.setTimeout(() => emitFocusAIPrompt(), 60);
  window.setTimeout(() => emitFocusAIPrompt(), 220);
};
