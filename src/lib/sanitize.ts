/**
 * Security utilities — input sanitization, XSS protection, prompt validation.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ENTITY_RE = /[&<>"'/]/g;

/** Escape HTML special characters to prevent XSS in rendered content. */
export const escapeHtml = (str: string): string =>
  str.replace(HTML_ENTITY_RE, (char) => HTML_ENTITY_MAP[char] || char);

/** Strip all HTML tags from a string. */
export const stripHtml = (str: string): string =>
  str.replace(/<[^>]*>/g, '');

/** Sanitize a user-provided string: trim, strip control chars, limit length. */
export const sanitizeInput = (raw: string, maxLength = 10_000): string => {
  if (!raw || typeof raw !== 'string') return '';
  // Remove null bytes and other control characters (keep newlines/tabs)
  const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, maxLength);
};

/** Validate and sanitize an AI prompt before sending to a provider. */
export const sanitizePrompt = (prompt: string): { valid: boolean; sanitized: string; reason?: string } => {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, sanitized: '', reason: 'Le prompt est vide.' };
  }

  const sanitized = sanitizeInput(prompt, 50_000);

  if (sanitized.length < 3) {
    return { valid: false, sanitized, reason: 'Le prompt est trop court (minimum 3 caractères).' };
  }

  if (sanitized.length > 50_000) {
    return { valid: false, sanitized: sanitized.slice(0, 50_000), reason: 'Le prompt dépasse 50 000 caractères.' };
  }

  return { valid: true, sanitized };
};

/** Validate a hex color string. Returns the color or null. */
export const sanitizeColor = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === 'transparent') return trimmed;
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  return null;
};

/** Sanitize a project name: strip dangerous chars, limit length. */
export const sanitizeProjectName = (name: string): string => {
  if (!name || typeof name !== 'string') return 'Sans titre';
  return name
    .replace(/[<>"/\\|?*\x00-\x1F]/g, '')
    .trim()
    .slice(0, 100) || 'Sans titre';
};

/** Validate an API key format (basic sanity check, not auth). */
export const isValidApiKeyFormat = (key: string, provider: string): boolean => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 10) return false;

  switch (provider) {
    case 'openai':
      return trimmed.startsWith('sk-');
    case 'anthropic':
      return trimmed.startsWith('sk-ant-');
    case 'google':
      return trimmed.startsWith('AIza');
    case 'huggingface':
      return trimmed.startsWith('hf_');
    case 'groq':
      return trimmed.startsWith('gsk_');
    case 'openrouter':
      return trimmed.startsWith('sk-or-');
    case 'deepseek':
      return trimmed.startsWith('sk-');
    default:
      return trimmed.length >= 10;
  }
};
