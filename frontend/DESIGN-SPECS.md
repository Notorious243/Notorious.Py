# Notorious Py — Spécifications Design de la Landing Page

> Ce document détaille chaque aspect visuel de la landing page pour garantir une réalisation fidèle.

---

## 1. Philosophie Design

### Ce que nous voulons :
- **Professionnel et de confiance** — comme Stripe, Linear, Vercel
- **Lumineux** — fond blanc/crème, beaucoup d'espace blanc
- **Élégant** — typographie soignée, espacements généreux
- **Accents de profondeur** — ombres subtiles, gradients violet/indigo
- **Captures réelles** — pas d'illustrations génériques, mais de vrais screenshots 4K de l'app

### Ce que nous ne voulons PAS :
- ❌ Ultra-sombre type "hacker" ou "developer tool"
- ❌ Néon agressif ou couleurs flashy
- ❌ Illustrations 3D génériques ou clipart
- ❌ Trop d'animations qui distraient
- ❌ Design chargé — chaque section respire

---

## 2. Grille & Layout

```
Largeur max conteneur : 1280px (mx-auto)
Padding horizontal    : 24px mobile, 48px tablette, 64px desktop
Padding vertical      : 96px (py-24) entre chaque section
Gap cartes            : 24px (gap-6) minimum, 32px (gap-8) recommandé

Breakpoints :
  - Mobile  : < 768px  → 1 colonne, textes centrés
  - Tablette: 768-1024px → 2 colonnes
  - Desktop : > 1024px → 3 colonnes (features), 2 colonnes (split layouts)
```

---

## 3. Palette Complète

### Fonds de page

| Zone | Couleur Light | Code |
|---|---|---|
| Fond global | Blanc pur | `#FFFFFF` |
| Sections alternées | Gris très léger | `#F8FAFC` (slate-50) |
| Sections accent | Violet ultra-léger | `#F5F3FF` (violet-50) |
| Hero arrière-plan | Gradient mesh subtil | Orbes `#6366F1` et `#8B5CF6` à 5-8% opacité |

### Couleurs principales

| Rôle | Couleur | Code Hex | Tailwind |
|---|---|---|---|
| Primaire | Violet | `#7C3AED` | `violet-600` |
| Primaire hover | Violet foncé | `#6D28D9` | `violet-700` |
| Secondaire | Indigo | `#6366F1` | `indigo-500` |
| Secondaire hover | Indigo foncé | `#4F46E5` | `indigo-600` |
| Accent chaud | Purple | `#9333EA` | `purple-600` |

### Gradients

```css
/* Bouton CTA principal */
background: linear-gradient(to right, #6366F1, #9333EA);

/* Hero background mesh */
background:
  radial-gradient(circle at 18% 12%, rgba(99,102,241,0.08), transparent 36%),
  radial-gradient(circle at 78% 82%, rgba(139,92,246,0.06), transparent 34%),
  linear-gradient(135deg, #FAFAFE 0%, #F5F3FF 46%, #F0F4FF 100%);

/* Badge accent */
background: linear-gradient(135deg, #EDE9FE, #E0E7FF);

/* Dot grid décoratif */
background-image: radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px);
background-size: 24px 24px;
opacity: 0.04;
```

### Texte

| Rôle | Couleur | Code | Tailwind |
|---|---|---|---|
| Titre H1 | Presque noir | `#0F172A` | `slate-900` |
| Titre H2 | Presque noir | `#1E293B` | `slate-800` |
| Sous-titre | Gris foncé | `#334155` | `slate-700` |
| Paragraphe | Gris moyen | `#64748B` | `slate-500` |
| Texte léger | Gris clair | `#94A3B8` | `slate-400` |
| Lien | Violet | `#7C3AED` | `violet-600` |
| Lien hover | Violet foncé | `#6D28D9` | `violet-700` |

### Surfaces

| Élément | Style |
|---|---|
| Carte feature | `bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl hover:border-violet-300 transition-all` |
| Carte témoignage | `bg-white border border-slate-100 rounded-2xl shadow-md` |
| Badge | `bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-4 py-1.5 text-sm font-semibold` |
| Capture screenshot | `border border-slate-200/60 rounded-2xl shadow-[0_40px_80px_rgba(99,102,241,0.12)]` |
| Code block | `bg-slate-900 text-slate-100 rounded-xl` |

---

## 4. Typographie

### Polices à importer

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Hiérarchie

| Élément | Police | Taille | Poids | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| H1 Hero | Inter | 56px (desktop) / 36px (mobile) | 800 | 1.1 | -0.025em |
| H2 Section | Inter | 42px (desktop) / 28px (mobile) | 700 | 1.15 | -0.02em |
| H3 Carte | Inter | 22px | 600 | 1.3 | -0.01em |
| Paragraphe | Inter | 18px (desktop) / 16px (mobile) | 400 | 1.7 | normal |
| Badge label | Inter | 14px | 600 | 1 | 0.05em |
| Navbar links | Inter | 15px | 500 | 1 | normal |
| Code | JetBrains Mono | 14px | 400 | 1.6 | normal |
| Bouton CTA | Inter | 16px | 600 | 1 | normal |
| Stats chiffres | Inter | 36px | 800 | 1 | -0.02em |

---

## 5. Composants UI

### Bouton CTA Principal

```
Hauteur    : 48px (h-12)
Padding    : 24px horizontal (px-6)
Radius     : 12px (rounded-xl)
Background : gradient from-indigo-600 to-purple-600
Texte      : blanc, 16px, font-weight 600
Ombre      : shadow-lg shadow-violet-500/25
Hover      : from-indigo-500 to-purple-500, shadow-xl shadow-violet-500/30
Transition : all 200ms ease
Icône      : ArrowRight à droite, 16px
```

### Bouton CTA Secondaire

```
Hauteur    : 48px (h-12)
Padding    : 24px horizontal (px-6)
Radius     : 12px (rounded-xl)
Background : blanc
Border     : 1px solid #E2E8F0 (slate-200)
Texte      : slate-700, 16px, font-weight 600
Hover      : bg-slate-50, border-slate-300
```

### Carte Feature

```
Padding    : 32px (p-8)
Radius     : 20px (rounded-[20px])
Background : blanc
Border     : 1px solid #E2E8F0
Ombre      : shadow-lg (repos) → shadow-xl (hover)
Hover      : border-violet-300, translateY(-4px)
Transition : all 300ms ease

Structure interne :
  ┌──────────────────────────────┐
  │ [Icône 48x48 dans cercle     │
  │  bg-violet-50/indigo-50]     │
  │                              │
  │ Titre (H3, 22px, bold)      │
  │ Description (16px, slate-500)│
  │                              │
  │ ┌──────────────────────────┐ │
  │ │  Capture d'écran         │ │
  │ │  (border, rounded-xl,    │ │
  │ │   shadow-inner)          │ │
  │ └──────────────────────────┘ │
  └──────────────────────────────┘
```

### Badge Section

```
Display    : inline-flex
Padding    : 6px 16px (py-1.5 px-4)
Radius     : 9999px (rounded-full)
Background : violet-50 (#F5F3FF)
Border     : 1px solid violet-200 (#DDD6FE)
Texte      : violet-700 (#6D28D9), 14px, font-weight 600, uppercase, letter-spacing 0.05em
```

### Mock Navigateur (pour encadrer les captures)

```
┌─────────────────────────────────────────────┐
│ ● ● ●    notoriouspy.com/builder           │  ← Header 40px, bg-slate-100, border-b
├─────────────────────────────────────────────┤
│                                             │
│         [CAPTURE D'ÉCRAN 4K]               │
│                                             │
└─────────────────────────────────────────────┘

Radius global : 16px (rounded-2xl)
Border       : 1px solid slate-200/60
Ombre        : shadow-[0_40px_80px_rgba(99,102,241,0.12)]
Dots macOS   : 3 cercles de 12px (rouge #EF4444, jaune #F59E0B, vert #22C55E)
Barre URL    : texte slate-400, 13px, centré
```

---

## 6. Animations & Interactions

### Scroll Reveal (Framer Motion)

```tsx
// Chaque section / carte utilise ce pattern :
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// Avec stagger pour les grilles :
const staggerContainer = {
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};
```

### Hover Carte

```css
.feature-card {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.15);
  border-color: #C4B5FD; /* violet-300 */
}
```

### Header Scroll

```
Position : sticky top-0, z-50
Fond initial : transparent
Fond après scroll : white/80 avec backdrop-blur-lg
Border : transparent → border-slate-200/60
Transition : background 300ms, border 300ms
```

### Bouton CTA Hover

```css
.cta-btn {
  transition: all 200ms ease;
}
.cta-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 40px -8px rgba(124, 58, 237, 0.35);
}
```

---

## 7. Responsive Design

### Mobile (< 768px)

- Header : logo + hamburger menu
- Hero : titre 36px, une seule colonne, capture pleine largeur
- Features : 1 colonne, cartes empilées
- Workflow : 1 colonne verticale
- IA section : empilée (texte au-dessus, capture en dessous)
- Témoignages : carrousel horizontal swipeable
- Footer : 1 colonne

### Tablette (768-1024px)

- Features : grille 2×3
- Workflow : 3 colonnes compactes
- Tout le reste : 1-2 colonnes adaptatives

### Desktop (> 1024px)

- Layout complet comme décrit dans le plan

---

## 8. Iconographie

### Sources d'icônes (par ordre de priorité)

| Source | URL | Usage recommandé | Format |
|---|---|---|---|
| **21.dev** | `https://21.dev` | Icônes modernes SVG animées, hero & features | SVG / React |
| **Flaticon** | `https://www.flaticon.com` | Icônes colorées pour les cartes features | SVG / PNG |
| **Icons8** | `https://icons8.com` | Icônes illustrées, style professionnel, animations | SVG / PNG / GIF |
| **Lucide React** | `https://lucide.dev` | Icônes inline dans le code (boutons, nav, badges) | React Component |

### Stratégie d'utilisation

- **Icônes de sections (features, workflow, IA)** → Privilégier **Flaticon** ou **Icons8** pour des icônes colorées, illustrées, qui apportent du caractère. Télécharger en SVG 64×64 ou 128×128.
- **Icônes hero / décorations animées** → Utiliser **21.dev** pour des icônes animées modernes qui donnent vie au hero.
- **Icônes inline (navigation, boutons, badges, footer)** → **Lucide React** pour la cohérence avec l'app et la légèreté.
- **Illustrations technos (bandeau de confiance)** → Logos officiels Python, React, TypeScript, Supabase, Vite en SVG depuis **Icons8** ou les sites officiels.

### Mapping icônes par section

| Section | Description | Source recommandée | Style |
|---|---|---|---|
| Feature Drag & Drop | Curseur + widgets | Flaticon / Icons8 | Coloré, 3D flat |
| Feature Export | Dossier ZIP / code | Flaticon / Icons8 | Coloré, 3D flat |
| Feature IA | Étincelles / cerveau IA | 21.dev (animé) ou Flaticon | Gradient violet |
| Feature Propriétés | Sliders / panneau | Flaticon / Icons8 | Coloré, emerald |
| Feature Cloud | Cloud + sync | Flaticon / Icons8 | Coloré, blue |
| Feature Code | Terminal / brackets | Flaticon / Icons8 | Coloré, amber |
| Étape 1 | Dossier + création | Flaticon | Violet |
| Étape 2 | Layers / design | Flaticon | Indigo |
| Étape 3 | Download / export | Flaticon | Emerald |
| CTA Arrow | Flèche | Lucide React (`ArrowRight`) | White |
| Navigation | Home, menu | Lucide React | slate-600 |
| Footer | GitHub, Twitter, Discord | Lucide React | slate-400 |
| Bandeau confiance | Python, React, TS, Supabase | Icons8 / sites officiels | Monochrome slate-400 |

### Présentation des icônes dans les cartes features

```
Conteneur : w-14 h-14, bg-{color}-50, rounded-2xl, flex items-center justify-center, shadow-sm
Icône SVG  : w-7 h-7 (ou 32×32 si image)
```

### Téléchargement et stockage

Placer les icônes téléchargées dans :
```
frontend/assets/icons/
├── features/
│   ├── icon-dragdrop.svg
│   ├── icon-export.svg
│   ├── icon-ai.svg
│   ├── icon-properties.svg
│   ├── icon-cloud.svg
│   └── icon-code.svg
├── workflow/
│   ├── icon-step1.svg
│   ├── icon-step2.svg
│   └── icon-step3.svg
├── tech-logos/
│   ├── python.svg
│   ├── react.svg
│   ├── typescript.svg
│   ├── supabase.svg
│   └── vite.svg
└── misc/
    └── ...
```

---

## 9. SEO & Meta Tags

```html
<title>Notorious Py — GUI Builder visuel pour Python CustomTkinter</title>
<meta name="description" content="Concevez visuellement des interfaces Python CustomTkinter avec Notorious Py. Drag & drop, export ZIP, génération IA, sauvegarde cloud. Gratuit.">
<meta name="keywords" content="Python, CustomTkinter, GUI Builder, interface graphique, drag and drop, code generator, visual builder">

<!-- Open Graph -->
<meta property="og:title" content="Notorious Py — Construisez vos interfaces Python visuellement">
<meta property="og:description" content="Le premier GUI Builder visuel dédié à CustomTkinter. Glissez, déposez, exportez.">
<meta property="og:image" content="/logos/notorious-py-logo-512x512.png">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Notorious Py — GUI Builder pour CustomTkinter">
<meta name="twitter:description" content="Concevez des interfaces Python sans coder. Export ZIP, IA intégrée, cloud.">
<meta name="twitter:image" content="/captures/capture-hero-canvas-fullscreen.png">
```

---

## 10. Accessibilité

- Contraste minimum **4.5:1** pour tout texte sur fond
- Tous les `<img>` ont un attribut `alt` descriptif
- Navigation clavier complète (focus visible avec ring violet)
- Balises sémantiques : `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- `aria-label` sur les boutons icônes
- Skip-to-content link masqué

---

> Ce document est le companion technique du fichier `LANDING-PAGE-PLAN.md`.
> Ensemble, ils forment le brief complet pour réaliser la landing page Notorious Py.
