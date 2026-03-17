# Notorious Py — Design System Landing Page

> **Identité visuelle** : Bleu Marine `#0F3460` + Blanc `#FFFFFF`
> **Philosophie** : Premium, épuré, professionnel — inspiré de Stripe, Linear, Vercel

---

## 1. Palette de Couleurs Complète

### Couleurs Principales

| Rôle | Nom | Hex | RGB | Usage |
|------|-----|-----|-----|-------|
| **Primaire** | Bleu Marine Profond | `#0F3460` | 15, 52, 96 | Titres, header, CTA principal, sections sombres |
| **Primaire clair** | Bleu Royal | `#16498C` | 22, 73, 140 | Hover boutons, liens actifs |
| **Accent** | Bleu Électrique | `#1A6DFF` | 26, 109, 255 | CTA secondaire, liens, badges, highlights |
| **Accent clair** | Bleu Ciel | `#4DA8FF` | 77, 168, 255 | Icônes, décorations, hover léger |
| **Accent ultra-léger** | Bleu Glace | `#E8F4FD` | 232, 244, 253 | Fond badges, fond cartes accent |

### Fonds

| Zone | Hex | Tailwind Approx. | Usage |
|------|-----|-------------------|-------|
| Fond global | `#FFFFFF` | `white` | Fond principal de la page |
| Sections alternées | `#F8FAFC` | `slate-50` | Sections pairs pour rythme visuel |
| Sections sombres | `#0F3460` | custom | Hero fond optionnel, CTA final, footer |
| Fond ultra-sombre | `#0A1929` | custom | Blocs de code, section démo code |
| Fond carte | `#FFFFFF` | `white` | Cartes features, pricing, témoignages |

### Texte

| Rôle | Hex | Usage |
|------|-----|-------|
| Titre H1/H2 | `#0F3460` | Titres principaux sur fond blanc |
| Titre sur fond sombre | `#FFFFFF` | Titres sur sections #0F3460 |
| Sous-titre | `#1E3A5F` | Sous-titres, texte important |
| Paragraphe | `#5A7184` | Corps de texte, descriptions |
| Texte léger | `#8FA3B8` | Labels, captions, texte tertiaire |
| Texte sur fond sombre | `#B8D4E8` | Paragraphes sur sections sombres |
| Lien | `#1A6DFF` | Liens interactifs |
| Lien hover | `#0F3460` | Liens au survol |

### Surfaces & Bordures

| Élément | Style |
|---------|-------|
| Bordure carte | `#E1E8F0` |
| Bordure hover | `#1A6DFF` (bleu électrique) |
| Ombre carte repos | `0 4px 24px rgba(15, 52, 96, 0.08)` |
| Ombre carte hover | `0 16px 48px rgba(15, 52, 96, 0.15)` |
| Ombre capture hero | `0 40px 80px rgba(15, 52, 96, 0.20)` |
| Séparateur | `#E1E8F0` |

### Gradients

```css
/* CTA Principal */
background: linear-gradient(135deg, #0F3460 0%, #1A6DFF 100%);

/* Hero Background (si fond sombre) */
background: linear-gradient(160deg, #0A1929 0%, #0F3460 50%, #16498C 100%);

/* Badge */
background: linear-gradient(135deg, #E8F4FD, #D6ECFA);

/* Fond section Pricing */
background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);

/* Glow décoratif */
background: radial-gradient(circle at 50% 0%, rgba(26, 109, 255, 0.12), transparent 60%);

/* Dot grid décoratif */
background-image: radial-gradient(circle, #0F3460 0.5px, transparent 0.5px);
background-size: 24px 24px;
opacity: 0.04;
```

### Couleurs d'État

| État | Hex | Usage |
|------|-----|-------|
| Succès | `#10B981` | Check marks, prix, confirmations |
| Warning | `#F59E0B` | Alertes |
| Erreur | `#EF4444` | Erreurs |
| Info | `#1A6DFF` | Informations |

---

## 2. Typographie

### Polices

```html
<!-- Google Fonts à importer -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Rôle | Police | Fallback |
|------|--------|----------|
| Titres & Corps | **Inter** | -apple-system, BlinkMacSystemFont, sans-serif |
| Code | **JetBrains Mono** | "Fira Code", "Cascadia Code", monospace |

### Hiérarchie Typographique

| Élément | Taille Desktop | Taille Mobile | Poids | Line-height | Letter-spacing |
|---------|---------------|---------------|-------|-------------|----------------|
| H1 Hero | 64px | 38px | 900 (Black) | 1.05 | -0.03em |
| H2 Section | 48px | 30px | 800 (ExtraBold) | 1.1 | -0.025em |
| H3 Carte | 24px | 20px | 700 (Bold) | 1.3 | -0.01em |
| Sous-titre Hero | 20px | 17px | 400 | 1.7 | normal |
| Paragraphe | 18px | 16px | 400 | 1.7 | normal |
| Badge label | 13px | 12px | 700 | 1 | 0.08em |
| Nav links | 15px | 14px | 500 | 1 | normal |
| Bouton CTA | 16px | 15px | 600 | 1 | 0.01em |
| Code | 14px | 13px | 400 | 1.6 | normal |
| Stats chiffres | 48px | 32px | 900 | 1 | -0.03em |
| Prix (Pricing) | 56px | 40px | 900 | 1 | -0.03em |
| Caption | 14px | 13px | 500 | 1.5 | normal |
| Footer links | 14px | 13px | 400 | 1.8 | normal |
| Footer titre colonne | 14px | 13px | 700 | 1 | 0.05em |

---

## 3. Grille & Layout

```
Largeur max conteneur  : 1280px (mx-auto)
Padding horizontal     : 20px (mobile), 40px (tablette), 64px (desktop)
Padding vertical       : 100px (py-[100px]) entre sections
Gap cartes features    : 24px (gap-6)
Gap cartes pricing     : 32px (gap-8)

Breakpoints :
  - Mobile   : < 768px   → 1 colonne
  - Tablette : 768-1024px → 2 colonnes
  - Desktop  : > 1024px  → 3 colonnes (features, pricing), 2 colonnes (splits)
```

---

## 4. Composants UI

### Bouton CTA Principal

```
Hauteur     : 52px (h-[52px])
Padding     : 28px horizontal (px-7)
Radius      : 14px (rounded-[14px])
Background  : linear-gradient(135deg, #0F3460, #1A6DFF)
Texte       : #FFFFFF, 16px, font-weight 600
Ombre       : 0 8px 30px rgba(15, 52, 96, 0.35)
Hover       : translateY(-2px), ombre amplifiée, brightness(1.1)
Transition  : all 250ms cubic-bezier(0.4, 0, 0.2, 1)
Icône       : ArrowRight, 18px, à droite, gap-2
```

### Bouton CTA Secondaire

```
Hauteur     : 52px (h-[52px])
Padding     : 28px horizontal (px-7)
Radius      : 14px (rounded-[14px])
Background  : #FFFFFF
Border      : 2px solid #0F3460
Texte       : #0F3460, 16px, font-weight 600
Hover       : bg #0F3460, texte #FFFFFF
Transition  : all 200ms ease
```

### Bouton Nav (Login)

```
Hauteur     : 40px
Padding     : 16px horizontal
Radius      : 10px
Background  : transparent
Texte       : #0F3460, 15px, font-weight 500
Hover       : bg #F8FAFC
```

### Bouton Nav (Sign Up)

```
Hauteur     : 40px
Padding     : 20px horizontal
Radius      : 10px
Background  : #0F3460
Texte       : #FFFFFF, 15px, font-weight 600
Hover       : bg #16498C
Icône       : ArrowUpRight, 14px
```

### Carte Feature

```
Padding     : 32px (p-8)
Radius      : 20px
Background  : #FFFFFF
Border      : 1px solid #E1E8F0
Ombre repos : 0 4px 24px rgba(15, 52, 96, 0.06)
Ombre hover : 0 16px 48px rgba(15, 52, 96, 0.12)
Hover       : border #1A6DFF, translateY(-6px)
Transition  : all 350ms cubic-bezier(0.4, 0, 0.2, 1)

Icône conteneur : w-14 h-14, bg-[#E8F4FD], rounded-2xl, flex center
Icône           : w-7 h-7, couleur #1A6DFF
Titre           : #0F3460, 24px, font-weight 700, mt-5
Description     : #5A7184, 16px, font-weight 400, mt-3, line-height 1.7
```

### Carte Pricing

```
Padding     : 40px (p-10)
Radius      : 24px
Background  : #FFFFFF
Border      : 1px solid #E1E8F0
Ombre       : 0 8px 32px rgba(15, 52, 96, 0.08)

Variante "Popular" (Pro) :
  Border    : 2px solid #1A6DFF
  Ombre     : 0 16px 64px rgba(26, 109, 255, 0.20)
  Badge     : "Populaire" — bg #0F3460, text white, rounded-full, absolute top -12px
  Scale     : transform scale(1.05) sur desktop
```

### Carte Témoignage

```
Padding     : 28px (p-7)
Radius      : 16px
Background  : #0A1929 (fond sombre pour cette section)
Border      : 1px solid rgba(255,255,255, 0.08)
Texte       : #E8F4FD
Nom auteur  : #FFFFFF, font-weight 600
Rôle        : #8FA3B8, 14px
Étoiles     : #F59E0B (amber)
```

### Badge Section

```
Display     : inline-flex
Padding     : 8px 18px (py-2 px-[18px])
Radius      : 9999px (rounded-full)
Background  : #E8F4FD
Border      : 1px solid #B8D4E8
Texte       : #0F3460, 13px, font-weight 700, uppercase, letter-spacing 0.08em
```

### Accordéon FAQ

```
Item padding    : 24px vertical
Border bottom   : 1px solid #E1E8F0
Question        : #0F3460, 18px, font-weight 600
Réponse         : #5A7184, 16px, font-weight 400, line-height 1.8
Icône toggle    : ChevronDown, #0F3460, rotation 180° quand ouvert
Transition      : height 300ms ease, transform 200ms ease
```

### Mock Navigateur (encadrement captures)

```
┌──────────────────────────────────────────────┐
│ ● ● ●    notoriouspy.com/builder             │  ← Header 44px, bg #F1F5F9, border-b #E1E8F0
├──────────────────────────────────────────────┤
│                                              │
│            [CAPTURE D'ÉCRAN 4K]              │
│                                              │
└──────────────────────────────────────────────┘

Radius global  : 20px (rounded-[20px])
Border         : 1px solid rgba(15, 52, 96, 0.12)
Ombre          : 0 40px 80px rgba(15, 52, 96, 0.18)
Dots macOS     : 12px — rouge #EF4444, jaune #F59E0B, vert #22C55E
Barre URL      : texte #8FA3B8, 13px, centré
```

---

## 5. Animations & Interactions

### Scroll Reveal (Framer Motion)

```tsx
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const staggerContainer = {
  visible: {
    transition: { staggerChildren: 0.12 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};
```

### Carrousel Témoignages (défilement infini)

```tsx
// Défilement automatique horizontal infini (type marquee)
// 2 rangées de cartes défilant en sens opposés
// Vitesse : 30px/s
// Pause au hover
// Duplication des cartes pour boucle fluide
```

### Header Scroll

```
Position     : sticky top-0, z-50
Fond initial : transparent (si hero fond sombre) OU white
Fond scroll  : rgba(255,255,255, 0.92) + backdrop-blur-xl
Border       : transparent → 1px solid #E1E8F0
Transition   : all 300ms ease
```

### Hover Cartes

```css
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(15, 52, 96, 0.15);
  border-color: #1A6DFF;
}
```

### Bouton CTA Hover

```css
.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(15, 52, 96, 0.45);
  filter: brightness(1.08);
}
```

### Compteurs Animés (bandeau confiance)

```
Animation   : Compter de 0 à la valeur finale
Durée       : 2 secondes
Easing      : easeOut
Trigger     : Quand la section entre dans le viewport
Librairie   : framer-motion useMotionValue + useTransform
```

---

## 6. Responsive

### Mobile (< 768px)

- Header : logo + hamburger menu (menu mobile full-screen avec fond #0F3460)
- Hero : titre 38px, 1 colonne, capture pleine largeur, CTA empilés
- Features : 1 colonne
- Pricing : 1 colonne, carte Pro en premier
- Témoignages : carrousel swipeable 1 carte visible
- FAQ : full width
- Footer : 1 colonne, sections empilées

### Tablette (768-1024px)

- Features : grille 2×3
- Pricing : 3 colonnes compactes
- Témoignages : 2 cartes visibles

### Desktop (> 1024px)

- Layout complet comme décrit dans le plan
- Pricing : 3 colonnes avec carte Pro agrandie au centre

---

## 7. Accessibilité

- Contraste **4.5:1** minimum (#0F3460 sur blanc = ratio **9.1:1** ✅)
- `alt` descriptif sur toutes les `<img>`
- Focus visible : ring `#1A6DFF` avec offset 2px
- Balises sémantiques : `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- `aria-label` sur boutons icônes
- `aria-expanded` sur l'accordéon FAQ
- Skip-to-content link masqué
- Préfère `prefers-reduced-motion` : désactiver animations

---

> Ce design system est le companion du fichier `CONTENU-COMPLET.md` et `PROMPT-IA.md`.
