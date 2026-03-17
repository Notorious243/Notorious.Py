# Notorious Py — Structure & Architecture du Projet Landing Page

> Architecture des fichiers et composants pour la landing page.

---

## 1. Stack Technique Recommandée

| Couche | Technologie | Justification |
|--------|------------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSG, SEO optimal, optimisation images |
| **Styling** | TailwindCSS 3.4+ | Utility-first, cohérence avec l'app |
| **Composants UI** | shadcn/ui | Button, Badge, Card, Accordion, Avatar, Tabs, Separator |
| **Animations** | Framer Motion 12+ | Scroll reveal, carrousel, compteurs |
| **Icônes inline** | Lucide React | Nav, boutons, footer, badges |
| **Icônes features** | Flaticon / Icons8 / 21.dev | Cartes features, workflow (SVG colorées) |
| **Fonts** | Inter + JetBrains Mono (Google Fonts) | Titres + code |
| **Images** | next/image + WebP | Optimisation automatique |
| **Déploiement** | Vercel | Intégration native Next.js |

---

## 2. Arborescence du Projet

```
notorious-py-landing/
├── app/
│   ├── layout.tsx              ← Layout racine (fonts, meta, body)
│   ├── page.tsx                ← Page principale (assemblage des sections)
│   ├── globals.css             ← Styles globaux + custom Tailwind
│   └── favicon.ico
│
├── components/
│   ├── sections/
│   │   ├── Header.tsx          ← 01. Navigation sticky
│   │   ├── Hero.tsx            ← 02. Hero (titre + CTA + capture)
│   │   ├── TrustBand.tsx       ← 03. Bandeau de confiance (stats + logos)
│   │   ├── Features.tsx        ← 04. 6 cartes fonctionnalités
│   │   ├── CodeDemo.tsx        ← 05. Section "Design visually, Compile natively"
│   │   ├── Pricing.tsx         ← 06. 3 plans de tarification
│   │   ├── TestimonialsGrid.tsx ← 07. Carrousel témoignages défilants
│   │   ├── TestimonialHero.tsx ← 08. Témoignage vedette (carte du monde)
│   │   ├── FAQ.tsx             ← 09. Accordéon FAQ
│   │   ├── AboutCreator.tsx    ← 10. À propos d'Emmanuel Lamaleka
│   │   ├── CTAFinal.tsx        ← 11. Appel à l'action final
│   │   └── Footer.tsx          ← 12. Pied de page multi-colonnes
│   │
│   ├── ui/                     ← Composants shadcn/ui (générés)
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── accordion.tsx
│   │   ├── avatar.tsx
│   │   ├── tabs.tsx
│   │   └── separator.tsx
│   │
│   ├── shared/
│   │   ├── SectionBadge.tsx    ← Badge réutilisable pour les sections
│   │   ├── SectionTitle.tsx    ← Titre H2 + sous-titre réutilisable
│   │   ├── BrowserMock.tsx     ← Encadrement capture (dots macOS + URL bar)
│   │   ├── AnimatedCounter.tsx ← Compteur animé (bandeau de confiance)
│   │   ├── MarqueeRow.tsx      ← Rangée de carrousel infini (témoignages)
│   │   └── CodeBlock.tsx       ← Bloc de code avec syntaxe (section démo)
│   │
│   └── icons/
│       └── TechLogos.tsx       ← Logos SVG tech (Python, React, TS, etc.)
│
├── lib/
│   ├── utils.ts                ← Utilitaires (cn, classnames)
│   └── animations.ts           ← Variantes Framer Motion réutilisables
│
├── data/
│   ├── features.ts             ← Données des 6 cartes features
│   ├── pricing.ts              ← Données des 3 plans
│   ├── testimonials.ts         ← Données des 10+ témoignages
│   ├── faq.ts                  ← Données des 8 questions FAQ
│   └── navigation.ts           ← Liens de navigation
│
├── public/
│   ├── logos/
│   │   ├── notorious-py-logo-512x512.png
│   │   ├── notorious-py-logo-256x256.png
│   │   ├── notorious-py-logo-192x192.png
│   │   ├── notorious-py-logo-128x128.png
│   │   ├── notorious-py-logo-64x64.png
│   │   └── notorious-py-logo.svg
│   │
│   ├── captures/
│   │   ├── capture-hero-canvas-fullscreen.png
│   │   ├── capture-feature-dragdrop.png
│   │   ├── capture-feature-export.png
│   │   ├── capture-feature-ai.png
│   │   ├── capture-feature-properties.png
│   │   ├── capture-feature-projects.png
│   │   ├── capture-feature-codeview.png
│   │   ├── capture-canvas-large.png
│   │   └── ...
│   │
│   ├── icons/
│   │   ├── features/
│   │   │   ├── icon-dragdrop.svg
│   │   │   ├── icon-export.svg
│   │   │   ├── icon-ai.svg
│   │   │   ├── icon-properties.svg
│   │   │   ├── icon-cloud.svg
│   │   │   └── icon-code.svg
│   │   ├── tech-logos/
│   │   │   ├── python.svg
│   │   │   ├── react.svg
│   │   │   ├── typescript.svg
│   │   │   ├── supabase.svg
│   │   │   ├── customtkinter.svg
│   │   │   └── vite.svg
│   │   └── avatars/
│   │       └── ... (photos témoignages)
│   │
│   ├── og-image.png            ← Image Open Graph (1200×630)
│   ├── robots.txt
│   └── sitemap.xml
│
├── styles/
│   └── fonts.ts                ← Configuration Inter + JetBrains Mono
│
├── tailwind.config.ts          ← Config Tailwind avec palette #0F3460
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Configuration Tailwind Personnalisée

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Notorious Py
        'navy': {
          50: '#E8F4FD',
          100: '#D6ECFA',
          200: '#B8D4E8',
          300: '#8FA3B8',
          400: '#5A7184',
          500: '#1E3A5F',
          600: '#16498C',
          700: '#0F3460',   // PRIMAIRE
          800: '#0C2A4E',
          900: '#0A1929',   // Ultra-sombre
          950: '#061121',
        },
        'electric': {
          DEFAULT: '#1A6DFF',
          light: '#4DA8FF',
          dark: '#0D4FCC',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(15, 52, 96, 0.06)',
        'card-hover': '0 16px 48px rgba(15, 52, 96, 0.12)',
        'hero': '0 40px 80px rgba(15, 52, 96, 0.18)',
        'cta': '0 8px 30px rgba(15, 52, 96, 0.35)',
        'pricing': '0 16px 64px rgba(26, 109, 255, 0.20)',
      },
      animation: {
        'marquee-left': 'marquee-left 40s linear infinite',
        'marquee-right': 'marquee-right 40s linear infinite',
      },
      keyframes: {
        'marquee-left': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 4. Commandes d'Initialisation

```bash
# 1. Créer le projet Next.js
npx create-next-app@latest notorious-py-landing --typescript --tailwind --app --src-dir=false

# 2. Installer les dépendances
cd notorious-py-landing
npm install framer-motion lucide-react

# 3. Initialiser shadcn/ui
npx shadcn@latest init

# 4. Ajouter les composants shadcn/ui nécessaires
npx shadcn@latest add button badge card accordion avatar tabs separator

# 5. Copier les assets depuis le projet principal
cp -r ../frontend/assets/logos/ public/logos/
cp -r ../frontend/assets/captures/ public/captures/

# 6. Lancer le dev server
npm run dev
```

---

## 5. Ordre de Développement Recommandé

| Étape | Composant | Priorité | Temps estimé |
|-------|-----------|----------|--------------|
| 1 | `layout.tsx` + `globals.css` | Critique | 30 min |
| 2 | `Header.tsx` | Critique | 1h |
| 3 | `Hero.tsx` + `BrowserMock.tsx` | Critique | 2h |
| 4 | `TrustBand.tsx` + `AnimatedCounter.tsx` | Haute | 1h |
| 5 | `Features.tsx` | Haute | 2h |
| 6 | `CodeDemo.tsx` + `CodeBlock.tsx` | Haute | 1.5h |
| 7 | `Pricing.tsx` | Haute | 2h |
| 8 | `TestimonialsGrid.tsx` + `MarqueeRow.tsx` | Moyenne | 2h |
| 9 | `TestimonialHero.tsx` | Moyenne | 1.5h |
| 10 | `FAQ.tsx` | Moyenne | 1h |
| 11 | `AboutCreator.tsx` | Moyenne | 1h |
| 12 | `CTAFinal.tsx` | Moyenne | 30 min |
| 13 | `Footer.tsx` | Moyenne | 1h |
| 14 | Animations Framer Motion | Basse | 2h |
| 15 | Responsive + Polish | Basse | 3h |
| **Total** | | | **~20h** |

---

## 6. Dépendances package.json

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-separator": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

> Ce document est le guide technique pour initialiser et structurer le projet landing page.
