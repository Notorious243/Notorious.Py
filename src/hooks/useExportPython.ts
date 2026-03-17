import { useCallback } from 'react';
import { WidgetData, CanvasSettings, AutoLayoutConfig, WidgetConstraints } from '@/types/widget';
import { getRelativePosition } from '@/lib/widgetLayout';
import { CTK_ALLOWED_STYLE_PARAMS } from '@/constants/customtkinter-validation';

/**
 * Construit un mapping id → nom de variable Python pour chaque widget.
 * Réutilisable par ExportModal (nommage des fichiers images dans le ZIP).
 */
export const buildWidgetVarNameMap = (widgets: WidgetData[]): Record<string, string> => {
  const counters: Record<string, number> = {};
  const mapping: Record<string, string> = {};
  const sorted = [...widgets].sort((a, b) => {
    const depthOf = (w: WidgetData): number => {
      let d = 0; let c = w;
      while (c.parentId) { d++; const p = widgets.find(x => x.id === c.parentId); if (!p) break; c = p; }
      return d;
    };
    return depthOf(a) - depthOf(b);
  });
  sorted.forEach(w => {
    const base = w.type.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    counters[base] = (counters[base] || 0) + 1;
    mapping[w.id] = counters[base] === 1 ? base : `${base}_${counters[base]}`;
  });
  return mapping;
};

/**
 * Hook d'exportation du code Python CustomTkinter.
 *
 * Génère un fichier .py fonctionnel qui reproduit fidèlement
 * le contenu du canvas (widgets natifs + composites).
 */
export const useExportPython = () => {
  const exportToPython = useCallback((widgets: WidgetData[], canvasSettings: CanvasSettings) => {
    const layoutMode = canvasSettings.layoutMode || 'absolute';

    // ── Compteur global pour noms de variables lisibles ──
    const typeCounters: Record<string, number> = {};
    const idToVarName: Record<string, string> = {};

    const buildVarName = (w: WidgetData): string => {
      if (idToVarName[w.id]) return idToVarName[w.id];
      const base = w.type.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      typeCounters[base] = (typeCounters[base] || 0) + 1;
      const name = typeCounters[base] === 1 ? base : `${base}_${typeCounters[base]}`;
      idToVarName[w.id] = name;
      return name;
    };

    // ── Tri topologique : les parents doivent être créés avant leurs enfants ──
    const sortedWidgets = [...widgets].sort((a, b) => {
      const depthOf = (w: WidgetData): number => {
        let depth = 0;
        let current = w;
        while (current.parentId) {
          depth++;
          const parent = widgets.find(p => p.id === current.parentId);
          if (!parent) break;
          current = parent;
        }
        return depth;
      };
      return depthOf(a) - depthOf(b);
    });

    // Pré-enregistrer tous les noms dans l'ordre trié
    sortedWidgets.forEach(w => buildVarName(w));

    // ── Collecte des fichiers images (stockés dans Assets/Images/) ──
    const imageFiles: Record<string, boolean> = {};
    if (canvasSettings.icon_data) imageFiles['icon'] = true;
    if (canvasSettings.background_image_data) imageFiles['background'] = true;
    sortedWidgets.forEach(w => {
      const varName = idToVarName[w.id] || w.type;
      if (w.type === 'image_label' && w.properties?.image_data) imageFiles[`image_${varName}`] = true;
      if (w.type === 'productCard' && w.properties?.imageData) imageFiles[`image_${varName}`] = true;
      if (w.type === 'userProfile' && w.properties?.avatarData) imageFiles[`avatar_${varName}`] = true;
    });
    const hasImages = Object.keys(imageFiles).length > 0;

    // ── Collecte des polices personnalisées ──
    const STANDARD_FONTS = new Set([
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
      'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI', 'San Francisco',
      'system-ui', 'sans-serif', 'serif', 'monospace',
      'Comic Sans MS', 'Arial Black', 'Impact', 'Calibri',
      'Lucida Console', 'Consolas',
    ]);
    const customFonts = new Set<string>();
    sortedWidgets.forEach(w => {
      [w.style?.fontFamily, w.properties?.font?.[0], w.properties?.nameFont, w.properties?.fontFamily,
       w.properties?.titleFont, w.properties?.valueFont, w.properties?.captionFont]
        .filter(Boolean)
        .forEach((f: any) => { if (!STANDARD_FONTS.has(f)) customFonts.add(f); });
    });
    const hasCustomFonts = customFonts.size > 0;

    // ── Détection des imports nécessaires ──
    const needsTkinter = widgets.some(w => ['table', 'canvas', 'menu'].includes(w.type));
    const needsTtk = widgets.some(w => w.type === 'table');
    const needsPIL = widgets.some(w => ['image_label', 'productCard', 'userProfile'].includes(w.type))
      || !!canvasSettings.icon_data || !!canvasSettings.background_image_data;
    const needsOs = needsPIL || hasCustomFonts;
    const needsRequests = widgets.some(w => w.type === 'image_label' && w.properties?.image_path && !w.properties?.image_data);
    const needsMatplotlib = widgets.some(w => w.type === 'chart');
    const needsDatepicker = widgets.some(w => w.type === 'datepicker');
    const needsDatetime = widgets.some(w => w.type === 'userProfile' && w.properties?.showDate !== false)
      || widgets.some(w => w.type === 'datepicker');

    // ── Génération des imports (tous en haut du fichier) ──
    let imports = '# -*- coding: utf-8 -*-\n';
    imports += '"""Application générée par Notorious.PY pour CustomTkinter."""\n\n';
    imports += 'import customtkinter as ctk\n';
    if (needsTkinter) {
      imports += 'import tkinter as tk\n';
    }
    if (needsTtk) {
      imports += 'from tkinter import ttk\n';
    }
    if (needsPIL) {
      imports += 'from PIL import Image\n';
    }
    if (needsOs || hasImages) {
      imports += 'import os\n';
    }
    if (needsDatetime) {
      imports += 'import datetime\n';
    }
    if (needsRequests) {
      imports += 'import requests\n';
    }
    if (needsRequests) {
      imports += 'from io import BytesIO\n';
    }
    if (needsMatplotlib) {
      imports += 'import matplotlib\n';
      imports += 'matplotlib.use("TkAgg")\n';
      imports += 'from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg\n';
      imports += 'from matplotlib.figure import Figure\n';
    }
    if (needsDatepicker) {
      imports += 'try:\n    from tkcalendar import DateEntry\nexcept ImportError:\n    DateEntry = None\n';
    }

    // ── Code pour l'icône et l'image de fond ──
    let iconCode = '';
    let bgImageCode = '';

    if (canvasSettings.icon_data) {
      iconCode = `
        # Icône de l'application
        try:
            from PIL import ImageTk
            _chemin_icone = os.path.join(_DOSSIER_ASSETS, "Images", "icon.png")
            if os.path.exists(_chemin_icone):
                _img_icone = Image.open(_chemin_icone).resize((32, 32), Image.LANCZOS)
                self._photo_icone = ImageTk.PhotoImage(_img_icone)
                self.iconphoto(False, self._photo_icone)
        except Exception:
            pass
`;
    }

    // Hauteur du contenu = canvas - barre de titre décorative (40px)
    // Dans le canvas, la barre de titre simule la barre OS (hors geometry en Python)
    const contentHeight = canvasSettings.height - 40;

    if (canvasSettings.background_image_data) {
      bgImageCode = `
        # Image d'arrière-plan
        try:
            _chemin_fond = os.path.join(_DOSSIER_ASSETS, "Images", "background.png")
            if os.path.exists(_chemin_fond):
                _img_fond = Image.open(_chemin_fond)
                self.image_fond_ctk = ctk.CTkImage(
                    light_image=_img_fond,
                    dark_image=_img_fond,
                    size=(${canvasSettings.width}, ${contentHeight})
                )
                self.label_fond = ctk.CTkLabel(self, image=self.image_fond_ctk, text="", width=${canvasSettings.width}, height=${contentHeight})
                self.label_fond.place(x=0, y=0)
        except Exception:
            pass
`;
    }

    let code = `${imports}\n`;

    // ── Module-level: chemin vers le dossier assets ──
    if (hasImages || hasCustomFonts) {
      code += `\n# ── Chemin vers le dossier Assets (relatif au script) ──\n`;
      code += `_DOSSIER_ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Assets")\n\n`;
    }

    // ── Fonction utilitaire pour charger des images depuis Assets/Images/ ──
    if (hasImages) {
      code += `def _charger_image(nom_fichier, taille=None):\n`;
      code += `    """Charge une image depuis le dossier Assets/Images/."""\n`;
      code += `    chemin = os.path.join(_DOSSIER_ASSETS, "Images", nom_fichier)\n`;
      code += `    if not os.path.exists(chemin):\n`;
      code += `        print(f"⚠ Image introuvable : {chemin}")\n`;
      code += `        return None\n`;
      code += `    try:\n`;
      code += `        img = Image.open(chemin)\n`;
      code += `        if taille:\n`;
      code += `            return ctk.CTkImage(light_image=img, dark_image=img, size=taille)\n`;
      code += `        return img\n`;
      code += `    except Exception as e:\n`;
      code += `        print(f"⚠ Erreur chargement image {nom_fichier}: {e}")\n`;
      code += `        return None\n\n`;
    }

    // ── Module-level: chargement silencieux des polices depuis Assets/Fonts/ ──
    if (hasCustomFonts) {
      code += `\n# ── Chargement des polices depuis Assets/Fonts/ ──\n`;
      code += `def _charger_polices():\n`;
      code += `    """Enregistre les polices .ttf incluses dans Assets/Fonts/."""\n`;
      code += `    import sys\n`;
      code += `    dossier = os.path.join(_DOSSIER_ASSETS, "Fonts")\n`;
      code += `    if not os.path.isdir(dossier):\n`;
      code += `        return\n`;
      code += `    fichiers = [f for f in os.listdir(dossier) if f.lower().endswith((".ttf", ".otf"))]\n`;
      code += `    if not fichiers:\n`;
      code += `        return\n`;
      code += `    if sys.platform == "win32":\n`;
      code += `        try:\n`;
      code += `            import ctypes\n`;
      code += `            for f in fichiers:\n`;
      code += `                ctypes.windll.gdi32.AddFontResourceExW(os.path.join(dossier, f), 0x10, 0)\n`;
      code += `        except Exception:\n`;
      code += `            pass\n`;
      code += `    elif sys.platform == "darwin":\n`;
      code += `        try:\n`;
      code += `            import subprocess\n`;
      code += `            for f in fichiers:\n`;
      code += `                subprocess.run(["open", os.path.join(dossier, f)], capture_output=True)\n`;
      code += `        except Exception:\n`;
      code += `            pass\n`;
      code += `    else:\n`;
      code += `        try:\n`;
      code += `            import shutil, subprocess\n`;
      code += `            dest = os.path.expanduser("~/.local/share/fonts")\n`;
      code += `            os.makedirs(dest, exist_ok=True)\n`;
      code += `            for f in fichiers:\n`;
      code += `                dst = os.path.join(dest, f)\n`;
      code += `                if not os.path.exists(dst):\n`;
      code += `                    shutil.copy2(os.path.join(dossier, f), dst)\n`;
      code += `            subprocess.run(["fc-cache", "-f"], capture_output=True)\n`;
      code += `        except Exception:\n`;
      code += `            pass\n\n`;
      code += `_charger_polices()\n\n`;
    }

    code += `class App(ctk.CTk):\n`;
    code += `    """Fenêtre principale de l'application."""\n\n`;
    code += `    def __init__(self):\n`;
    code += `        super().__init__()\n\n`;
    const safeTitle = String(canvasSettings.title || 'Mon Application').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
    code += `        # Configuration de la fenêtre\n`;
    code += `        self.title("${safeTitle}")\n`;
    code += `        self.geometry("${canvasSettings.width}x${contentHeight}")\n`;
    if (!canvasSettings.resizable) {
      code += `        self.resizable(False, False)\n`;
    }
    // Le canvas est blanc par défaut dans le builder — toujours exporter la couleur de fond
    const windowBg = canvasSettings.backgroundColor || '#FFFFFF';
    code += `        self.configure(fg_color="${windowBg}")\n`;
    code += iconCode;
    code += bgImageCode;
    if (layoutMode === 'responsive') {
      code += `\n        # Conteneur principal pour le layout responsive\n`;
      code += `        self.conteneur_principal = ctk.CTkFrame(self, fg_color="transparent")\n`;
      code += `        self.conteneur_principal.pack(fill="both", expand=True, padx=20, pady=20)\n`;
    }
    code += `\n        # Créer les widgets\n`;
    code += `        self.creer_widgets()\n\n`;
    code += `    def creer_widgets(self):\n`;
    code += `        """Création et placement de tous les widgets."""\n`;

    // ── Listes pour stocker les gestionnaires d'événements et méthodes utilitaires ──
    const eventHandlers: string[] = [];

    // ── Générer le code pour chaque widget (parents d'abord) ──
    sortedWidgets.forEach(widget => {
      code += generateWidgetCode(widget, widgets, canvasSettings, eventHandlers, idToVarName, layoutMode);
    });

    // ── Ajouter les méthodes d'événements à la fin de la classe ──
    if (eventHandlers.length > 0) {
      code += `\n    # ── Gestionnaires d'événements ──\n\n`;
      code += eventHandlers.join('\n');
    }

    // ── Génération de logique métier automatique ──
    code += generateLogicHelpers(sortedWidgets, idToVarName);

    code += `\n    def lancer(self):\n`;
    code += `        """Démarre la boucle principale de l'application."""\n`;
    code += `        self.mainloop()\n\n\n`;
    code += `if __name__ == "__main__":\n`;
    code += `    app = App()\n`;
    code += `    app.lancer()\n`;

    return code;
  }, []);

  const generateWidgetCode = (
    widget: WidgetData,
    allWidgets: WidgetData[],
    canvasSettings: CanvasSettings,
    eventHandlers: string[],
    idToVarName: Record<string, string>,
    layoutMode: string
  ): string => {
    const { type, position, size, properties, style } = widget;
    const widgetName = idToVarName[widget.id] || widget.type;
    const contentHeight = canvasSettings.height - 40; // Hauteur contenu (sans barre de titre décorative)

    const sanitize = (value: any) => {
      if (value === null || value === undefined) return '';
      return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
    };

    // ── Résolution du parent ──
    let parent = layoutMode === 'responsive' ? 'self.conteneur_principal' : 'self';

    if (widget.parentId) {
      const parentWidget = allWidgets.find(w => w.id === widget.parentId);
      if (parentWidget) {
        const parentVarName = `self.${idToVarName[parentWidget.id] || 'self'}`;
        if (parentWidget.type === 'tabview' && widget.parentSlot) {
          parent = `${parentVarName}.tab("${widget.parentSlot}")`;
        } else {
          parent = parentVarName;
        }
      }
    }

    const parseNumeric = (raw: any, fallback: number) => {
      if (raw === undefined || raw === null || raw === '') return fallback;
      const num = Number(raw);
      return Number.isFinite(num) ? num : fallback;
    };

    const safeInt = (val: any, fallback: number): number => {
      const n = Number(val);
      return Number.isFinite(n) ? Math.round(n) : fallback;
    };

    let code = `\n        # ── ${type.charAt(0).toUpperCase() + type.slice(1)} : ${widgetName} ──\n`;
    let skipPositioning = false;

    // Helper : récupère la police définie dans le panneau de styles
    const getFont = (): { family: string; size: number; weight: string } => {
      return {
        family: style.fontFamily || properties.font?.[0] || 'Roboto',
        size: style.fontSize !== undefined ? style.fontSize : (properties.font?.[1] || 13),
        weight: style.fontWeight === 'bold' ? 'bold' : (properties.font?.[2] === 'bold' ? 'bold' : 'normal'),
      };
    };

    const getStyleParams = (includeText: boolean = false, exclude: Set<string> = new Set()): string => {
      const allowed = CTK_ALLOWED_STYLE_PARAMS[type];
      const isAllowed = (param: string): boolean => {
        if (exclude.has(param)) return false;
        if (allowed && !allowed.has(param)) return false;
        return true;
      };

      const params: string[] = [];
      if (style.backgroundColor && isAllowed('fg_color')) {
        params.push(`fg_color="${style.backgroundColor}"`);
      }
      if (style.textColor && includeText && isAllowed('text_color')) {
        params.push(`text_color="${style.textColor}"`);
      }
      if (style.borderColor && isAllowed('border_color')) {
        params.push(`border_color="${style.borderColor}"`);
      }
      if (style.borderWidth !== undefined && isAllowed('border_width')) {
        params.push(`border_width=${style.borderWidth}`);
      }
      if (style.borderRadius !== undefined && isAllowed('corner_radius')) {
        params.push(`corner_radius=${style.borderRadius}`);
      }
      // font uniquement pour les widgets qui affichent du texte (pas CTkFrame, CTkSlider, etc.)
      if (includeText && (style.fontFamily || style.fontSize || style.fontWeight || properties.font) && isAllowed('font')) {
        const f = getFont();
        if (f.weight === 'bold') {
          params.push(`font=("${f.family}", ${f.size}, "bold")`);
        } else {
          params.push(`font=("${f.family}", ${f.size})`);
        }
      }
      return params.length > 0 ? ',\n            ' + params.join(',\n            ') : '';
    };

    // Helper pour les propriétés de couleur qui viennent des propriétés du widget
    const propColor = (propName: string): string | null => {
      const val = properties[propName];
      return (val && val !== 'transparent') ? val : null;
    };

    switch (type) {
      // ════════════════════════════════════════
      // WIDGETS NATIFS CUSTOMTKINTER
      // ════════════════════════════════════════

      case 'button': {
        const gestionnaire = `clic_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaire}(self):\n` +
          `        """Gestionnaire de clic pour ${widgetName}."""\n` +
          `        print("${sanitize(properties.text || 'Bouton')} cliqué")\n`
        );
        const params: string[] = [
          `${parent}`,
          `text="${sanitize(properties.text || 'Bouton')}"`,
          `command=self.${gestionnaire}`,
          `width=${safeInt(size.width, 140)}`,
          `height=${safeInt(size.height, 40)}`,
        ];
        // Suivi des propriétés déjà ajoutées pour éviter les doublons
        const btnExclude = new Set<string>();
        if (propColor('fg_color')) { params.push(`fg_color="${properties.fg_color}"`); btnExclude.add('fg_color'); }
        if (propColor('hover_color')) params.push(`hover_color="${properties.hover_color}"`);
        // Canvas defaults button text to #FFFFFF — always export to guarantee consistency
        const btnTextColor = style.textColor || properties.text_color || '#FFFFFF';
        params.push(`text_color="${btnTextColor}"`); btnExclude.add('text_color');
        if (propColor('border_color')) { params.push(`border_color="${properties.border_color}"`); btnExclude.add('border_color'); }
        if (properties.border_width > 0) { params.push(`border_width=${properties.border_width}`); btnExclude.add('border_width'); }
        if (properties.corner_radius !== undefined) { params.push(`corner_radius=${properties.corner_radius}`); btnExclude.add('corner_radius'); }
        if (properties.anchor && properties.anchor !== 'center') { params.push(`anchor="${properties.anchor}"`); }
        if (properties.hover === false) { params.push(`hover=False`); }
        if (properties.state === 'disabled') params.push(`state="disabled"`);
        code += `        self.${widgetName} = ctk.CTkButton(\n            ${params.join(',\n            ')}${getStyleParams(true, btnExclude)}\n        )\n`;
        break;
      }

      case 'label': {
        const ancre = properties.anchor || 'center';
        const lblExclude = new Set<string>();
        const lblParams: string[] = [
          `${parent}`,
          `text="${sanitize(properties.text || 'Label')}"`,
          `width=${size.width}`,
          `height=${size.height}`,
          `anchor="${ancre}"`,
        ];
        if (properties.justify && properties.justify !== 'center') { lblParams.push(`justify="${properties.justify}"`); }
        if (propColor('fg_color')) { lblParams.push(`fg_color="${properties.fg_color}"`); lblExclude.add('fg_color'); }
        if (properties.state === 'disabled') { lblParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkLabel(\n            ${lblParams.join(',\n            ')}${getStyleParams(true, lblExclude)}\n        )\n`;
        break;
      }

      case 'image_label': {
        const maxW = Math.round(size.width);
        const maxH = Math.round(size.height);
        const nomImage = `${widgetName}_img`;
        const aImageData = !!properties.image_data;
        const aImageUrl = !!properties.image_path;
        const texteImage = sanitize(properties.text || '');
        const compositionImage = properties.compound || 'center';

        if (aImageData) {
          // Image chargée depuis Assets/Images/ (ratio préservé, comme object-fit: contain)
          code += `        _img_orig_${widgetName} = _charger_image("image_${widgetName}.png")\n`;
          code += `        self.${nomImage} = None\n`;
          code += `        if _img_orig_${widgetName}:\n`;
          code += `            _iw, _ih = _img_orig_${widgetName}.size\n`;
          code += `            _ratio = min(${maxW} / _iw, ${maxH} / _ih)\n`;
          code += `            _taille_${widgetName} = (int(_iw * _ratio), int(_ih * _ratio))\n`;
          code += `            self.${nomImage} = ctk.CTkImage(\n`;
          code += `                light_image=_img_orig_${widgetName},\n`;
          code += `                dark_image=_img_orig_${widgetName},\n`;
          code += `                size=_taille_${widgetName}\n`;
          code += `            )\n`;
        } else if (aImageUrl) {
          code += `        # Image depuis une URL (ratio préservé)\n`;
          code += `        try:\n`;
          code += `            reponse = requests.get("${sanitize(properties.image_path)}")\n`;
          code += `            donnees_image = Image.open(BytesIO(reponse.content))\n`;
          code += `            _iw, _ih = donnees_image.size\n`;
          code += `            _ratio = min(${maxW} / _iw, ${maxH} / _ih)\n`;
          code += `            _taille_${widgetName} = (int(_iw * _ratio), int(_ih * _ratio))\n`;
          code += `            self.${nomImage} = ctk.CTkImage(\n`;
          code += `                light_image=donnees_image,\n`;
          code += `                dark_image=donnees_image,\n`;
          code += `                size=_taille_${widgetName}\n`;
          code += `            )\n`;
          code += `        except Exception:\n`;
          code += `            self.${nomImage} = None\n`;
        } else {
          code += `        self.${nomImage} = None  # Aucune image définie\n`;
        }

        // Créer le label (toujours, même sans image)
        const labelParams: string[] = [
          `${parent}`,
          `text="${texteImage}"`,
          `width=${size.width}`,
          `height=${size.height}`,
          `anchor="${properties.anchor || 'center'}"`,
        ];
        if (aImageData || aImageUrl) {
          labelParams.push(`image=self.${nomImage}`);
          if (texteImage) labelParams.push(`compound="${compositionImage}"`);
        }
        code += `        self.${widgetName} = ctk.CTkLabel(\n            ${labelParams.join(',\n            ')}${getStyleParams(true)}\n        )\n`;
        break;
      }

      case 'entry': {
        const entExclude = new Set<string>();
        const entParams: string[] = [
          `${parent}`,
          `placeholder_text="${sanitize(properties.placeholder_text || '')}"`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.justify && properties.justify !== 'left') { entParams.push(`justify="${properties.justify}"`); }
        if (propColor('placeholder_text_color')) { entParams.push(`placeholder_text_color="${properties.placeholder_text_color}"`); }
        if (propColor('fg_color')) { entParams.push(`fg_color="${properties.fg_color}"`); entExclude.add('fg_color'); }
        if (propColor('border_color')) { entParams.push(`border_color="${properties.border_color}"`); entExclude.add('border_color'); }
        if (properties.state === 'disabled' || properties.state === 'readonly') { entParams.push(`state="${properties.state}"`); }
        code += `        self.${widgetName} = ctk.CTkEntry(\n            ${entParams.join(',\n            ')}${getStyleParams(true, entExclude)}\n        )\n`;
        if (properties.show) {
          code += `        self.${widgetName}.configure(show="${sanitize(properties.show)}")\n`;
        }
        break;
      }

      case 'passwordentry': {
        const gestionnaireMdp = `basculer_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireMdp}(self):\n` +
          `        """Afficher/masquer le mot de passe."""\n` +
          `        if self.${widgetName}_saisie.cget("show") == "*":\n` +
          `            self.${widgetName}_saisie.configure(show="")\n` +
          `            self.${widgetName}_btn.configure(text="\u25cf")\n` +
          `        else:\n` +
          `            self.${widgetName}_saisie.configure(show="*")\n` +
          `            self.${widgetName}_btn.configure(text="\u25cb")\n`
        );
        // Conteneur qui reproduit l'apparence d'un CTkEntry
        const btnFont = getFont();
        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height}${getStyleParams(false)}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}.grid_propagate(False)\n`;
        code += `        self.${widgetName}.grid_columnconfigure(0, weight=1)\n`;
        code += `        self.${widgetName}.grid_rowconfigure(0, weight=1)\n`;
        // Champ de saisie intégré (sans bordure, fond transparent)
        const entryH = Math.max(30, size.height - 10);
        code += `        self.${widgetName}_saisie = ctk.CTkEntry(\n`;
        code += `            self.${widgetName},\n`;
        code += `            placeholder_text="${sanitize(properties.placeholder_text || 'Mot de passe')}",\n`;
        code += `            show="*",\n`;
        code += `            height=${entryH},\n`;
        code += `            border_width=0,\n`;
        code += `            fg_color="transparent",\n`;
        code += `            font=("${btnFont.family}", ${btnFont.size}${btnFont.weight === 'bold' ? ', "bold"' : ''})\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_saisie.grid(row=0, column=0, sticky="nsew", padx=(8, 0), pady=2)\n`;
        // Bouton \u0153il intégré dans le conteneur
        const btnSize = Math.max(28, Math.round(size.height * 0.6));
        code += `        self.${widgetName}_btn = ctk.CTkButton(\n`;
        code += `            self.${widgetName},\n`;
        code += `            text="\u25cb",\n`;
        code += `            width=${btnSize},\n`;
        code += `            height=${btnSize},\n`;
        code += `            fg_color="transparent",\n`;
        code += `            hover_color="#E8E8E8",\n`;
        code += `            text_color="#666666",\n`;
        code += `            font=("Arial", 18),\n`;
        code += `            corner_radius=8,\n`;
        code += `            command=self.${gestionnaireMdp}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_btn.grid(row=0, column=1, padx=(0, 8), pady=8)\n`;
        break;
      }

      case 'textbox': {
        const tbParams: string[] = [
          `${parent}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.wrap && properties.wrap !== 'word') { tbParams.push(`wrap="${properties.wrap}"`); }
        if (properties.activate_scrollbars === false) { tbParams.push(`activate_scrollbars=False`); }
        if (propColor('scrollbar_button_color')) { tbParams.push(`scrollbar_button_color="${properties.scrollbar_button_color}"`); }
        if (properties.state === 'disabled') { tbParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkTextbox(\n            ${tbParams.join(',\n            ')}${getStyleParams(true)}\n        )\n`;
        break;
      }

      case 'checkbox': {
        const gestionnaireCoche = `changement_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireCoche}(self):\n` +
          `        """Gestionnaire pour la case à cocher."""\n` +
          `        print(f"${widgetName} = {self.${widgetName}.get()}")\n`
        );
        const cbExclude = new Set<string>();
        const cbParams: string[] = [
          `${parent}`,
          `text="${sanitize(properties.text || 'Case à cocher')}"`,
          `command=self.${gestionnaireCoche}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.checkbox_width && properties.checkbox_width !== 24) { cbParams.push(`checkbox_width=${properties.checkbox_width}`); }
        if (properties.checkbox_height && properties.checkbox_height !== 24) { cbParams.push(`checkbox_height=${properties.checkbox_height}`); }
        if (properties.onvalue !== undefined && properties.onvalue !== 1) { cbParams.push(`onvalue=${JSON.stringify(properties.onvalue)}`); }
        if (properties.offvalue !== undefined && properties.offvalue !== 0) { cbParams.push(`offvalue=${JSON.stringify(properties.offvalue)}`); }
        if (propColor('checkmark_color')) { cbParams.push(`checkmark_color="${properties.checkmark_color}"`); }
        if (propColor('fg_color')) { cbParams.push(`fg_color="${properties.fg_color}"`); cbExclude.add('fg_color'); }
        if (propColor('hover_color')) { cbParams.push(`hover_color="${properties.hover_color}"`); }
        if (propColor('border_color')) { cbParams.push(`border_color="${properties.border_color}"`); cbExclude.add('border_color'); }
        // Canvas defaults border_width to 0, but CTkCheckBox defaults to 3 — force explicit value
        const cbBorderWidth = properties.border_width !== undefined ? properties.border_width : 0;
        cbParams.push(`border_width=${cbBorderWidth}`); cbExclude.add('border_width');
        if (properties.state === 'disabled') { cbParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkCheckBox(\n            ${cbParams.join(',\n            ')}${getStyleParams(true, cbExclude)}\n        )\n`;
        break;
      }

      case 'radiobutton': {
        // Déterminer le groupe de radio buttons (basé sur le parent)
        const radioGroupId = widget.parentId || 'root';
        const radioGroupVar = `radio_var_${radioGroupId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        const gestionnaireRadio = `selection_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireRadio}(self):\n` +
          `        """Gestionnaire pour le bouton radio."""\n` +
          `        print(f"${widgetName} sélectionné, valeur = {self.${radioGroupVar}.get()}")\n`
        );
        // Vérifier si la variable du groupe a déjà été créée
        const radioVarDecl = `self.${radioGroupVar}`;
        if (!code.includes(radioVarDecl) && !eventHandlers.some(h => h.includes(radioVarDecl))) {
          code += `        self.${radioGroupVar} = ctk.IntVar(value=0)\n`;
        }
        const radioValue = properties.value !== undefined ? properties.value : 0;
        const rbExclude = new Set<string>();
        const rbParams: string[] = [
          `${parent}`,
          `text="${sanitize(properties.text || 'Bouton Radio')}"`,
          `command=self.${gestionnaireRadio}`,
          `variable=self.${radioGroupVar}`,
          `value=${radioValue}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.radiobutton_width && properties.radiobutton_width !== 22) { rbParams.push(`radiobutton_width=${properties.radiobutton_width}`); }
        if (properties.radiobutton_height && properties.radiobutton_height !== 22) { rbParams.push(`radiobutton_height=${properties.radiobutton_height}`); }
        if (propColor('fg_color')) { rbParams.push(`fg_color="${properties.fg_color}"`); rbExclude.add('fg_color'); }
        if (propColor('border_color')) { rbParams.push(`border_color="${properties.border_color}"`); rbExclude.add('border_color'); }
        if (propColor('hover_color')) { rbParams.push(`hover_color="${properties.hover_color}"`); }
        // Canvas defaults border_width_unchecked/checked to 0, but CTkRadioButton defaults to 3
        const rbBorderUnchecked = properties.border_width_unchecked !== undefined ? properties.border_width_unchecked : 0;
        const rbBorderChecked = properties.border_width_checked !== undefined ? properties.border_width_checked : 0;
        rbParams.push(`border_width_unchecked=${rbBorderUnchecked}`);
        rbParams.push(`border_width_checked=${rbBorderChecked}`);
        rbExclude.add('border_width');
        if (properties.state === 'disabled') { rbParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkRadioButton(\n            ${rbParams.join(',\n            ')}${getStyleParams(true, rbExclude)}\n        )\n`;
        break;
      }

      case 'switch': {
        const gestionnaireSwitch = `basculer_switch_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireSwitch}(self):\n` +
          `        """Gestionnaire pour l'interrupteur."""\n` +
          `        print(f"${widgetName} = {self.${widgetName}.get()}")\n`
        );
        const swExclude = new Set<string>();
        const swParams: string[] = [
          `${parent}`,
          `text="${sanitize(properties.text || 'Interrupteur')}"`,
          `command=self.${gestionnaireSwitch}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.switch_width && properties.switch_width !== 36) { swParams.push(`switch_width=${properties.switch_width}`); }
        if (properties.switch_height && properties.switch_height !== 20) { swParams.push(`switch_height=${properties.switch_height}`); }
        if (properties.button_length && properties.button_length > 0) { swParams.push(`button_length=${properties.button_length}`); }
        if (propColor('button_color')) { swParams.push(`button_color="${properties.button_color}"`); }
        if (propColor('button_hover_color')) { swParams.push(`button_hover_color="${properties.button_hover_color}"`); }
        if (propColor('progress_color')) { swParams.push(`progress_color="${properties.progress_color}"`); }
        if (propColor('fg_color')) { swParams.push(`fg_color="${properties.fg_color}"`); swExclude.add('fg_color'); }
        // Canvas defaults corner_radius to 1000 (pill shape) — export explicitly
        const swCornerRadius = properties.corner_radius !== undefined ? properties.corner_radius : 1000;
        swParams.push(`corner_radius=${swCornerRadius}`); swExclude.add('corner_radius');
        if (properties.onvalue !== undefined && properties.onvalue !== 1) { swParams.push(`onvalue=${JSON.stringify(properties.onvalue)}`); }
        if (properties.offvalue !== undefined && properties.offvalue !== 0) { swParams.push(`offvalue=${JSON.stringify(properties.offvalue)}`); }
        if (properties.state === 'disabled') { swParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkSwitch(\n            ${swParams.join(',\n            ')}${getStyleParams(true, swExclude)}\n        )\n`;
        break;
      }

      case 'combobox': {
        const valeursCombo = properties.values || ['Option 1', 'Option 2'];
        const gestionnaireCombo = `selection_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireCombo}(self, choix):\n` +
          `        """Gestionnaire pour la liste déroulante."""\n` +
          `        print(f"${widgetName} : {choix}")\n`
        );
        const cmbExclude = new Set<string>();
        const cmbParams: string[] = [
          `${parent}`,
          `values=${JSON.stringify(valeursCombo)}`,
          `command=self.${gestionnaireCombo}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (propColor('button_color')) { cmbParams.push(`button_color="${properties.button_color}"`); }
        if (propColor('button_hover_color')) { cmbParams.push(`button_hover_color="${properties.button_hover_color}"`); }
        if (propColor('dropdown_fg_color')) { cmbParams.push(`dropdown_fg_color="${properties.dropdown_fg_color}"`); }
        if (propColor('dropdown_hover_color')) { cmbParams.push(`dropdown_hover_color="${properties.dropdown_hover_color}"`); }
        if (propColor('dropdown_text_color')) { cmbParams.push(`dropdown_text_color="${properties.dropdown_text_color}"`); }
        if (propColor('fg_color')) { cmbParams.push(`fg_color="${properties.fg_color}"`); cmbExclude.add('fg_color'); }
        if (propColor('border_color')) { cmbParams.push(`border_color="${properties.border_color}"`); cmbExclude.add('border_color'); }
        if (properties.justify && properties.justify !== 'left') { cmbParams.push(`justify="${properties.justify}"`); }
        if (properties.state === 'disabled' || properties.state === 'readonly') { cmbParams.push(`state="${properties.state}"`); }
        code += `        self.${widgetName} = ctk.CTkComboBox(\n            ${cmbParams.join(',\n            ')}${getStyleParams(true, cmbExclude)}\n        )\n`;
        break;
      }

      case 'optionmenu': {
        const valeursOption = properties.values || ['Option 1', 'Option 2', 'Option 3'];
        const gestionnaireOption = `selection_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireOption}(self, choix):\n` +
          `        """Gestionnaire pour le menu de sélection."""\n` +
          `        print(f"${widgetName} : {choix}")\n`
        );
        const omExclude = new Set<string>();
        const omParams: string[] = [
          `${parent}`,
          `values=${JSON.stringify(valeursOption)}`,
          `command=self.${gestionnaireOption}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (propColor('button_color')) { omParams.push(`button_color="${properties.button_color}"`); }
        if (propColor('button_hover_color')) { omParams.push(`button_hover_color="${properties.button_hover_color}"`); }
        if (propColor('dropdown_fg_color')) { omParams.push(`dropdown_fg_color="${properties.dropdown_fg_color}"`); }
        if (propColor('dropdown_hover_color')) { omParams.push(`dropdown_hover_color="${properties.dropdown_hover_color}"`); }
        if (propColor('dropdown_text_color')) { omParams.push(`dropdown_text_color="${properties.dropdown_text_color}"`); }
        if (propColor('fg_color')) { omParams.push(`fg_color="${properties.fg_color}"`); omExclude.add('fg_color'); }
        // Canvas defaults OptionMenu text to #FFFFFF — always export to guarantee consistency
        const omTextColor = style.textColor || properties.text_color || '#FFFFFF';
        omParams.push(`text_color="${omTextColor}"`); omExclude.add('text_color');
        if (properties.anchor && properties.anchor !== 'w') { omParams.push(`anchor="${properties.anchor}"`); }
        if (properties.dynamic_resizing === false) { omParams.push(`dynamic_resizing=False`); }
        if (properties.state === 'disabled') { omParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkOptionMenu(\n            ${omParams.join(',\n            ')}${getStyleParams(true, omExclude)}\n        )\n`;
        break;
      }

      case 'segmentedbutton': {
        const valeursSegment = properties.values || ['Option 1', 'Option 2', 'Option 3'];
        const gestionnaireSegment = `selection_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireSegment}(self, valeur):\n` +
          `        """Gestionnaire pour les boutons segmentés."""\n` +
          `        print(f"${widgetName} : {valeur}")\n`
        );
        const sgExclude = new Set<string>();
        const sgParams: string[] = [
          `${parent}`,
          `values=${JSON.stringify(valeursSegment)}`,
          `command=self.${gestionnaireSegment}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (propColor('selected_color')) { sgParams.push(`selected_color="${properties.selected_color}"`); }
        if (propColor('selected_hover_color')) { sgParams.push(`selected_hover_color="${properties.selected_hover_color}"`); }
        if (propColor('unselected_color')) { sgParams.push(`unselected_color="${properties.unselected_color}"`); }
        if (propColor('unselected_hover_color')) { sgParams.push(`unselected_hover_color="${properties.unselected_hover_color}"`); }
        if (propColor('fg_color')) { sgParams.push(`fg_color="${properties.fg_color}"`); sgExclude.add('fg_color'); }
        if (properties.state === 'disabled') { sgParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkSegmentedButton(\n            ${sgParams.join(',\n            ')}${getStyleParams(true, sgExclude)}\n        )\n`;
        if (properties.selectedIndex !== undefined && valeursSegment[properties.selectedIndex]) {
          code += `        self.${widgetName}.set("${valeursSegment[properties.selectedIndex]}")\n`;
        }
        break;
      }

      case 'slider': {
        const gestionnaireCurseur = `deplacement_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireCurseur}(self, valeur):\n` +
          `        """Gestionnaire pour le curseur."""\n` +
          `        print(f"${widgetName} = {valeur}")\n`
        );
        const slExclude = new Set<string>();
        const slParams: string[] = [
          `${parent}`,
          `from_=${properties.from_ || 0}`,
          `to=${properties.to || 100}`,
          `command=self.${gestionnaireCurseur}`,
          `width=${size.width}`,
        ];
        if (properties.orientation === 'vertical') { slParams.push(`orientation="vertical"`); }
        if (properties.number_of_steps) { slParams.push(`number_of_steps=${properties.number_of_steps}`); }
        if (propColor('button_color')) { slParams.push(`button_color="${properties.button_color}"`); }
        if (propColor('button_hover_color')) { slParams.push(`button_hover_color="${properties.button_hover_color}"`); }
        if (propColor('progress_color')) { slParams.push(`progress_color="${properties.progress_color}"`); }
        if (propColor('fg_color')) { slParams.push(`fg_color="${properties.fg_color}"`); slExclude.add('fg_color'); }
        if (properties.button_corner_radius !== undefined && properties.button_corner_radius !== 1000) { slParams.push(`button_corner_radius=${properties.button_corner_radius}`); }
        if (properties.state === 'disabled') { slParams.push(`state="disabled"`); }
        code += `        self.${widgetName} = ctk.CTkSlider(\n            ${slParams.join(',\n            ')}${getStyleParams(false, slExclude)}\n        )\n`;
        code += `        self.${widgetName}.set(${properties.value || 50})\n`;
        break;
      }

      case 'progressbar': {
        const pbExclude = new Set<string>();
        const pbParams: string[] = [
          `${parent}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.orientation === 'vertical') { pbParams.push(`orientation="vertical"`); }
        if (properties.mode === 'indeterminate') { pbParams.push(`mode="indeterminate"`); }
        if (propColor('progress_color')) { pbParams.push(`progress_color="${properties.progress_color}"`); }
        if (propColor('fg_color')) { pbParams.push(`fg_color="${properties.fg_color}"`); pbExclude.add('fg_color'); }
        if (propColor('border_color')) { pbParams.push(`border_color="${properties.border_color}"`); pbExclude.add('border_color'); }
        code += `        self.${widgetName} = ctk.CTkProgressBar(\n            ${pbParams.join(',\n            ')}${getStyleParams(false, pbExclude)}\n        )\n`;
        const pbValue = parseNumeric(properties.progress, 70) / 100;
        code += `        self.${widgetName}.set(${pbValue})\n`;
        break;
      }

      case 'scrollbar': {
        const scrExclude = new Set<string>();
        const scrParams: string[] = [
          `${parent}`,
        ];
        if (properties.orientation === 'horizontal') {
          scrParams.push(`orientation="horizontal"`);
          scrParams.push(`width=${size.width}`);
          scrParams.push(`height=${size.height}`);
        } else {
          scrParams.push(`width=${size.width}`);
          scrParams.push(`height=${size.height}`);
        }
        if (propColor('button_color')) { scrParams.push(`button_color="${properties.button_color}"`); }
        if (propColor('button_hover_color')) { scrParams.push(`button_hover_color="${properties.button_hover_color}"`); }
        if (propColor('fg_color')) { scrParams.push(`fg_color="${properties.fg_color}"`); scrExclude.add('fg_color'); }
        if (properties.corner_radius !== undefined && properties.corner_radius !== 1000) { scrParams.push(`corner_radius=${properties.corner_radius}`); }
        if (properties.border_spacing !== undefined && properties.border_spacing !== 2) { scrParams.push(`border_spacing=${properties.border_spacing}`); }
        if (properties.minimum_pixel_length !== undefined && properties.minimum_pixel_length !== 20) { scrParams.push(`minimum_pixel_length=${properties.minimum_pixel_length}`); }
        code += `        self.${widgetName} = ctk.CTkScrollbar(\n            ${scrParams.join(',\n            ')}${getStyleParams(false, scrExclude)}\n        )\n`;
        code += `        # Pour connecter à un widget : self.${widgetName}.configure(command=widget.yview)\n`;
        break;
      }

      // ════════════════════════════════════════
      // CONTENEURS
      // ════════════════════════════════════════

      case 'frame': {
        const frameCorner = style.borderRadius ?? 0;
        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            corner_radius=${frameCorner}${getStyleParams(false, new Set(['corner_radius']))}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}.pack_propagate(False)\n`;
        break;
      }

      case 'scrollableframe': {
        const sfParams: string[] = [
          `${parent}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.label_text) { sfParams.push(`label_text="${sanitize(properties.label_text)}"`); }
        if (properties.orientation === 'horizontal') { sfParams.push(`orientation="horizontal"`); }
        if (propColor('fg_color')) { sfParams.push(`fg_color="${properties.fg_color}"`); }
        code += `        self.${widgetName} = ctk.CTkScrollableFrame(\n            ${sfParams.join(',\n            ')}${getStyleParams(false, new Set(['fg_color']))}\n        )\n`;
        break;
      }

      case 'tabview': {
        const nomsOnglets = properties.tabs || ['Tab 1', 'Tab 2'];
        const tvExclude = new Set<string>();
        const tvParams: string[] = [
          `${parent}`,
          `width=${size.width}`,
          `height=${size.height}`,
        ];
        if (properties.anchor && properties.anchor !== 'n') { tvParams.push(`anchor="${properties.anchor}"`); }
        if (propColor('segmented_button_selected_color')) { tvParams.push(`segmented_button_selected_color="${properties.segmented_button_selected_color}"`); }
        if (propColor('segmented_button_unselected_color')) { tvParams.push(`segmented_button_unselected_color="${properties.segmented_button_unselected_color}"`); }
        if (propColor('fg_color')) { tvParams.push(`fg_color="${properties.fg_color}"`); tvExclude.add('fg_color'); }
        code += `        self.${widgetName} = ctk.CTkTabview(\n            ${tvParams.join(',\n            ')}${getStyleParams(false, tvExclude)}\n        )\n`;
        nomsOnglets.forEach((nom: string) => {
          code += `        self.${widgetName}.add("${sanitize(nom)}")\n`;
        });
        if (properties.selectedIndex !== undefined && nomsOnglets[properties.selectedIndex]) {
          code += `        self.${widgetName}.set("${sanitize(nomsOnglets[properties.selectedIndex])}")\n`;
        }
        break;
      }

      // ════════════════════════════════════════
      // WIDGETS COMPOSITES
      // ════════════════════════════════════════

      case 'statCard': {
        const scFond = sanitize(properties.backgroundColor || '#FFFFFF');
        const scTitre = sanitize(properties.title || 'Statistique');
        const scValeur = sanitize(properties.value || '123');
        const scSousTitre = sanitize(properties.caption || '');
        const scCouleurTitre = sanitize(properties.titleColor || '#64748B');
        const scCouleurValeur = sanitize(properties.valueColor || '#0F172A');
        const scCouleurCaption = sanitize(properties.captionColor || '#94A3B8');
        const scPoliceTitre = sanitize(properties.titleFont || 'Poppins');
        const scPoliceValeur = sanitize(properties.valueFont || 'Poppins');
        const scPoliceCaption = sanitize(properties.captionFont || properties.titleFont || 'Poppins');
        const scTailleTitre = parseNumeric(properties.titleFontSize, 13);
        const scTailleValeur = parseNumeric(properties.valueFontSize, 32);
        const scTailleCaption = parseNumeric(properties.captionFontSize, 12);

        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            fg_color="${scFond}",\n`;
        code += `            corner_radius=${style.borderRadius ?? 16}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}.pack_propagate(False)\n`;
        code += `        self.${widgetName}_titre = ctk.CTkLabel(\n`;
        code += `            self.${widgetName},\n`;
        code += `            text="${scTitre}",\n`;
        code += `            text_color="${scCouleurTitre}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${scPoliceTitre}", ${scTailleTitre}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_titre.pack(anchor="w", padx=16, pady=(16, 6))\n`;
        code += `        self.${widgetName}_valeur = ctk.CTkLabel(\n`;
        code += `            self.${widgetName},\n`;
        code += `            text="${scValeur}",\n`;
        code += `            text_color="${scCouleurValeur}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${scPoliceValeur}", ${scTailleValeur}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_valeur.pack(anchor="w", padx=16)\n`;
        if (scSousTitre) {
          code += `        self.${widgetName}_caption = ctk.CTkLabel(\n`;
          code += `            self.${widgetName},\n`;
          code += `            text="${scSousTitre}",\n`;
          code += `            text_color="${scCouleurCaption}",\n`;
          code += `            anchor="w",\n`;
          code += `            font=("${scPoliceCaption}", ${scTailleCaption})\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_caption.pack(anchor="w", padx=16, pady=(12, 0))\n`;
        }
        if (properties.showIcon !== false && properties.icon) {
          code += `        # Astuce : utilisez CTkImage pour l'icône "${sanitize(properties.icon)}" (taille ${parseNumeric(properties.iconSize, 28)}px)\n`;
        }
        // Méthode utilitaire placée dans eventHandlers (indentation correcte)
        let updateStat = `    def maj_${widgetName}(self, valeur, titre=None, sous_titre=None):\n`;
        updateStat += `        """Met à jour la carte statistique ${widgetName}."""\n`;
        updateStat += `        self.${widgetName}_valeur.configure(text=str(valeur))\n`;
        updateStat += `        if titre:\n`;
        updateStat += `            self.${widgetName}_titre.configure(text=titre)\n`;
        if (scSousTitre) {
          updateStat += `        if sous_titre:\n`;
          updateStat += `            self.${widgetName}_caption.configure(text=sous_titre)\n`;
        }
        eventHandlers.push(updateStat);
        break;
      }

      case 'statCardWithProgress': {
        const spFond = sanitize(properties.backgroundColor || '#FFFFFF');
        const spTitre = sanitize(properties.title || 'Statistique');
        const spValeur = sanitize(properties.value || '0');
        const spCaption = sanitize(properties.caption || '');
        const spCouleurTitre = sanitize(properties.titleColor || '#64748B');
        const spCouleurValeur = sanitize(properties.valueColor || '#0F172A');
        const spCouleurCaption = sanitize(properties.captionColor || '#94A3B8');
        const spCouleurProgression = sanitize(properties.progressColor || '#166534');
        const spProgressionValeur = Math.max(0, Math.min(1, Number(properties.progressValue) || 0.65));
        const spPoliceTitre = sanitize(properties.titleFont || 'Poppins');
        const spPoliceValeur = sanitize(properties.valueFont || 'Poppins');
        const spPoliceCaption = sanitize(properties.captionFont || properties.titleFont || 'Poppins');
        const spTailleTitre = parseNumeric(properties.titleFontSize, 12);
        const spTailleValeur = parseNumeric(properties.valueFontSize, 28);
        const spTailleCaption = parseNumeric(properties.captionFontSize, 11);

        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            fg_color="${spFond}",\n`;
        code += `            corner_radius=${properties.cornerRadius || 16}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}.pack_propagate(False)\n`;
        // En-tête avec titre et barre de progression
        code += `        self.${widgetName}_entete = ctk.CTkFrame(self.${widgetName}, fg_color="transparent")\n`;
        code += `        self.${widgetName}_entete.pack(fill="x", padx=18, pady=(14, 0))\n`;
        code += `        self.${widgetName}_titre = ctk.CTkLabel(\n`;
        code += `            self.${widgetName}_entete,\n`;
        code += `            text="${spTitre}",\n`;
        code += `            text_color="${spCouleurTitre}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${spPoliceTitre}", ${spTailleTitre}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_titre.pack(side="left")\n`;
        code += `        self.${widgetName}_barre = ctk.CTkProgressBar(\n`;
        code += `            self.${widgetName}_entete,\n`;
        code += `            width=60,\n`;
        code += `            height=8,\n`;
        code += `            progress_color="${spCouleurProgression}"\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_barre.pack(side="right")\n`;
        code += `        self.${widgetName}_barre.set(${spProgressionValeur})\n`;
        // Valeur
        code += `        self.${widgetName}_valeur = ctk.CTkLabel(\n`;
        code += `            self.${widgetName},\n`;
        code += `            text="${spValeur}",\n`;
        code += `            text_color="${spCouleurValeur}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${spPoliceValeur}", ${spTailleValeur}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_valeur.pack(anchor="w", padx=18, pady=(8, 0))\n`;
        if (spCaption) {
          code += `        self.${widgetName}_caption = ctk.CTkLabel(\n`;
          code += `            self.${widgetName},\n`;
          code += `            text="${spCaption}",\n`;
          code += `            text_color="${spCouleurCaption}",\n`;
          code += `            anchor="w",\n`;
          code += `            font=("${spPoliceCaption}", ${spTailleCaption})\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_caption.pack(anchor="w", padx=18, pady=(4, 0))\n`;
        }
        break;
      }

      case 'productCard': {
        const pcFond = sanitize(properties.backgroundColor || '#FFFFFF');
        const pcCouleurTexte = sanitize(properties.textColor || '#1E293B');
        const pcCouleurPrix = sanitize(properties.priceColor || '#0F172A');
        const pcCouleurBordure = sanitize(properties.borderColor || '#E2E8F0');
        const pcPolice = sanitize(properties.fontFamily || 'Poppins');
        const pcTailleTexte = parseNumeric(properties.fontSize, 13);
        const pcTaillePrix = parseNumeric(properties.priceFontSize, 15);
        const pcRayon = properties.cornerRadius || 12;
        const pcNomProduit = sanitize(properties.productName || 'Produit');
        const pcDetail = sanitize(properties.productDetail || '');
        const pcPrix = sanitize(properties.price || '0');
        const pcAImage = !!properties.imageData;

        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            fg_color="${pcFond}",\n`;
        code += `            border_color="${pcCouleurBordure}",\n`;
        code += `            border_width=1,\n`;
        code += `            corner_radius=${pcRayon}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}.pack_propagate(False)\n`;
        // Zone image
        if (pcAImage) {
          code += `        # Image du produit\n`;
          code += `        _img_produit_${widgetName} = _charger_image("image_${widgetName}.png")\n`;
          code += `        self.${widgetName}_img = None\n`;
          code += `        if _img_produit_${widgetName}:\n`;
          code += `            self.${widgetName}_img = ctk.CTkImage(\n`;
          code += `                light_image=_img_produit_${widgetName},\n`;
          code += `                dark_image=_img_produit_${widgetName},\n`;
          code += `                size=(${Math.round(size.width * 0.7)}, ${Math.round(size.height * 0.4)})\n`;
          code += `            )\n`;
          code += `        self.${widgetName}_zone_image = ctk.CTkLabel(\n`;
          code += `            self.${widgetName},\n`;
          code += `            text="" if self.${widgetName}_img else "Image",\n`;
          code += `            image=self.${widgetName}_img,\n`;
          code += `            height=${Math.round(size.height * 0.55)}\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_zone_image.pack(fill="x")\n`;
        } else {
          code += `        self.${widgetName}_zone_image = ctk.CTkLabel(\n`;
          code += `            self.${widgetName},\n`;
          code += `            text="Image",\n`;
          code += `            height=${Math.round(size.height * 0.55)},\n`;
          code += `            fg_color="#F1F5F9"\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_zone_image.pack(fill="x")\n`;
        }
        // Nom du produit
        code += `        self.${widgetName}_nom = ctk.CTkLabel(\n`;
        code += `            self.${widgetName},\n`;
        code += `            text="${pcNomProduit}",\n`;
        code += `            text_color="${pcCouleurTexte}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${pcPolice}", ${pcTailleTexte}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_nom.pack(anchor="w", padx=12, pady=(8, 0))\n`;
        if (pcDetail) {
          code += `        self.${widgetName}_detail = ctk.CTkLabel(\n`;
          code += `            self.${widgetName},\n`;
          code += `            text="${pcDetail}",\n`;
          code += `            text_color="#64748B",\n`;
          code += `            anchor="w",\n`;
          code += `            font=("${pcPolice}", ${pcTailleTexte - 2})\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_detail.pack(anchor="w", padx=12)\n`;
        }
        // Prix
        code += `        self.${widgetName}_prix = ctk.CTkLabel(\n`;
        code += `            self.${widgetName},\n`;
        code += `            text="${pcPrix}",\n`;
        code += `            text_color="${pcCouleurPrix}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${pcPolice}", ${pcTaillePrix}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_prix.pack(anchor="w", padx=12, pady=(4, 8))\n`;
        break;
      }

      case 'userProfile': {
        const upNomPolice = sanitize(properties.nameFont || 'Poppins');
        const upTailleNom = parseNumeric(properties.nameFontSize, 15);
        const upTailleInfo = parseNumeric(properties.infoFontSize, 12);
        const upTailleDate = parseNumeric(properties.dateFontSize, 12);
        const upTailleAvatar = parseNumeric(properties.avatarSize, 40);
        const upNomUtilisateur = sanitize(properties.userName || 'Utilisateur');
        const upInfo = sanitize(properties.userInfo || '');
        const upCouleurNom = sanitize(properties.nameColor || '#0F172A');
        const upCouleurInfo = sanitize(properties.infoColor || '#64748B');
        const upCouleurDate = sanitize(properties.dateColor || '#94A3B8');
        const upFond = sanitize(properties.backgroundColor || 'transparent');
        const upAfficherDate = properties.showDate !== false;
        const upAAvatar = !!properties.avatarData;

        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            fg_color="${upFond}"\n`;
        code += `        )\n`;
        code += `        self.${widgetName}.pack_propagate(False)\n`;
        // Conteneur horizontal
        code += `        self.${widgetName}_contenu = ctk.CTkFrame(self.${widgetName}, fg_color="transparent")\n`;
        code += `        self.${widgetName}_contenu.pack(fill="both", expand=True, padx=8, pady=4)\n`;

        if (upAfficherDate) {
          code += `        # Date et heure actuelles\n`;
          code += `        jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]\n`;
          code += `        mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]\n`;
          code += `        maintenant = datetime.datetime.now()\n`;
          code += `        texte_date = f"{jours[maintenant.weekday()]} {maintenant.day:02d} {mois[maintenant.month - 1]} {maintenant.year} - {maintenant.hour:02d}h{maintenant.minute:02d}"\n`;
          code += `        self.${widgetName}_date = ctk.CTkLabel(\n`;
          code += `            self.${widgetName}_contenu,\n`;
          code += `            text=texte_date,\n`;
          code += `            text_color="${upCouleurDate}",\n`;
          code += `            font=("${upNomPolice}", ${upTailleDate})\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_date.pack(side="left", padx=(0, 12))\n`;
        }

        // Avatar
        if (upAAvatar) {
          code += `        # Avatar\n`;
          code += `        _img_avatar_${widgetName} = _charger_image("avatar_${widgetName}.png")\n`;
          code += `        self.${widgetName}_avatar_img = None\n`;
          code += `        if _img_avatar_${widgetName}:\n`;
          code += `            self.${widgetName}_avatar_img = ctk.CTkImage(\n`;
          code += `                light_image=_img_avatar_${widgetName},\n`;
          code += `                dark_image=_img_avatar_${widgetName},\n`;
          code += `                size=(${upTailleAvatar}, ${upTailleAvatar})\n`;
          code += `            )\n`;
          code += `        self.${widgetName}_avatar = ctk.CTkLabel(\n`;
          code += `            self.${widgetName}_contenu,\n`;
          code += `            text="",\n`;
          code += `            image=self.${widgetName}_avatar_img,\n`;
          code += `            width=${upTailleAvatar},\n`;
          code += `            height=${upTailleAvatar}\n`;
          code += `        )\n`;
        } else {
          code += `        self.${widgetName}_avatar = ctk.CTkLabel(\n`;
          code += `            self.${widgetName}_contenu,\n`;
          code += `            text="👤",\n`;
          code += `            width=${upTailleAvatar},\n`;
          code += `            height=${upTailleAvatar},\n`;
          code += `            fg_color="#E2E8F0",\n`;
          code += `            corner_radius=${Math.round(upTailleAvatar / 2)}\n`;
          code += `        )\n`;
        }
        code += `        self.${widgetName}_avatar.pack(side="left", padx=(0, 8))\n`;

        // Informations textuelles
        code += `        self.${widgetName}_infos = ctk.CTkFrame(self.${widgetName}_contenu, fg_color="transparent")\n`;
        code += `        self.${widgetName}_infos.pack(side="left", fill="y")\n`;
        code += `        self.${widgetName}_nom = ctk.CTkLabel(\n`;
        code += `            self.${widgetName}_infos,\n`;
        code += `            text="${upNomUtilisateur}",\n`;
        code += `            text_color="${upCouleurNom}",\n`;
        code += `            anchor="w",\n`;
        code += `            font=("${upNomPolice}", ${upTailleNom}, "bold")\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_nom.pack(anchor="w")\n`;
        if (upInfo) {
          code += `        self.${widgetName}_role = ctk.CTkLabel(\n`;
          code += `            self.${widgetName}_infos,\n`;
          code += `            text="${upInfo}",\n`;
          code += `            text_color="${upCouleurInfo}",\n`;
          code += `            anchor="w",\n`;
          code += `            font=("${upNomPolice}", ${upTailleInfo})\n`;
          code += `        )\n`;
          code += `        self.${widgetName}_role.pack(anchor="w")\n`;
        }
        break;
      }

      case 'menuItem': {
        const texteMenu = sanitize(properties.text || 'Élément de menu');
        const policeMenu = sanitize(properties.fontFamily || 'Poppins');
        const tailleMenu = parseNumeric(properties.fontSize, 14);
        const fondMenuActif = sanitize(properties.fg_color || '#2563EB');
        const fondMenuBase = sanitize(properties.backgroundColor || 'transparent');
        const texteMenuActif = sanitize(properties.text_color || '#FFFFFF');
        const texteMenuInactif = sanitize(properties.unselected_text_color || '#1E293B');
        const survol = sanitize(properties.hover_color || '#1E4FD8');
        const estActif = properties.selected !== false;
        const fondFinal = estActif ? fondMenuActif : fondMenuBase;
        const couleurTexteFinal = estActif ? texteMenuActif : texteMenuInactif;
        const couleurSurvol = estActif ? sanitize(properties.hover_color || properties.fg_color || '#2563EB') : survol;
        const gestionnaireMenu = `clic_${widgetName}`;
        eventHandlers.push(
          `    def ${gestionnaireMenu}(self):\n` +
          `        """Gestionnaire de clic pour ${texteMenu}."""\n` +
          `        print("${texteMenu} cliqué")\n`
        );
        code += `        self.${widgetName} = ctk.CTkButton(\n`;
        code += `            ${parent},\n`;
        code += `            text="${texteMenu}",\n`;
        code += `            command=self.${gestionnaireMenu},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            corner_radius=${style.borderRadius ?? 12},\n`;
        code += `            fg_color="${fondFinal}",\n`;
        code += `            hover_color="${couleurSurvol}",\n`;
        code += `            text_color="${couleurTexteFinal}",\n`;
        code += `            font=("${policeMenu}", ${tailleMenu}, "bold"),\n`;
        code += `            anchor="w"\n`;
        code += `        )\n`;
        if (properties.icon) {
          code += `        # Ajoutez un CTkImage pour l'icône "${sanitize(properties.icon)}"\n`;
        }
        break;
      }

      case 'table': {
        const colonnes = Array.isArray(properties.columns) && properties.columns.length > 0
          ? properties.columns
          : [
            { id: 'id', label: 'ID', width: 80 },
            { id: 'nom', label: 'Nom', width: 160 },
            { id: 'statut', label: 'Statut', width: 140 },
          ];
        const idsColonnes = colonnes.map((col: any, idx: number) => sanitize(col.id || `col${idx + 1}`));
        const labelsColonnes = colonnes.map((col: any, idx: number) => sanitize(col.label || idsColonnes[idx]));
        const largeursColonnes = colonnes.map((col: any) => col.width || 140);
        const lignesTableau = Array.isArray(properties.rows) && properties.rows.length > 0
          ? properties.rows
          : [
            ['1', 'Alice Martin', 'Confirmé'],
            ['2', 'Bob Dupont', 'En cours'],
            ['3', 'Chloé Leroy', 'Livré'],
          ];
        const lignesNettoyees = lignesTableau.map((ligne: any) => {
          if (Array.isArray(ligne)) {
            const norm = [...ligne];
            while (norm.length < idsColonnes.length) norm.push('');
            return norm.slice(0, idsColonnes.length).map(sanitize);
          }
          return idsColonnes.map((id: string) => sanitize(ligne?.[id] ?? ''));
        });
        const hauteurLigne = properties.rowHeight || 32;
        const fondEntete = sanitize(properties.headerBgColor || '#2563EB');
        const texteEntete = sanitize(properties.headerTextColor || '#FFFFFF');
        const couleurPaire = sanitize(properties.evenRowColor || '#F8FAFC');
        const couleurImpaire = sanitize(properties.oddRowColor || '#FFFFFF');
        const bordureTableau = sanitize(properties.borderColor || '#E2E8F0');

        code += `        self.${widgetName}_colonnes = ${JSON.stringify(idsColonnes)}\n`;
        code += `        self.${widgetName} = ttk.Treeview(\n`;
        code += `            ${parent},\n`;
        code += `            columns=self.${widgetName}_colonnes,\n`;
        code += `            show="headings"\n`;
        code += `        )\n`;
        code += `        style_${widgetName} = ttk.Style()\n`;
        code += `        try:\n`;
        code += `            style_${widgetName}.theme_use("clam")\n`;
        code += `        except Exception:\n`;
        code += `            pass\n`;
        code += `        style_${widgetName}.configure(\n`;
        code += `            "${widgetName}.Treeview",\n`;
        code += `            background="${couleurImpaire}",\n`;
        code += `            fieldbackground="${couleurImpaire}",\n`;
        code += `            foreground="#0F172A",\n`;
        code += `            bordercolor="${bordureTableau}",\n`;
        code += `            rowheight=${hauteurLigne}\n`;
        code += `        )\n`;
        code += `        style_${widgetName}.configure(\n`;
        code += `            "${widgetName}.Treeview.Heading",\n`;
        code += `            background="${fondEntete}",\n`;
        code += `            foreground="${texteEntete}",\n`;
        code += `            relief="flat"\n`;
        code += `        )\n`;
        code += `        style_${widgetName}.map("${widgetName}.Treeview", background=[("selected", "${fondEntete}")])\n`;
        code += `        self.${widgetName}.configure(style="${widgetName}.Treeview")\n`;
        code += `        self.${widgetName}.tag_configure("paire", background="${couleurPaire}")\n`;
        code += `        self.${widgetName}.tag_configure("impaire", background="${couleurImpaire}")\n`;
        code += `        for id_col, en_tete, largeur in zip(self.${widgetName}_colonnes, ${JSON.stringify(labelsColonnes)}, ${JSON.stringify(largeursColonnes)}):\n`;
        code += `            self.${widgetName}.heading(id_col, text=en_tete)\n`;
        code += `            self.${widgetName}.column(id_col, width=largeur, anchor="w")\n`;
        if (properties.showHeaders === false) {
          code += `        for id_col in self.${widgetName}_colonnes:\n`;
          code += `            self.${widgetName}.heading(id_col, text="")\n`;
        }
        code += `        donnees_${widgetName} = ${JSON.stringify(lignesNettoyees)}\n`;
        code += `        for idx, ligne in enumerate(donnees_${widgetName}):\n`;
        code += `            tag = "paire" if idx % 2 == 0 else "impaire"\n`;
        code += `            self.${widgetName}.insert("", "end", values=ligne, tags=(tag,))\n`;

        // Méthode de mise à jour dans eventHandlers (indentation correcte)
        let updateTable = `    def maj_${widgetName}(self, lignes):\n`;
        updateTable += `        """Met à jour les données du tableau ${widgetName}."""\n`;
        updateTable += `        for item in self.${widgetName}.get_children():\n`;
        updateTable += `            self.${widgetName}.delete(item)\n`;
        updateTable += `        for idx, ligne in enumerate(lignes):\n`;
        updateTable += `            tag = "paire" if idx % 2 == 0 else "impaire"\n`;
        updateTable += `            self.${widgetName}.insert("", "end", values=ligne, tags=(tag,))\n`;
        eventHandlers.push(updateTable);
        break;
      }

      case 'chart': {
        const typeGraphe = properties.chartType || 'line';
        const titreGraphe = sanitize(properties.title || 'Graphique');
        const donneesGraphe = Array.isArray(properties.data) ? properties.data : [
          { label: 'A', value: 10 },
          { label: 'B', value: 40 },
          { label: 'C', value: 25 },
        ];
        const labelsGraphe = donneesGraphe.map((d: any) => sanitize(d.label || ''));
        const valeursGraphe = donneesGraphe.map((d: any) => d.value || 0);
        const couleurLigne = properties.lineColor || '#22C55E';
        const remplissage = properties.showFill !== false;
        const grille = properties.showGrid !== false;
        const marqueurs = properties.showMarkers !== false;
        const tailleMarqueur = properties.markerSize || 8;
        const epaisseurLigne = properties.lineWidth || 2;
        const fondGraphe = properties.backgroundColor || '#FFFFFF';
        const texteGraphe = properties.textColor || '#64748B';
        const titreCouleur = properties.titleColor || '#0F172A';
        const markerParam = marqueurs ? "'o'" : "''";

        code += `        # Graphique matplotlib intégré dans CustomTkinter\n`;
        code += `        self.${widgetName}_fig = Figure(\n`;
        code += `            figsize=(${(size.width / 100).toFixed(1)}, ${(size.height / 100).toFixed(1)}),\n`;
        code += `            dpi=100,\n`;
        code += `            facecolor="${fondGraphe}"\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_ax = self.${widgetName}_fig.add_subplot(111)\n`;
        code += `        self.${widgetName}_ax.set_facecolor("${fondGraphe}")\n\n`;
        code += `        # Données du graphique\n`;
        code += `        labels_${widgetName} = ${JSON.stringify(labelsGraphe)}\n`;
        code += `        valeurs_${widgetName} = ${JSON.stringify(valeursGraphe)}\n\n`;

        if (typeGraphe === 'line' || typeGraphe === 'area') {
          code += `        # Graphique en ${typeGraphe === 'area' ? 'aire' : 'ligne'}\n`;
          code += `        self.${widgetName}_ax.plot(\n`;
          code += `            labels_${widgetName}, valeurs_${widgetName},\n`;
          code += `            color="${couleurLigne}",\n`;
          code += `            linewidth=${epaisseurLigne},\n`;
          code += `            marker=${markerParam},\n`;
          code += `            markersize=${tailleMarqueur}\n`;
          code += `        )\n`;
          if (remplissage || typeGraphe === 'area') {
            code += `        self.${widgetName}_ax.fill_between(\n`;
            code += `            labels_${widgetName}, valeurs_${widgetName},\n`;
            code += `            alpha=${typeGraphe === 'area' ? '0.4' : '0.2'},\n`;
            code += `            color="${couleurLigne}"\n`;
            code += `        )\n`;
          }
        } else if (typeGraphe === 'bar') {
          code += `        # Graphique en barres\n`;
          code += `        self.${widgetName}_ax.bar(labels_${widgetName}, valeurs_${widgetName}, color="${couleurLigne}")\n`;
        } else if (typeGraphe === 'pie') {
          const cp1 = properties.pieColor1 || '#4CAF50';
          const cp2 = properties.pieColor2 || '#FFC107';
          const cp3 = properties.pieColor3 || '#E53935';
          code += `        # Graphique en secteurs (Donut)\n`;
          code += `        couleurs_secteurs = ["${cp1}", "${cp2}", "${cp3}"]\n`;
          code += `        self.${widgetName}_ax.pie(\n`;
          code += `            valeurs_${widgetName},\n`;
          code += `            labels=labels_${widgetName},\n`;
          code += `            autopct="%1.1f%%",\n`;
          code += `            startangle=90,\n`;
          code += `            colors=couleurs_secteurs,\n`;
          code += `            wedgeprops={"width": 0.5, "edgecolor": "white"}\n`;
          code += `        )\n`;
        }

        code += `\n        # Configuration du graphique\n`;
        code += `        self.${widgetName}_ax.set_title("${titreGraphe}", color="${titreCouleur}", fontsize=14, fontweight="bold", pad=10)\n`;
        code += `        self.${widgetName}_ax.tick_params(colors="${texteGraphe}")\n`;
        if (grille) {
          code += `        self.${widgetName}_ax.grid(True, linestyle="--", alpha=0.3)\n`;
        }
        code += `        self.${widgetName}_ax.spines["top"].set_visible(False)\n`;
        code += `        self.${widgetName}_ax.spines["right"].set_visible(False)\n`;
        code += `        self.${widgetName}_ax.spines["left"].set_color("${texteGraphe}")\n`;
        code += `        self.${widgetName}_ax.spines["bottom"].set_color("${texteGraphe}")\n\n`;

        // Intégrer dans un CTkFrame (le widget principal pour le placement)
        code += `        # Conteneur pour intégrer le graphique dans CustomTkinter\n`;
        code += `        self.${widgetName} = ctk.CTkFrame(\n`;
        code += `            ${parent},\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height},\n`;
        code += `            fg_color="${fondGraphe}",\n`;
        code += `            corner_radius=${style.borderRadius ?? 16}\n`;
        code += `        )\n`;
        code += `        self.${widgetName}_canvas = FigureCanvasTkAgg(self.${widgetName}_fig, master=self.${widgetName})\n`;
        code += `        self.${widgetName}_canvas.draw()\n`;
        code += `        self.${widgetName}_canvas.get_tk_widget().pack(fill="both", expand=True)\n`;

        // Méthode de mise à jour dans eventHandlers (indentation correcte)
        let updateChart = `    def maj_${widgetName}(self, labels, valeurs):\n`;
        updateChart += `        """Met à jour le graphique ${widgetName}."""\n`;
        updateChart += `        self.${widgetName}_ax.clear()\n`;
        if (typeGraphe === 'line' || typeGraphe === 'area') {
          updateChart += `        self.${widgetName}_ax.plot(\n`;
          updateChart += `            labels, valeurs,\n`;
          updateChart += `            color="${couleurLigne}",\n`;
          updateChart += `            linewidth=${epaisseurLigne},\n`;
          updateChart += `            marker=${markerParam},\n`;
          updateChart += `            markersize=${tailleMarqueur}\n`;
          updateChart += `        )\n`;
          if (remplissage || typeGraphe === 'area') {
            updateChart += `        self.${widgetName}_ax.fill_between(\n`;
            updateChart += `            labels, valeurs,\n`;
            updateChart += `            alpha=${typeGraphe === 'area' ? '0.4' : '0.2'},\n`;
            updateChart += `            color="${couleurLigne}"\n`;
            updateChart += `        )\n`;
          }
        } else if (typeGraphe === 'bar') {
          updateChart += `        self.${widgetName}_ax.bar(labels, valeurs, color="${couleurLigne}")\n`;
        } else if (typeGraphe === 'pie') {
          const cp1 = properties.pieColor1 || '#4CAF50';
          const cp2 = properties.pieColor2 || '#FFC107';
          const cp3 = properties.pieColor3 || '#E53935';
          updateChart += `        couleurs = ["${cp1}", "${cp2}", "${cp3}"]\n`;
          updateChart += `        self.${widgetName}_ax.pie(\n`;
          updateChart += `            valeurs, labels=labels,\n`;
          updateChart += `            autopct="%1.1f%%", startangle=90,\n`;
          updateChart += `            colors=couleurs,\n`;
          updateChart += `            wedgeprops={"width": 0.5, "edgecolor": "white"}\n`;
          updateChart += `        )\n`;
        }
        updateChart += `        self.${widgetName}_ax.set_title("${titreGraphe}", color="${titreCouleur}", fontsize=14, fontweight="bold", pad=10)\n`;
        updateChart += `        self.${widgetName}_ax.tick_params(colors="${texteGraphe}")\n`;
        if (grille) {
          updateChart += `        self.${widgetName}_ax.grid(True, linestyle="--", alpha=0.3)\n`;
        }
        updateChart += `        self.${widgetName}_ax.spines["top"].set_visible(False)\n`;
        updateChart += `        self.${widgetName}_ax.spines["right"].set_visible(False)\n`;
        updateChart += `        self.${widgetName}_ax.spines["left"].set_color("${texteGraphe}")\n`;
        updateChart += `        self.${widgetName}_ax.spines["bottom"].set_color("${texteGraphe}")\n`;
        updateChart += `        self.${widgetName}_canvas.draw()\n`;
        eventHandlers.push(updateChart);
        break;
      }

      case 'datepicker': {
        const motifDate = sanitize(properties.date_pattern || 'dd/mm/yyyy');
        const dpFondEntete = sanitize(properties.headersbackground || '#2563EB');
        const dpTexteEntete = sanitize(properties.headersforeground || '#FFFFFF');
        const dpFondSelect = sanitize(properties.selectbackground || '#2563EB');
        const dpTexteSelect = sanitize(properties.selectforeground || '#FFFFFF');
        const dpFond = sanitize(properties.background || '#FFFFFF');
        const dpTexte = sanitize(properties.foreground || '#000000');
        const dpBordure = sanitize(properties.bordercolor || '#565B5E');
        const dpPolice = sanitize(properties.font?.[0] || 'Roboto');
        const dpTaillePolice = parseNumeric(properties.font?.[1], 13);
        const dpEtat = properties.state === 'disabled' ? 'disabled' : 'normal';
        const dpPremierJour = properties.firstweekday === 'sunday' ? 'sunday' : 'monday';
        const dpNumSemaine = properties.showweeknumbers === true ? 'True' : 'False';
        const dpLocale = sanitize(properties.locale || 'fr_FR');
        const dpLargeurCar = Math.max(10, Math.floor(size.width / 10));

        code += `        # Sélecteur de date (nécessite : pip install tkcalendar)\n`;
        code += `        if DateEntry is not None:\n`;
        code += `            self.${widgetName} = DateEntry(\n`;
        code += `                ${parent},\n`;
        code += `                date_pattern="${motifDate}",\n`;
        code += `                background="${dpFondEntete}",\n`;
        code += `                foreground="${dpTexte}",\n`;
        code += `                headersbackground="${dpFondEntete}",\n`;
        code += `                headersforeground="${dpTexteEntete}",\n`;
        code += `                selectbackground="${dpFondSelect}",\n`;
        code += `                selectforeground="${dpTexteSelect}",\n`;
        code += `                normalbackground="${dpFond}",\n`;
        code += `                normalforeground="${dpTexte}",\n`;
        code += `                bordercolor="${dpBordure}",\n`;
        code += `                font=("${dpPolice}", ${dpTaillePolice}),\n`;
        code += `                state="${dpEtat}",\n`;
        code += `                firstweekday="${dpPremierJour}",\n`;
        code += `                showweeknumbers=${dpNumSemaine},\n`;
        code += `                locale="${dpLocale}",\n`;
        code += `                width=${dpLargeurCar}\n`;
        code += `            )\n`;
        code += `        else:\n`;
        code += `            # Alternative si tkcalendar n'est pas installé\n`;
        code += `            self.${widgetName} = ctk.CTkEntry(\n`;
        code += `                ${parent},\n`;
        code += `                placeholder_text="${motifDate}",\n`;
        code += `                width=${size.width},\n`;
        code += `                height=${size.height},\n`;
        code += `                font=("${dpPolice}", ${dpTaillePolice})\n`;
        code += `            )\n`;
        code += `            self.${widgetName}.insert(0, datetime.date.today().strftime("%d/%m/%Y"))\n`;
        break;
      }

      default:
        code += `        # Widget de type "${type}" non supporté nativement\n`;
        code += `        self.${widgetName} = ctk.CTkLabel(\n`;
        code += `            ${parent},\n`;
        code += `            text="[${type}]",\n`;
        code += `            width=${size.width},\n`;
        code += `            height=${size.height}\n`;
        code += `        )\n`;
    }

    // ── Positionnement selon le mode de layout ──
    if (skipPositioning) {
      // Positionnement déjà géré dans le switch (ex: passwordentry)
    } else {
      // Check if parent has auto-layout enabled
      const parentWidget = widget.parentId ? allWidgets.find(w => w.id === widget.parentId) : null;
      const parentAutoLayout: AutoLayoutConfig | undefined = parentWidget?.autoLayout;
      const isInAutoLayout = parentAutoLayout?.enabled === true;

      if (isInAutoLayout && parentAutoLayout) {
        // ── Auto Layout: use pack() ──
        const dir = parentAutoLayout.direction;
        const childOverrides = widget.autoLayoutChild;
        const fillW = childOverrides?.fill_width ?? false;
        const fillH = childOverrides?.fill_height ?? false;
        const alignment = childOverrides?.align_self ?? parentAutoLayout.alignment;

        const side = dir === 'vertical' ? '"top"' : '"left"';
        let fill = '"none"';
        let expand = 'False';

        if (dir === 'vertical') {
          if (fillW || alignment === 'stretch') fill = '"x"';
          if (fillH) { fill = '"both"'; expand = 'True'; }
        } else {
          if (fillH || alignment === 'stretch') fill = '"y"';
          if (fillW) { fill = '"both"'; expand = 'True'; }
        }

        // Anchor for alignment (cross-axis)
        let anchor = '';
        if (alignment === 'center') anchor = '';
        else if (alignment === 'start') anchor = dir === 'vertical' ? ', anchor="w"' : ', anchor="n"';
        else if (alignment === 'end') anchor = dir === 'vertical' ? ', anchor="e"' : ', anchor="s"';

        const spacing = parentAutoLayout.spacing;
        const padx = dir === 'horizontal' ? Math.round(spacing / 2) : 0;
        const pady = dir === 'vertical' ? Math.round(spacing / 2) : 0;

        code += `        self.${widgetName}.pack(side=${side}, fill=${fill}, expand=${expand}`;
        if (padx > 0) code += `, padx=${padx}`;
        if (pady > 0) code += `, pady=${pady}`;
        code += `${anchor})\n\n`;
      } else if (layoutMode === 'absolute') {
        const relPos = getRelativePosition(widget, allWidgets);
        const placeX = Math.max(0, Math.round(relPos.x));
        const placeY = Math.max(0, Math.round(relPos.y));

        // Phase 3: Constraints — use place() with relative positioning for stretching
        // IMPORTANT: never use grid() here because other widgets use place() on the same parent.
        // Mixing geometry managers (grid + place) on the same parent crashes tkinter.
        const constraints: WidgetConstraints | undefined = widget.constraints;
        const hasConstraints = constraints && (constraints.top || constraints.bottom || constraints.left || constraints.right);
        const isResizable = canvasSettings.resizable;

        if (hasConstraints && isResizable && !widget.parentId) {
          // Use place() with relative coords for constraint-based responsive layout
          const placeArgs: string[] = [];

          // CTk interdit width/height/relwidth/relheight dans place().
          // On utilise place(x, y) uniquement et configure() pour le redimensionnement.
          placeArgs.push(`x=${placeX}`);
          placeArgs.push(`y=${placeY}`);

          code += `        self.${widgetName}.place(${placeArgs.join(', ')})\n\n`;
        } else {
          // Détecter si le widget est collé aux bords du canvas/parent
          // pour utiliser relx/rely + anchor au lieu de coordonnées absolues.
          // CTk interdit width/height dans place(), donc relx=1.0 + anchor="ne"
          // garantit que le widget touche exactement le bord droit.
          const parentW = widget.parentId
            ? (() => { const p = allWidgets.find(w => w.id === widget.parentId); return p ? p.size.width : canvasSettings.width; })()
            : canvasSettings.width;
          const parentH = widget.parentId
            ? (() => { const p = allWidgets.find(w => w.id === widget.parentId); return p ? p.size.height : contentHeight; })()
            : contentHeight;

          const EDGE_TOLERANCE = 3;
          const flushRight = Math.abs((placeX + Math.round(size.width)) - parentW) < EDGE_TOLERANCE;
          const flushBottom = Math.abs((placeY + Math.round(size.height)) - parentH) < EDGE_TOLERANCE;
          const flushLeft = placeX < EDGE_TOLERANCE;
          const flushTop = placeY < EDGE_TOLERANCE;

          // CTk interdit width/height dans place() mais autorise relwidth/relheight.
          // Si le widget couvre toute la largeur ou hauteur, on utilise relwidth/relheight=1.0
          // pour garantir qu'il n'y a aucun gap dû au scaling.
          const fullHeight = flushTop && flushBottom;
          const fullWidth = flushLeft && flushRight;

          const placeParams: string[] = [];

          // Position X
          if (flushRight) {
            placeParams.push('relx=1.0');
          } else {
            placeParams.push(`x=${placeX}`);
          }

          // Position Y
          if (flushBottom && !flushTop) {
            placeParams.push('rely=1.0');
          } else {
            placeParams.push(`y=${placeY}`);
          }

          // Taille relative (si couvre tout un axe)
          if (fullHeight) {
            placeParams.push('relheight=1.0');
          }
          if (fullWidth) {
            placeParams.push('relwidth=1.0');
          }

          // Anchor (point d'ancrage du widget)
          if (flushRight && (flushBottom && !flushTop)) {
            placeParams.push('anchor="se"');
          } else if (flushRight) {
            placeParams.push('anchor="ne"');
          } else if (flushBottom && !flushTop) {
            placeParams.push('anchor="sw"');
          }

          code += `        self.${widgetName}.place(${placeParams.join(', ')})\n\n`;
        }
      } else if (layoutMode === 'centered') {
        const relx = ((position.x + size.width / 2) / canvasSettings.width).toFixed(3);
        const rely = ((position.y + size.height / 2) / contentHeight).toFixed(3);
        code += `        self.${widgetName}.place(relx=${relx}, rely=${rely}, anchor="center")\n\n`;
      } else if (layoutMode === 'responsive') {
        const remplissage = type === 'table' ? '"both"' : '"x"';
        code += `        self.${widgetName}.pack(fill=${remplissage}, expand=${type === 'table' ? 'True' : 'False'}, pady=10)\n\n`;
      }
    }

    return code;
  };

  /**
   * Génère automatiquement des méthodes utilitaires de logique métier
   * en analysant l'arbre de widgets présents sur le canvas.
   */
  const generateLogicHelpers = (
    allWidgets: WidgetData[],
    idToVarName: Record<string, string>
  ): string => {
    let logic = '';

    // ── 1. Collecte de formulaire ──
    // Détecte les widgets d'entrée (entry, textbox, checkbox, switch, combobox, optionmenu, radiobutton, slider, datepicker)
    const inputWidgets = allWidgets.filter(w =>
      ['entry', 'passwordentry', 'textbox', 'checkbox', 'switch', 'combobox', 'optionmenu', 'radiobutton', 'slider', 'datepicker'].includes(w.type)
    );

    if (inputWidgets.length > 0) {
      logic += `\n    # ── Collecte des données du formulaire ──\n\n`;
      logic += `    def collecter_donnees(self):\n`;
      logic += `        """Collecte les valeurs de tous les champs du formulaire."""\n`;
      logic += `        donnees = {}\n`;

      inputWidgets.forEach(w => {
        const varName = idToVarName[w.id] || w.type;
        const label = w.properties?.text || w.properties?.placeholder_text || varName;
        const safeLabel = String(label).replace(/"/g, '\\"');

        switch (w.type) {
          case 'entry':
            logic += `        donnees["${safeLabel}"] = self.${varName}.get()\n`;
            break;
          case 'passwordentry':
            logic += `        donnees["${safeLabel}"] = self.${varName}_saisie.get()\n`;
            break;
          case 'textbox':
            logic += `        donnees["${safeLabel}"] = self.${varName}.get("1.0", "end-1c")\n`;
            break;
          case 'checkbox':
          case 'switch':
            logic += `        donnees["${safeLabel}"] = self.${varName}.get()\n`;
            break;
          case 'combobox':
          case 'optionmenu':
            logic += `        donnees["${safeLabel}"] = self.${varName}.get()\n`;
            break;
          case 'radiobutton':
            logic += `        donnees["${safeLabel}"] = self.${varName}.cget("value")\n`;
            break;
          case 'slider':
            logic += `        donnees["${safeLabel}"] = self.${varName}.get()\n`;
            break;
          case 'datepicker':
            logic += `        try:\n`;
            logic += `            donnees["${safeLabel}"] = self.${varName}.get()\n`;
            logic += `        except Exception:\n`;
            logic += `            donnees["${safeLabel}"] = ""\n`;
            break;
        }
      });

      logic += `        return donnees\n`;

      // Méthode de réinitialisation
      logic += `\n    def reinitialiser_formulaire(self):\n`;
      logic += `        """Réinitialise tous les champs du formulaire."""\n`;

      inputWidgets.forEach(w => {
        const varName = idToVarName[w.id] || w.type;
        switch (w.type) {
          case 'entry':
            logic += `        self.${varName}.delete(0, "end")\n`;
            break;
          case 'passwordentry':
            logic += `        self.${varName}_saisie.delete(0, "end")\n`;
            break;
          case 'textbox':
            logic += `        self.${varName}.delete("1.0", "end")\n`;
            break;
          case 'checkbox':
            logic += `        self.${varName}.deselect()\n`;
            break;
          case 'switch':
            logic += `        self.${varName}.deselect()\n`;
            break;
          case 'slider':
            logic += `        self.${varName}.set(0)\n`;
            break;
        }
      });
    }

    // ── 2. Validation des entrées ──
    const entryWidgets = allWidgets.filter(w => ['entry', 'passwordentry'].includes(w.type));

    if (entryWidgets.length > 0) {
      logic += `\n    # ── Validation des entrées ──\n\n`;
      logic += `    def valider_champs(self):\n`;
      logic += `        """Valide les champs obligatoires. Retourne (True, []) si OK, (False, erreurs) sinon."""\n`;
      logic += `        erreurs = []\n`;

      entryWidgets.forEach(w => {
        const varName = idToVarName[w.id] || w.type;
        const label = w.properties?.placeholder_text || w.properties?.text || varName;
        const safeLabel = String(label).replace(/"/g, '\\"');
        const getter = w.type === 'passwordentry' ? `self.${varName}_saisie.get()` : `self.${varName}.get()`;

        logic += `        if not ${getter}.strip():\n`;
        logic += `            erreurs.append("${safeLabel} est requis")\n`;
      });

      logic += `        return len(erreurs) == 0, erreurs\n`;

      // Méthode utilitaire de validation email
      const hasEmailLikeEntry = entryWidgets.some(w => {
        const placeholder = String(w.properties?.placeholder_text || '').toLowerCase();
        return placeholder.includes('email') || placeholder.includes('mail') || placeholder.includes('courriel');
      });

      if (hasEmailLikeEntry) {
        logic += `\n    @staticmethod\n`;
        logic += `    def valider_email(email):\n`;
        logic += `        """Vérifie si l'email a un format valide."""\n`;
        logic += `        import re\n`;
        logic += `        motif = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'\n`;
        logic += `        return bool(re.match(motif, email))\n`;
      }
    }

    // ── 3. Navigation sidebar (menuItems) ──
    const menuItems = allWidgets.filter(w => w.type === 'menuItem');
    const frames = allWidgets.filter(w => w.type === 'frame' && !w.parentId);

    if (menuItems.length >= 2 && frames.length >= 2) {
      logic += `\n    # ── Navigation entre les vues ──\n\n`;
      logic += `    def naviguer_vers(self, nom_vue):\n`;
      logic += `        """Affiche la vue demandée et masque les autres."""\n`;
      logic += `        vues = {\n`;

      // On associe les frames principales (sans parent) aux noms des menuItems
      const maxAssoc = Math.min(menuItems.length, frames.length);
      for (let i = 0; i < maxAssoc; i++) {
        const menuVar = idToVarName[menuItems[i].id] || 'menu';
        const frameVar = idToVarName[frames[i].id] || 'frame';
        const menuText = String(menuItems[i].properties?.text || menuVar).replace(/"/g, '\\"');
        logic += `            "${menuText}": self.${frameVar},\n`;
      }

      logic += `        }\n`;
      logic += `        for nom, vue in vues.items():\n`;
      logic += `            if nom == nom_vue:\n`;
      logic += `                vue.place(relx=0, rely=0)  # ou .pack()/.grid() selon votre layout\n`;
      logic += `            else:\n`;
      logic += `                vue.place_forget()\n`;
    }

    // ── 4. Persistance des données (JSON) ──
    if (inputWidgets.length > 0) {
      logic += `\n    # ── Persistance des données ──\n\n`;
      logic += `    def sauvegarder_donnees(self, chemin_fichier="donnees.json"):\n`;
      logic += `        """Sauvegarde les données du formulaire dans un fichier JSON."""\n`;
      logic += `        import json\n`;
      logic += `        donnees = self.collecter_donnees()\n`;
      logic += `        with open(chemin_fichier, "w", encoding="utf-8") as f:\n`;
      logic += `            json.dump(donnees, f, ensure_ascii=False, indent=2)\n`;
      logic += `        print(f"Données sauvegardées dans {chemin_fichier}")\n`;

      logic += `\n    def charger_donnees(self, chemin_fichier="donnees.json"):\n`;
      logic += `        """Charge les données depuis un fichier JSON."""\n`;
      logic += `        import json\n`;
      logic += `        import os\n`;
      logic += `        if not os.path.exists(chemin_fichier):\n`;
      logic += `            print(f"Fichier {chemin_fichier} introuvable")\n`;
      logic += `            return None\n`;
      logic += `        with open(chemin_fichier, "r", encoding="utf-8") as f:\n`;
      logic += `            donnees = json.load(f)\n`;
      logic += `        print(f"Données chargées depuis {chemin_fichier}")\n`;
      logic += `        return donnees\n`;
    }

    return logic;
  };

  return { exportToPython };
};
