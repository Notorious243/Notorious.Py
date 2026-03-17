/**
 * Validation des propriétés CustomTkinter par type de widget.
 *
 * Ce module est la source unique de vérité utilisée à la fois par :
 *  - Le canvas (InteractiveWidget) pour afficher uniquement les propriétés supportées
 *  - Le moteur d'export Python (useExportPython) pour ne générer que du code valide
 *
 * Basé sur la documentation officielle CustomTkinter :
 * https://customtkinter.tomschimansky.com/documentation/widgets/
 */

/**
 * Propriétés de style autorisées par type de widget CustomTkinter.
 *
 * Clés possibles (correspondance style CSS → argument Python) :
 *  - fg_color       → backgroundColor
 *  - text_color     → textColor
 *  - border_color   → borderColor
 *  - border_width   → borderWidth
 *  - corner_radius  → borderRadius
 *  - font           → fontFamily / fontSize / fontWeight
 */
export const CTK_ALLOWED_STYLE_PARAMS: Record<string, Set<string>> = {
  // ── Widgets de base ──
  label:           new Set(['fg_color', 'text_color', 'corner_radius', 'font']),
  image_label:     new Set(['fg_color', 'text_color', 'corner_radius', 'font']),
  button:          new Set(['fg_color', 'text_color', 'border_color', 'border_width', 'corner_radius', 'font']),
  entry:           new Set(['fg_color', 'text_color', 'border_color', 'border_width', 'corner_radius', 'font']),
  passwordentry:   new Set(['fg_color', 'border_color', 'border_width', 'corner_radius']),
  textbox:         new Set(['fg_color', 'text_color', 'border_color', 'border_width', 'corner_radius', 'font']),

  // ── Widgets d'interaction ──
  checkbox:        new Set(['fg_color', 'text_color', 'border_color', 'border_width', 'corner_radius', 'font']),
  radiobutton:     new Set(['fg_color', 'text_color', 'border_color', 'corner_radius', 'font']),
  switch:          new Set(['fg_color', 'text_color', 'border_color', 'border_width', 'corner_radius', 'font']),
  combobox:        new Set(['fg_color', 'text_color', 'border_color', 'border_width', 'corner_radius', 'font']),
  optionmenu:      new Set(['fg_color', 'text_color', 'corner_radius', 'font']),
  segmentedbutton: new Set(['fg_color', 'text_color', 'border_width', 'corner_radius', 'font']),
  slider:          new Set(['fg_color', 'border_width', 'corner_radius']),
  progressbar:     new Set(['fg_color', 'border_color', 'border_width', 'corner_radius']),
  scrollbar:       new Set(['fg_color', 'corner_radius']),

  // ── Conteneurs ──
  frame:           new Set(['fg_color', 'border_color', 'border_width', 'corner_radius']),
  scrollableframe: new Set(['fg_color', 'border_color', 'border_width', 'corner_radius']),
  tabview:         new Set(['fg_color', 'border_color', 'border_width', 'corner_radius']),
};

/**
 * Vérifie si une propriété de style est supportée par un type de widget.
 */
export const isCtkStyleSupported = (widgetType: string, styleProp: string): boolean => {
  const allowed = CTK_ALLOWED_STYLE_PARAMS[widgetType];
  // Types inconnus (composites, etc.) : on autorise tout par défaut
  if (!allowed) return true;
  return allowed.has(styleProp);
};

/**
 * Retourne les valeurs effectives de border pour le rendu canvas.
 * Si le widget ne supporte pas border_color/border_width en CTk,
 * on retourne 0 / 'transparent' pour que le canvas reflète l'export.
 */
export const getCtkBorderForCanvas = (
  widgetType: string,
  borderWidth: number,
  borderColor: string
): { width: number; color: string } => {
  const supportsBorderColor = isCtkStyleSupported(widgetType, 'border_color');
  const supportsBorderWidth = isCtkStyleSupported(widgetType, 'border_width');

  if (!supportsBorderColor && !supportsBorderWidth) {
    return { width: 0, color: 'transparent' };
  }
  if (!supportsBorderColor) {
    return { width: borderWidth, color: 'transparent' };
  }
  if (!supportsBorderWidth) {
    return { width: 0, color: borderColor };
  }
  return { width: borderWidth, color: borderColor };
};
