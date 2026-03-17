import { useState, useCallback, useRef } from 'react';
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

interface AIGenerationResult {
    widgets: WidgetData[];
    canvasSettings?: Partial<CanvasSettings>;
}

interface UseAIGenerationReturn {
    isGenerating: boolean;
    error: string | null;
    retryCount: number;
    generateFromPrompt: (apiKey: string, prompt: string, modelId: string, contextFiles?: ContextFile[]) => Promise<AIGenerationResult | null>;
    generateFromImage: (apiKey: string, imageBase64: string, additionalPrompt: string | undefined, modelId: string, contextFiles?: ContextFile[]) => Promise<AIGenerationResult | null>;
    generateIteration: (apiKey: string, prompt: string, currentWidgets: WidgetData[], modelId: string, contextFiles?: ContextFile[]) => Promise<AIGenerationResult | null>;
}

// Reliable fallback models per provider (used for auto-retry)
const FALLBACK_MODELS: Record<AIProvider, string[]> = {
    openrouter: [
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemma-2-9b-it:free',
        'mistralai/mistral-7b-instruct:free',
    ],
    groq: [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
    ],
    google: ['gemini-2.0-flash', 'gemini-1.5-flash'],
    openai: ['gpt-4o-mini'],
    anthropic: ['claude-3-haiku-20240307'],
    deepseek: ['deepseek-chat'],
    huggingface: ['mistralai/Mistral-7B-Instruct-v0.3', 'microsoft/Phi-3-mini-4k-instruct'],
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

        console.log('[AI] Converted relative positions to absolute for', result.filter(w => w.parentId).length, 'child widgets');
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
            console.log(`[AI-Validate] ${widgets.length - filtered.length} widget(s) supprimé(s) (types invalides)`);
        }

        return filtered;
    };

    /**
     * Robustly extracts JSON from an AI response that may contain
     * surrounding text, markdown fences, or other formatting.
     */
    const parseAIResponse = (responseText: string, skipConversion = false): AIGenerationResult | null => {
        try {
            console.log('[AI] Raw response length:', responseText.length);

            let jsonStr = '';

            // Strategy 1: Try markdown code blocks (```json ... ``` or ``` ... ```)
            const codeBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
                console.log('[AI] Extracted JSON from code block');
            }

            // Strategy 2: Find the outermost { ... } containing "widgets"
            if (!jsonStr || !jsonStr.includes('"widgets"')) {
                const firstBrace = responseText.indexOf('{');
                const lastBrace = responseText.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace > firstBrace) {
                    jsonStr = responseText.substring(firstBrace, lastBrace + 1);
                    console.log('[AI] Extracted JSON from brace matching');
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

            console.log(`[AI] Parsed ${finalWidgets.length} widgets successfully (conversion: ${skipConversion ? 'skipped' : 'applied'})`);

            return {
                widgets: finalWidgets,
                canvasSettings: parsed.canvasSettings,
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
        const modelDef = ALL_MODELS.find(m => m.id === model);
        const provider: AIProvider = modelDef?.provider ?? 'openrouter';
        const config: ProviderConfig = getProviderConfig(provider);
        const providerName = config.label;

        console.log(`[AI] Calling ${providerName} — model: ${model}`);

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
                model,
                max_tokens: config.maxTokens,
                system: systemMsg?.content || '',
                messages: convertedMessages,
                temperature: 0,
            });
        } else {
            // OpenAI-compatible format (OpenRouter, Groq, Google, OpenAI, DeepSeek)
            requestBody = JSON.stringify({
                model,
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
            throw new Error(`Impossible de contacter ${providerName}. Vérifiez votre connexion.`);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[AI] ${providerName} ${response.status}:`, JSON.stringify(errorData, null, 2));

            const apiMsg = errorData.error?.message || errorData.error?.code || '';

            if (response.status === 401 || response.status === 403) {
                throw new Error(`Clé API ${providerName} invalide. Vérifiez votre clé.`);
            }
            if (response.status === 429) {
                throw new Error(`Limite de requêtes ${providerName} atteinte. Réessayez dans ~30s.`);
            }
            if (response.status === 404 || response.status === 400) {
                throw new Error(`MODEL_ERROR:Modèle "${model}" indisponible sur ${providerName}. ${apiMsg}`);
            }

            throw new Error(apiMsg || `Erreur ${providerName} (${response.status})`);
        }

        const data = await response.json();
        const actualModel = data.model || model;
        console.log(`[AI] Response OK — actual model: ${actualModel}`);

        // Extract content based on API format
        const content = config.apiFormat === 'anthropic'
            ? extractAnthropicContent(data)
            : extractContent(data);

        if (!content) {
            console.error('[AI] Empty content. Full response:', JSON.stringify(data, null, 2));
            throw new Error(`EMPTY_CONTENT:${providerName} (${actualModel}) a renvoyé une réponse vide.`);
        }

        return content;
    };

    /**
     * Calls the provider with automatic retry using fallback models
     * if the first attempt fails with a retryable error.
     */
    const callWithRetry = async (
        apiKey: string,
        model: string,
        messages: any[],
        signal?: AbortSignal
    ): Promise<string> => {
        const modelDef = ALL_MODELS.find(m => m.id === model);
        const provider: AIProvider = modelDef?.provider ?? 'openrouter';
        const fallbacks = FALLBACK_MODELS[provider].filter(m => m !== model);

        // First attempt with the requested model
        try {
            return await callProvider(apiKey, model, messages, signal);
        } catch (firstError: any) {
            if (firstError.name === 'AbortError') throw firstError;

            const isRetryable = firstError.message?.startsWith('EMPTY_CONTENT:')
                || firstError.message?.startsWith('MODEL_ERROR:');

            // Auth errors or non-retryable — fail immediately
            if (!isRetryable || fallbacks.length === 0) {
                // Clean up the prefix for display
                const cleanMsg = firstError.message
                    ?.replace('EMPTY_CONTENT:', '')
                    ?.replace('MODEL_ERROR:', '') || firstError.message;
                throw new Error(cleanMsg);
            }

            console.warn(`[AI] First attempt failed (${model}), trying fallbacks...`);

            // Try each fallback model
            for (const fallbackModel of fallbacks) {
                try {
                    console.log(`[AI] Retry with fallback: ${fallbackModel}`);
                    setRetryCount(prev => prev + 1);
                    return await callProvider(apiKey, fallbackModel, messages, signal);
                } catch (retryError: any) {
                    if (retryError.name === 'AbortError') throw retryError;
                    console.warn(`[AI] Fallback ${fallbackModel} also failed:`, retryError.message);
                    continue;
                }
            }

            // All fallbacks failed
            throw new Error(
                `Échec avec ${model} et ${fallbacks.length} modèle(s) de secours. ` +
                `Vérifiez votre clé API ou essayez plus tard.`
            );
        }
    };

    const generateFromPrompt = useCallback(async (
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
                throw new Error('L\'IA a répondu mais le format JSON est invalide. Réessayez ou changez de modèle.');
            }

            return result;
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(e.message);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateFromImage = useCallback(async (
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
                throw new Error('L\'IA a répondu mais le format JSON est invalide. Réessayez ou changez de modèle.');
            }

            return result;
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(e.message);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const generateIteration = useCallback(async (
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
                throw new Error('L\'IA a répondu mais le format JSON est invalide. Réessayez ou changez de modèle.');
            }

            return result;
        } catch (e: any) {
            if (e.name !== 'AbortError') setError(e.message);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        isGenerating,
        error,
        retryCount,
        generateFromPrompt,
        generateFromImage,
        generateIteration,
    };
};
