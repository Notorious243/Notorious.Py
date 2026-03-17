# Notorious Py — Prompt IA Complet pour Générer la Landing Page

> Ce prompt est conçu pour être donné **tel quel** à une IA (Claude, GPT-4, Cursor, Windsurf, Bolt, v0)
> pour générer la landing page complète de Notorious Py.
> Il contient TOUTES les informations nécessaires : design, contenu, structure, code.

---

## PROMPT PRINCIPAL — À COPIER-COLLER

````
Tu es un développeur frontend expert et un designer UI/UX senior. Crée une landing page
complète, professionnelle et percutante pour "Notorious Py" — un GUI Builder visuel
pour Python CustomTkinter.

═══════════════════════════════════════════════════════
INFORMATIONS PRODUIT
═══════════════════════════════════════════════════════

Nom              : Notorious Py
Type             : Application web (SaaS) — GUI Builder visuel
Créateur         : Emmanuel Lamaleka
URL              : notoriouspy.com

FONCTION PRINCIPALE :
Permettre aux développeurs Python de concevoir visuellement des interfaces desktop
CustomTkinter via drag & drop dans le navigateur, puis d'exporter un projet Python
complet en ZIP (fichier .py + images + requirements.txt + README.md).

STACK DE L'APPLICATION :
React 19, TypeScript 5.8, Vite 6.3, TailwindCSS 3.4, Supabase (Auth, DB PostgreSQL,
Realtime), Framer Motion, react-dnd, shadcn/ui, Lucide React, Recharts, JSZip,
react-syntax-highlighter, driver.js (onboarding)

WIDGETS DISPONIBLES (24+) :
• 14 Widgets Natifs CustomTkinter : Label, Button, Entry, PasswordEntry, Textbox,
  ProgressBar, ImageLabel, Checkbox, RadioButton, Switch, ComboBox, OptionMenu,
  SegmentedButton, Slider
• 3 Conteneurs : Frame, ScrollableFrame, TabView
• 7 Composants Composites : StatCard, Table, MenuItem, Chart (matplotlib),
  DatePicker (tkcalendar), ProductCard, UserProfile

FEATURES PRINCIPALES :
1. Drag & Drop — 24+ widgets organisés en 4 catégories, guides d'alignement magnétiques
2. Export ZIP — Code Python propre, commenté, 100% conforme CustomTkinter
3. Génération IA — Prompt texte ou upload image via OpenRouter (GPT-4o, Claude, Gemini)
4. Projets Cloud — Sauvegarde automatique chaque seconde via Supabase
5. Multi-fichiers — Explorateur de fichiers .py intégré type VS Code
6. Vue Code — Code Python en temps réel avec coloration syntaxique
7. Thème clair/sombre — Toggle instantané
8. Tour guidé — Onboarding 7 étapes avec driver.js
9. Undo/Redo — 50 niveaux d'historique
10. Raccourcis clavier — Ctrl+Z, Ctrl+C, Ctrl+V, flèches, etc.

PUBLIC CIBLE :
- Étudiants Python (apprendre les GUI)
- Développeurs Python (prototypage rapide)
- Formateurs/Enseignants (outil pédagogique)
- Freelances Python (livrer des apps avec UI)

═══════════════════════════════════════════════════════
DIRECTION DESIGN — TRÈS IMPORTANT
═══════════════════════════════════════════════════════

COULEURS PRINCIPALES :
  Couleur primaire     : #0F3460 (Bleu Marine Profond)
  Fond principal       : #FFFFFF (Blanc Pur)
  Fond sections alternées : #F8FAFC (Gris Perle)
  Accent lumineux      : #1A6DFF (Bleu Électrique)
  Accent clair         : #4DA8FF (Bleu Ciel)
  Accent ultra-léger   : #E8F4FD (Bleu Glace — fond badges)
  Fond sombre (code)   : #0A1929 (Bleu Nuit)
  Texte principal      : #0F3460
  Texte secondaire     : #5A7184
  Texte léger          : #8FA3B8
  Texte sur fond sombre: #B8D4E8
  Bordures             : #E1E8F0
  Succès               : #10B981
  Étoiles              : #F59E0B

GRADIENTS :
  CTA principal : linear-gradient(135deg, #0F3460 0%, #1A6DFF 100%)
  Hero fond sombre (optionnel) : linear-gradient(160deg, #0A1929, #0F3460, #16498C)
  Badge : linear-gradient(135deg, #E8F4FD, #D6ECFA)
  Glow décoratif : radial-gradient(circle at 50% 0%, rgba(26,109,255,0.12), transparent 60%)

STYLE GÉNÉRAL :
- Professionnel, premium, lumineux — inspiré de Stripe, Linear, Vercel
- Fonds principalement blancs avec sections alternées gris très léger
- Sections sombres (#0F3460 ou #0A1929) pour contraste : section code, témoignages, CTA final
- PAS ultra-sombre sur toute la page
- Beaucoup d'espace blanc (whitespace)
- Captures d'écran réelles de l'app (pas d'illustrations génériques)
- Ombres douces : rgba(15, 52, 96, 0.06) à rgba(15, 52, 96, 0.18)

TYPOGRAPHIE :
- Font titres & corps : "Inter" (Google Fonts) — weights 400, 500, 600, 700, 800, 900
- Font code : "JetBrains Mono" (Google Fonts) — weight 400, 500
- H1 : 64px desktop / 38px mobile, weight 900, line-height 1.05, letter-spacing -0.03em
- H2 : 48px desktop / 30px mobile, weight 800, line-height 1.1
- H3 : 24px, weight 700
- Paragraphe : 18px, weight 400, line-height 1.7, couleur #5A7184
- Badge : 13px, weight 700, uppercase, letter-spacing 0.08em

COMPOSANTS :
- Border-radius cartes : 20px
- Border-radius boutons : 14px
- Ombre carte repos : 0 4px 24px rgba(15,52,96,0.06)
- Ombre carte hover : 0 16px 48px rgba(15,52,96,0.12), border #1A6DFF, translateY(-6px)
- Bouton CTA : h-[52px], gradient #0F3460→#1A6DFF, texte blanc, shadow, hover translateY(-2px)
- Badge section : rounded-full, bg #E8F4FD, border #B8D4E8, texte #0F3460

ANIMATIONS (Framer Motion) :
- Scroll reveal : fadeInUp (opacity 0→1, y 40→0, durée 0.7s, ease easeOut)
- Stagger cartes : 0.12s entre chaque
- Compteurs animés : de 0 à valeur finale en 2s
- Hover cartes : translateY(-6px) + shadow amplifiée
- Carrousel témoignages : marquee infini (2 rangées sens opposés, 40s par cycle)

RESPONSIVE :
- Mobile (<768px) : 1 colonne, hamburger menu, titres réduits
- Tablette (768-1024px) : 2 colonnes features, pricing compact
- Desktop (>1024px) : layout complet

═══════════════════════════════════════════════════════
STRUCTURE — 12 SECTIONS (dans cet ordre exact)
═══════════════════════════════════════════════════════

SECTION 01 — HEADER (Navigation sticky)
────────────────────────────────────────
Layout : Sticky top-0, z-50, fond transparent → white/92% + backdrop-blur au scroll
Contenu :
  - Gauche : Logo (icône 40x40 + texte "Notorious Py" bold)
  - Centre : Liens → Fonctionnalités · Tarifs · FAQ · À propos (smooth scroll)
  - Droite : Bouton "Connexion" (ghost) + Bouton "Commencer gratuitement →" (plein #0F3460)
Mobile : Logo + hamburger menu (menu full-screen fond #0F3460 avec liens blancs)

SECTION 02 — HERO
──────────────────
Layout : Centré, texte au-dessus, capture en dessous.
Fond : Blanc avec gradient mesh subtil (orbes bleu à 6-8% opacité)

Badge : ⚡ Le GUI Builder visuel n°1 pour Python CustomTkinter
        (rounded-full, bg #E8F4FD, border #B8D4E8, texte #0F3460)

Titre H1 :
  "Construisez vos interfaces
   Python sans écrire une ligne."
  → Le mot "Python" en couleur #1A6DFF (bleu électrique)
  → 64px, Inter, weight 900, letter-spacing -0.03em

Sous-titre :
  "Notorious Py transforme votre navigateur en studio de conception d'interfaces
   CustomTkinter. Glissez vos widgets, personnalisez chaque pixel, et exportez
   un projet Python complet — prêt à exécuter en une seule commande."
  → 20px, Inter, weight 400, couleur #5A7184

2 boutons :
  - "Commencer gratuitement →" → gradient #0F3460→#1A6DFF, texte blanc, ArrowRight
  - "Voir la démo en action ▶" → border 2px #0F3460, texte #0F3460, hover inverse

Capture d'écran (en dessous) :
  - Image : capture-hero-canvas-fullscreen.png (placeholder src)
  - Encadrée dans un mock navigateur (barre avec 3 dots macOS rouge/jaune/vert + URL)
  - Ombre profonde : 0 40px 80px rgba(15,52,96,0.18)
  - Radius : 20px
  - Légère perspective 3D optionnelle : perspective(1200px) rotateX(2deg)

SECTION 03 — BANDEAU DE CONFIANCE
──────────────────────────────────
Layout : Fond #F8FAFC, py-16

Titre : "Déjà adopté par des développeurs Python dans le monde entier"
        (16px, weight 500, #8FA3B8, uppercase, letter-spacing 0.05em, centré)

4 stats animées en ligne :
  | 24+      | Widgets disponibles    |
  | 1 clic   | Export ZIP complet     |
  | 3        | Modèles IA intégrés    |
  | < 1s     | Sauvegarde automatique |
  → Chiffres : 48px, weight 900, #0F3460
  → Labels : 16px, weight 500, #5A7184
  → Compteurs animés de 0 à la valeur (Framer Motion)

Logos tech en dessous (monochrome #8FA3B8, hover couleur originale) :
  Python · CustomTkinter · React · TypeScript · Supabase · Vite

SECTION 04 — FONCTIONNALITÉS (6 CARTES)
────────────────────────────────────────
Fond : #FFFFFF
Badge : FONCTIONNALITÉS (style section badge)

Titre H2 :
  "Tout ce dont vous avez besoin
   pour créer des interfaces Python modernes"

Sous-titre :
  "Notorious Py combine la puissance de CustomTkinter avec l'expérience
   des meilleurs outils de conception visuelle — le tout dans votre navigateur."

Grille 3×2 de cartes (gap-6, responsive 1col mobile, 2col tablette, 3col desktop) :

Carte 1 — Drag & Drop
  Icône : MousePointerClick (dans cercle 56×56, bg #E8F4FD, icône #1A6DFF)
  Titre : "Glissez, déposez, créez"
  Texte : "Choisissez parmi 24+ widgets — boutons, champs de texte, tableaux,
           graphiques — et déposez-les sur le canvas. Repositionnez et redimensionnez
           avec des guides d'alignement magnétiques. Zéro configuration, zéro code."

Carte 2 — Export ZIP
  Icône : FolderArchive (même style, icône #16498C)
  Titre : "Export ZIP instantané"
  Texte : "Générez un projet Python structuré en un clic : fichier .py avec code
           CustomTkinter propre et commenté, images embarquées, requirements.txt
           et README.md. Lancez python app.py et votre interface apparaît."

Carte 3 — IA
  Icône : Sparkles (même style, icône gradient)
  Titre : "L'IA dessine pour vous"
  Texte : "Décrivez votre interface en français : 'Un dashboard pharmacie avec sidebar,
           cartes stats et tableau patients'. Ou uploadez un mockup. L'IA génère
           les widgets CustomTkinter en quelques secondes via GPT-4o, Claude ou Gemini."

Carte 4 — Propriétés
  Icône : SlidersHorizontal (même style, icône #10B981)
  Titre : "Contrôle pixel-perfect"
  Texte : "Chaque widget expose ses vraies propriétés CustomTkinter : fg_color,
           text_color, corner_radius, font_family, state, border_width et plus.
           Modifiez en direct, voyez le résultat instantanément sur le canvas."

Carte 5 — Cloud
  Icône : Cloud (même style, icône #4DA8FF)
  Titre : "Vos projets, partout"
  Texte : "Créez un compte et retrouvez vos projets depuis n'importe quel navigateur.
           Sauvegarde automatique chaque seconde. Système multi-fichiers .py avec
           explorateur intégré — comme dans un vrai IDE professionnel."

Carte 6 — Code
  Icône : Code2 (même style, icône #F59E0B)
  Titre : "Voyez votre code naître en direct"
  Texte : "Basculez entre la vue Design et la vue Code à tout moment. Le code Python
           est généré en temps réel avec coloration syntaxique, compteur de lignes
           et copie en un clic. Ce que vous voyez est exactement ce qui sera exporté."

Style cartes :
  padding 32px, border-radius 20px, bg white, border 1px #E1E8F0
  shadow: 0 4px 24px rgba(15,52,96,0.06)
  hover: translateY(-6px), shadow 0 16px 48px rgba(15,52,96,0.12), border #1A6DFF
  transition: all 350ms ease

SECTION 05 — DÉMO CODE ("Design visually. Compile natively.")
─────────────────────────────────────────────────────────────
INSPIRATION : Image 2 fournie (style sombre avec code Python à droite)
Fond : #0A1929 (bleu nuit) pleine largeur
Layout : Split 2 colonnes (texte gauche, code droite)

Badge gauche : GÉNÉRATION DE SYNTAXE (couleur sur fond sombre : bg rgba(26,109,255,0.15), texte #4DA8FF)

Titre H2 gauche (texte blanc, mot en #4DA8FF) :
  "Concevez visuellement.
   Compilez nativement."

Texte gauche (#B8D4E8) :
  "Notorious Py fait le pont entre le design visuel et la syntaxe Python stricte.
   Configurez les propriétés dans l'interface, et observez le fichier app.py
   se mettre à jour en temps réel."

3 points avec icônes (liste verticale, texte blanc) :
  ▶ Structures OOP Propres — Génère des classes Python héritables, prêtes pour la logique métier.
  ■ Géométrie Précise — Traduction fidèle des coordonnées visuelles en configurations grid/pack.
  ▶ Bindings d'Événements — Fonctions callback générées automatiquement pour les widgets interactifs.

Lien en bas : "> view_source_docs()" (style terminal, couleur #4DA8FF, font mono)

Code à droite : Bloc de code Python avec header "generated_app.py" + bouton "Copy"
  Fond du bloc : #0D2137, border 1px rgba(255,255,255,0.08), radius 16px
  Contenu du code :

```python
import customtkinter as ctk

class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Configuration
        self.title("Dashboard UI")
        self.geometry("1024x768")
        self.grid_columnconfigure(1, weight=1)

        # Navigation Sidebar
        self.sidebar = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar.grid(row=0, columns=1, sticky="nsw")

        # Main Content Area
        self.main = ctk.CTkFrame(self, fg_color="transparent")
        self.main.grid(row=0, column=1, sticky="nsew", padx=20)

        # Action Button
        self.btn = ctk.CTkButton(
            self.main,
            text="Execute Query",
            command=self._on_click
        )
        self.btn.grid(row=0, column=0, pady=20)

    def _on_click(self):
        pass  # TODO: Implement logic

if __name__ == "__main__":
    app = App()
    app.mainloop()
```

  Coloration syntaxique : mots-clés Python colorés (import en violet, strings en vert,
  commentaires en gris, noms de classes en jaune, self en bleu clair)

SECTION 06 — PRICING (TARIFICATION)
────────────────────────────────────
Fond : Gradient léger #FFFFFF → #F8FAFC
Badge : TARIFS

Titre H2 :
  "Un plan pour chaque développeur"

Sous-titre :
  "Commencez gratuitement. Évoluez quand vous êtes prêt. Pas de carte bancaire requise."

3 cartes en ligne (gap-8) :

CARTE STARTER (gauche) :
  Nom : Starter
  Prix : 0€ /mois
  Description : "Parfait pour découvrir et prototyper"
  Bouton : "Commencer gratuitement →" (outlined, border #0F3460)
  Features :
    ✅ 3 projets maximum
    ✅ 24+ widgets natifs & composites
    ✅ Export ZIP illimité
    ✅ Sauvegarde cloud automatique
    ✅ Vue code en temps réel
    ✅ Thème clair / sombre
    ✅ Tour guidé interactif
    ❌ Génération IA (5/mois)
    ❌ Support prioritaire

CARTE PRO (centre — MISE EN AVANT) :
  Badge absolue : "Populaire" (bg #0F3460, texte blanc, rounded-full, top -14px)
  Nom : Pro
  Prix : 9€ /mois (avec ~~19€~~ barré + badge "Lancement -53%")
  Description : "Pour les développeurs sérieux"
  Bouton : "Démarrer l'essai Pro →" (gradient #0F3460→#1A6DFF, texte blanc)
  Border : 2px solid #1A6DFF
  Shadow : 0 16px 64px rgba(26,109,255,0.20)
  Scale desktop : transform scale(1.05)
  Features :
    ✅ Projets illimités
    ✅ 24+ widgets natifs & composites
    ✅ Export ZIP illimité
    ✅ Sauvegarde cloud automatique
    ✅ Vue code en temps réel
    ✅ Thème clair / sombre
    ✅ Tour guidé interactif
    ✅ Génération IA illimitée (GPT-4o, Claude, Gemini)
    ✅ Support prioritaire par email
    ✅ Import de projets ZIP
    ✅ Raccourcis clavier avancés

CARTE TEAM (droite) :
  Nom : Team
  Prix : 29€ /mois
  Description : "Collaboration pour les équipes"
  Bouton : "Contacter l'équipe →" (outlined, border #0F3460)
  Features :
    ✅ Tout le plan Pro
    ✅ Jusqu'à 10 membres
    ✅ Projets partagés en temps réel
    ✅ Historique des versions
    ✅ Rôles & permissions
    ✅ Support dédié Slack/Discord
    ✅ Onboarding personnalisé
    ✅ Facturation centralisée
    ✅ SLA 99.9% uptime

Note sous les plans (14px, #8FA3B8, centré) :
  "Tous les plans incluent les mises à jour gratuites. Annulez à tout moment."

Style cartes pricing :
  padding 40px, radius 24px, bg white, border 1px #E1E8F0
  Prix : 56px desktop, weight 900, #0F3460
  Nom plan : 20px, weight 700, #0F3460
  Features : 15px, #5A7184, icône ✅ couleur #10B981, icône ❌ couleur #EF4444

SECTION 07 — TÉMOIGNAGES DÉFILANTS
───────────────────────────────────
INSPIRATION : Image 3 fournie (style "Loved by Devs" de Trae — grille de cartes sur fond sombre)
Fond : #0A1929 (bleu nuit)

Badge : TÉMOIGNAGES (style adapté fond sombre : bg rgba(26,109,255,0.15), texte #4DA8FF)

Titre H2 (blanc) :
  "Adoré par les développeurs Python"

Sous-titre (#B8D4E8) :
  "Notorious Py est l'outil de référence pour les développeurs Python
   qui veulent créer des interfaces rapidement."

CARROUSEL : 2 rangées de cartes défilant horizontalement en boucle infinie
  - Rangée 1 : défile vers la GAUCHE (animation marquee-left 40s infinite)
  - Rangée 2 : défile vers la DROITE (animation marquee-right 40s infinite)
  - Les cartes sont dupliquées pour créer la boucle
  - Pause au hover

Style carte témoignage :
  padding 28px, radius 16px, bg #0D2137, border 1px rgba(255,255,255,0.08)
  min-width 350px
  Citation : #E8F4FD, 15px, italic, line-height 1.7
  Nom : #FFFFFF, 15px, weight 600
  Rôle : #8FA3B8, 13px
  Avatar : cercle 40×40 avec initiales ou photo
  Étoiles : #F59E0B

Témoignages rangée 1 (5 cartes) :
  1. "J'ai conçu l'interface complète de gestion de ma pharmacie en 30 minutes au lieu de 2 jours..."
     — Dr. Michel Kouassi, Pharmacien & Dev Python ⭐⭐⭐⭐⭐
  2. "Mes étudiants adorent Notorious Py. Ils visualisent leur interface avant même d'écrire..."
     — Prof. Sarah Lemoine, Enseignante Informatique ⭐⭐⭐⭐⭐
  3. "La génération par IA m'a bluffé. J'ai uploadé un mockup Figma et en 10 secondes..."
     — Kevin Mbala, Développeur Freelance Python ⭐⭐⭐⭐⭐
  4. "Enfin un outil qui comprend CustomTkinter ! Les propriétés sont toutes là..."
     — Aminata Diallo, Développeuse Backend Python ⭐⭐⭐⭐⭐
  5. "J'ai testé plusieurs GUI builders pour Python. Notorious Py est le seul qui supporte..."
     — Thomas Richter, Ingénieur Logiciel, Munich ⭐⭐⭐⭐⭐

Témoignages rangée 2 (5 cartes) :
  6. "Le système multi-fichiers est génial. Je crée mes pages dans des fichiers .py séparés..."
     — Julien Ferreira, Étudiant M2 Informatique ⭐⭐⭐⭐⭐
  7. "En tant que formateur Python, je cherchais un outil visuel pour enseigner les GUI..."
     — Prof. Omar Benali, Formateur Python, Alger ⭐⭐⭐⭐⭐
  8. "Le drag & drop est ultra-fluide, les guides d'alignement s'activent au pixel près..."
     — Clara Nguyen, UX Designer & Dev Python ⭐⭐⭐⭐⭐
  9. "L'export ZIP est magique : un fichier .py propre, les images, le requirements.txt..."
     — David Okafor, CTO Startup, Lagos ⭐⭐⭐⭐⭐
  10. "Je développe des outils internes pour mon entreprise. Notorious Py me fait gagner..."
     — Sophie Martin, Lead Dev, Paris ⭐⭐⭐⭐⭐

SECTION 08 — TÉMOIGNAGE VEDETTE (Carte du monde)
─────────────────────────────────────────────────
INSPIRATION : Image 4 fournie (citation sur carte du monde avec photos flottantes)
Fond : #FFFFFF avec pattern carte du monde en pointillés (#E1E8F0, opacity 0.5)

Layout : Citation centrée, 6-8 avatars flottants disposés autour (positions absolues)
  Les avatars sont des cercles de 56-80px avec photos, répartis autour de la citation
  comme sur l'image de référence (haut gauche, haut droite, milieu gauche, etc.)

Citation centrale (grande typographie, 32px desktop, weight 600, #0F3460) :
  ❝ J'ai essayé tous les GUI builders Python.
     Notorious Py est le premier qui produit
     du code que je suis fier de livrer. ❞

Auteur (sous la citation) :
  Nom : Alexandre Tshimanga (20px, weight 700, #0F3460)
  Titre : Lead Developer chez NovaTech Solutions (16px, #5A7184)
  Photo : Cercle 80×80 centré AU-DESSUS de la citation

Navigation : 2 boutons flèche gauche/droite sous l'auteur
  → Le bouton actif : bg #1A6DFF, icône blanc
  → Le bouton inactif : bg #F8FAFC, icône #5A7184

2 citations alternatives (accessibles via les flèches) :
  "Notorious Py a transformé ma façon d'enseigner la programmation GUI..."
  — Prof. Nadia Belkacem, Université de Rabat

  "Le fait de pouvoir décrire mon interface en français et que l'IA la construise..."
  — Marc-Antoine Duval, Architecte Logiciel, Montréal

SECTION 09 — FAQ
────────────────
Fond : #F8FAFC
Badge : QUESTIONS FRÉQUENTES

Titre H2 :
  "Tout ce que vous devez savoir"

Sous-titre :
  "Vous avez une question ? Nous avons probablement la réponse."

Accordéon (8 items, utiliser le composant Accordion de shadcn/ui) :
  Chaque item : question en #0F3460, 18px, weight 600 + réponse en #5A7184, 16px
  Icône toggle : ChevronDown, rotation 180° quand ouvert
  Border-bottom : 1px solid #E1E8F0
  Premier item ouvert par défaut

Q1 : "Notorious Py est-il vraiment gratuit ?"
R1 : "Oui, le plan Starter est 100% gratuit et le restera. Vous pouvez créer jusqu'à 3 projets,
      utiliser tous les 24+ widgets, exporter en ZIP et profiter de la sauvegarde cloud —
      sans carte bancaire ni engagement. La génération IA est limitée à 5/mois sur le plan gratuit."

Q2 : "Quel type de code Python est généré ?"
R2 : "Notorious Py génère du code Python 100% conforme à la documentation officielle CustomTkinter.
      Le code est structuré en classes OOP propres, avec des commentaires, des imports organisés
      et une architecture prête pour la production."

Q3 : "Ai-je besoin de connaître Python pour utiliser Notorious Py ?"
R3 : "Non ! Vous concevez votre interface visuellement par drag & drop, et le code Python est
      généré automatiquement. Des connaissances de base en Python vous aideront à personnaliser
      le code exporté et à ajouter votre logique métier."

Q4 : "Comment fonctionne la génération par IA ?"
R4 : "Décrivez votre interface en langage naturel ou uploadez un mockup image. L'IA génère
      les widgets CustomTkinter correspondants via GPT-4o (OpenAI), Claude 3.5 Sonnet (Anthropic)
      ou Gemini 2.0 Flash (Google) — tous accessibles via OpenRouter."

Q5 : "Mes projets sont-ils sauvegardés ?"
R5 : "Oui, tous vos projets sont automatiquement sauvegardés dans le cloud via Supabase
      chaque seconde. Accédez à vos projets depuis n'importe quel navigateur."

Q6 : "Puis-je utiliser Notorious Py hors ligne ?"
R6 : "L'application nécessite Internet pour la sauvegarde et l'IA. Mais le code exporté en ZIP
      fonctionne entièrement hors ligne — aucune dépendance Internet pour l'app Python générée."

Q7 : "Quels widgets sont disponibles ?"
R7 : "24+ widgets : 14 natifs CustomTkinter (Label, Button, Entry, etc.), 3 conteneurs
      (Frame, ScrollableFrame, TabView) et 7 composites (StatCard, Table, Chart, DatePicker, etc.)."

Q8 : "Notorious Py fonctionne-t-il sur mobile ?"
R8 : "Le builder est optimisé pour desktop/tablette (≥ 768px). Les projets Python exportés
      fonctionnent sur tout système avec Python 3.8+ (Windows, macOS, Linux)."

SECTION 10 — À PROPOS DU CRÉATEUR
──────────────────────────────────
Fond : #FFFFFF
Badge : LE CRÉATEUR

Titre H2 :
  "Conçu avec passion par un développeur,
   pour les développeurs."

Layout : 2 colonnes (photo gauche, bio droite) ou centré

Photo : Placeholder cercle 160×160 avec bordure 4px #0F3460
Nom : Emmanuel Lamaleka (28px, weight 800, #0F3460)
Titre : Développeur Full-Stack & Créateur de Notorious Py (18px, #5A7184)

Bio :
  "Passionné par Python et le développement d'outils qui simplifient la vie
   des développeurs, j'ai créé Notorious Py pour résoudre un problème que
   je rencontrais moi-même : passer des heures à coder des interfaces
   CustomTkinter à la main.

   Mon objectif ? Permettre à chaque développeur Python — du débutant
   à l'expert — de créer des interfaces desktop professionnelles
   en quelques minutes, pas en quelques jours."

Citation (#0F3460, italic, 20px, avec guillemets décoratifs) :
  "Chaque ligne de code de Notorious Py a été écrite pour que vous
   n'ayez pas à écrire les vôtres."

Liens sociaux (icônes) : GitHub · Twitter/X · LinkedIn

SECTION 11 — CTA FINAL
───────────────────────
Fond : #0F3460 pleine largeur, avec radial-gradient subtil vers #16498C

Titre H2 (blanc, 48px) :
  "Prêt à construire votre prochaine
   interface Python ?"

Texte (#B8D4E8, 20px) :
  "Rejoignez les développeurs qui conçoivent leurs interfaces visuellement.
   Inscription gratuite, sans carte bancaire, projets illimités."

2 boutons :
  - "Commencer maintenant — C'est gratuit →" (bg blanc, texte #0F3460, weight 600)
  - "Voir la documentation" (border 2px blanc, texte blanc, hover bg white/10%)

SECTION 12 — FOOTER
────────────────────
INSPIRATION : Image 5 fournie (multi-colonnes style Startive)
Fond : #FFFFFF, border-top 1px #E1E8F0

Layout : 5 colonnes desktop (1 grande marque + 4 colonnes liens), 1 col mobile

Colonne 1 (grande) — Marque :
  Logo (64×64) + "Notorious Py" (20px, weight 800, #0F3460)
  Description (14px, #5A7184) :
    "Conçu et développé par Emmanuel Lamaleka.
     Le constructeur visuel d'interfaces Python CustomTkinter."
  Contact : contact@notoriouspy.com
  Icônes réseaux : Facebook · Instagram · GitHub · X (Twitter)
    → Cercles 36×36, bg #F8FAFC, icône #5A7184, hover bg #0F3460 icône blanc

Colonne 2 — Plateforme :
  Titre : "Plateforme" (14px, weight 700, #0F3460, uppercase)
  Liens (14px, #5A7184, hover #0F3460) :
    Builder visuel · Bibliothèque de widgets · Génération IA · Export Python · Vue Code · Projets Cloud

Colonne 3 — Ressources :
  Titre : "Ressources"
  Liens : Documentation · Tutoriels · Changelog · Blog · API CustomTkinter · Communauté Discord

Colonne 4 — Solutions :
  Titre : "Solutions"
  Liens : Pour les étudiants · Pour les formateurs · Pour les freelances · Pour les startups · Pour les entreprises

Colonne 5 — Légal :
  Titre : "Légal"
  Liens : Conditions d'utilisation · Politique de confidentialité · Mentions légales · Cookies

Barre copyright (border-top 1px #E1E8F0, py-6, mt-12) :
  "© 2026 Notorious Py. Tous droits réservés. Propulsé par Emmanuel Lamaleka."
  → 14px, #8FA3B8, centré

═══════════════════════════════════════════════════════
STACK TECHNIQUE DE LA LANDING PAGE
═══════════════════════════════════════════════════════

- Framework : Next.js 14+ (App Router) avec TypeScript
- Styling : TailwindCSS 3.4+
- Composants UI : shadcn/ui (OBLIGATOIRE) → Button, Badge, Card, Accordion, Avatar, Tabs, Separator
- Animations : Framer Motion
- Icônes : Lucide React (nav, boutons, footer) + SVG custom pour features
- Fonts : Inter + JetBrains Mono via Google Fonts
- Images : next/image avec optimisation automatique

COMPOSANTS SHADCN/UI À UTILISER :
  npx shadcn@latest add button badge card accordion avatar tabs separator

═══════════════════════════════════════════════════════
INSTRUCTIONS FINALES
═══════════════════════════════════════════════════════

1. Génère TOUS les composants un par un, dans l'ordre des 12 sections
2. Utilise les composants shadcn/ui pour TOUS les boutons, badges, cartes, accordéons
3. Implémente les animations Framer Motion (scroll reveal, stagger, compteurs, marquee)
4. Utilise EXACTEMENT les couleurs, tailles et styles décrits ci-dessus
5. Rends la page ENTIÈREMENT responsive (mobile, tablette, desktop)
6. Les captures d'écran sont des <img> avec src="/captures/nom-fichier.png" (placeholders)
7. Le code doit être production-ready, propre, commenté et bien structuré
8. Chaque section doit avoir un id pour le smooth scroll (id="features", id="pricing", etc.)
9. Ajoute les meta tags SEO dans le layout.tsx
10. Le fond de la page est majoritairement BLANC avec quelques sections sombres pour le contraste
````

---

## PROMPTS COMPLÉMENTAIRES (si besoin de préciser)

### Prompt pour la section Header uniquement

```
Crée le composant Header.tsx pour la landing page Notorious Py.
- Navigation sticky, fond transparent → white/92% + backdrop-blur au scroll
- Logo : icône 40×40 + texte "Notorious Py" (Inter, 20px, weight 800, #0F3460)
- Liens centrés : Fonctionnalités, Tarifs, FAQ, À propos (smooth scroll, #5A7184, hover #0F3460)
- Boutons droite : "Connexion" (ghost) + "Commencer gratuitement →" (bg #0F3460, texte blanc)
- Mobile : hamburger menu full-screen fond #0F3460
- Utilise Lucide React pour les icônes (Menu, X, ArrowRight, ArrowUpRight)
- Z-index 50, max-width 1280px centré
```

### Prompt pour le carrousel témoignages uniquement

```
Crée un carrousel de témoignages à défilement infini (type marquee) pour la landing page.
Fond : #0A1929
2 rangées de cartes :
  - Rangée 1 : défile vers la gauche, 40s par cycle
  - Rangée 2 : défile vers la droite, 40s par cycle
Chaque carte : padding 28px, radius 16px, bg #0D2137, border 1px rgba(255,255,255,0.08)
  Citation en #E8F4FD, nom en blanc, rôle en #8FA3B8, étoiles en #F59E0B
Les cartes sont dupliquées dans le DOM pour créer la boucle infinie.
Pause au hover sur chaque rangée.
Animation CSS : @keyframes marquee-left { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
```

### Prompt pour la section Pricing uniquement

```
Crée la section Pricing avec 3 cartes pour Notorious Py.
Couleurs : primaire #0F3460, accent #1A6DFF, fond blanc, bordures #E1E8F0
Plans : Starter (0€), Pro (9€, populaire, mise en avant), Team (29€)
La carte Pro a : border 2px #1A6DFF, shadow amplifiée, badge "Populaire" absolue,
scale(1.05) sur desktop, bouton gradient #0F3460→#1A6DFF
Utilise le composant Card de shadcn/ui.
Features avec ✅ (#10B981) et ❌ (#EF4444).
Responsive : 1 col mobile (Pro en premier), 3 col desktop.
```

---

> Ce document contient tout ce dont une IA a besoin pour générer la landing page complète.
> Copier le PROMPT PRINCIPAL et le donner tel quel à Claude, GPT-4, Cursor ou Windsurf.
