import { WidgetType, WidgetCategory } from '@/types/widget';
import {
  Box,
  CheckSquare,
  ChevronDown,
  Circle,
  FileText,
  FolderOpen,
  Gauge,
  Image as ImageIcon,
  ListFilter,
  Menu,
  MousePointerClick,
  ScrollText,
  SlidersHorizontal,
  GripVertical,
  TextCursor,
  ToggleRight,
  Type,
} from 'lucide-react';
import { ICON_LIBRARY } from './icons';

/**
 * WIDGETS NATIFS CUSTOMTKINTER OFFICIELS
 * 
 * Ce fichier contient UNIQUEMENT les widgets natifs de CustomTkinter
 * selon la documentation officielle: https://customtkinter.tomschimansky.com/documentation/widgets/
 * 
 * Aucun widget personnalisé. 100% conforme à la bibliothèque officielle.
 */

export const WIDGET_DEFINITIONS: WidgetType[] = [
  // ========================================
  // WIDGETS DE BASE
  // ========================================

  {
    type: 'label',
    name: 'Label',
    description: 'Afficher du texte statique',
    icon: Type,
    defaultSize: { width: 100, height: 32 },
    defaultProperties: {
      text: 'Label',
      text_color: null, // Auto (theme)
      fg_color: 'transparent',
      font: ['Roboto', 13],
      anchor: 'center',
      compound: 'center',
      corner_radius: 0
    },
    category: 'Basiques'
  },

  {
    type: 'button',
    name: 'Bouton',
    description: 'Bouton cliquable',
    icon: MousePointerClick,
    popular: true,
    defaultSize: { width: 120, height: 40 },
    defaultProperties: {
      text: 'CTkButton',
      fg_color: '#0F3460',
      hover_color: null, // Auto (theme)
      border_color: null,
      border_width: 0,
      text_color: null, // Auto (theme)
      corner_radius: 0,
      font: ['Roboto', 13],
      state: 'normal',
      hover: true
    },
    category: 'Basiques'
  },

  {
    type: 'entry',
    name: 'Champ de texte',
    description: 'Saisie de texte sur une ligne',
    icon: TextCursor,
    defaultSize: { width: 200, height: 40 },
    defaultProperties: {
      placeholder_text: 'CTkEntry',
      fg_color: null, // Auto (theme)
      text_color: null, // Auto (theme)
      placeholder_text_color: '#000000',
      border_color: '#000000',
      border_width: 1,
      corner_radius: 0,
      font: ['Roboto', 13],
      state: 'normal',
      show: null // null pour texte normal, "•" pour mot de passe
    },
    category: 'Basiques'
  },

  {
    type: 'passwordentry',
    name: 'Champ mot de passe',
    description: 'Champ de saisie avec bouton afficher/masquer',
    icon: TextCursor,
    defaultSize: { width: 240, height: 40 },
    defaultProperties: {
      placeholder_text: 'Mot de passe',
      fg_color: null,
      text_color: null,
      placeholder_text_color: '#000000',
      border_color: '#000000',
      border_width: 1,
      corner_radius: 0,
      font: ['Roboto', 13],
      state: 'normal',
      show_button_text: '👁',
      hide_button_text: '🙈',
    },
    category: 'Basiques'
  },

  {
    type: 'textbox',
    name: 'Zone de texte',
    description: 'Saisie de texte multi-lignes',
    icon: FileText,
    defaultSize: { width: 240, height: 120 },
    defaultProperties: {
      fg_color: '#EBEBEB',
      text_color: null, // Auto (theme)
      border_color: null,
      border_width: 0,
      corner_radius: 0,
      font: ['Roboto', 13],
      scrollbar_button_color: null, // Auto (theme)
      wrap: 'word', // 'none', 'char', 'word'
      activate_scrollbars: true,
      state: 'normal'
    },
    category: 'Basiques'
  },

  {
    type: 'progressbar',
    name: 'Barre de progression',
    description: 'Indicateur de progression',
    icon: Gauge,
    defaultSize: { width: 200, height: 20 },
    defaultProperties: {
      fg_color: null, // Auto (theme)
      progress_color: null, // Auto (theme)
      border_color: null,
      border_width: 0,
      corner_radius: 0,
      progress: 70,
      mode: 'determinate', // 'determinate' ou 'indeterminate'
      determinate_speed: 1,
      indeterminate_speed: 1,
      orientation: 'horizontal' // 'horizontal' ou 'vertical'
    },
    category: 'Basiques'
  },

  {
    type: 'image_label',
    name: 'Label avec Image',
    description: 'Label avec CTkImage pour afficher des images',
    icon: ImageIcon,
    defaultSize: { width: 200, height: 200 },
    defaultProperties: {
      text: '',
      image_path: '',
      image_data: '', // Base64 pour image locale
      image_size: [200, 200], // Taille de l'image [width, height]
      compound: 'center', // 'top', 'bottom', 'left', 'right', 'center'
      fg_color: 'transparent',
      text_color: null,
      corner_radius: 0,
      font: ['Roboto', 13],
      anchor: 'center'
    },
    category: 'Basiques'
  },

  // ========================================
  // WIDGETS D'INTERACTION
  // ========================================

  {
    type: 'checkbox',
    name: 'Case à cocher',
    description: 'Sélection multiple activable/désactivable',
    icon: CheckSquare,
    defaultSize: { width: 120, height: 24 },
    defaultProperties: {
      text: 'CTkCheckBox',
      fg_color: '#0F3460',
      hover_color: null, // Auto (theme)
      border_color: '#0F3460',
      checkmark_color: null, // Auto (theme)
      text_color: null, // Auto (theme)
      corner_radius: 0,
      border_width: 1,
      checkbox_width: 24,
      checkbox_height: 24,
      font: ['Roboto', 13],
      state: 'normal',
      onvalue: 1,
      offvalue: 0
    },
    category: 'Interactions'
  },

  {
    type: 'radiobutton',
    name: 'Bouton radio',
    description: 'Choix unique parmi plusieurs options',
    icon: Circle,
    defaultSize: { width: 120, height: 24 },
    defaultProperties: {
      text: 'CTkRadioButton',
      fg_color: '#0F3460',
      hover_color: null, // Auto (theme)
      border_color: '#0F3460',
      text_color: null, // Auto (theme)
      corner_radius: 1000, // Cercle
      border_width_unchecked: 1,
      border_width_checked: 1,
      radiobutton_width: 24,
      radiobutton_height: 24,
      font: ['Roboto', 13],
      state: 'normal',
      value: 0
    },
    category: 'Interactions'
  },

  {
    type: 'switch',
    name: 'Interrupteur',
    description: 'Interrupteur activé/désactivé',
    icon: ToggleRight,
    popular: true,
    defaultSize: { width: 100, height: 24 },
    defaultProperties: {
      text: 'CTkSwitch',
      fg_color: null, // Auto (theme)
      progress_color: null, // Auto (theme) - Couleur quand activé
      button_color: null, // Auto (theme)
      button_hover_color: null, // Auto (theme)
      text_color: null, // Auto (theme)
      corner_radius: 1000,
      button_length: 0, // 0 = auto
      switch_width: 36,
      switch_height: 20,
      font: ['Roboto', 13],
      state: 'normal',
      onvalue: 1,
      offvalue: 0
    },
    category: 'Interactions'
  },

  {
    type: 'combobox',
    name: 'Liste déroulante',
    description: 'Liste de choix éditable',
    icon: ListFilter,
    defaultSize: { width: 200, height: 40 },
    defaultProperties: {
      values: ['Option 1', 'Option 2', 'Option 3'],
      fg_color: '#0F3460',
      border_color: null, // Auto (theme)
      button_color: null, // Auto (theme)
      button_hover_color: null, // Auto (theme)
      text_color: '#FFFFFF',
      dropdown_fg_color: null, // Auto (theme)
      dropdown_hover_color: null, // Auto (theme)
      dropdown_text_color: null, // Auto (theme)
      corner_radius: 0,
      border_width: 0,
      font: ['Roboto', 13],
      dropdown_font: ['Roboto', 13],
      state: 'normal',
      justify: 'left'
    },
    category: 'Interactions'
  },

  {
    type: 'optionmenu',
    name: 'Menu de sélection',
    description: 'Liste de choix fixe',
    icon: ChevronDown,
    defaultSize: { width: 200, height: 40 },
    defaultProperties: {
      values: ['Option 1', 'Option 2', 'Option 3'],
      fg_color: '#0F3460',
      button_color: null, // Auto (theme)
      button_hover_color: null, // Auto (theme)
      text_color: '#FFFFFF',
      dropdown_fg_color: null, // Auto (theme)
      dropdown_hover_color: null, // Auto (theme)
      dropdown_text_color: null, // Auto (theme)
      corner_radius: 0,
      font: ['Roboto', 13],
      dropdown_font: ['Roboto', 13],
      state: 'normal',
      anchor: 'w',
      dynamic_resizing: true
    },
    category: 'Interactions'
  },

  {
    type: 'segmentedbutton',
    name: 'Boutons segmentés',
    description: 'Sélection par segments',
    icon: Menu,
    defaultSize: { width: 300, height: 40 },
    defaultProperties: {
      values: ['Option 1', 'Option 2', 'Option 3'],
      fg_color: null, // Auto (theme)
      selected_color: null, // Auto (theme)
      selected_hover_color: null, // Auto (theme)
      unselected_color: null, // Auto (theme)
      unselected_hover_color: null, // Auto (theme)
      text_color: null, // Auto (theme)
      text_color_disabled: null, // Auto (theme)
      corner_radius: 0,
      border_width: 0,
      font: ['Roboto', 13],
      state: 'normal',
      dynamic_resizing: true
    },
    category: 'Interactions'
  },

  {
    type: 'slider',
    name: 'Curseur',
    description: 'Sélection de valeur par glissement',
    icon: SlidersHorizontal,
    defaultSize: { width: 200, height: 20 },
    defaultProperties: {
      from_: 0,
      to: 100,
      number_of_steps: null, // null = continu
      fg_color: null, // Auto (theme)
      progress_color: null, // Auto (theme)
      button_color: null, // Auto (theme)
      button_hover_color: null, // Auto (theme)
      corner_radius: 0,
      button_corner_radius: 1000,
      border_width: 0,
      state: 'normal',
      orientation: 'horizontal' // 'horizontal' ou 'vertical'
    },
    category: 'Interactions'
  },

  {
    type: 'scrollbar',
    name: 'Barre de défilement',
    description: 'Barre de défilement personnalisable',
    icon: GripVertical,
    defaultSize: { width: 16, height: 200 },
    defaultProperties: {
      fg_color: null, // Auto (theme)
      button_color: null, // Auto (theme)
      button_hover_color: null, // Auto (theme)
      corner_radius: 1000,
      border_spacing: 2,
      minimum_pixel_length: 20,
      orientation: 'vertical' // 'vertical' ou 'horizontal'
    },
    category: 'Interactions'
  },

  // ========================================
  // CONTENEURS
  // ========================================

  {
    type: 'frame',
    name: 'Conteneur',
    description: 'Cadre pour grouper des widgets',
    icon: Box,
    defaultSize: { width: 300, height: 200 },
    defaultProperties: {
      fg_color: '#DAEBFF',
      border_color: null,
      border_width: 0,
      corner_radius: 0
    },
    category: 'Conteneurs'
  },

  {
    type: 'scrollableframe',
    name: 'Conteneur défilant',
    description: 'Cadre avec barre de défilement',
    icon: ScrollText,
    defaultSize: { width: 300, height: 400 },
    defaultProperties: {
      fg_color: '#DAEBFF',
      border_color: null,
      border_width: 0,
      corner_radius: 0,
      scrollbar_fg_color: null, // Auto (theme)
      scrollbar_button_color: null, // Auto (theme)
      scrollbar_button_hover_color: null, // Auto (theme)
      label_fg_color: null, // Couleur du label (si label_text défini)
      label_text_color: null, // Auto (theme)
      label_text: '', // Texte du label en haut
      label_font: ['Roboto', 13],
      label_anchor: 'center',
      orientation: 'vertical', // 'vertical' ou 'horizontal'
    },
    category: 'Conteneurs'
  },

  {
    type: 'tabview',
    name: 'Onglets',
    description: 'Navigation par onglets',
    icon: FolderOpen,
    defaultSize: { width: 400, height: 300 },
    defaultProperties: {
      fg_color: null, // Auto (theme)
      border_color: null,
      border_width: 0,
      corner_radius: 0,
      segmented_button_fg_color: null, // Auto (theme)
      segmented_button_selected_color: null, // Auto (theme)
      segmented_button_selected_hover_color: null, // Auto (theme)
      segmented_button_unselected_color: null, // Auto (theme)
      segmented_button_unselected_hover_color: null, // Auto (theme)
      text_color: null, // Auto (theme)
      text_color_disabled: null, // Auto (theme)
      anchor: 'n', // Position des onglets: 'n', 's', 'e', 'w'
      state: 'normal',
      // Note: Les onglets sont créés avec .add("tab_name") en Python
      tabs: ['Tab 1', 'Tab 2'] // Onglets par défaut
    },
    category: 'Conteneurs'
  },
];

export const COMPOSITE_WIDGET_DEFINITIONS: WidgetType[] = [
  {
    type: 'statCard',
    name: 'Carte Statistique',
    description: 'Carte avec titre, valeur et icône',
    icon: ICON_LIBRARY.barChart3,
    defaultSize: { width: 260, height: 140 },
    defaultProperties: {
      title: 'Total Patients',
      value: '123',
      caption: 'Ce mois',
      showIcon: true,
      icon: 'users',
      iconColor: null, // Auto (theme)
      backgroundColor: null, // Auto (theme)
      accentColor: null, // Auto (theme)
      titleColor: null, // Auto (theme)
      valueColor: null, // Auto (theme)
      captionColor: null, // Auto (theme)
      titleFont: 'Poppins',
      valueFont: 'Poppins',
      captionFont: 'Poppins',
      titleFontSize: 13,
      valueFontSize: 32,
      captionFontSize: 12,
      iconSize: 28,
    },
    category: 'Composites',
  },
  {
    type: 'table',
    name: 'Tableau de données',
    description: 'Tableau stylisé pour afficher des listes',
    icon: ICON_LIBRARY.table,
    defaultSize: { width: 640, height: 320 },
    defaultProperties: {
      showHeaders: true,
      alternateRowColors: true,
      enableScroll: true,
      rowHeight: 36,
      headerBgColor: null, // Auto (theme)
      headerTextColor: null, // Auto (theme)
      evenRowColor: null, // Auto (theme)
      oddRowColor: null, // Auto (theme)
      borderColor: null, // Auto (theme)
      borderWidth: 1,
      columns: [
        { id: 'id', label: 'ID', width: 80 },
        { id: 'name', label: 'Nom', width: 160 },
        { id: 'status', label: 'Statut', width: 140 },
      ],
      rows: [
        ['1', 'Alice Martin', 'Confirmé'],
        ['2', 'Bob Dupont', 'En cours'],
        ['3', 'Chloé Leroy', 'Livré'],
      ],
    },
    category: 'Composites',
  },
  {
    type: 'menuItem',
    name: 'Menu latéral',
    description: 'Bouton de navigation avec icône',
    icon: ICON_LIBRARY.layoutDashboard,
    defaultSize: { width: 220, height: 48 },
    defaultProperties: {
      text: 'Dashboard',
      icon: 'layoutDashboard',
      iconSize: 20,
      selected: true,
      fg_color: '#2563EB',
      text_color: '#FFFFFF',
      hover_color: '#1E4FD8',
      backgroundColor: 'transparent',
      unselected_text_color: '#1E293B',
      fontFamily: 'Poppins',
      fontSize: 14,
      iconColor: '#FFFFFF',
      cornerRadius: 0,
    },
    category: 'Composites',
  },
  {
    type: 'chart',
    name: 'Graphique',
    description: 'Graphique matplotlib (ligne, barre, etc.)',
    icon: ICON_LIBRARY.barChart3,
    defaultSize: { width: 400, height: 280 },
    defaultProperties: {
      chartType: 'line', // 'line', 'bar', 'pie'
      title: 'Évolution des Ventes',
      xLabel: '',
      yLabel: '',
      data: [
        { label: 'Lun', value: 10 },
        { label: 'Mar', value: 100 },
        { label: 'Mer', value: 120 },
        { label: 'Jeu', value: 180 },
        { label: 'Ven', value: 200 },
        { label: 'Sam', value: 220 },
        { label: 'Dim', value: 190 },
      ],
      lineColor: '#22C55E',
      fillColor: '#22C55E20',
      showFill: true,
      showGrid: true,
      showMarkers: true,
      markerSize: 8,
      lineWidth: 2,
      backgroundColor: null, // Auto (theme)
      textColor: null, // Auto (theme)
      titleColor: null, // Auto (theme)
      gridColor: null, // Auto (theme)
      fontFamily: 'Poppins',
      titleFontSize: 16,
      labelFontSize: 12,
      cornerRadius: 16,
    },
    category: 'Composites',
  },
  {
    type: 'datepicker',
    name: 'Sélecteur de date',
    description: 'Champ avec calendrier pour sélectionner une date',
    icon: ICON_LIBRARY.calendar,
    defaultSize: { width: 200, height: 40 },
    defaultProperties: {
      date_pattern: 'dd/mm/yyyy',
      background: null, // Auto (theme)
      foreground: null, // Auto (theme)
      bordercolor: null, // Auto (theme)
      headersbackground: null, // Auto (theme)
      headersforeground: null, // Auto (theme)
      selectbackground: null, // Auto (theme)
      selectforeground: null, // Auto (theme)
      font: ['Roboto', 13],
      state: 'normal',
      firstweekday: 'monday', // 'monday' ou 'sunday'
      showweeknumbers: false,
      locale: 'fr_FR', // Locale pour les noms de mois/jours
    },
    category: 'Composites',
  },
  {
    type: 'productCard',
    name: 'Carte Produit',
    description: 'Carte avec image, nom et prix du produit',
    icon: ICON_LIBRARY.shoppingCart,
    defaultSize: { width: 180, height: 200 },
    defaultProperties: {
      productName: 'Doliprane 1000mg',
      productDetail: 'Comprimés',
      price: '5.000 Fc',
      imageUrl: '',
      imageData: '',
      imageBgColor: '', // '' = auto theme, 'transparent' = transparent, or custom hex
      backgroundColor: null, // Auto (theme)
      textColor: null, // Auto (theme)
      priceColor: null, // Auto (theme)
      borderColor: null, // Auto (theme)
      fontFamily: 'Poppins',
      fontSize: 13,
      priceFontSize: 15,
      cornerRadius: 12,
    },
    category: 'Composites',
  },
  {
    type: 'userProfile',
    name: 'Profil Utilisateur',
    description: 'Avatar avec nom et informations utilisateur',
    icon: ICON_LIBRARY.circleUser,
    defaultSize: { width: 280, height: 60 },
    defaultProperties: {
      userName: 'Michel Maleka',
      userInfo: 'michelmaleka@gmail.com',
      avatarUrl: '',
      avatarData: '',
      showDate: true,
      dateText: '',
      backgroundColor: 'transparent',
      nameColor: null, // Auto (theme)
      infoColor: null, // Auto (theme)
      dateColor: null, // Auto (theme)
      nameFont: 'Poppins',
      nameFontSize: 17,
      infoFontSize: 13,
      dateFontSize: 13,
      avatarSize: 48,
    },
    category: 'Composites',
  },
];

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  { name: 'Basiques', widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'Basiques') },
  { name: 'Interactions', widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'Interactions') },
  { name: 'Conteneurs', widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'Conteneurs') },
  { name: 'Composites', widgets: COMPOSITE_WIDGET_DEFINITIONS },
];

export const ALL_WIDGET_DEFINITIONS: WidgetType[] = [
  ...WIDGET_DEFINITIONS,
  ...COMPOSITE_WIDGET_DEFINITIONS,
];

// Polices supportées (à utiliser dans font: [font_family, size])
export const FONT_FAMILIES = [
  // Polices Google Fonts — Sans-serif (embarquées dans public/fonts/)
  'Roboto', 'Poppins', 'Inter', 'Montserrat', 'Open Sans', 'Lato',
  'Nunito', 'Nunito Sans', 'Raleway', 'Ubuntu', 'Outfit', 'Space Grotesk',
  'Quicksand', 'Josefin Sans', 'Source Sans Pro', 'Oswald', 'PT Sans',
  'Rubik', 'Fira Sans', 'Work Sans', 'DM Sans', 'Plus Jakarta Sans',
  'Manrope', 'IBM Plex Sans',
  // Polices Google Fonts — Serif
  'Lora', 'Playfair Display', 'Merriweather', 'Crimson Text',
  // Polices système (installées par défaut sur les OS)
  'Arial', 'Helvetica', 'Times New Roman', 'Verdana', 'Georgia',
  'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
  'Tahoma', 'Calibri', 'Segoe UI',
  // Polices monospace — Google Fonts
  'Roboto Mono', 'Source Code Pro', 'Fira Code',
  'JetBrains Mono', 'IBM Plex Mono',
  // Polices monospace — Système
  'Courier New', 'Lucida Console', 'Consolas',
];


/**
 * NOTE IMPORTANTE SUR LES WIDGETS SUPPRIMÉS:
 * 
 * Les widgets suivants ont été SUPPRIMÉS car ils n'existent PAS dans CustomTkinter officiel:
 * 
 * - emailInput, passwordInput, telInput → Utiliser CTkEntry avec placeholder_text et show="•"
 * - darkModeToggle → Utiliser CTkSwitch + customtkinter.set_appearance_mode()
 * - datePicker → Utiliser CTkEntry ou bibliothèque externe tkcalendar
 * (Des composites pratiques comme statCard, table et menuItem sont proposés séparément
 *  dans `COMPOSITE_WIDGET_DEFINITIONS` pour accélérer la conception d'interfaces.)
 * - image → Utiliser CTkImage (classe) dans CTkLabel ou CTkButton
 * 
 * Ce fichier est 100% conforme à la documentation officielle CustomTkinter.
 * Référence: https://customtkinter.tomschimansky.com/documentation/widgets/
 */
