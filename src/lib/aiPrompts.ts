/**
 * AI System Prompts for CustomTkinter Interface Generation
 * These prompts ensure consistent, accurate widget generation across providers
 */

export const AVAILABLE_WIDGETS = [
  'button', 'label', 'entry', 'passwordentry', 'textbox', 'checkbox', 'radiobutton',
  'switch', 'slider', 'progressbar', 'combobox', 'optionmenu',
  'segmentedbutton', 'frame', 'scrollableframe', 'tabview',
  'image_label', 'scrollbar',
  'statCard', 'table', 'menuItem', 'chart', 'datepicker', 'productCard', 'userProfile'
];

export const WIDGET_SCHEMA = `{
  "widgets": [
    {
      "id": "unique-string",
      "type": "one of the ALLOWED types below",
      "position": { "x": number, "y": number },
      "size": { "width": number, "height": number },
      "style": { ... },
      "properties": { ... },
      "parentId": "parent-frame-id or null",
      "parentSlot": "tab-name or null"
    }
  ],
  "canvasSettings": { "width": 800, "height": 600, "title": "Window Title" }
}`;

// Exact widget reference matching the canvas rendering engine
const WIDGET_REFERENCE = `
WIDGET REFERENCE — Use ONLY these types with ONLY these keys. Any other type or key will be IGNORED by the canvas.

CONTAINERS (can have children via parentId):
  frame — Panel container.
    style: {backgroundColor, borderRadius, borderColor, borderWidth, padding}
    default size: 300x200
  scrollableframe — Scrollable container.
    style: {backgroundColor, borderRadius}
    properties: {label_text:"optional header"}
    default size: 300x400
  tabview — Tabbed container. Children need parentSlot matching a tab name.
    style: {backgroundColor, borderRadius}
    properties: {tabs:["Tab 1","Tab 2"]}
    default size: 400x300

BASIC WIDGETS:
  label — Static text display.
    style: {backgroundColor, textColor, fontSize, fontFamily, borderRadius}
    properties: {text:"Label text", anchor:"center"|"w"|"e"}
    default size: 100x32
  button — Clickable button.
    style: {backgroundColor, textColor, borderRadius, fontSize, fontFamily, borderColor, borderWidth}
    properties: {text:"Button text"}
    default size: 120x40
  entry — Single-line text input.
    style: {backgroundColor, textColor, borderColor, borderWidth, borderRadius, fontSize}
    properties: {placeholder_text:"hint text"}
    default size: 200x40
  passwordentry — Password input with show/hide toggle.
    style: {backgroundColor, borderColor, borderWidth, borderRadius}
    properties: {placeholder_text:"Mot de passe"}
    default size: 240x40
  textbox — Multi-line text area.
    style: {backgroundColor, textColor, borderRadius, fontSize}
    default size: 240x120
  image_label — Image display (CTkLabel+CTkImage).
    style: {backgroundColor, borderRadius}
    properties: {text:"optional caption", image_path:""}
    default size: 200x200
  progressbar — Progress indicator.
    style: {backgroundColor, borderRadius}
    properties: {progress:70}
    default size: 200x20

INTERACTION WIDGETS:
  checkbox — Checkable box with label.
    style: {backgroundColor, textColor, borderColor, borderRadius}
    properties: {text:"Checkbox text"}
    default size: 120x24
  radiobutton — Radio option.
    style: {backgroundColor, textColor, borderColor}
    properties: {text:"Radio text"}
    default size: 120x24
  switch — Toggle switch.
    style: {backgroundColor, textColor}
    properties: {text:"Switch text"}
    default size: 100x24
  slider — Value slider.
    style: {backgroundColor, borderRadius}
    properties: {from_:0, to:100}
    default size: 200x20
  combobox — Editable dropdown.
    style: {backgroundColor, textColor, borderRadius}
    properties: {values:["Option 1","Option 2"]}
    default size: 200x40
  optionmenu — Fixed dropdown.
    style: {backgroundColor, textColor, borderRadius}
    properties: {values:["Option 1","Option 2"]}
    default size: 200x40
  segmentedbutton — Segmented control.
    style: {backgroundColor, textColor, borderRadius}
    properties: {values:["Seg 1","Seg 2","Seg 3"]}
    default size: 300x40

COMPOSITE WIDGETS:
  statCard — Statistics card.
    properties: {title:"Patients", value:"123", caption:"Ce mois", icon:"users", backgroundColor:"#hex", accentColor:"#hex"}
    default size: 260x140
  menuItem — Sidebar navigation button.
    properties: {text:"Dashboard", icon:"layoutDashboard", selected:true, fg_color:"#hex", text_color:"#hex"}
    default size: 220x48
  table — Data table.
    properties: {columns:[{id:"col1",label:"Nom",width:160}], rows:[["Alice","Active"]], headerBgColor:"#hex"}
    default size: 640x320
  chart — Graph widget.
    properties: {chartType:"line"|"bar"|"pie", title:"Ventes", data:[{label:"Lun",value:10}], lineColor:"#hex"}
    default size: 400x280
  productCard — Product display card.
    properties: {productName:"Produit", price:"10€", backgroundColor:"#hex"}
    default size: 180x200
  userProfile — User avatar card.
    properties: {userName:"Nom", userInfo:"email@test.com", backgroundColor:"transparent"}
    default size: 280x60
  datepicker — Date selector.
    properties: {date_pattern:"dd/mm/yyyy"}
    default size: 200x40

STRICT: Do NOT invent widget types. Do NOT use keys not listed above. Do NOT use HTML elements.`;

const DESIGN_RULES = `
DESIGN RULES (CRITICAL):
1. Choose a canvas size that fits the UI type. Set it in canvasSettings:
   - Login / Register / Simple form: 800x600
   - Dashboard / Admin panel: 1200x800
   - Settings / Profile page: 900x700
   - Mobile preview: 400x700
   - E-commerce / Product page: 1000x750
   FILL the ENTIRE canvas. No tiny widgets lost in a corner.
2. ALWAYS start with large frame containers that divide the canvas into regions.
   Frames MUST be big: sidebars ~20-30% width, headers ~60px tall, content panels fill remaining space.
3. Child widgets go INSIDE frames via parentId. Position is RELATIVE to parent frame origin.
4. Every frame MUST have a backgroundColor. Use professional colors:
   Dark: #1A1A2E, #0F3460, #1B5E5E, #2D3436, #0B4F3A
   Light: #FFFFFF, #F5F5F5, #F0F4F8
   Accents: #1A5C5C, #6C63FF, #4361EE, #E94560
5. Sizing: titles fontSize 24-32, buttons 200-300 wide × 42-48 tall, entries 250-320 wide × 38-42 tall.
6. Spacing: 15-25px vertical gap between widgets. Center content horizontally in frames.
7. Make it look like a REAL professional desktop application.`;

const QUALITY_RUBRIC = `
QUALITY RUBRIC (MANDATORY BEFORE OUTPUT):
- Visual hierarchy: strong heading/subheading/body/action hierarchy.
- Legibility: avoid tiny components; text should remain readable at 100% zoom.
- Composition: no empty unusable zones and no crowded clusters.
- Anti-truncation: ensure labels/buttons/inputs are wide enough for their text.
- Alignment: keep clean left/right edges and consistent vertical rhythm.
- Professional finish: balanced contrast, coherent typography, polished spacing.`;

const EXAMPLE_LOGIN = `
EXAMPLE — "page de login" produces:
{"widgets":[
{"id":"left","type":"frame","position":{"x":0,"y":0},"size":{"width":480,"height":600},"style":{"backgroundColor":"#FFFFFF","padding":12},"properties":{},"parentId":null,"parentSlot":null},
{"id":"right","type":"frame","position":{"x":480,"y":0},"size":{"width":320,"height":600},"style":{"backgroundColor":"#0B4F3A"},"properties":{},"parentId":null,"parentSlot":null},
{"id":"t1","type":"label","position":{"x":90,"y":80},"size":{"width":300,"height":50},"style":{"fontSize":28,"textColor":"#1A1A2E"},"properties":{"text":"Se Connecter"},"parentId":"left","parentSlot":null},
{"id":"e1","type":"entry","position":{"x":90,"y":160},"size":{"width":300,"height":42},"style":{"borderRadius":10,"borderColor":"#E0E0E0","borderWidth":1},"properties":{"placeholder_text":"Email"},"parentId":"left","parentSlot":null},
{"id":"p1","type":"passwordentry","position":{"x":90,"y":220},"size":{"width":300,"height":42},"style":{"borderRadius":10,"borderColor":"#E0E0E0","borderWidth":1},"properties":{"placeholder_text":"Mot de passe"},"parentId":"left","parentSlot":null},
{"id":"c1","type":"checkbox","position":{"x":90,"y":275},"size":{"width":220,"height":24},"style":{"textColor":"#666666"},"properties":{"text":"Afficher le mot de passe"},"parentId":"left","parentSlot":null},
{"id":"b1","type":"button","position":{"x":90,"y":320},"size":{"width":300,"height":46},"style":{"backgroundColor":"#0B4F3A","textColor":"#FFFFFF","borderRadius":10,"fontSize":15},"properties":{"text":"Connexion"},"parentId":"left","parentSlot":null},
{"id":"l1","type":"label","position":{"x":90,"y":385},"size":{"width":300,"height":20},"style":{"fontSize":11,"textColor":"#999999"},"properties":{"text":"Pas de compte ? Inscrivez-vous","anchor":"center"},"parentId":"left","parentSlot":null},
{"id":"b2","type":"label","position":{"x":60,"y":250},"size":{"width":200,"height":40},"style":{"fontSize":24,"textColor":"#FFFFFF"},"properties":{"text":"NOTORIOUS"},"parentId":"right","parentSlot":null},
{"id":"b3","type":"label","position":{"x":30,"y":300},"size":{"width":260,"height":20},"style":{"fontSize":12,"textColor":"#AADECC"},"properties":{"text":"LA SANTÉ, NOTRE PRIORITÉ"},"parentId":"right","parentSlot":null}
],"canvasSettings":{"width":800,"height":600,"title":"Connexion"}}
Key points: frames cover full canvas, passwordentry for passwords, checkbox for toggle, all children use parentId, positions relative to parent.`;

// IMPORTANT: This system prompt is INVISIBLE to the user but CRITICAL for correct output
export const SYSTEM_PROMPT_TEXT = `You are the Notorious.PY CustomTkinter UI generator. You produce JSON for a visual canvas builder. Output ONLY valid JSON matching the schema below. No text, no markdown, no explanation — just the JSON object.

${WIDGET_REFERENCE}

JSON OUTPUT SCHEMA:
${WIDGET_SCHEMA}

IMPORTANT RULES:
- parentId links a child widget to its parent frame/container. Positions become RELATIVE to the parent frame.
- parentSlot is ONLY for tabview children — set it to the tab name (e.g. "Tab 1").
- All colors: valid hex codes (#RRGGBB). All sizes in pixels.
- NEVER overlap widgets. Ensure every widget has enough vertical/horizontal spacing to avoid collision.
- Text content in widgets (labels, buttons, etc.) MUST be in French unless the user specifies otherwise.
${DESIGN_RULES}
${QUALITY_RUBRIC}
${EXAMPLE_LOGIN}

OUTPUT: Pure JSON only. No text before or after the JSON. No explanation. No markdown.`;

// Enhanced image prompt with pixel-perfect reproduction requirements
export const SYSTEM_PROMPT_IMAGE = `You are the Notorious.PY CustomTkinter PIXEL-PERFECT reproduction AI. Your goal is to reproduce the provided image with 99.99% accuracy. Output ONLY valid JSON.

${WIDGET_REFERENCE}

JSON OUTPUT SCHEMA:
${WIDGET_SCHEMA}

PIXEL-PERFECT REPRODUCTION PROCESS (follow EXACTLY):

STEP 1 — ANALYZE THE IMAGE METICULOUSLY:
- Measure the EXACT proportions of the image (aspect ratio, total width vs height).
- Identify EVERY visible region: header, sidebar, content area, footer, cards, modals, etc.
- Note the EXACT background colors of each region. Extract hex codes precisely (#RRGGBB).
- Count and catalog EVERY visible UI element: buttons, labels, inputs, icons, images, etc.

STEP 2 — COLOR EXTRACTION (CRITICAL):
- Extract the EXACT hex color codes from the image for: backgrounds, text, borders, accents, shadows.
- Do NOT approximate colors. If a background looks like dark blue, determine the EXACT shade (#0F3460 vs #1A1A2E vs #162447).
- Maintain the EXACT color contrast ratios visible in the image.
- For gradients, use the dominant color as backgroundColor.

STEP 3 — TYPOGRAPHY REPRODUCTION (CRITICAL):
- Match font sizes EXACTLY as they appear proportionally in the image.
- Title/heading text: typically fontSize 24-36. Body text: 12-16. Small/caption: 10-12.
- Match font weight: use fontWeight "bold" for headings and emphasized text.
- Preserve text alignment (left, center, right) exactly as shown.
- Reproduce ALL visible text content character-by-character.

STEP 4 — LAYOUT PRECISION (CRITICAL):
- Start with frame containers that EXACTLY match the layout regions in the image.
- Frames must cover the FULL canvas area — no empty gaps between frames.
- Measure the EXACT proportional width/height of each region relative to the total canvas.
- Example: if a sidebar is ~25% of total width on a 1200px canvas → sidebar width = 300px.
- Preserve the EXACT spacing (padding, margins, gaps) between elements.
- Child widget positions must be RELATIVE to their parent frame and EXACTLY match the image layout.

STEP 5 — ELEMENT-BY-ELEMENT REPRODUCTION:
- For EACH visible element in the image, create the corresponding widget.
- Match the EXACT size, position, color, border radius, and text of each element.
- Buttons: match exact width, height, backgroundColor, textColor, borderRadius, text.
- Inputs/entries: match exact dimensions, placeholder text, border styling.
- Labels: match exact font size, color, position, and content.
- Cards/containers: match exact padding, border radius, background color, shadow appearance.

STEP 6 — FINAL VALIDATION:
- Verify EVERY element from the image has a corresponding widget in the JSON.
- Verify NO element overlaps another.
- Verify the overall composition matches the image proportions.
- Verify all colors are exact hex codes, not approximations.
- Set canvasSettings width/height to best match the image's aspect ratio.

ACCURACY REQUIREMENTS:
- Color accuracy: EXACT hex codes matching the image (no generic approximations)
- Position accuracy: within 5px of proportional placement
- Size accuracy: within 5px of proportional dimensions
- Text accuracy: 100% character-for-character match of visible text
- Layout accuracy: identical visual hierarchy and spacing ratios
- Text content MUST be in French unless the image shows another language.

${DESIGN_RULES}
${QUALITY_RUBRIC}

OUTPUT: Pure JSON only. No text before or after the JSON. No explanation. No markdown.`;

// Iterative AI prompt: modify existing UI based on user instructions
export const SYSTEM_PROMPT_ITERATE = `You are the Notorious.PY CustomTkinter AI in MODIFICATION MODE.
You receive CURRENT canvas widgets as JSON + a user instruction. Apply changes, return the COMPLETE updated widget array.

RULES:
1. PRESERVE existing widget IDs you are not removing.
2. ADD new widgets with unique IDs like "ai-added-1".
3. REMOVE widgets by excluding them.
4. Return the FULL array (modified + unmodified).
5. Positions relative to parentId frame. Colors: hex #RRGGBB.
6. NEVER overlap widgets. Ensure enough spacing between all elements.
7. Text content MUST be in French unless the user specifies otherwise.

${WIDGET_REFERENCE}

JSON OUTPUT SCHEMA:
${WIDGET_SCHEMA}
${DESIGN_RULES}
${QUALITY_RUBRIC}

OUTPUT: Pure JSON only. No text before or after the JSON. No explanation. No markdown.`;

/**
 * Serializes current widgets to a compact JSON representation for the AI context.
 * Strips unnecessary fields to reduce token usage.
 */
export function serializeWidgetsForAI(widgets: any[]): string {
  const compact = widgets.map(w => ({
    id: w.id,
    type: w.type,
    position: w.position,
    size: w.size,
    style: w.style || {},
    properties: w.properties || {},
    parentId: w.parentId || null,
    parentSlot: w.parentSlot || null,
  }));
  return JSON.stringify(compact, null, 2);
}

// ══════════════════════════════════════════════════════════════
// PROVIDER & MODEL SYSTEM
// ══════════════════════════════════════════════════════════════

export type AIProvider = 'openrouter' | 'groq' | 'huggingface' | 'google' | 'openai' | 'anthropic' | 'deepseek';

export interface AIModel {
  id: string;
  name: string;
  supportsVision: boolean;
  provider: AIProvider;
  free?: boolean;
}

// Keep legacy alias for compatibility
export type OpenRouterModel = AIModel;

export interface ProviderConfig {
  endpoint: string;
  authHeader: (key: string) => Record<string, string>;
  label: string;
  keyPrefix: string;
  keyUrl: string;
  color: string;
  free?: boolean;
  apiFormat: 'openai' | 'anthropic';
  maxTokens: number;
}

// ── GRATUIT : OpenRouter (modèles gratuits uniquement) ──────
export const OPENROUTER_MODELS: AIModel[] = [
  { id: 'openrouter/free', name: 'Auto (Gratuit)', supportsVision: true, provider: 'openrouter', free: true },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', supportsVision: false, provider: 'openrouter', free: true },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 Vision', supportsVision: true, provider: 'openrouter', free: true },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', supportsVision: false, provider: 'openrouter', free: true },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', supportsVision: false, provider: 'openrouter', free: true },
];

// ── GRATUIT : Groq (tous gratuits) ──────────────────────────
export const GROQ_MODELS: AIModel[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', supportsVision: false, provider: 'groq', free: true },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', supportsVision: false, provider: 'groq', free: true },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', supportsVision: false, provider: 'groq', free: true },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', supportsVision: false, provider: 'groq', free: true },
];

// ── GRATUIT : Hugging Face Inference ────────────────────────
export const HUGGINGFACE_MODELS: AIModel[] = [
  { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', supportsVision: false, provider: 'huggingface', free: true },
  { id: 'mistralai/Mistral-Nemo-Instruct-2407', name: 'Mistral Nemo 12B', supportsVision: false, provider: 'huggingface', free: true },
  { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', supportsVision: false, provider: 'huggingface', free: true },
  { id: 'microsoft/Phi-3.5-mini-instruct', name: 'Phi-3.5 Mini', supportsVision: false, provider: 'huggingface', free: true },
];

// ── PREMIUM : Google Gemini (API directe) ───────────────────
export const GOOGLE_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', supportsVision: true, provider: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', supportsVision: true, provider: 'google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', supportsVision: true, provider: 'google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', supportsVision: true, provider: 'google' },
];

// ── PREMIUM : OpenAI (API directe) ─────────────────────────
export const OPENAI_MODELS: AIModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', supportsVision: true, provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsVision: true, provider: 'openai' },
  { id: 'o3-mini', name: 'o3 Mini', supportsVision: false, provider: 'openai' },
];

// ── PREMIUM : Anthropic Claude (API directe) ────────────────
export const ANTHROPIC_MODELS: AIModel[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', supportsVision: true, provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', supportsVision: true, provider: 'anthropic' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', supportsVision: true, provider: 'anthropic' },
];

// ── PREMIUM : DeepSeek (API directe) ────────────────────────
export const DEEPSEEK_MODELS: AIModel[] = [
  { id: 'deepseek-chat', name: 'DeepSeek V3', supportsVision: false, provider: 'deepseek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', supportsVision: false, provider: 'deepseek' },
];

/** All models across all providers */
export const ALL_MODELS: AIModel[] = [
  ...OPENROUTER_MODELS, ...GROQ_MODELS, ...HUGGINGFACE_MODELS,
  ...GOOGLE_MODELS, ...OPENAI_MODELS, ...ANTHROPIC_MODELS, ...DEEPSEEK_MODELS,
];

/** Models grouped by provider */
export const MODELS_BY_PROVIDER: Record<AIProvider, AIModel[]> = {
  openrouter: OPENROUTER_MODELS,
  groq: GROQ_MODELS,
  huggingface: HUGGINGFACE_MODELS,
  google: GOOGLE_MODELS,
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  deepseek: DEEPSEEK_MODELS,
};

/** Provider tiers for UI grouping */
export const FREE_PROVIDERS: AIProvider[] = ['openrouter', 'groq', 'huggingface'];
export const PREMIUM_PROVIDERS: AIProvider[] = ['google', 'openai', 'anthropic', 'deepseek'];
export const ALL_PROVIDERS: AIProvider[] = [...FREE_PROVIDERS, ...PREMIUM_PROVIDERS];

/** Unified provider configuration */
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    authHeader: (key: string) => ({
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'Notorious.PY',
    }),
    label: 'OpenRouter',
    keyPrefix: 'sk-or-...',
    keyUrl: 'https://openrouter.ai/keys',
    color: 'indigo',
    free: true,
    apiFormat: 'openai',
    maxTokens: 8192,
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
    label: 'Groq',
    keyPrefix: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
    color: 'emerald',
    free: true,
    apiFormat: 'openai',
    maxTokens: 4096,
  },
  google: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
    label: 'Google',
    keyPrefix: 'AIza...',
    keyUrl: 'https://aistudio.google.com/apikey',
    color: 'blue',
    apiFormat: 'openai',
    maxTokens: 8192,
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
    label: 'OpenAI',
    keyPrefix: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    color: 'green',
    apiFormat: 'openai',
    maxTokens: 16384,
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    authHeader: (key: string) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
    label: 'Anthropic',
    keyPrefix: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    color: 'orange',
    apiFormat: 'anthropic',
    maxTokens: 8192,
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/chat/completions',
    authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
    label: 'DeepSeek',
    keyPrefix: 'sk-...',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    color: 'violet',
    apiFormat: 'openai',
    maxTokens: 8192,
  },
  huggingface: {
    endpoint: 'https://router.huggingface.co/v1/chat/completions',
    authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
    label: 'Hugging Face',
    keyPrefix: 'hf_... (token)',
    keyUrl: 'https://huggingface.co/settings/tokens',
    color: 'amber',
    free: true,
    apiFormat: 'openai',
    maxTokens: 2048,
  },
};

/** Returns the config for a given provider */
export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
}
