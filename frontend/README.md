# 📁 Dossier Frontend — Notorious Py Landing Page

> Ce dossier contient **toute la documentation, le plan, les assets et les procédures**
> nécessaires pour réaliser la landing page de **Notorious Py**.

---

## Structure du dossier

```
frontend/
├── README.md                  ← Ce fichier (index du dossier)
├── LANDING-PAGE-PLAN.md       ← Plan complet : architecture, sections, prompt IA, checklist
├── DESIGN-SPECS.md            ← Spécifications design : couleurs, typo, composants, animations
├── CONTENU-LANDING.md         ← Tout le contenu textuel final (prêt à copier-coller)
├── PROCEDURES.md              ← Procédures pas à pas : captures, setup, dev, déploiement
├── ARCHITECTURE.md            ← Architecture technique de l'app Notorious Py
└── assets/
    ├── logos/                 ← Logos officiels Notorious Py (copiés depuis public/)
    │   ├── notorious-py-logo-512x512.png
    │   ├── notorious-py-logo-256x256.png
    │   ├── notorious-py-logo-192x192.png
    │   ├── notorious-py-logo-128x128.png
    │   ├── notorious-py-logo-64x64.png
    │   └── notorious-py-logo.svg
    ├── captures/              ← Screenshots 4K (générés via le script Puppeteer)
    └── icons/                 ← Icônes téléchargées depuis Flaticon, Icons8, 21.dev
        ├── features/          ← Icônes colorées pour les 6 cartes features
        ├── workflow/          ← Icônes pour les 3 étapes du workflow
        ├── tech-logos/        ← Logos Python, React, TypeScript, Supabase, Vite
        └── misc/              ← Icônes diverses
```

---

## Ordre de lecture recommandé

| # | Fichier | Ce que vous y trouverez |
|---|---|---|
| 1 | `ARCHITECTURE.md` | Comprendre l'application Notorious Py en profondeur |
| 2 | `LANDING-PAGE-PLAN.md` | Le plan complet de la landing page (10 sections) |
| 3 | `DESIGN-SPECS.md` | Les spécifications visuelles détaillées |
| 4 | `CONTENU-LANDING.md` | Tous les textes finaux de chaque section |
| 5 | `PROCEDURES.md` | Comment réaliser la landing page étape par étape |

---

## Comment utiliser ce dossier

### Pour donner à une IA (Claude, GPT-4, Cursor, Windsurf)

1. Commencez par envoyer `LANDING-PAGE-PLAN.md` — il contient un **prompt IA complet** (section 6)
2. Ajoutez `DESIGN-SPECS.md` pour les détails visuels
3. Ajoutez `CONTENU-LANDING.md` pour le contenu textuel exact
4. L'IA aura tout ce qu'il faut pour générer la landing page

### Pour un développeur humain

1. Lisez `ARCHITECTURE.md` pour comprendre le produit
2. Suivez `PROCEDURES.md` phase par phase
3. Référez-vous à `DESIGN-SPECS.md` pour chaque composant
4. Copiez le contenu depuis `CONTENU-LANDING.md`

### Pour réaliser les captures d'écran (script automatique)

```bash
# 1. Lancer l'app en dev (dans un terminal)
npm run dev

# 2. Lancer le script Puppeteer (dans un autre terminal)
node scripts/capture-screenshots.mjs

# 3. Suivre les instructions dans le terminal
#    (le navigateur s'ouvre, tu te connectes, puis Entrée pour chaque capture)
```

→ Voir aussi `PROCEDURES.md` > Phase 0 pour les scénarios détaillés de chaque capture.

### Pour les icônes

Télécharger les icônes depuis ces sources et les placer dans `assets/icons/` :
- **21.dev** — Icônes SVG animées modernes (hero, sections premium)
- **Flaticon** — Icônes colorées illustrées (cartes features, workflow)
- **Icons8** — Icônes professionnelles + logos technos (bandeau confiance)

---

## Informations clés

- **Nom officiel** : Notorious Py
- **Tagline** : Le constructeur visuel d'interfaces Python CustomTkinter
- **Stack app** : React 19 + TypeScript + Vite + TailwindCSS + Supabase
- **Stack landing recommandée** : Next.js 14 + TailwindCSS + Framer Motion
- **Style** : Professionnel, lumineux, de confiance (PAS ultra-sombre)
- **Palette** : Violet (#7C3AED) + Indigo (#6366F1) sur fond blanc/crème

---

> Dossier créé le 11 mars 2026 — Notorious Py © 2026
