# Notorious Py — Procédures de Réalisation de la Landing Page

> Guide étape par étape pour réaliser la landing page de A à Z.

---

## Phase 0 — Préparation des Captures d'Écran (Critique)

### Pourquoi c'est la première étape

La landing page repose sur de **vraies captures 4K** de l'application Notorious Py. Sans ces captures, la page sera vide. C'est la tâche la plus importante à faire EN PREMIER.

### Configuration de l'environnement de capture

```bash
# 1. Lancer l'application en mode développement
cd "/Users/emmanuellamaleka/Documents/FORMATION PYTHON 2025 FIN/NOTORIOUS CUSTOM TKINTER/Archive"
npm run dev

# 2. Ouvrir dans Chrome (meilleur pour les captures retina)
# URL : http://localhost:5173
```

### Paramètres Chrome pour captures 4K

1. Ouvrir DevTools (`Cmd+Option+I`)
2. Cliquer sur l'icône "Toggle device toolbar" (`Cmd+Shift+M`)
3. Configurer une résolution personnalisée : **2560 × 1440** (ou **1440 × 900** avec DPR 2x)
4. Pour capturer : `Cmd+Shift+P` → taper "Capture full size screenshot"

### Scénarios de capture détaillés

---

#### C01 — `capture-hero-canvas-fullscreen.png`
**Scénario** : Vue principale du builder
1. Se connecter à l'application
2. Ouvrir un projet existant OU en créer un nouveau nommé "Dashboard Pharmacie"
3. Créer un fichier `main.py`
4. Placer sur le canvas :
   - 2 cartes statistiques (StatCard) en haut
   - 1 tableau de données au centre
   - 1 graphique en bas à droite
   - 1 menu latéral à gauche
5. S'assurer que :
   - Le sidebar "Composants" est visible à gauche
   - Le panneau de propriétés est visible à droite
   - Le thème est en mode **clair**
   - La grille est visible
6. Capturer la fenêtre complète

---

#### C02 — `capture-feature-dragdrop.png`
**Scénario** : Widget en cours de drag
1. Depuis le canvas de C01
2. Commencer à glisser un widget "Bouton" depuis la bibliothèque
3. **TIMING** : Capturer pendant le drag (le widget est translucide à 30% opacity)
4. Les guides d'alignement devraient apparaître
> **Astuce** : Utiliser un enregistrement vidéo puis extraire une frame

---

#### C03 — `capture-feature-export.png`
**Scénario** : Modal d'export ouverte
1. Depuis un canvas avec plusieurs widgets
2. Cliquer sur "Exporter le Code" dans la TopBar
3. La modal s'ouvre avec :
   - Header gradient violet avec stats (lignes, widgets, fichiers)
   - Prévisualisation du code Python avec coloration syntaxique
   - Boutons "Copier" et "Télécharger ZIP"
4. Capturer la modal complète

---

#### C04 — `capture-feature-ai.png`
**Scénario** : Modal IA
1. Cliquer sur "Générer UI" (bouton violet avec Sparkles) dans la TopBar
2. La modal IA s'ouvre
3. Dans l'onglet "Prompt", taper :
   ```
   Un formulaire d'inscription avec un titre "Créer un compte",
   un champ prénom, un champ email, un champ mot de passe
   et un bouton "S'inscrire" violet sur fond sombre.
   ```
4. Sélectionner le modèle "GPT-4o" dans le sélecteur
5. Capturer la modal

---

#### C05 — `capture-feature-properties.png`
**Scénario** : Panneau de propriétés
1. Sélectionner un widget Bouton sur le canvas
2. Le panneau de propriétés à droite affiche :
   - Section Texte (text, font, text_color)
   - Section Apparence (fg_color, hover_color, corner_radius)
   - Section Dimensions (width, height)
3. Modifier quelques couleurs pour montrer la personnalisation
4. Capturer principalement le panneau droit + le widget sélectionné

---

#### C06 — `capture-feature-projects.png`
**Scénario** : Écran des projets
1. Fermer le projet actuel (cliquer sur l'icône Home)
2. L'écran "Mes Projets" s'affiche (WelcomeScreen)
3. Créer 3-4 projets avec des noms variés :
   - "Dashboard Pharmacie"
   - "App de Gestion Patients"
   - "Formulaire d'Inscription"
   - "Calculatrice Scientifique"
4. Capturer l'écran avec les cartes de projets

---

#### C07 — `capture-feature-codeview.png`
**Scénario** : Vue code
1. Depuis un canvas avec des widgets variés
2. Cliquer sur l'icône "Code" dans la TopBar (toggle Design/Code)
3. La vue code s'affiche avec :
   - Coloration syntaxique Python
   - Numéros de lignes
   - Code CustomTkinter généré
4. Capturer la vue code complète

---

#### C08 — `capture-canvas-large.png`
**Scénario** : Canvas avec dashboard riche
1. Créer un canvas 1200×800
2. Placer un dashboard complet :
   - Header avec UserProfile en haut à droite
   - 3 StatCards en haut (Patients, Revenus, Commandes)
   - 1 Tableau de données au centre
   - 1 Graphique (type "line") à droite
   - 1 MenuItem de navigation à gauche
3. **Thème clair**, grille visible
4. Capturer le canvas avec une marge confortable

---

#### C09 — `capture-widgets-library.png`
**Scénario** : Sidebar bibliothèque
1. Ouvrir l'onglet "Composants" dans la sidebar gauche
2. S'assurer que toutes les catégories sont visibles :
   - Basiques (Label, Bouton, Entry...)
   - Interactions (Checkbox, Radio, Switch...)
   - Conteneurs (Frame, ScrollableFrame, TabView)
   - Composites (StatCard, Table, Chart...)
3. Zoomer/cadrer sur la sidebar
4. Capturer

---

#### C10 — `capture-widgets-canvas.png`
**Scénario** : Tous les types de composites sur un canvas
1. Canvas large (1400×900)
2. Placer au moins :
   - 1 StatCard
   - 1 Table
   - 1 Chart
   - 1 MenuItem
   - 1 ProductCard
   - 1 UserProfile
   - 1 DatePicker
3. Organiser joliment
4. Capturer

---

#### C11 à C20 — Voir la liste dans `LANDING-PAGE-PLAN.md` section 5.2

---

## Phase 1 — Initialisation du Projet Landing Page

### Option A — Next.js (Recommandé)

```bash
# Créer le projet
npx create-next-app@latest notorious-py-landing \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd notorious-py-landing

# Installer les dépendances
npm install framer-motion lucide-react

# Installer les fonts
# → Ajouter Inter et JetBrains Mono via next/font/google dans layout.tsx
```

### Option B — React + Vite (Plus simple)

```bash
npm create vite@latest notorious-py-landing -- --template react-ts
cd notorious-py-landing
npm install
npm install tailwindcss @tailwindcss/vite framer-motion lucide-react
```

### Structure de fichiers à créer

```
notorious-py-landing/
├── src/ (ou app/ pour Next.js)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── TrustBand.tsx
│   │   ├── Features.tsx
│   │   ├── CanvasDemo.tsx
│   │   ├── WidgetShowcase.tsx
│   │   ├── Workflow.tsx
│   │   ├── AISection.tsx
│   │   ├── Testimonials.tsx
│   │   ├── CTAFinal.tsx
│   │   ├── Footer.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── BrowserMock.tsx      ← Mock navigateur pour captures
│   │       └── SectionWrapper.tsx   ← Wrapper avec animations scroll
│   ├── assets/
│   │   ├── logos/      (copier depuis frontend/assets/logos/)
│   │   └── captures/   (copier depuis frontend/assets/captures/)
│   ├── page.tsx        (ou App.tsx pour Vite)
│   └── globals.css
├── public/
│   └── og-image.png    (image Open Graph pour partage social)
└── package.json
```

---

## Phase 2 — Configuration TailwindCSS

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Reprendre la palette de DESIGN-SPECS.md
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## Phase 3 — Développement des Composants

### Ordre de développement (du plus au moins impactant)

| # | Composant | Temps estimé | Priorité |
|---|---|---|---|
| 1 | `Header.tsx` | 1h | 🔴 Critique |
| 2 | `Hero.tsx` | 2h | 🔴 Critique |
| 3 | `Features.tsx` | 2h | 🔴 Critique |
| 4 | `CanvasDemo.tsx` | 1h | 🟡 Important |
| 5 | `WidgetShowcase.tsx` | 1.5h | 🟡 Important |
| 6 | `Workflow.tsx` | 1.5h | 🟡 Important |
| 7 | `AISection.tsx` | 1.5h | 🟡 Important |
| 8 | `TrustBand.tsx` | 30min | 🟢 Bonus |
| 9 | `Testimonials.tsx` | 1h | 🟢 Bonus |
| 10 | `CTAFinal.tsx` + `Footer.tsx` | 1h | 🟢 Bonus |

**Temps total estimé** : ~12-15h de développement

### Pattern de composant réutilisable

```tsx
// components/ui/SectionWrapper.tsx
"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionWrapper({ children, className = "", id }: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`py-24 px-6 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </motion.section>
  );
}
```

---

## Phase 4 — Intégration des Captures

### Composant BrowserMock

```tsx
// components/ui/BrowserMock.tsx
interface BrowserMockProps {
  src: string;
  alt: string;
  url?: string;
}

export function BrowserMock({ src, alt, url = "notoriouspy.com/builder" }: BrowserMockProps) {
  return (
    <div className="rounded-2xl border border-slate-200/60 shadow-[0_40px_80px_rgba(99,102,241,0.12)] overflow-hidden bg-white">
      {/* Barre macOS */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-slate-400 mx-auto font-mono">{url}</span>
      </div>
      {/* Capture */}
      <img src={src} alt={alt} className="w-full" loading="lazy" />
    </div>
  );
}
```

### Convention de nommage des images

```
assets/captures/capture-{section}-{detail}.png     ← Source PNG 4K
assets/captures/capture-{section}-{detail}.webp    ← Version optimisée WebP
```

---

## Phase 5 — Tests & Optimisation

### Checklist responsive

- [ ] Mobile 375px (iPhone SE) — vérifier que rien ne dépasse
- [ ] Mobile 390px (iPhone 14) — texte lisible, CTA atteignable
- [ ] Tablette 768px (iPad) — grille 2 colonnes
- [ ] Desktop 1280px — layout complet
- [ ] Desktop 1920px — pas de stretch excessif

### Checklist performance

- [ ] Images en WebP avec fallback PNG
- [ ] `loading="lazy"` sur toutes les images sous le fold
- [ ] Fonts optimisées avec `font-display: swap`
- [ ] Bundle JS < 200ko (gzip)
- [ ] Lighthouse Score > 90 (Performance, Accessibility, SEO)

### Checklist accessibilité

- [ ] Alt text sur toutes les images
- [ ] Contraste WCAG AA minimum
- [ ] Navigation clavier fonctionnelle
- [ ] Focus visible (ring violet)
- [ ] Skip-to-content link

---

## Phase 6 — Déploiement

### Vercel (Recommandé pour Next.js)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer le domaine
vercel domains add notoriouspy.com
```

### Netlify (Alternative)

```bash
# Build
npm run build

# Déployer le dossier out/ (Next.js static export) ou dist/ (Vite)
netlify deploy --prod --dir=out
```

### Variables d'environnement

Aucune variable d'environnement nécessaire pour la landing page (site statique).
L'application principale (Supabase, OpenRouter) est un projet séparé.

---

## Récapitulatif des Livrables

| # | Fichier/Dossier | Description |
|---|---|---|
| 1 | `frontend/LANDING-PAGE-PLAN.md` | Plan complet avec architecture, sections, prompt IA |
| 2 | `frontend/DESIGN-SPECS.md` | Spécifications design (couleurs, typo, composants) |
| 3 | `frontend/CONTENU-LANDING.md` | Tout le contenu textuel prêt à intégrer |
| 4 | `frontend/PROCEDURES.md` | Ce fichier — procédures pas à pas |
| 5 | `frontend/ARCHITECTURE.md` | Architecture technique de l'application |
| 6 | `frontend/assets/logos/` | Logos Notorious Py (64, 128, 192, 256, 512, SVG) |
| 7 | `frontend/assets/captures/` | Dossier pour les 20 captures 4K (à réaliser) |
| 8 | `frontend/assets/icons/` | Icônes additionnelles si nécessaire |

---

> Suivez les phases dans l'ordre. La Phase 0 (captures) est la plus critique
> car elle conditionne toute la qualité visuelle de la landing page.
