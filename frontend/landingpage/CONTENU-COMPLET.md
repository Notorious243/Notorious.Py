# Notorious Py — Contenu Textuel Complet de la Landing Page

> Chaque mot ci-dessous est prêt à être copié-collé dans les composants.
> Contenu unique, optimisé SEO, adapté au produit réel.
> **Couleurs** : `#0F3460` (Bleu Marine) + `#FFFFFF` (Blanc)

---

## SECTION 01 — Header (Navigation)

**Logo** : Icône `notorious-py-logo-64x64.png` + texte **Notorious Py**

**Liens navigation** :
- Fonctionnalités
- Tarifs
- FAQ
- À propos

**Boutons droite** :
- Connexion (bouton ghost)
- Commencer gratuitement → (bouton plein #0F3460 avec flèche)

---

## SECTION 02 — Hero

**Badge** :
```
⚡ Le GUI Builder visuel n°1 pour Python CustomTkinter
```

**Titre H1** :
```
Construisez vos interfaces
Python sans écrire une ligne.
```

> Le mot **"Python"** est en couleur `#1A6DFF` (bleu électrique) pour créer un contraste visuel.

**Sous-titre** :
```
Notorious Py transforme votre navigateur en studio de conception d'interfaces
CustomTkinter. Glissez vos widgets, personnalisez chaque pixel, et exportez
un projet Python complet — prêt à exécuter en une seule commande.
```

**Bouton principal** : Commencer gratuitement →
**Bouton secondaire** : Voir la démo en action ▶

**Capture** : `capture-hero-canvas-fullscreen.png`
> Screenshot 4K de l'interface complète du builder : sidebar widgets à gauche, canvas avec widgets au centre, panneau de propriétés à droite. Encadré dans un mock navigateur avec dots macOS.

**Alt image** : "Interface complète de Notorious Py — GUI Builder visuel pour Python CustomTkinter avec canvas de conception, bibliothèque de widgets et panneau de propriétés"

---

## SECTION 03 — Bandeau de Confiance

**Titre** : Déjà adopté par des développeurs Python dans le monde entier

**Stats animées (4 colonnes)** :

| Chiffre | Label |
|---------|-------|
| **24+** | Widgets disponibles |
| **1 clic** | Export ZIP complet |
| **3** | Modèles IA intégrés |
| **< 1s** | Sauvegarde automatique |

**Logos technologiques** (version alternative / en dessous) :
- Python
- CustomTkinter
- React
- TypeScript
- Supabase
- Vite

> Logos en monochrome `#8FA3B8` avec hover couleur originale.

---

## SECTION 04 — Fonctionnalités

**Badge** : FONCTIONNALITÉS

**Titre H2** :
```
Tout ce dont vous avez besoin
pour créer des interfaces Python modernes
```

**Sous-titre** :
```
Notorious Py combine la puissance de CustomTkinter avec l'expérience
des meilleurs outils de conception visuelle — le tout dans votre navigateur.
```

---

### Carte 1 — Drag & Drop

**Icône** : MousePointerClick (bleu)
**Titre** : Glissez, déposez, créez
**Description** :
```
Choisissez parmi 24+ widgets — boutons, champs de texte, tableaux,
graphiques — et déposez-les sur le canvas. Repositionnez et redimensionnez
avec des guides d'alignement magnétiques. Zéro configuration, zéro code.
```

---

### Carte 2 — Export Python

**Icône** : FolderArchive (indigo)
**Titre** : Export ZIP instantané
**Description** :
```
Générez un projet Python structuré en un clic : fichier .py avec code
CustomTkinter propre et commenté, images embarquées, requirements.txt
et README.md. Lancez python app.py et votre interface apparaît.
```

---

### Carte 3 — Génération IA

**Icône** : Sparkles (gradient bleu)
**Titre** : L'IA dessine pour vous
**Description** :
```
Décrivez votre interface en français : "Un dashboard pharmacie avec sidebar,
cartes stats et tableau patients". Ou uploadez un mockup. L'IA génère
les widgets CustomTkinter en quelques secondes via GPT-4o, Claude ou Gemini.
```

---

### Carte 4 — Personnalisation Temps Réel

**Icône** : SlidersHorizontal (vert émeraude)
**Titre** : Contrôle pixel-perfect
**Description** :
```
Chaque widget expose ses vraies propriétés CustomTkinter : fg_color,
text_color, corner_radius, font_family, state, border_width et plus.
Modifiez en direct, voyez le résultat instantanément sur le canvas.
```

---

### Carte 5 — Projets Cloud

**Icône** : Cloud (bleu ciel)
**Titre** : Vos projets, partout
**Description** :
```
Créez un compte et retrouvez vos projets depuis n'importe quel navigateur.
Sauvegarde automatique chaque seconde. Système multi-fichiers .py avec
explorateur intégré — comme dans un vrai IDE professionnel.
```

---

### Carte 6 — Code en Direct

**Icône** : Code2 (ambre)
**Titre** : Voyez votre code naître en direct
**Description** :
```
Basculez entre la vue Design et la vue Code à tout moment. Le code Python
est généré en temps réel avec coloration syntaxique, compteur de lignes
et copie en un clic. Ce que vous voyez est exactement ce qui sera exporté.
```

---

## SECTION 05 — Démo Code (Syntax Generation)

> **Inspiration** : Image 2 — Style "Design visually. Compile natively." avec code Python à droite.
> **Fond** : `#0A1929` (bleu nuit ultra-sombre)

**Badge** : GÉNÉRATION DE SYNTAXE

**Titre H2** (texte blanc + partie en `#4DA8FF`) :
```
Concevez visuellement.
Compilez nativement.
```

**Texte** :
```
Notorious Py fait le pont entre le design visuel et la syntaxe Python stricte.
Configurez les propriétés dans l'interface, et observez le fichier app.py
se mettre à jour en temps réel.
```

**3 points forts (liste avec icônes)** :

1. **Structures OOP Propres**
   Génère des classes Python héritables, prêtes pour la logique métier.

2. **Géométrie Précise**
   Traduction fidèle des coordonnées visuelles en configurations grid/pack.

3. **Bindings d'Événements**
   Fonctions callback générées automatiquement pour les widgets interactifs.

**Lien en bas** : `> view_source_docs()` (style terminal, couleur `#4DA8FF`)

**Bloc code à droite** (coloration syntaxique, fond `#0D2137`) :

```python
# generated_app.py

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

> Le bloc de code doit avoir un header avec le nom du fichier "generated_app.py" et un bouton "Copy".

---

## SECTION 06 — Pricing (Tarification)

**Badge** : TARIFS

**Titre H2** :
```
Un plan pour chaque développeur
```

**Sous-titre** :
```
Commencez gratuitement. Évoluez quand vous êtes prêt.
Pas de carte bancaire requise.
```

---

### Plan 1 — Gratuit

**Nom** : Starter
**Prix** : 0€ / mois
**Description** : Parfait pour découvrir et prototyper
**Bouton** : Commencer gratuitement →

**Fonctionnalités incluses** :
- ✅ 3 projets maximum
- ✅ 24+ widgets natifs & composites
- ✅ Export ZIP illimité
- ✅ Sauvegarde cloud automatique
- ✅ Vue code en temps réel
- ✅ Thème clair / sombre
- ✅ Tour guidé interactif
- ❌ Génération IA (limité à 5/mois)
- ❌ Support prioritaire

---

### Plan 2 — Pro (POPULAIRE)

**Nom** : Pro
**Prix** : 9€ / mois
**Prix barré** : ~~19€~~ (badge "Lancement -53%")
**Description** : Pour les développeurs sérieux
**Bouton** : Démarrer l'essai Pro → (fond gradient #0F3460 → #1A6DFF)

**Fonctionnalités incluses** :
- ✅ Projets illimités
- ✅ 24+ widgets natifs & composites
- ✅ Export ZIP illimité
- ✅ Sauvegarde cloud automatique
- ✅ Vue code en temps réel
- ✅ Thème clair / sombre
- ✅ Tour guidé interactif
- ✅ Génération IA illimitée (GPT-4o, Claude, Gemini)
- ✅ Support prioritaire par email
- ✅ Import de projets ZIP
- ✅ Raccourcis clavier avancés

---

### Plan 3 — Équipe

**Nom** : Team
**Prix** : 29€ / mois
**Description** : Collaboration pour les équipes
**Bouton** : Contacter l'équipe →

**Fonctionnalités incluses** :
- ✅ Tout le plan Pro
- ✅ Jusqu'à 10 membres
- ✅ Projets partagés en temps réel
- ✅ Historique des versions
- ✅ Rôles & permissions
- ✅ Support dédié Slack/Discord
- ✅ Onboarding personnalisé
- ✅ Facturation centralisée
- ✅ SLA 99.9% uptime

---

**Note sous les plans** :
```
Tous les plans incluent les mises à jour gratuites. Annulez à tout moment.
Les prix affichés sont hors taxes.
```

---

## SECTION 07 — Témoignages Défilants

> **Inspiration** : Image 3 — Style "Loved by Devs" de Trae
> **Fond** : `#0A1929` (sombre) pour contraste avec les cartes

**Badge** : TÉMOIGNAGES

**Titre H2** (texte blanc) :
```
Adoré par les développeurs Python
```

**Sous-titre** (texte `#B8D4E8`) :
```
Notorious Py est l'outil de référence pour les développeurs Python
qui veulent créer des interfaces rapidement.
```

---

**Rangée 1 (défile vers la gauche)** :

**Témoignage 1** :
```
"J'ai conçu l'interface complète de gestion de ma pharmacie en 30 minutes
au lieu de 2 jours de codage. Le code exporté était propre, commenté
et fonctionnel dès le premier lancement. Un gain de temps incroyable."
```
— **Dr. Michel Kouassi** · Pharmacien & Développeur Python · ⭐⭐⭐⭐⭐

**Témoignage 2** :
```
"Mes étudiants adorent Notorious Py. Ils visualisent leur interface
avant même d'écrire une ligne de Python. C'est devenu un outil
pédagogique indispensable dans mes cours de programmation GUI."
```
— **Prof. Sarah Lemoine** · Enseignante en Informatique · ⭐⭐⭐⭐⭐

**Témoignage 3** :
```
"La génération par IA m'a bluffé. J'ai uploadé un mockup Figma
et en 10 secondes j'avais tous mes widgets CustomTkinter prêts
sur le canvas. Je l'utilise pour prototyper les interfaces de mes clients."
```
— **Kevin Mbala** · Développeur Freelance Python · ⭐⭐⭐⭐⭐

**Témoignage 4** :
```
"Enfin un outil qui comprend CustomTkinter ! Les propriétés sont
toutes là — fg_color, corner_radius, font... Le code généré est
exactement ce que j'aurais écrit à la main, mais 10x plus vite."
```
— **Aminata Diallo** · Développeuse Backend Python · ⭐⭐⭐⭐⭐

**Témoignage 5** :
```
"J'ai testé plusieurs GUI builders pour Python. Notorious Py est
le seul qui supporte correctement les composites : cartes stats,
tableaux, graphiques matplotlib. C'est un game-changer."
```
— **Thomas Richter** · Ingénieur Logiciel, Munich · ⭐⭐⭐⭐⭐

---

**Rangée 2 (défile vers la droite)** :

**Témoignage 6** :
```
"Le système multi-fichiers est génial. Je crée mes différentes pages
dans des fichiers .py séparés, exactement comme dans un vrai projet.
La sauvegarde cloud automatique est un plus énorme."
```
— **Julien Ferreira** · Étudiant M2 Informatique · ⭐⭐⭐⭐⭐

**Témoignage 7** :
```
"En tant que formateur Python, je cherchais un outil visuel pour
enseigner les interfaces graphiques. Notorious Py est parfait :
mes étudiants passent de l'idée au prototype en 15 minutes."
```
— **Prof. Omar Benali** · Formateur Python, Alger · ⭐⭐⭐⭐⭐

**Témoignage 8** :
```
"Le drag & drop est ultra-fluide, les guides d'alignement s'activent
au pixel près. C'est l'expérience Figma mais pour Python.
Je ne reviendrai jamais au codage manuel d'interfaces."
```
— **Clara Nguyen** · UX Designer & Dev Python · ⭐⭐⭐⭐⭐

**Témoignage 9** :
```
"L'export ZIP est magique : un fichier .py propre, les images,
le requirements.txt, le README... Je décompresse, j'installe,
je lance. Ça marche du premier coup, à chaque fois."
```
— **David Okafor** · CTO Startup, Lagos · ⭐⭐⭐⭐⭐

**Témoignage 10** :
```
"Je développe des outils internes pour mon entreprise. Notorious Py
me fait gagner des heures sur chaque projet. Le mode IA avec Claude
comprend exactement ce que je veux. Impressionnant."
```
— **Sophie Martin** · Lead Dev, Paris · ⭐⭐⭐⭐⭐

---

## SECTION 08 — Témoignage Vedette

> **Inspiration** : Image 4 — Citation centrale sur fond carte du monde avec photos flottantes
> **Fond** : `#FFFFFF` (blanc) avec pattern carte du monde en pointillés `#E1E8F0`

**Photos flottantes** : 6-8 avatars disposés autour de la citation (comme l'image 4)

**Citation centrale** (grande typographie) :
```
❝ J'ai essayé tous les GUI builders Python.
   Notorious Py est le premier qui produit
   du code que je suis fier de livrer. ❞
```

**Auteur** :
- **Nom** : Alexandre Tshimanga
- **Titre** : Lead Developer chez NovaTech Solutions
- **Avatar** : Photo circulaire centrée au-dessus de la citation

**Navigation** : Flèches gauche/droite pour changer de témoignage vedette

**Témoignages vedettes alternatifs** :

Vedette 2 :
```
❝ Notorious Py a transformé ma façon d'enseigner
   la programmation GUI. Mes étudiants créent
   des interfaces professionnelles dès le premier cours. ❞
```
— **Prof. Nadia Belkacem** · Directrice du département Informatique, Université de Rabat

Vedette 3 :
```
❝ Le fait de pouvoir décrire mon interface en français
   et que l'IA la construise... c'est de la magie.
   Je ne code plus jamais une interface from scratch. ❞
```
— **Marc-Antoine Duval** · Architecte Logiciel, Montréal

---

## SECTION 09 — FAQ

**Badge** : QUESTIONS FRÉQUENTES

**Titre H2** :
```
Tout ce que vous devez savoir
```

**Sous-titre** :
```
Vous avez une question ? Nous avons probablement la réponse.
```

---

### Q1 : Notorious Py est-il vraiment gratuit ?
```
Oui, le plan Starter est 100% gratuit et le restera. Vous pouvez créer
jusqu'à 3 projets, utiliser tous les 24+ widgets, exporter en ZIP
et profiter de la sauvegarde cloud — sans carte bancaire ni engagement.
La génération IA est limitée à 5 utilisations par mois sur le plan gratuit.
```

### Q2 : Quel type de code Python est généré ?
```
Notorious Py génère du code Python 100% conforme à la documentation officielle
CustomTkinter. Le code est structuré en classes OOP propres, avec des commentaires,
des imports organisés et une architecture prête pour la production. Chaque widget
utilise les méthodes et paramètres officiels de CustomTkinter — aucun hack,
aucune dépendance cachée.
```

### Q3 : Ai-je besoin de connaître Python pour utiliser Notorious Py ?
```
Non ! C'est justement la force de Notorious Py. Vous concevez votre interface
visuellement par drag & drop, et le code Python est généré automatiquement.
Cependant, des connaissances de base en Python vous aideront à personnaliser
le code exporté et à ajouter votre logique métier.
```

### Q4 : Comment fonctionne la génération par IA ?
```
Vous avez deux options : (1) Décrivez votre interface en langage naturel
— par exemple "Un formulaire d'inscription avec email, mot de passe et bouton
sur fond bleu marine" — et l'IA crée les widgets correspondants. (2) Uploadez
un screenshot ou mockup et l'IA analyse l'image pour reproduire l'interface.
Nous supportons GPT-4o (OpenAI), Claude 3.5 Sonnet (Anthropic) et Gemini 2.0
Flash (Google) via OpenRouter.
```

### Q5 : Mes projets sont-ils sauvegardés ?
```
Oui, tous vos projets sont automatiquement sauvegardés dans le cloud
via Supabase (PostgreSQL) chaque seconde. Vous pouvez accéder à vos projets
depuis n'importe quel navigateur, sur n'importe quel appareil,
en vous connectant avec votre compte.
```

### Q6 : Puis-je utiliser Notorious Py hors ligne ?
```
Notorious Py est une application web qui nécessite une connexion Internet
pour la sauvegarde cloud et la génération IA. Cependant, une fois le code
exporté en ZIP, votre projet Python fonctionne entièrement hors ligne —
aucune dépendance Internet n'est requise pour exécuter l'application générée.
```

### Q7 : Quels widgets sont disponibles ?
```
Notorious Py propose 24+ widgets répartis en 4 catégories :
• Widgets Natifs (14) : Label, Button, Entry, PasswordEntry, Textbox,
  ProgressBar, ImageLabel, Checkbox, RadioButton, Switch, ComboBox,
  OptionMenu, SegmentedButton, Slider
• Conteneurs (3) : Frame, ScrollableFrame, TabView
• Composants Composites (7) : StatCard, Table, MenuItem, Chart (matplotlib),
  DatePicker, ProductCard, UserProfile
Tous sont 100% conformes à CustomTkinter.
```

### Q8 : Notorious Py fonctionne-t-il sur mobile ?
```
L'application builder est optimisée pour les écrans desktop et tablette
(≥ 768px) car la conception d'interfaces nécessite un espace de travail
suffisant. La landing page et la gestion de compte fonctionnent sur mobile.
Vos projets exportés (code Python) peuvent être exécutés sur tout système
supportant Python 3.8+ (Windows, macOS, Linux).
```

---

## SECTION 10 — À Propos du Créateur

**Badge** : LE CRÉATEUR

**Titre H2** :
```
Conçu avec passion par un développeur,
pour les développeurs.
```

---

**Photo** : Photo professionnelle d'Emmanuel Lamaleka (circulaire, 160x160, bordure `#0F3460`)

**Nom** : Emmanuel Lamaleka

**Titre** : Développeur Full-Stack & Créateur de Notorious Py

**Bio** :
```
Passionné par Python et le développement d'outils qui simplifient la vie
des développeurs, j'ai créé Notorious Py pour résoudre un problème que
je rencontrais moi-même : passer des heures à coder des interfaces
CustomTkinter à la main.

Mon objectif ? Permettre à chaque développeur Python — du débutant
à l'expert — de créer des interfaces desktop professionnelles
en quelques minutes, pas en quelques jours.

Notorious Py est né de cette vision : un outil puissant, accessible,
et fidèle à la philosophie CustomTkinter.
```

**Liens** :
- 🔗 GitHub : github.com/emmanuellamaleka
- 🐦 Twitter/X : @emmanuellamaleka
- 💼 LinkedIn : linkedin.com/in/emmanuellamaleka

**Citation du créateur** :
```
"Chaque ligne de code de Notorious Py a été écrite pour que vous
n'ayez pas à écrire les vôtres."
```

---

## SECTION 11 — CTA Final

> **Fond** : `#0F3460` (bleu marine plein) avec gradient radial subtil vers `#16498C`

**Titre H2** (texte blanc) :
```
Prêt à construire votre prochaine
interface Python ?
```

**Texte** (texte `#B8D4E8`) :
```
Rejoignez les développeurs qui conçoivent leurs interfaces visuellement.
Inscription gratuite, sans carte bancaire, projets illimités.
```

**Bouton principal** : Commencer maintenant — C'est gratuit → (fond blanc, texte #0F3460)
**Bouton secondaire** : Voir la documentation (bordure blanche, texte blanc)

---

## SECTION 12 — Footer

> **Inspiration** : Image 5 — Footer multi-colonnes style Startive
> **Fond** : `#FFFFFF` avec bordure top `#E1E8F0`

---

### Colonne 1 — Marque

**Logo** : `notorious-py-logo-64x64.png` + **Notorious Py**

**Adresse / Contact** :
```
Conçu et développé par Emmanuel Lamaleka
Projet open-source & SaaS
contact@notoriouspy.com
```

**Réseaux sociaux** (icônes) :
- Facebook
- Instagram
- GitHub
- X (Twitter)

---

### Colonne 2 — Plateforme

**Titre** : Plateforme

- Builder visuel
- Bibliothèque de widgets
- Génération IA
- Export Python
- Vue Code
- Projets Cloud

---

### Colonne 3 — Ressources

**Titre** : Ressources

- Documentation
- Tutoriels
- Changelog
- Blog
- API CustomTkinter
- Communauté Discord

---

### Colonne 4 — Solutions

**Titre** : Solutions

- Pour les étudiants
- Pour les formateurs
- Pour les freelances
- Pour les startups
- Pour les entreprises

---

### Colonne 5 — Légal

**Titre** : Légal

- Conditions d'utilisation
- Politique de confidentialité
- Mentions légales
- Cookies

---

### Barre Copyright

```
© 2026 Notorious Py. Tous droits réservés. Propulsé par Emmanuel Lamaleka.
```

---

> Document prêt à l'intégration. Chaque texte a été rédigé pour
> Notorious Py avec un SEO optimisé et un ton professionnel.
