# Notorious Py — Architecture Technique de l'Application

> Ce document décrit l'architecture complète de l'application Notorious Py
> pour servir de référence lors de la réalisation de la landing page.

---

## 1. Vue d'Ensemble

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NOTORIOUS PY                                  │
│              GUI Builder Visuel pour Python CustomTkinter             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐   ┌──────────────────┐   ┌───────────────────┐    │
│  │  Auth Layer  │   │   Builder Core   │   │  Export Engine    │    │
│  │  (Supabase)  │   │  (React Canvas)  │   │  (Python Gen.)   │    │
│  └──────┬───────┘   └────────┬─────────┘   └────────┬──────────┘    │
│         │                    │                       │              │
│  ┌──────┴───────────────────┴───────────────────────┴──────────┐    │
│  │                    State Management                          │    │
│  │   WidgetContext · ProjectContext · AuthContext · DragContext  │    │
│  └──────────────────────────┬───────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────┴───────────────────────────────────┐    │
│  │                    Backend (Supabase)                         │    │
│  │   Auth · Database (PostgreSQL) · Realtime · Storage          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Technique

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| **Framework** | React | 19.1 | UI composants |
| **Langage** | TypeScript | 5.8 | Typage statique |
| **Bundler** | Vite | 6.3 | Build & dev server |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Animations** | Framer Motion | 12.x | Animations fluides |
| **Drag & Drop** | react-dnd | 16.x | Système de drag |
| **Backend** | Supabase | 2.97 | Auth, DB, Realtime |
| **UI Components** | Radix UI + shadcn/ui | — | Composants accessibles |
| **Icônes** | Lucide React | 0.544 | Bibliothèque d'icônes |
| **Export** | JSZip | 3.10 | Génération ZIP client-side |
| **Coloration** | react-syntax-highlighter | 15.6 | Syntaxe Python |
| **Graphiques** | Recharts | 3.2 | Prévisualisation charts |
| **Thème** | next-themes | 0.4 | Thème clair/sombre |
| **Onboarding** | driver.js | 1.3 | Tour guidé interactif |
| **Formulaires** | react-hook-form + Zod | — | Validation |

---

## 3. Architecture des Composants

### 3.1 Arbre des composants principal

```
App
├── AuthProvider (contexte authentification)
│   └── AppInner
│       ├── [Non connecté] → AuthPage
│       │   ├── SignInForm (connexion)
│       │   └── SignUpForm (inscription)
│       │
│       ├── [Nouveau] → WelcomePage (onboarding)
│       │
│       └── [Connecté] → Index (page principale)
│           └── ProjectProvider (contexte projets)
│               └── WidgetProvider (contexte widgets)
│                   ├── [Aucun projet] → WelcomeScreen (liste projets)
│                   │
│                   └── [Projet ouvert] → Builder Layout
│                       ├── TopBar
│                       │   ├── Logo + Home
│                       │   ├── Undo/Redo
│                       │   ├── Bouton "Générer UI" (IA)
│                       │   ├── Bouton "Exporter le Code"
│                       │   ├── Tour guidé / Raccourcis
│                       │   ├── Toggle Design/Code
│                       │   ├── Toggle Édition/Aperçu
│                       │   ├── Toggle Thème
│                       │   └── UserMenu
│                       │
│                       ├── WidgetSidebar (gauche)
│                       │   ├── Onglet "Composants"
│                       │   │   ├── Barre de recherche
│                       │   │   └── Catégories de widgets
│                       │   │       ├── Basiques (7 widgets)
│                       │   │       ├── Interactions (7 widgets)
│                       │   │       ├── Conteneurs (3 widgets)
│                       │   │       └── Composites (7 widgets)
│                       │   │
│                       │   └── Onglet "Explorateur"
│                       │       └── Arbre de fichiers .py
│                       │           ├── Création inline
│                       │           ├── Renommage
│                       │           └── Suppression
│                       │
│                       ├── Canvas (centre)
│                       │   ├── CanvasHeader (titre fenêtre, dots macOS)
│                       │   ├── CanvasGrid (grille magnétique)
│                       │   ├── SmartGuides (guides d'alignement)
│                       │   ├── RenderedWidget × N (widgets visuels)
│                       │   │   └── InteractiveWidget (sélection, resize, move)
│                       │   └── Menu contextuel (clic droit)
│                       │
│                       ├── RightSidebar → PropertiesPanel (droite)
│                       │   ├── Propriétés Canvas (si rien sélectionné)
│                       │   │   ├── Dimensions (width, height)
│                       │   │   ├── Titre de la fenêtre
│                       │   │   ├── Couleur de fond
│                       │   │   ├── Mode layout
│                       │   │   └── Options grille
│                       │   │
│                       │   └── Propriétés Widget (si widget sélectionné)
│                       │       ├── Texte & Contenu
│                       │       ├── Apparence (couleurs, border, radius)
│                       │       ├── Dimensions & Position
│                       │       ├── Police & Typographie
│                       │       ├── État (normal/disabled)
│                       │       └── Propriétés spécifiques au type
│                       │
│                       └── [Vue Code] → CodeView
│                           └── CodeSyntaxHighlighter (Python)
│
├── ExportModal (modale export ZIP)
├── AIGeneratorModal (modale génération IA)
├── KeyboardShortcutsDialog (raccourcis clavier)
└── OnboardingTour (tour guidé driver.js)
```

### 3.2 Flux de données

```
                    ┌─────────────────┐
                    │   Supabase DB   │
                    │   (PostgreSQL)  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  Realtime Sub.  │ ← Sync temps réel
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────┴───┐  ┌──────┴─────┐  ┌────┴──────┐
     │ AuthContext │  │ ProjectCtx │  │ WidgetCtx │
     │  (user)    │  │ (projects) │  │ (widgets) │
     └────────────┘  └────────────┘  └───────────┘
                                          │
                                    ┌─────┴──────┐
                                    │ AutoSave   │ → Supabase
                                    │ (1s timer) │
                                    └────────────┘
```

---

## 4. Contextes React (State Management)

### 4.1 AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

- Gère l'authentification via Supabase Auth
- Fournit l'utilisateur connecté à toute l'app
- Écoute les changements de session en temps réel

### 4.2 ProjectContext

```typescript
interface ProjectContextType {
  projects: ProjectMetadata[];      // Liste des projets
  activeProjectId: string | null;   // Projet ouvert
  loading: boolean;
  createProject: (name: string) => Promise<string>;
  openProject: (id: string) => void;
  closeProject: () => void;
  deleteProject: (id: string) => void;
  updateProjectThumbnail: (id: string, thumbnail: string) => void;
}
```

- CRUD complet sur les projets via Supabase
- Souscription Realtime pour sync multi-onglets
- Persistance locale de l'ID projet actif

### 4.3 WidgetContext

```typescript
interface WidgetContextType {
  widgets: WidgetData[];
  selectedWidgetId: string | null;
  canvasSettings: CanvasSettings;
  activeFileId: string;
  viewMode: 'design' | 'code';
  previewMode: 'edit' | 'preview';
  clipboard: WidgetData | null;

  // CRUD Widgets
  addWidget: (type, position, parentId?) => void;
  updateWidget: (id, updates) => void;
  deleteWidget: (id) => void;
  moveWidget: (id, position) => void;
  selectWidget: (id) => void;

  // Clipboard
  copyWidget: () => void;
  cutWidget: () => void;
  pasteWidget: () => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // State
  loadWorkspaceState: (widgets, canvasSettings) => void;
  setActiveFile: (id) => void;
  updateCanvasSettings: (settings) => void;
}
```

- Gestion complète de l'état du canvas
- Historique undo/redo (50 niveaux)
- Synchronisation avec le file system

### 4.4 Hooks personnalisés

| Hook | Fichier | Rôle |
|---|---|---|
| `useFileSystem` | `useFileSystem.tsx` | Arbre de fichiers (CRUD, persistence Supabase) |
| `useDragDrop` | `useDragDrop.ts` | Configuration react-dnd pour drag widgets |
| `useExportPython` | `useExportPython.ts` | Génération du code Python CustomTkinter |
| `useAIGeneration` | `useAIGeneration.ts` | Appels API OpenRouter pour génération IA |

---

## 5. Système de Widgets

### 5.1 Structure d'un Widget

```typescript
interface WidgetData {
  id: string;
  type: string;               // 'button', 'label', 'statCard', etc.
  parentId: string | null;     // null = racine, sinon ID du conteneur parent
  style: {
    x: number;
    y: number;
    width: number;
    height: number;
    locked?: boolean;
    zIndex?: number;
  };
  properties: Record<string, any>;  // Propriétés spécifiques au type
}
```

### 5.2 Catalogue complet

**14 Widgets Natifs CustomTkinter** :
`label` · `button` · `entry` · `passwordentry` · `textbox` · `progressbar` · `image_label` · `checkbox` · `radiobutton` · `switch` · `combobox` · `optionmenu` · `segmentedbutton` · `slider`

**3 Conteneurs** :
`frame` · `scrollableframe` · `tabview`

**7 Composants Composites** :
`statCard` · `table` · `menuItem` · `chart` · `datepicker` · `productCard` · `userProfile`

### 5.3 Export Python

Le hook `useExportPython` transforme l'arbre de widgets en code Python valide :

```
Widgets JSON → Tri par profondeur → Génération des imports
                                   → Génération de la classe App
                                   → Placement des widgets (place/pack/grid)
                                   → Gestion des images (CTkImage + Pillow)
                                   → Composites → Méthodes dédiées
                                   → Code final .py
```

Le ZIP exporté contient :
- `app.py` (ou nom du fichier actif) — code Python principal
- `requirements.txt` — dépendances (customtkinter, Pillow, matplotlib, tkcalendar)
- `README.md` — documentation du projet
- `image_*.png` — images des widgets
- `icon.png` — icône de fenêtre (si définie)
- `background.png` — arrière-plan (si défini)

---

## 6. Base de Données (Supabase)

### Table `projects`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Identifiant unique |
| `user_id` | uuid (FK → auth.users) | Propriétaire |
| `name` | text | Nom du projet |
| `canvas_settings` | jsonb | Configuration du canvas |
| `file_tree` | jsonb[] | Arbre de fichiers avec contenu |
| `thumbnail` | text | Miniature base64 du projet |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière modification |

### Authentification

- Email + mot de passe via Supabase Auth
- Inscription avec prénom
- Confirmation par email
- Session persistante

---

## 7. Fonctionnalités Clés (pour la Landing Page)

### 7.1 Drag & Drop

- Bibliothèque de 24+ widgets organisés en 4 catégories
- Drag depuis la sidebar → Drop sur le canvas
- Repositionnement libre avec guides d'alignement magnétiques (SmartGuides)
- Redimensionnement avec poignées (8 directions)
- Widgets imbriqués dans les conteneurs (Frame, ScrollableFrame, TabView)

### 7.2 Canvas Interactif

- Grille configurable (visible/masquée)
- Header de fenêtre macOS simulé (titre, dots rouge/jaune/vert)
- Sélection simple et multiple (rubber-band)
- Menu contextuel (clic droit) : copier, coller, supprimer, verrouiller
- Zoom (via canvasSettings.scaling)
- Mode aperçu (désactive l'édition pour voir le rendu final)

### 7.3 Panneau de Propriétés

- Propriétés dynamiques selon le type de widget
- Color pickers pour toutes les couleurs (fg_color, text_color, hover_color…)
- Sélecteur de polices (18 polices supportées)
- Sliders pour les dimensions
- Toggles pour les états (normal/disabled)
- Upload d'images pour les widgets image (drag ou click)
- Auto-layout (direction, gap, alignment, distribution)

### 7.4 Export Python

- Prévisualisation du code avec coloration syntaxique
- Compteur de lignes et de widgets
- Copie dans le presse-papiers
- Téléchargement ZIP avec toutes les ressources
- Code 100% conforme CustomTkinter

### 7.5 Génération IA

- Mode texte : description en langage naturel → widgets
- Mode image : upload mockup/screenshot → analyse → widgets
- Modèles supportés : GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash (via OpenRouter)
- Contexte de fichiers existants pour génération cohérente

### 7.6 Gestion de Projets

- Dashboard avec tous les projets (cartes avec miniatures)
- Recherche de projets
- Création manuelle ou via IA
- Import de projets depuis ZIP
- Suppression avec confirmation
- Synchronisation Realtime multi-onglets

### 7.7 Système de Fichiers

- Explorateur de fichiers intégré (arbre)
- Création de fichiers `.py` inline
- Renommage par double-clic
- Auto-extension `.py`
- Sauvegarde du contenu de chaque fichier (widgets + canvasSettings)
- Basculement entre fichiers avec sauvegarde automatique

### 7.8 Raccourcis Clavier

| Raccourci | Action |
|---|---|
| `Ctrl+Z` | Annuler |
| `Ctrl+Shift+Z` | Rétablir |
| `Ctrl+C` | Copier widget |
| `Ctrl+X` | Couper widget |
| `Ctrl+V` | Coller widget |
| `Delete` | Supprimer widget |
| `Esc` | Désélectionner |
| `↑↓←→` | Déplacer (1px) |
| `Shift+Arrows` | Déplacer (10px) |
| `F1` | Raccourcis clavier |

### 7.9 Thème Clair / Sombre

- Toggle dans la TopBar (icône soleil/lune)
- Transition douce entre les modes
- Toute l'interface s'adapte (sidebar, canvas, properties, modales)
- Persisté via `next-themes`

### 7.10 Tour Guidé (Onboarding)

- 7 étapes interactives pour les nouveaux utilisateurs
- Powered by driver.js avec design premium personnalisé
- Highlighting des éléments UI
- Progression numérotée
- Peut être relancé via le bouton `?`

---

## 8. Métriques & Chiffres (pour la landing page)

| Métrique | Valeur | Source |
|---|---|---|
| Widgets disponibles | 24+ | `widgets.ts` (14 natifs + 3 conteneurs + 7 composites) |
| Polices supportées | 18 | `FONT_FAMILIES` dans `widgets.ts` |
| Catégories de widgets | 4 | Basiques, Interactions, Conteneurs, Composites |
| Niveaux undo/redo | 50 | `WidgetContext.tsx` |
| Intervalle autosave | 1 seconde | `WidgetSidebar.tsx` |
| Modèles IA supportés | 3+ | GPT-4o, Claude 3.5, Gemini 2.0 via OpenRouter |
| Fichiers dans le ZIP | 4+ | .py + requirements.txt + README.md + images |
| Raccourcis clavier | 10+ | `KeyboardShortcutsDialog.tsx` |
| Composants React | 35+ | Estimation du nombre de fichiers .tsx |
| Dépendances npm | 40+ | `package.json` |

---

> Ce document est la référence technique pour comprendre Notorious Py
> et rédiger du contenu précis pour la landing page.
