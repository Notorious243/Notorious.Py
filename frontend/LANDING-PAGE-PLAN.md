# Notorious Py — Plan & Prompt Ultra-Détaillé pour la Landing Page

> **Nom officiel** : Notorious Py  
> **Tagline** : Le constructeur visuel d'interfaces Python CustomTkinter — sans coder une seule ligne.  
> **URL cible** : `notoriouspy.com` (ou sous-domaine à définir)  
> **Date de rédaction** : Mars 2026  

---

## Table des matières

1. [Vision & Positionnement](#1-vision--positionnement)
2. [Architecture de la Landing Page](#2-architecture-de-la-landing-page)
3. [Design System & Direction Artistique](#3-design-system--direction-artistique)
4. [Sections Détaillées avec Contenu Final](#4-sections-détaillées-avec-contenu-final)
5. [Assets & Captures Requises](#5-assets--captures-requises)
6. [Prompt IA Complet pour Génération](#6-prompt-ia-complet-pour-génération)
7. [Méthodologie & Procédure de Réalisation](#7-méthodologie--procédure-de-réalisation)
8. [Stack Technique Recommandée](#8-stack-technique-recommandée)
9. [Checklist Finale](#9-checklist-finale)

---

## 1. Vision & Positionnement

### Qu'est-ce que Notorious Py ?

**Notorious Py** est une application web professionnelle de type **GUI Builder visuel** permettant de concevoir des interfaces desktop Python avec **CustomTkinter** — entièrement depuis le navigateur, sans écrire une seule ligne de code.

L'utilisateur glisse-dépose des widgets natifs CustomTkinter (boutons, champs de texte, sliders, cases à cocher, conteneurs, onglets…) et des composants composites avancés (cartes statistiques, tableaux de données, graphiques matplotlib, profils utilisateur, cartes produit…) sur un canvas interactif. Il personnalise chaque propriété en temps réel, puis **exporte un projet Python complet** (fichier `.py` + images + `requirements.txt` + `README.md`) en un clic.

### Pourquoi Notorious Py est unique

| Avantage | Détail |
|---|---|
| **100% conforme CustomTkinter** | Chaque widget généré respecte la documentation officielle CustomTkinter |
| **Génération IA intégrée** | Décrivez votre interface en texte ou uploadez un mockup — l'IA crée les widgets automatiquement |
| **Export ZIP complet** | Code Python propre, images, dépendances, README — prêt à exécuter |
| **Sauvegarde Cloud temps réel** | Projets synchronisés via Supabase, autosave chaque seconde |
| **Multi-fichiers par projet** | Système de fichiers intégré avec explorateur de type VS Code |
| **Thème clair/sombre** | Interface adaptative avec mode clair et sombre |
| **Tour guidé interactif** | Onboarding complet pour les nouveaux utilisateurs |
| **24 widgets natifs + composites** | Bibliothèque complète couvrant tous les cas d'usage |

### Public cible

- **Étudiants Python** qui apprennent la programmation et veulent créer des interfaces graphiques rapidement
- **Développeurs Python** qui prototypent des applications desktop
- **Formateurs / Enseignants** qui ont besoin d'outils pédagogiques visuels
- **Freelances** qui livrent des applications Python avec UI moderne

---

## 2. Architecture de la Landing Page

La landing page suit une structure en **10 sections** fluides, inspirée des meilleures SaaS modernes (Linear, Vercel, Raycast) mais avec une identité visuelle **professionnelle, lumineuse et de confiance** — PAS ultra-sombre.

```
┌─────────────────────────────────────────────────────┐
│  SECTION 1 — Navigation (Header sticky)             │
├─────────────────────────────────────────────────────┤
│  SECTION 2 — Hero (titre + CTA + capture principale)│
├─────────────────────────────────────────────────────┤
│  SECTION 3 — Bandeau de confiance (logos/stats)     │
├─────────────────────────────────────────────────────┤
│  SECTION 4 — Fonctionnalités principales (6 cards)  │
├─────────────────────────────────────────────────────┤
│  SECTION 5 — Démo visuelle (Canvas en action)       │
├─────────────────────────────────────────────────────┤
│  SECTION 6 — Bibliothèque de widgets (showcase)     │
├─────────────────────────────────────────────────────┤
│  SECTION 7 — Workflow en 3 étapes                   │
├─────────────────────────────────────────────────────┤
│  SECTION 8 — Génération IA                          │
├─────────────────────────────────────────────────────┤
│  SECTION 9 — Témoignages / Social proof             │
├─────────────────────────────────────────────────────┤
│  SECTION 10 — CTA Final + Footer                    │
└─────────────────────────────────────────────────────┘
```

---

## 3. Design System & Direction Artistique

### 3.1 Direction générale

> **IMPORTANT** : Le design ne doit PAS être ultra-sombre. L'objectif est un design **professionnel, de confiance, lumineux avec des accents de profondeur**. Pensez à l'univers de Stripe, Linear ou Notion — des fonds clairs/blanc cassé avec des éléments de contraste élégants.

### 3.2 Palette de couleurs

```
FOND PRINCIPAL :
  - Light mode : #FFFFFF (blanc) → #F8FAFC (gris très léger) → #F1F5F9 (sections alternées)
  - Dark mode (optionnel toggle) : #0B1422 → #0C1728

COULEURS PRIMAIRES (Identité Notorious Py) :
  - Violet principal : #7C3AED (violet-600)
  - Indigo accent   : #6366F1 (indigo-500)
  - Gradient hero    : linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #7C3AED 100%)
  - Gradient boutons : linear-gradient(to right, #6366F1, #9333EA)

TEXTE :
  - Titre principal  : #0F172A (slate-900)
  - Sous-titre       : #334155 (slate-700)
  - Paragraphe       : #64748B (slate-500)
  - Texte léger      : #94A3B8 (slate-400)

ACCENTS :
  - Succès / Vert    : #10B981 (emerald-500)
  - Warning / Ambre  : #F59E0B (amber-500)
  - Info / Bleu      : #3B82F6 (blue-500)
  - Erreur / Rouge   : #EF4444 (red-500)

SURFACES :
  - Carte            : #FFFFFF avec border #E2E8F0 et shadow-lg
  - Badge            : bg-violet-50 text-violet-700
  - Code block       : bg-slate-900 (pour les extraits de code Python)
```

### 3.3 Typographie

```
TITRES (H1, H2, H3) :
  - Font-family : "Inter", -apple-system, sans-serif
  - H1 Hero : 56px-64px, font-weight 800, letter-spacing -0.025em, line-height 1.1
  - H2 Sections : 40px-48px, font-weight 700, letter-spacing -0.02em
  - H3 Sous-titres : 24px-28px, font-weight 600

CORPS DE TEXTE :
  - Font-family : "Inter", sans-serif
  - Paragraphes : 18px, font-weight 400, line-height 1.7, couleur slate-500
  - Badges / labels : 14px, font-weight 600, uppercase, letter-spacing 0.05em

CODE :
  - Font-family : "JetBrains Mono", "Fira Code", monospace
  - 14px, line-height 1.6
```

### 3.4 Espacements & Grille

```
- Max-width conteneur : 1280px (centré)
- Padding sections : 96px vertical (py-24), 24px horizontal (px-6)
- Gap entre cartes : 24px-32px
- Border-radius cartes : 16px-20px (rounded-2xl)
- Border-radius boutons : 12px (rounded-xl)
```

### 3.5 Effets & Animations

```
- Scroll animations : Fade-in + slide-up au scroll (IntersectionObserver ou Framer Motion)
- Hover cartes : translateY(-4px) + shadow amplifiée + border-color violet
- Gradient mesh subtil en arrière-plan du hero (orbes violet/indigo avec opacity 0.06-0.10)
- Dot grid décoratif en arrière-plan (opacity 0.05)
- Pas de parallax agressif — rester sobre et fluide
```

---

## 4. Sections Détaillées avec Contenu Final

### SECTION 1 — Navigation (Header)

**Layout** : Sticky top, fond blanc avec `backdrop-blur-md`, border-bottom subtile.

```
[Logo Notorious Py]   Fonctionnalités   Widgets   Workflow   Témoignages    [Commencer gratuitement →]
```

- **Logo** : Icône ronde `notorious-py-logo-64x64.png` + texte "Notorious Py" en font-weight 700
- **Liens** : smooth scroll vers les sections, texte slate-600, hover violet-600
- **CTA bouton** : Gradient violet, texte blanc, rounded-xl, shadow-md

---

### SECTION 2 — Hero

**Layout** : Centré, texte au-dessus, capture d'écran en dessous.

**Contenu exact :**

```
[Badge] 🚀 L'outil n°1 pour concevoir des interfaces CustomTkinter

# Concevez vos interfaces Python
# visuellement, exportez instantanément.

Notorious Py est le premier GUI Builder visuel dédié à CustomTkinter.
Glissez-déposez vos widgets, personnalisez chaque propriété,
et exportez un projet Python complet — prêt à exécuter.

[Bouton principal] Commencer gratuitement →
[Bouton secondaire] Voir la démo ▶
```

**Capture requise** : `capture-hero-canvas-fullscreen.png`
> Screenshot 4K de l'interface complète du builder avec un projet ouvert : sidebar widgets visible à gauche, canvas au centre avec des widgets colorés (formulaire ou dashboard), panneau de propriétés à droite. Thème clair de préférence.

**Présentation de la capture** :
- Encadrée dans un mock navigateur (barre d'adresse + 3 dots macOS)
- Ombre portée profonde : `shadow-[0_40px_80px_rgba(99,102,241,0.15)]`
- Légère rotation perspective 3D (subtle tilt) : `perspective(1200px) rotateX(2deg)`
- Bordure subtile `border border-slate-200/60`

---

### SECTION 3 — Bandeau de confiance

**Layout** : Bande horizontale, fond gris très léger.

```
Propulsé par des technologies de confiance

[Logo Python]  [Logo CustomTkinter]  [Logo React]  [Logo Supabase]  [Logo TypeScript]  [Logo Vite]
```

OU version stats :

```
24+ widgets    |    Export ZIP en 1 clic    |    Sauvegarde Cloud    |    IA intégrée
```

---

### SECTION 4 — Fonctionnalités principales

**Layout** : Grille 3×2 de cartes

**Contenu exact des 6 cartes :**

---

**Carte 1 — Drag & Drop Intuitif**
- **Icône** : MousePointerClick (violet)
- **Titre** : Glissez, déposez, créez
- **Texte** : Sélectionnez un widget dans la bibliothèque et déposez-le sur le canvas. Repositionnez, redimensionnez et alignez avec les guides intelligents. Aucune ligne de code nécessaire.
- **Capture** : `capture-feature-dragdrop.png` — Widget en cours de drag depuis la sidebar vers le canvas

---

**Carte 2 — Export Python Complet**
- **Icône** : FolderArchive (indigo)
- **Titre** : Export ZIP en un clic
- **Texte** : Exportez votre interface en un projet Python complet : fichier `.py` avec syntaxe propre, images embarquées, `requirements.txt` et `README.md`. Prêt à exécuter avec `python app.py`.
- **Capture** : `capture-feature-export.png` — Modal d'export avec prévisualisation du code Python et bouton ZIP

---

**Carte 3 — Génération par IA**
- **Icône** : Sparkles (violet gradient)
- **Titre** : Décrivez, l'IA construit
- **Texte** : Décrivez votre interface en langage naturel ou uploadez un mockup image. Notorious Py utilise l'IA (GPT-4o, Claude, Gemini via OpenRouter) pour générer automatiquement vos widgets sur le canvas.
- **Capture** : `capture-feature-ai.png` — Modal IA avec un prompt textuel et les widgets générés

---

**Carte 4 — Panneau de Propriétés**
- **Icône** : SlidersHorizontal (emerald)
- **Titre** : Personnalisation pixel-perfect
- **Texte** : Chaque widget expose toutes ses propriétés CustomTkinter officielles : couleurs, polices, dimensions, états, corner_radius, et plus. Modifiez en temps réel et voyez le résultat instantanément sur le canvas.
- **Capture** : `capture-feature-properties.png` — Panneau de propriétés avec un bouton sélectionné, montrant les couleurs et polices

---

**Carte 5 — Projets Cloud**
- **Icône** : Cloud (blue)
- **Titre** : Vos projets, partout
- **Texte** : Créez un compte et retrouvez tous vos projets depuis n'importe quel navigateur. Sauvegarde automatique chaque seconde via Supabase. Système multi-fichiers avec explorateur intégré, comme dans un vrai IDE.
- **Capture** : `capture-feature-projects.png` — Écran d'accueil avec la liste des projets (cards avec thumbnail)

---

**Carte 6 — Code en Temps Réel**
- **Icône** : Code2 (amber)
- **Titre** : Voir le code généré en direct
- **Texte** : Basculez entre la vue Design et la vue Code à tout moment. Le code Python CustomTkinter est généré en temps réel, avec coloration syntaxique et compteur de lignes. Copiez ou exportez d'un clic.
- **Capture** : `capture-feature-codeview.png` — Vue code avec la coloration syntaxique Python et la toolbar de bascule Design/Code

---

### SECTION 5 — Démo visuelle du Canvas

**Layout** : Grande capture centrée avec texte d'accompagnement.

```
[Badge] Interface Builder

# Un canvas de conception
# puissant et professionnel

Notorious Py reproduit l'expérience des meilleurs outils de design
(Figma, Sketch) adaptée au monde Python. Grille magnétique, guides
intelligents, undo/redo illimité, mode aperçu, et raccourcis clavier
pour une productivité maximale.
```

**Capture requise** : `capture-canvas-large.png`
> Screenshot 4K large du canvas en mode édition avec :
> - La grille visible
> - Plusieurs widgets positionnés (un formulaire de connexion par exemple)
> - Les guides d'alignement (smart guides) visibles
> - Le panneau de propriétés à droite
> - Les onglets Composants/Explorateur à gauche

---

### SECTION 6 — Bibliothèque de Widgets

**Layout** : Section showcase avec 3 colonnes.

```
[Badge] Bibliothèque

# 24+ widgets prêts à l'emploi

De la simple étiquette au graphique matplotlib interactif,
Notorious Py couvre tous vos besoins d'interface.
```

**3 catégories affichées avec exemples :**

**Widgets Natifs CustomTkinter (14 widgets)** :
- Label, Bouton, Champ de texte, Champ mot de passe, Zone de texte
- Barre de progression, Label avec Image
- Case à cocher, Bouton radio, Interrupteur
- Liste déroulante, Menu de sélection, Boutons segmentés, Curseur (Slider)

**Conteneurs (3 widgets)** :
- Conteneur (Frame), Conteneur défilant (ScrollableFrame), Onglets (TabView)

**Composants Composites (7 widgets)** :
- Carte Statistique, Tableau de données, Menu latéral
- Graphique (matplotlib), Sélecteur de date, Carte Produit, Profil Utilisateur

**Capture requise** : `capture-widgets-library.png`
> Screenshot de la sidebar Composants déployée avec les catégories visibles (Basiques, Interactions, Conteneurs, Composites)

**Capture bonus** : `capture-widgets-canvas.png`
> Un canvas avec un dashboard complet montrant : carte stat, tableau, graphique, menu latéral, profil utilisateur — pour illustrer la richesse des composites.

---

### SECTION 7 — Workflow en 3 étapes

**Layout** : 3 colonnes avec numéros + icônes

```
[Badge] Simple comme 1, 2, 3

# Créez votre interface en 3 étapes
```

**Étape 1 — Créez un projet**
- Icône : FolderPlus
- Texte : Connectez-vous, créez un nouveau projet et donnez-lui un nom. Ajoutez un fichier `.py` depuis l'explorateur intégré. Vous pouvez aussi importer un projet existant depuis un fichier ZIP.
- Capture : `capture-step1-create.png` — Écran de création de projet

**Étape 2 — Concevez visuellement**
- Icône : Layers
- Texte : Glissez des widgets depuis la bibliothèque, positionnez-les sur le canvas, personnalisez les couleurs, polices et dimensions via le panneau de propriétés. Utilisez les guides d'alignement pour un résultat pixel-perfect.
- Capture : `capture-step2-design.png` — Canvas en action avec widgets

**Étape 3 — Exportez et exécutez**
- Icône : Download
- Texte : Cliquez sur "Exporter le Code", prévisualisez le Python généré, puis téléchargez le ZIP complet. Lancez `pip install -r requirements.txt && python app.py` et votre interface apparaît.
- Capture : `capture-step3-export.png` — Modal export avec code + terminal montrant l'exécution

---

### SECTION 8 — Génération IA

**Layout** : Mise en avant grande avec split (texte gauche, capture droite).

```
[Badge] Propulsé par l'IA

# Décrivez votre interface,
# l'IA la construit pour vous.

Tapez un prompt en langage naturel comme :
"Un formulaire de connexion avec email, mot de passe et bouton Connexion
sur fond bleu marine"

Ou uploadez un screenshot de mockup —
Notorious Py analyse l'image et reproduit fidèlement les widgets
CustomTkinter correspondants.

Compatible avec GPT-4o, Claude 3.5, Gemini 2.0 et plus encore
via OpenRouter.

[Bouton] Essayer la génération IA →
```

**Capture requise** : `capture-ai-modal.png`
> Modal IA ouverte avec :
> - Onglet "Prompt" actif avec un texte d'exemple
> - Sélecteur de modèle (GPT-4o sélectionné)
> - Champ clé API (masqué)
> - Bouton "Générer"

**Capture bonus** : `capture-ai-result.png`
> Canvas APRÈS génération IA — les widgets ont été créés automatiquement

---

### SECTION 9 — Témoignages / Social Proof

**Layout** : Carrousel ou grille 3 colonnes.

> **Note** : Si pas encore de vrais témoignages, utiliser des use cases fictifs mais réalistes.

**Témoignage 1** :
> "J'ai conçu l'interface de gestion de ma pharmacie en 30 minutes au lieu de 2 jours. Le code exporté était propre et fonctionnel dès le premier lancement."
> — **Dr. Michel K.**, Pharmacien & Développeur Python

**Témoignage 2** :
> "Mes étudiants adorent Notorious Py. Ils peuvent enfin visualiser leurs interfaces avant de coder. C'est un outil pédagogique extraordinaire."
> — **Prof. Sarah L.**, Enseignante en Informatique

**Témoignage 3** :
> "La génération par IA m'a bluffé. J'ai uploadé un mockup Figma et en 10 secondes, j'avais mes widgets CustomTkinter prêts. Incroyable."
> — **Kevin M.**, Développeur Freelance Python

---

### SECTION 10 — CTA Final + Footer

**CTA Final** :

```
# Prêt à construire votre prochaine
# interface Python ?

Rejoignez les développeurs qui conçoivent visuellement
avec Notorious Py. Gratuit, sans carte bancaire.

[Bouton] Commencer maintenant — C'est gratuit →
```

**Footer** :

```
[Logo Notorious Py]  © 2026 Notorious Py. Tous droits réservés.

Produit         Ressources          Légal
Fonctionnalités Documentation       Conditions d'utilisation
Widgets         Changelog           Politique de confidentialité
Tarifs          Support             

Réseaux : [GitHub] [Twitter/X] [Discord]
```

---

## 5. Assets & Captures Requises

### 5.1 Logos (déjà copiés dans `assets/logos/`)

| Fichier | Dimensions | Usage |
|---|---|---|
| `notorious-py-logo-512x512.png` | 512×512 | OG Image, social sharing |
| `notorious-py-logo-256x256.png` | 256×256 | Hero, sections grandes |
| `notorious-py-logo-192x192.png` | 192×192 | PWA manifest |
| `notorious-py-logo-128x128.png` | 128×128 | Navigation, favicon large |
| `notorious-py-logo-64x64.png` | 64×64 | Header navigation |
| `notorious-py-logo.svg` | Vectoriel | Tout usage, scalable |

### 5.2 Captures d'écran à réaliser (4K — 2560×1440 minimum)

Toutes les captures doivent être réalisées depuis l'application Notorious Py elle-même, en **résolution 4K** (retina display), avec des données réalistes sur le canvas.

| ID | Nom du fichier | Description | Section |
|---|---|---|---|
| C01 | `capture-hero-canvas-fullscreen.png` | Vue complète du builder : sidebar + canvas avec widgets + properties panel. Thème clair. | Hero |
| C02 | `capture-feature-dragdrop.png` | Widget en cours de glissement depuis la bibliothèque vers le canvas | Feature 1 |
| C03 | `capture-feature-export.png` | Modal d'export ouverte avec code Python visible + bouton ZIP | Feature 2 |
| C04 | `capture-feature-ai.png` | Modal IA avec prompt textuel rempli | Feature 3 |
| C05 | `capture-feature-properties.png` | Panneau propriétés avec widget bouton sélectionné | Feature 4 |
| C06 | `capture-feature-projects.png` | Écran d'accueil "Mes Projets" avec 3-4 projets visibles | Feature 5 |
| C07 | `capture-feature-codeview.png` | Vue Code Python avec coloration syntaxique | Feature 6 |
| C08 | `capture-canvas-large.png` | Canvas large avec dashboard (stat cards, table, chart, menu) | Démo |
| C09 | `capture-widgets-library.png` | Sidebar bibliothèque de widgets déployée | Widgets |
| C10 | `capture-widgets-canvas.png` | Canvas avec dashboard complet (composites variés) | Widgets |
| C11 | `capture-step1-create.png` | Écran création projet / modal nouveau projet | Étape 1 |
| C12 | `capture-step2-design.png` | Canvas avec formulaire en cours de conception | Étape 2 |
| C13 | `capture-step3-export.png` | Modal export + aperçu code | Étape 3 |
| C14 | `capture-ai-modal.png` | Modal IA complète (onglet prompt) | IA |
| C15 | `capture-ai-result.png` | Canvas après génération IA | IA |
| C16 | `capture-auth-page.png` | Page de connexion/inscription | Footer/About |
| C17 | `capture-welcome-page.png` | Page d'accueil après inscription | Footer/About |
| C18 | `capture-onboarding-tour.png` | Tour guidé en cours (popover driver.js) | Footer/About |
| C19 | `capture-dark-mode.png` | Vue du builder en mode sombre (pour comparaison) | Design System |
| C20 | `capture-keyboard-shortcuts.png` | Dialog raccourcis clavier ouverte | Footer/About |

### 5.3 Procédure de capture

```bash
# 1. Lancer l'application en local
cd Archive && npm run dev

# 2. Ouvrir Chrome/Edge avec DevTools
# Régler le viewport à 2560x1440 (ou utiliser Retina 1440 × 900 @2x)

# 3. Pour chaque capture :
#    - Naviguer vers l'écran concerné
#    - Remplir avec des données réalistes (projets de démo, widgets variés)
#    - Prendre le screenshot via DevTools (Cmd+Shift+P → "Capture full size screenshot")
#    - Nommer selon la convention ci-dessus
#    - Placer dans frontend/assets/captures/

# 4. Optimiser les images
#    - Compresser avec TinyPNG ou sharp
#    - Convertir en WebP pour le web (garder PNG comme source)
```

---

## 6. Prompt IA Complet pour Génération

> Ce prompt peut être donné tel quel à une IA (Claude, GPT-4, Cursor, Windsurf) pour générer la landing page.

---

### PROMPT PRINCIPAL

```
Tu es un développeur frontend expert et un designer UI/UX senior. Crée une landing page
complète et professionnelle pour "Notorious Py", un GUI Builder visuel pour Python CustomTkinter.

INFORMATIONS PRODUIT :
- Nom : Notorious Py
- Type : Application web (SaaS) — GUI Builder visuel
- Fonction : Permettre aux développeurs Python de concevoir visuellement des interfaces
  CustomTkinter via drag & drop, puis d'exporter un projet Python complet (ZIP avec .py,
  images, requirements.txt, README.md)
- Stack de l'app : React 19, TypeScript, Vite, TailwindCSS, Supabase, Framer Motion
- Widgets : 24+ widgets (14 natifs CTk + 3 conteneurs + 7 composites incluant carte stat,
  tableau, graphique matplotlib, menu latéral, datepicker, carte produit, profil utilisateur)
- Features : Drag & drop, export ZIP, génération IA (OpenRouter avec GPT-4o/Claude/Gemini),
  projets cloud (Supabase), multi-fichiers, thème clair/sombre, tour guidé, undo/redo,
  raccourcis clavier, guides d'alignement, aperçu en temps réel, vue code avec syntaxe Python

DIRECTION DESIGN :
- Style : Professionnel, lumineux, inspirant confiance. PAS ultra-sombre.
- Fond principal : Blanc (#FFFFFF) à gris très léger (#F8FAFC), sections alternées
- Couleur primaire : Violet (#7C3AED) et Indigo (#6366F1)
- Gradient boutons : from-indigo-600 to-purple-600
- Typographie : Inter pour le texte, JetBrains Mono pour le code
- Border-radius : 16-20px pour les cartes, 12px pour les boutons
- Animations : Fade-in au scroll avec Framer Motion, hover lift sur les cartes
- Pas de dark-mode par défaut sur la landing (uniquement dans l'app)

STRUCTURE (10 sections) :
1. Header sticky avec navigation + CTA
2. Hero centré avec badge, titre (H1), sous-titre, 2 boutons CTA, capture 4K du builder
3. Bandeau de confiance (logos tech ou stats chiffrées)
4. 6 cartes fonctionnalités (drag&drop, export, IA, propriétés, cloud, vue code)
5. Grande démo visuelle du canvas
6. Showcase bibliothèque widgets (24+ widgets en 3 catégories)
7. Workflow en 3 étapes (créer → concevoir → exporter)
8. Section IA avec split layout
9. Témoignages (3 cards)
10. CTA final + footer complet

IMAGES :
- Utilise des <img> avec placeholder src pointant vers les captures dans assets/captures/
- Les images sont des screenshots réels de l'application, pas des illustrations
- Encadre les captures dans des mocks navigateur (dots macOS + barre URL)
- Ajoute des ombres portées profondes et un léger tilt perspective

STACK LANDING PAGE :
- Next.js 14+ (App Router) OU Astro OU React + Vite
- TailwindCSS 3.4+
- Framer Motion pour les animations
- shadcn/ui (OBLIGATOIRE) : Button, Badge, Card, Separator, Tabs, Accordion, Avatar
- Lucide React pour les icônes inline (nav, boutons, badges, footer)

SOURCES D'ICÔNES POUR LES SECTIONS :
- 21.dev (https://21.dev) : Icônes SVG animées modernes pour le hero et sections premium
- Flaticon (https://flaticon.com) : Icônes colorées illustrées SVG/PNG pour cartes features et workflow
- Icons8 (https://icons8.com) : Icônes illustrées professionnelles, logos technos pour bandeau confiance
- Lucide React : Icônes inline uniquement (navigation, CTA arrows, footer social)
→ Pour chaque carte feature et chaque étape workflow, utilise des icônes Flaticon/Icons8/21.dev
  colorées et illustrées (style 3D flat ou gradient) plutôt que des icônes ligne simples.

Génère le code complet de la landing page, composant par composant.
Utilise les composants shadcn/ui pour tous les boutons, badges, cartes et tabs.
```

---

## 7. Méthodologie & Procédure de Réalisation

### Phase 1 — Préparation (Jour 1)

1. **Captures d'écran** : Lancer l'app, créer un projet de démo riche, réaliser les 20 captures listées en section 5
2. **Optimisation images** : Compresser toutes les captures, générer les versions WebP
3. **Valider le contenu** : Relire tous les textes de la section 4, ajuster si nécessaire

### Phase 2 — Setup Technique (Jour 1)

1. Initialiser le projet : `npx create-next-app@latest notorious-py-landing --typescript --tailwind --app`
2. Installer les dépendances : `npm install framer-motion lucide-react`
3. Configurer le `tailwind.config.js` avec la palette définie en section 3
4. Mettre en place la structure de fichiers :

```
notorious-py-landing/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── TrustBand.tsx
│   ├── Features.tsx
│   ├── CanvasDemo.tsx
│   ├── WidgetShowcase.tsx
│   ├── Workflow.tsx
│   ├── AISection.tsx
│   ├── Testimonials.tsx
│   ├── CTAFinal.tsx
│   └── Footer.tsx
├── public/
│   ├── logos/          (copie de frontend/assets/logos/)
│   └── captures/       (copie de frontend/assets/captures/)
└── package.json
```

### Phase 3 — Développement (Jours 2-4)

**Ordre de développement recommandé :**

1. `Header.tsx` — Navigation sticky + logo + CTA
2. `Hero.tsx` — Section la plus impactante, titre + CTA + capture
3. `TrustBand.tsx` — Bandeau logos/stats
4. `Features.tsx` — Grille 3×2 de cartes
5. `CanvasDemo.tsx` — Grande capture avec texte
6. `WidgetShowcase.tsx` — Showcase widgets
7. `Workflow.tsx` — 3 étapes
8. `AISection.tsx` — Section IA
9. `Testimonials.tsx` — Témoignages
10. `CTAFinal.tsx` + `Footer.tsx` — Fin de page

### Phase 4 — Polish (Jour 5)

1. Ajouter les animations Framer Motion (scroll-triggered)
2. Tester responsive (mobile, tablette, desktop)
3. Optimiser les performances (lazy loading images, WebP)
4. Vérifier l'accessibilité (alt texts, contraste, navigation clavier)
5. Ajouter les meta tags OG (Open Graph) pour le partage social

### Phase 5 — Déploiement (Jour 5)

1. Déployer sur Vercel ou Netlify
2. Configurer le domaine `notoriouspy.com`
3. Tester en production

---

## 8. Stack Technique Recommandée

| Couche | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSG pour les performances, SEO optimal |
| Styling | **TailwindCSS 3.4** | Cohérence avec l'app principale |
| Composants UI | **shadcn/ui** (obligatoire) | Button, Badge, Card, Separator, Tabs, Accordion — composants React accessibles et stylés |
| Animations | **Framer Motion** | Déjà utilisé dans l'app, animations fluides |
| Icônes inline | **Lucide React** | Navigation, boutons, badges, footer |
| Icônes features | **Flaticon** / **Icons8** | Icônes colorées SVG/PNG pour les cartes features et workflow |
| Icônes animées | **21.dev** | Icônes SVG animées modernes pour le hero et sections premium |
| Fonts | **Inter** (Google Fonts) | Police propre et professionnelle |
| Déploiement | **Vercel** | Intégration native Next.js |
| Images | **next/image** + WebP | Optimisation automatique |

### Composants shadcn/ui à utiliser

```bash
npx shadcn@latest init
npx shadcn@latest add button badge card separator tabs accordion avatar
```

| Composant shadcn/ui | Utilisation sur la landing |
|---|---|
| `Button` | CTA principaux et secondaires, liens navigation |
| `Badge` | Labels de section ("Fonctionnalités", "Propulsé par l'IA", etc.) |
| `Card` | Cartes features, cartes témoignages, cartes workflow |
| `Separator` | Séparateurs entre sections |
| `Tabs` | Onglet widgets natifs / composites dans la section bibliothèque |
| `Accordion` | FAQ optionnelle en bas de page |
| `Avatar` | Photos des témoignages |

---

## 9. Checklist Finale

- [ ] Logos copiés dans `assets/logos/` ✅
- [ ] 20 captures d'écran réalisées en 4K
- [ ] Toutes les captures placées dans `assets/captures/`
- [ ] Contenu textuel finalisé et relu
- [ ] Palette de couleurs validée
- [ ] Projet Next.js initialisé
- [ ] 10 composants développés
- [ ] Animations au scroll implémentées
- [ ] Responsive testé (mobile + desktop)
- [ ] Meta tags OG configurés
- [ ] Déployé sur Vercel
- [ ] Domaine configuré

---

> **Document rédigé pour le projet Notorious Py**  
> Toute la documentation, le contenu et l'architecture de cette landing page sont basés sur l'analyse complète du code source de l'application.
