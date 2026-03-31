import { useState, useRef } from 'react';
import { WidgetData, CanvasSettings } from '@/types/widget';
import {
    SYSTEM_PROMPT_TEXT,
    SYSTEM_PROMPT_IMAGE,
    SYSTEM_PROMPT_ITERATE,
    serializeWidgetsForAI,
    getProviderConfig,
    ALL_MODELS,
    type AIProvider,
    type ProviderConfig,
} from '@/lib/aiPrompts';

export interface ContextFile {
    name: string;
    content: string;
}

export interface GenerationQualityCheck {
    id: 'bounds' | 'collisions' | 'readability' | 'contrast' | 'truncation' | 'duplicates';
    label: string;
    issueCount: number;
    fixedCount: number;
    status: 'passed' | 'fixed' | 'failed';
    detail: string;
}

export interface GenerationQualitySummary {
    score: number;
    hasBlockingIssues: boolean;
    remainingIssues: number;
    notes: string[];
}

export interface GenerationQualityGate {
    status: 'passed' | 'failed';
    minScore: number;
    reason?: string;
}

interface AIGenerationResult {
    widgets: WidgetData[];
    canvasSettings?: Partial<CanvasSettings>;
    qualityChecks?: GenerationQualityCheck[];
    qualitySummary?: GenerationQualitySummary;
    qualityGate?: GenerationQualityGate;
    selfHealApplied?: boolean;
}

interface UseAIGenerationReturn {
    isGenerating: boolean;
    error: string | null;
    retryCount: number;
    generateFromPrompt: (apiKey: string, prompt: string, modelId: string, contextFiles?: ContextFile[]) => Promise<AIGenerationResult | null>;
    generateFromImage: (apiKey: string, imageBase64: string, additionalPrompt: string | undefined, modelId: string, contextFiles?: ContextFile[]) => Promise<AIGenerationResult | null>;
    generateIteration: (apiKey: string, prompt: string, currentWidgets: WidgetData[], modelId: string, contextFiles?: ContextFile[]) => Promise<AIGenerationResult | null>;
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

const MAX_RETRY_ATTEMPTS = 3;
const QUALITY_GATE_MIN_SCORE = 85;
const RETRYABLE_ERROR_CODES = new Set<AIErrorCode>([
    'NETWORK',
    'TIMEOUT',
    'RATE_LIMIT',
    'SERVER_ERROR',
    'EMPTY_CONTENT',
]);

const devDebug = (...args: unknown[]) => {
    if (!import.meta.env.DEV) return;
    console.warn('[AI Debug]', ...args);
};

const withErrorCode = (code: AIErrorCode, message: string): string => `${code}:${message}`;

const splitErrorCode = (rawMessage: string): { code: AIErrorCode; message: string } => {
    const separator = rawMessage.indexOf(':');
    if (separator <= 0) return { code: 'UNKNOWN', message: rawMessage };
    const code = rawMessage.slice(0, separator).trim().toUpperCase() as AIErrorCode;
    const message = rawMessage.slice(separator + 1).trim() || rawMessage;
    return { code: (Object.values<string>([
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
    ]).includes(code) ? code : 'UNKNOWN') as AIErrorCode, message };
};

const normalizeHuggingFaceModel = (provider: AIProvider, model: string): string => {
    if (provider !== 'huggingface') return model;
    return model.includes(':') ? model : `${model}:hf-inference`;
};

const shouldMarkPaidModel = (message: string): boolean => {
    return /(payment|paid|billing|subscription|required|premium)/i.test(message);
};

const shouldMarkQuotaExceeded = (message: string): boolean => {
    return /(quota|credit|insufficient|exceeded|limit reached|balance|tokens? exhausted)/i.test(message);
};

const buildQualityGate = (summary: GenerationQualitySummary): GenerationQualityGate => {
    if (summary.hasBlockingIssues) {
        return {
            status: 'failed',
            minScore: QUALITY_GATE_MIN_SCORE,
            reason: `Issues structurelles detectees (${summary.remainingIssues} restante(s)).`,
        };
    }

    if (summary.score < QUALITY_GATE_MIN_SCORE) {
        return {
            status: 'failed',
            minScore: QUALITY_GATE_MIN_SCORE,
            reason: `Score qualite ${summary.score}% inferieur au seuil ${QUALITY_GATE_MIN_SCORE}%.`,
        };
    }

    return {
        status: 'passed',
        minScore: QUALITY_GATE_MIN_SCORE,
    };
};

const formatErrorForUi = (rawMessage: string): string => {
    const { code, message } = splitErrorCode(rawMessage);
    switch (code) {
        case 'INVALID_KEY':
            return withErrorCode(code, message || 'Acces invalide. Verifiez votre cle API ou token.');
        case 'QUOTA_EXCEEDED':
            return withErrorCode(code, message || 'Credits/tokens epuises. Choisissez un autre modele.');
        case 'PAID_MODEL':
            return withErrorCode(code, message || 'Modele payant indisponible. Choisissez un autre modele.');
        case 'RATE_LIMIT':
            return withErrorCode(code, message || 'Limite de requetes atteinte. Nouvelle tentative en cours.');
        case 'NETWORK':
            return withErrorCode(code, message || 'Erreur reseau. Verifiez votre connexion.');
        case 'TIMEOUT':
            return withErrorCode(code, message || 'Delai depasse. Reessayez.');
        case 'SERVER_ERROR':
            return withErrorCode(code, message || 'Erreur serveur temporaire.');
        case 'MODEL_UNAVAILABLE':
            return withErrorCode(code, message || 'Modele indisponible.');
        case 'EMPTY_CONTENT':
            return withErrorCode(code, message || 'Le modele a renvoye une reponse vide.');
        case 'JSON_INVALID':
            return withErrorCode(code, message || 'Le JSON renvoye est invalide.');
        default:
            return withErrorCode('UNKNOWN', message || 'Erreur IA inconnue.');
    }
};

export const useAIGeneration = (): UseAIGenerationReturn => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    /**
     * Converts AI-generated relative positions (relative to parent frame)
     * into absolute canvas coordinates that the rendering engine expects.
     * The canvas stores all positions as absolute (x,y from canvas origin).
     * The rendering engine then subtracts parentBounds to get the visual offset.
     */
    const convertRelativeToAbsolute = (widgets: any[]): any[] => {
        const widgetMap = new Map<string, any>();
        const result: any[] = [];

        // Deep-copy widgets and build lookup map
        for (const w of widgets) {
            const copy = {
                ...w,
                position: { ...w.position },
                size: { ...w.size },
                style: { ...w.style },
                properties: { ...w.properties },
            };
            widgetMap.set(copy.id, copy);
            result.push(copy);
        }

        // Convert in depth-order (parents before children)
        const processed = new Set<string>();

        function process(widget: any) {
            if (processed.has(widget.id)) return;
            processed.add(widget.id);

            if (widget.parentId) {
                const parent = widgetMap.get(widget.parentId);
                if (parent) {
                    // Ensure parent is processed first (for nested frames)
                    process(parent);

                    // Compute content offset (padding + header if applicable)
                    const padding = typeof parent.style?.padding === 'number' ? parent.style.padding : 12;
                    let offsetY = padding;
                    if (parent.type === 'tabview') offsetY += 40;
                    if (parent.type === 'scrollableframe' && parent.properties?.label_text) offsetY += 28;

                    // Convert: absolute = parent.absolute + padding + relative
                    widget.position.x = parent.position.x + padding + widget.position.x;
                    widget.position.y = parent.position.y + offsetY + widget.position.y;
                }
            }
        }

        for (const w of result) {
            process(w);
        }

        devDebug('Converted relative positions to absolute for', result.filter(w => w.parentId).length, 'child widgets');
        return result;
    };

    /**
     * Validates and sanitizes AI-generated widgets:
     * - Filters out invalid widget types
     * - Clamps positions/sizes to reasonable values
     * - Fixes invalid hex colors
     * - Removes orphan parentId references
     */
    const validateWidgets = (widgets: any[]): any[] => {
        const validTypes = new Set([
            'button', 'label', 'entry', 'passwordentry', 'textbox', 'checkbox', 'radiobutton',
            'switch', 'slider', 'progressbar', 'combobox', 'optionmenu',
            'segmentedbutton', 'frame', 'scrollableframe', 'tabview',
            'image_label', 'scrollbar',
            'statCard', 'table', 'menuItem', 'chart', 'datepicker', 'productCard', 'userProfile',
        ]);

        const widgetIds = new Set(widgets.map(w => w.id));
        const hexRegex = /^#[0-9a-fA-F]{3,8}$/;

        const fixColor = (val: any): string | undefined => {
            if (typeof val !== 'string') return undefined;
            if (val === 'transparent') return val;
            if (hexRegex.test(val)) return val;
            // Try adding # prefix
            if (/^[0-9a-fA-F]{6}$/.test(val)) return `#${val}`;
            return undefined;
        };

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

        let filtered = widgets.filter(w => {
            if (!validTypes.has(w.type)) {
                console.warn(`[AI-Validate] Removed invalid widget type: "${w.type}" (id: ${w.id})`);
                return false;
            }
            return true;
        });

        filtered = filtered.map(w => {
            // Clamp position and size
            const position = {
                x: clamp(Number(w.position?.x) || 0, 0, 4000),
                y: clamp(Number(w.position?.y) || 0, 0, 4000),
            };
            const size = {
                width: clamp(Number(w.size?.width) || 100, 10, 3000),
                height: clamp(Number(w.size?.height) || 40, 10, 3000),
            };

            // Fix parentId referencing non-existent widget
            let parentId = w.parentId || null;
            if (parentId && !widgetIds.has(parentId)) {
                console.warn(`[AI-Validate] Removed orphan parentId "${parentId}" from widget ${w.id}`);
                parentId = null;
            }

            // Sanitize style colors
            const style = { ...(w.style || {}) };
            for (const key of ['backgroundColor', 'textColor', 'borderColor', 'hoverColor']) {
                if (style[key] && style[key] !== 'transparent') {
                    const fixed = fixColor(style[key]);
                    if (!fixed) {
                        delete style[key];
                    } else {
                        style[key] = fixed;
                    }
                }
            }

            return { ...w, position, size, style, parentId };
        });

        if (filtered.length < widgets.length) {
            devDebug(`${widgets.length - filtered.length} widget(s) supprimé(s) (types invalides)`);
        }

        return filtered;
    };

    const parseHexColor = (value: unknown): { r: number; g: number; b: number } | null => {
        if (typeof value !== 'string') return null;
        const raw = value.trim();
        if (!raw || raw === 'transparent') return null;
        const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
        if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(normalized)) return null;
        const full = normalized.length === 3
            ? normalized.split('').map((c) => `${c}${c}`).join('')
            : normalized;
        return {
            r: Number.parseInt(full.slice(0, 2), 16),
            g: Number.parseInt(full.slice(2, 4), 16),
            b: Number.parseInt(full.slice(4, 6), 16),
        };
    };

    const channelToLinear = (channel: number) => {
        const v = channel / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };

    const contrastRatio = (fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }) => {
        const luminance = (rgb: { r: number; g: number; b: number }) =>
            0.2126 * channelToLinear(rgb.r) + 0.7152 * channelToLinear(rgb.g) + 0.0722 * channelToLinear(rgb.b);
        const l1 = luminance(fg);
        const l2 = luminance(bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    };

    const estimateTextWidth = (text: string, fontSize: number) => {
        return Math.ceil(text.length * Math.max(8, fontSize) * 0.56) + 20;
    };

    const getWidgetText = (widget: any): string => {
        const props = widget.properties || {};
        return String(
            props.text ||
            props.placeholder_text ||
            props.title ||
            props.value ||
            props.caption ||
            ''
        ).trim();
    };

    const getWidgetMinSize = (widget: any): { width: number; height: number } => {
        switch (widget.type) {
            case 'label':
                return { width: 60, height: 24 };
            case 'button':
            case 'entry':
            case 'passwordentry':
            case 'combobox':
            case 'optionmenu':
            case 'segmentedbutton':
                return { width: 110, height: 34 };
            case 'checkbox':
            case 'radiobutton':
            case 'switch':
                return { width: 90, height: 22 };
            case 'progressbar':
            case 'slider':
                return { width: 120, height: 18 };
            default:
                return { width: 36, height: 20 };
        }
    };

    const overlaps = (a: any, b: any, padding = 2): boolean => {
        const ax1 = Number(a.position?.x) - padding;
        const ay1 = Number(a.position?.y) - padding;
        const ax2 = ax1 + Number(a.size?.width) + padding * 2;
        const ay2 = ay1 + Number(a.size?.height) + padding * 2;
        const bx1 = Number(b.position?.x) - padding;
        const by1 = Number(b.position?.y) - padding;
        const bx2 = bx1 + Number(b.size?.width) + padding * 2;
        const by2 = by1 + Number(b.size?.height) + padding * 2;
        return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
    };

    const runQualityPass = (
        widgets: any[],
        canvasSettings?: Partial<CanvasSettings>
    ): { widgets: any[]; checks: GenerationQualityCheck[]; summary: GenerationQualitySummary; selfHealApplied: boolean } => {
        const canvasWidth = Math.max(360, Number(canvasSettings?.width) || 800);
        const canvasHeight = Math.max(360, Number(canvasSettings?.height) || 600);
        const fixed = widgets.map((widget) => ({
            ...widget,
            position: { ...(widget.position || {}) },
            size: { ...(widget.size || {}) },
            style: { ...(widget.style || {}) },
            properties: { ...(widget.properties || {}) },
        }));

        let boundsIssues = 0;
        let boundsFixed = 0;
        let readabilityIssues = 0;
        let readabilityFixed = 0;
        let truncationIssues = 0;
        let truncationFixed = 0;
        let contrastIssues = 0;
        let contrastFixed = 0;
        let collisionIssues = 0;
        let collisionFixed = 0;
        let duplicateIssues = 0;
        let duplicateFixed = 0;

        for (const widget of fixed) {
            widget.position.x = Number.isFinite(widget.position.x) ? widget.position.x : 0;
            widget.position.y = Number.isFinite(widget.position.y) ? widget.position.y : 0;
            widget.size.width = Number.isFinite(widget.size.width) ? widget.size.width : 120;
            widget.size.height = Number.isFinite(widget.size.height) ? widget.size.height : 40;

            const minSize = getWidgetMinSize(widget);
            if (widget.size.width < minSize.width) {
                readabilityIssues += 1;
                widget.size.width = minSize.width;
                readabilityFixed += 1;
            }
            if (widget.size.height < minSize.height) {
                readabilityIssues += 1;
                widget.size.height = minSize.height;
                readabilityFixed += 1;
            }

            const text = getWidgetText(widget);
            const fontSize = Number(widget.style?.fontSize) || 14;
            if (text) {
                const required = estimateTextWidth(text, fontSize);
                if (required > widget.size.width) {
                    truncationIssues += 1;
                    const maxAllowed = Math.max(40, canvasWidth - widget.position.x - 8);
                    const nextWidth = Math.min(required, maxAllowed);
                    if (nextWidth > widget.size.width) {
                        widget.size.width = nextWidth;
                        truncationFixed += 1;
                    }
                }
            }

            const fg = parseHexColor(widget.style?.textColor);
            const bg = parseHexColor(widget.style?.backgroundColor) || parseHexColor('#FFFFFF');
            if (fg && bg) {
                const ratio = contrastRatio(fg, bg);
                if (ratio < 4.5) {
                    contrastIssues += 1;
                    const white = parseHexColor('#FFFFFF')!;
                    const dark = parseHexColor('#0F172A')!;
                    const whiteRatio = contrastRatio(white, bg);
                    const darkRatio = contrastRatio(dark, bg);
                    widget.style.textColor = whiteRatio >= darkRatio ? '#FFFFFF' : '#0F172A';
                    contrastFixed += 1;
                }
            }

            const maxX = Math.max(0, canvasWidth - widget.size.width);
            const maxY = Math.max(0, canvasHeight - widget.size.height);
            if (widget.position.x < 0 || widget.position.y < 0 || widget.position.x > maxX || widget.position.y > maxY) {
                boundsIssues += 1;
                widget.position.x = Math.max(0, Math.min(widget.position.x, maxX));
                widget.position.y = Math.max(0, Math.min(widget.position.y, maxY));
                boundsFixed += 1;
            }
        }

        // Remove near-duplicate widgets often produced by repetitive generation loops.
        const duplicateIds = new Set<string>();
        for (let i = 0; i < fixed.length; i += 1) {
            if (duplicateIds.has(fixed[i].id)) continue;
            for (let j = i + 1; j < fixed.length; j += 1) {
                if (duplicateIds.has(fixed[j].id)) continue;
                const a = fixed[i];
                const b = fixed[j];
                if ((a.parentId || null) !== (b.parentId || null)) continue;
                if (a.type !== b.type) continue;

                const textA = getWidgetText(a).toLowerCase();
                const textB = getWidgetText(b).toLowerCase();
                const sameText = textA === textB;
                const sameSize = Math.abs(a.size.width - b.size.width) <= 8 && Math.abs(a.size.height - b.size.height) <= 8;
                const closePosition = Math.abs(a.position.x - b.position.x) <= 10 && Math.abs(a.position.y - b.position.y) <= 10;

                if (sameText && sameSize && closePosition) {
                    duplicateIssues += 1;
                    duplicateIds.add(b.id);
                }
            }
        }

        if (duplicateIds.size > 0) {
            duplicateFixed = duplicateIds.size;
        }

        const deduped = fixed.filter((widget) => !duplicateIds.has(widget.id));

        const groups = new Map<string, any[]>();
        for (const widget of deduped) {
            const groupKey = widget.parentId ? `parent:${widget.parentId}` : 'root';
            const group = groups.get(groupKey) || [];
            group.push(widget);
            groups.set(groupKey, group);
        }

        for (const group of groups.values()) {
            const sorted = [...group].sort((a, b) => {
                const dy = Number(a.position.y) - Number(b.position.y);
                if (dy !== 0) return dy;
                return Number(a.position.x) - Number(b.position.x);
            });
            for (let i = 0; i < sorted.length; i += 1) {
                for (let j = 0; j < i; j += 1) {
                    if (!overlaps(sorted[i], sorted[j], 4)) continue;
                    collisionIssues += 1;
                    sorted[i].position.y = sorted[j].position.y + sorted[j].size.height + 12;
                    const maxY = Math.max(0, canvasHeight - sorted[i].size.height);
                    sorted[i].position.y = Math.min(maxY, sorted[i].position.y);
                    collisionFixed += 1;
                }
            }
        }

        const toCheck = (
            id: GenerationQualityCheck['id'],
            label: string,
            issueCount: number,
            fixedCount: number,
            detailBase: string
        ): GenerationQualityCheck => {
            const remaining = Math.max(0, issueCount - fixedCount);
            return {
                id,
                label,
                issueCount,
                fixedCount,
                status: issueCount === 0 ? 'passed' : remaining === 0 ? 'fixed' : 'failed',
                detail: issueCount === 0
                    ? `${detailBase}: OK`
                    : `${detailBase}: ${issueCount} probleme(s), ${fixedCount} corrige(s), ${remaining} restant(s)`,
            };
        };

        const checks: GenerationQualityCheck[] = [
            toCheck('duplicates', 'Doublons de layout', duplicateIssues, duplicateFixed, 'Controle deduplication widgets'),
            toCheck('bounds', 'Widgets hors canvas', boundsIssues, boundsFixed, 'Controle limites canvas'),
            toCheck('collisions', 'Collisions majeures', collisionIssues, collisionFixed, 'Controle chevauchements'),
            toCheck('readability', 'Lisibilite tailles', readabilityIssues, readabilityFixed, 'Controle tailles minimales'),
            toCheck('contrast', 'Contraste texte', contrastIssues, contrastFixed, 'Controle contraste'),
            toCheck('truncation', 'Texte tronque probable', truncationIssues, truncationFixed, 'Controle largeur texte'),
        ];

        const totalIssues = checks.reduce((sum, check) => sum + check.issueCount, 0);
        const totalFixed = checks.reduce((sum, check) => sum + check.fixedCount, 0);
        const remainingIssues = Math.max(0, totalIssues - totalFixed);
        const score = Math.max(0, Math.min(100, 100 - remainingIssues * 14 - Math.max(0, totalIssues - totalFixed) * 4));
        const notes = checks
            .filter((check) => check.issueCount > 0)
            .map((check) => check.detail);

        return {
            widgets: deduped,
            checks,
            summary: {
                score,
                hasBlockingIssues: remainingIssues > 0,
                remainingIssues,
                notes,
            },
            selfHealApplied: totalFixed > 0,
        };
    };

    /**
     * Robustly extracts JSON from an AI response that may contain
     * surrounding text, markdown fences, or other formatting.
     */
    const parseAIResponse = (responseText: string, skipConversion = false): AIGenerationResult | null => {
        try {
            devDebug('Raw response length:', responseText.length);

            let jsonStr = '';

            // Strategy 1: Try markdown code blocks (```json ... ``` or ``` ... ```)
            const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
                devDebug('Extracted JSON from code block');
            }

            // Strategy 2: Find the outermost { ... } containing "widgets"
            if (!jsonStr || !jsonStr.includes('"widgets"')) {
                const firstBrace = responseText.indexOf('{');
                const lastBrace = responseText.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace > firstBrace) {
                    jsonStr = responseText.substring(firstBrace, lastBrace + 1);
                    devDebug('Extracted JSON from brace matching');
                }
            }

            // Strategy 3: Raw text as-is
            if (!jsonStr) {
                jsonStr = responseText.trim();
            }

            const parsed = JSON.parse(jsonStr);

            if (!parsed.widgets || !Array.isArray(parsed.widgets)) {
                // Some models wrap in an extra layer
                if (parsed.response?.widgets) {
                    return parseAIResponse(JSON.stringify(parsed.response), skipConversion);
                }
                throw new Error('Réponse IA invalide : tableau "widgets" manquant');
            }

            if (parsed.widgets.length === 0) {
                throw new Error('L\'IA a renvoyé 0 widgets. Reformulez votre prompt.');
            }

            const widgetsWithIds = parsed.widgets.map((w: any, index: number) => ({
                ...w,
                id: w.id || `ai-widget-${Date.now()}-${index}`,
                style: w.style || {},
                properties: w.properties || {},
            }));

            // Validate and sanitize widget data
            const validatedWidgets = validateWidgets(widgetsWithIds);

            if (validatedWidgets.length === 0) {
                throw new Error('Aucun widget valide après validation. Reformulez votre prompt.');
            }

            // Convert AI relative positions to absolute canvas coordinates
            // Skip in iterate mode: existing widgets are already absolute
            const finalWidgets = skipConversion ? validatedWidgets : convertRelativeToAbsolute(validatedWidgets);

            devDebug(`Parsed ${finalWidgets.length} widgets successfully (conversion: ${skipConversion ? 'skipped' : 'applied'})`);

            const quality = runQualityPass(finalWidgets, parsed.canvasSettings);
            const qualityGate = buildQualityGate(quality.summary);
            return {
                widgets: quality.widgets,
                canvasSettings: parsed.canvasSettings,
                qualityChecks: quality.checks,
                qualitySummary: quality.summary,
                qualityGate,
                selfHealApplied: quality.selfHealApplied,
            };
        } catch (e: any) {
            console.error('[AI] Parse error:', e.message);
            console.error('[AI] Response text (first 500 chars):', responseText.substring(0, 500));
            return null;
        }
    };

    const buildContextPrompt = (files: ContextFile[]): string => {
        if (!files || files.length === 0) return '';

        return `\n\nCONTEXT FILES:\nThe following files are provided as context from the user's project. You can use their structure or content as reference if requested.\n\n${files.map(f => `--- FILE: ${f.name} ---\n${f.content}\n--- END FILE ---\n`).join('\n')}`;
    };

    /**
     * Extracts text content from an API response, checking multiple
     * possible locations (content, reasoning, text, etc.)
     */
    const extractContent = (data: any): string | null => {
        // HuggingFace legacy format: [{generated_text: "..."}]
        if (Array.isArray(data) && data.length > 0 && data[0]?.generated_text) {
            return data[0].generated_text;
        }

        const choice = data?.choices?.[0];
        if (!choice) return null;

        // Standard: message.content
        if (choice.message?.content && typeof choice.message.content === 'string' && choice.message.content.trim()) {
            return choice.message.content;
        }

        // Some models put the answer in reasoning_content when content is null
        if (choice.message?.reasoning_content && typeof choice.message.reasoning_content === 'string') {
            return choice.message.reasoning_content;
        }

        // Older completion format: text field
        if (choice.text && typeof choice.text === 'string' && choice.text.trim()) {
            return choice.text;
        }

        // Some models use delta format even in non-streaming
        if (choice.delta?.content && typeof choice.delta.content === 'string') {
            return choice.delta.content;
        }

        return null;
    };

    /**
     * Extracts content from Anthropic's response format.
     * Anthropic returns { content: [{ type: 'text', text: '...' }] }
     */
    const extractAnthropicContent = (data: any): string | null => {
        if (data?.content && Array.isArray(data.content)) {
            const textBlock = data.content.find((b: any) => b.type === 'text');
            if (textBlock?.text) return textBlock.text;
        }
        return null;
    };

    /**
     * Unified provider call — resolves the correct endpoint, auth,
     * and API format based on the model's provider.
     * Supports OpenAI-compatible (OpenRouter, Groq, Google, OpenAI, DeepSeek)
     * and Anthropic's native format.
     */
    const callProvider = async (
        apiKey: string,
        model: string,
        messages: any[],
        signal?: AbortSignal
    ): Promise<string> => {
        const modelBase = model.split(':')[0];
        const modelDef = ALL_MODELS.find(m => m.id === model) || ALL_MODELS.find(m => m.id === modelBase);
        const provider: AIProvider = modelDef?.provider ?? 'openrouter';
        const config: ProviderConfig = getProviderConfig(provider);
        const providerName = config.label;
        const requestModel = normalizeHuggingFaceModel(provider, model);
        const credentialLabel = provider === 'huggingface' ? "token d'acces Hugging Face" : `cle API ${providerName}`;

        if (provider === 'huggingface' && !apiKey.trim().startsWith('hf_')) {
            throw new Error(withErrorCode('INVALID_KEY', "Token Hugging Face invalide. Utilisez un token 'hf_...'."));
        }

        devDebug(`Calling ${providerName} — model: ${requestModel}`);

        // Build request body based on API format
        let requestBody: string;

        if (config.apiFormat === 'anthropic') {
            // Anthropic: system prompt goes in 'system' field, not in messages
            const systemMsg = messages.find((m: any) => m.role === 'system');
            const userMessages = messages.filter((m: any) => m.role !== 'system');

            // Convert OpenAI vision format to Anthropic format
            const convertedMessages = userMessages.map((msg: any) => {
                if (Array.isArray(msg.content)) {
                    return {
                        ...msg,
                        content: msg.content.map((block: any) => {
                            if (block.type === 'image_url' && block.image_url?.url) {
                                // Extract base64 data and media type from data URI
                                const dataUri = block.image_url.url as string;
                                const match = dataUri.match(/^data:(image\/[^;]+);base64,(.+)$/);
                                if (match) {
                                    return {
                                        type: 'image',
                                        source: {
                                            type: 'base64',
                                            media_type: match[1],
                                            data: match[2],
                                        },
                                    };
                                }
                            }
                            return block;
                        }),
                    };
                }
                return msg;
            });

            requestBody = JSON.stringify({
                model: requestModel,
                max_tokens: config.maxTokens,
                system: systemMsg?.content || '',
                messages: convertedMessages,
                temperature: 0,
            });
        } else {
            // OpenAI-compatible format (OpenRouter, Groq, Google, OpenAI, DeepSeek)
            requestBody = JSON.stringify({
                model: requestModel,
                messages,
                max_tokens: config.maxTokens,
                temperature: 0,
            });
        }

        let response: Response;
        try {
            response = await fetch(config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...config.authHeader(apiKey),
                },
                body: requestBody,
                signal,
            });
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            console.error(`[AI] Network error:`, err);
            throw new Error(withErrorCode('NETWORK', `Impossible de contacter ${providerName}. Verifiez votre connexion.`));
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[AI] ${providerName} ${response.status}:`, JSON.stringify(errorData, null, 2));

            const apiMsg = String(errorData.error?.message || errorData.error?.code || errorData.message || '').trim();

            if (response.status === 401 || response.status === 403) {
                throw new Error(withErrorCode('INVALID_KEY', `${credentialLabel} invalide. Verifiez votre acces.`));
            }
            if (response.status === 402 || shouldMarkPaidModel(apiMsg)) {
                throw new Error(withErrorCode('PAID_MODEL', `Modele payant indisponible sur ${providerName}. Choisissez un autre modele.`));
            }
            if (shouldMarkQuotaExceeded(apiMsg)) {
                throw new Error(withErrorCode('QUOTA_EXCEEDED', `Credits/tokens epuises sur ${providerName}. Choisissez un autre modele.`));
            }
            if (response.status === 429) {
                throw new Error(withErrorCode('RATE_LIMIT', `Limite de requetes ${providerName} atteinte. Nouvelle tentative automatique.`));
            }
            if (response.status === 404 || response.status === 400) {
                throw new Error(withErrorCode('MODEL_UNAVAILABLE', `Modele "${requestModel}" indisponible sur ${providerName}. ${apiMsg}`.trim()));
            }
            if (response.status >= 500) {
                throw new Error(withErrorCode('SERVER_ERROR', `Erreur serveur ${providerName} (${response.status}).`));
            }

            throw new Error(withErrorCode('UNKNOWN', apiMsg || `Erreur ${providerName} (${response.status})`));
        }

        const data = await response.json();
        const actualModel = data.model || requestModel;
        devDebug(`Response OK — actual model: ${actualModel}`);

        // Extract content based on API format
        const content = config.apiFormat === 'anthropic'
            ? extractAnthropicContent(data)
            : extractContent(data);

        if (!content) {
            console.error('[AI] Empty content. Full response:', JSON.stringify(data, null, 2));
            throw new Error(withErrorCode('EMPTY_CONTENT', `${providerName} (${actualModel}) a renvoye une reponse vide.`));
        }

        return content;
    };

    const callWithRetry = async (
        apiKey: string,
        model: string,
        messages: any[],
        signal?: AbortSignal
    ): Promise<string> => {
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
            try {
                if (attempt > 1) setRetryCount(attempt - 1);
                return await callProvider(apiKey, model, messages, signal);
            } catch (attemptError: any) {
                if (attemptError.name === 'AbortError') throw attemptError;
                const { code, message } = splitErrorCode(attemptError.message || '');
                lastError = new Error(withErrorCode(code, message || attemptError.message || 'Erreur IA'));
                const isRetryable = RETRYABLE_ERROR_CODES.has(code);
                if (!isRetryable || attempt >= MAX_RETRY_ATTEMPTS) {
                    throw lastError;
                }
                const waitMs = Math.min(4000, 700 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
                await new Promise((resolve) => setTimeout(resolve, waitMs));
            }
        }
        throw lastError || new Error(withErrorCode('UNKNOWN', 'Erreur IA inconnue.'));
    };

    const generateFromPrompt = async (
        apiKey: string,
        prompt: string,
        modelId: string,
        contextFiles: ContextFile[] = []
    ): Promise<AIGenerationResult | null> => {
        setIsGenerating(true);
        setError(null);
        setRetryCount(0);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const contextPrompt = buildContextPrompt(contextFiles);
        const finalPrompt = prompt + contextPrompt;

        try {
            const responseText = await callWithRetry(apiKey, modelId, [
                { role: 'system', content: SYSTEM_PROMPT_TEXT },
                { role: 'user', content: finalPrompt },
            ], controller.signal);

            const result = parseAIResponse(responseText);
            if (!result) {
                throw new Error(withErrorCode('JSON_INVALID', "L'IA a repondu mais le format JSON est invalide."));
            }

            return result;
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(formatErrorForUi(e.message || ''));
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const generateFromImage = async (
        apiKey: string,
        imageBase64: string,
        additionalPrompt?: string,
        modelId: string = 'openai/gpt-4o',
        contextFiles: ContextFile[] = []
    ): Promise<AIGenerationResult | null> => {
        setIsGenerating(true);
        setError(null);
        setRetryCount(0);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const contextPrompt = buildContextPrompt(contextFiles);
        const userPrompt = (additionalPrompt
            ? `${additionalPrompt}\n\nPlease analyze this image and reproduce it exactly.`
            : 'Analyze this UI mockup and reproduce it exactly as CustomTkinter widgets.') + contextPrompt;

        try {
            const responseText = await callWithRetry(apiKey, modelId, [
                { role: 'system', content: SYSTEM_PROMPT_IMAGE },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        { type: 'image_url', image_url: { url: imageBase64 } },
                    ],
                },
            ], controller.signal);

            const result = parseAIResponse(responseText);
            if (!result) {
                throw new Error(withErrorCode('JSON_INVALID', "L'IA a repondu mais le format JSON est invalide."));
            }

            return result;
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(formatErrorForUi(e.message || ''));
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const generateIteration = async (
        apiKey: string,
        prompt: string,
        currentWidgets: WidgetData[],
        modelId: string,
        contextFiles: ContextFile[] = []
    ): Promise<AIGenerationResult | null> => {
        setIsGenerating(true);
        setError(null);
        setRetryCount(0);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const widgetsJson = serializeWidgetsForAI(currentWidgets);
        const contextPrompt = buildContextPrompt(contextFiles);
        const userMessage = `CURRENT CANVAS STATE (${currentWidgets.length} widgets):
${widgetsJson}

USER INSTRUCTION: ${prompt}${contextPrompt}`;

        try {
            const responseText = await callWithRetry(apiKey, modelId, [
                { role: 'system', content: SYSTEM_PROMPT_ITERATE },
                { role: 'user', content: userMessage },
            ], controller.signal);

            // skipConversion=true: iterate mode sends absolute coords, gets absolute back
            const result = parseAIResponse(responseText, true);
            if (!result) {
                throw new Error(withErrorCode('JSON_INVALID', "L'IA a repondu mais le format JSON est invalide."));
            }

            return result;
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(formatErrorForUi(e.message || ''));
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        error,
        retryCount,
        generateFromPrompt,
        generateFromImage,
        generateIteration,
    };
};
