# Guide d'installation — Code Python exporté par Notorious Py

Ce document explique comment exécuter le code Python généré par le GUI Builder
afin d'obtenir **exactement le même résultat** que ce qui est affiché dans le canvas et le preview.

---

## Prérequis

| Outil | Version minimum | Vérification |
|-------|----------------|--------------|
| **Python** | 3.8+ | `python --version` |
| **pip** | inclus avec Python | `pip --version` |

---

## 1. Installation des dépendances obligatoires

```bash
pip install customtkinter
```

> `customtkinter` est la seule dépendance **toujours** requise.

---

## 2. Dépendances conditionnelles

Selon les widgets utilisés dans votre design, certaines bibliothèques supplémentaires
sont nécessaires. Le code exporté les importe automatiquement quand elles sont présentes.

| Widget / Fonctionnalité | Bibliothèque(s) | Commande d'installation |
|--------------------------|------------------|------------------------|
| **Images** (image_label, productCard, userProfile, icône app, fond) | `Pillow` | `pip install Pillow` |
| **Images depuis URL** | `Pillow` + `requests` | `pip install Pillow requests` |
| **Graphiques** (chart) | `matplotlib` | `pip install matplotlib` |
| **Sélecteur de date** (datepicker) | `tkcalendar` | `pip install tkcalendar` |
| **Tableaux** (table) | `tkinter` (inclus) | Déjà inclus avec Python |

### Installation complète (tout en une commande)

```bash
pip install customtkinter Pillow requests matplotlib tkcalendar
```

---

## 3. Police de caractères

Le code exporté utilise par défaut la police **Roboto**. Pour un rendu identique au canvas :

- **Windows** : Roboto est souvent déjà installée. Sinon, téléchargez-la depuis
  [Google Fonts](https://fonts.google.com/specimen/Roboto) et installez le fichier `.ttf`.
- **macOS** : Roboto n'est pas installée par défaut. Téléchargez et installez depuis Google Fonts,
  ou CustomTkinter utilisera une police système similaire.
- **Linux** : `sudo apt install fonts-roboto` (Debian/Ubuntu) ou téléchargez depuis Google Fonts.

> **Note** : Si Roboto n'est pas installée, CustomTkinter utilisera automatiquement une police
> système de remplacement. L'apparence sera très proche mais pas pixel-perfect.

---

## 4. Fichiers associés à l'export

Lorsque votre design contient des **images**, le code Python s'attend à les trouver
**dans le même dossier** que le fichier `.py`. Voici les fichiers à placer :

| Fichier | Condition |
|---------|-----------|
| `icon.png` | Si une icône d'application est définie |
| `background.png` | Si une image d'arrière-plan est définie |
| `image_<nom_widget>.png` | Pour chaque widget image_label, productCard, ou userProfile |
| `avatar_<nom_widget>.png` | Pour chaque widget userProfile avec avatar |

> **Astuce** : L'export ZIP inclut automatiquement ces fichiers quand ils sont disponibles.

---

## 5. Exécution

```bash
# Se placer dans le dossier contenant le fichier exporté
cd chemin/vers/mon_projet

# Lancer l'application
python mon_application.py
```

---

## 6. Résolution des problèmes courants

### L'application ne se lance pas

```
ModuleNotFoundError: No module named 'customtkinter'
```
→ Exécutez `pip install customtkinter`

### Les images ne s'affichent pas

- Vérifiez que les fichiers `.png` sont dans le **même dossier** que le `.py`
- Vérifiez que `Pillow` est installé : `pip install Pillow`

### Le sélecteur de date affiche un champ texte simple

```
pip install tkcalendar
```
→ Sans `tkcalendar`, un champ de saisie de remplacement est utilisé.

### Les graphiques ne s'affichent pas

```
pip install matplotlib
```

### Police différente du canvas

- Installez la police **Roboto** sur votre système (voir section 3)
- Les polices personnalisées (Poppins, Inter, etc.) doivent aussi être installées sur le système

### Icône de l'application ne s'affiche pas

- Vérifiez que `icon.png` est bien dans le même dossier que le `.py`
- Vérifiez que `Pillow` est installé

---

## 7. Compatibilité

| Système | Statut |
|---------|--------|
| **Windows 10/11** | ✅ Entièrement supporté |
| **macOS 12+** | ✅ Entièrement supporté |
| **Linux (Ubuntu 20.04+)** | ✅ Supporté (nécessite `python3-tk` : `sudo apt install python3-tk`) |

---

## 8. Versions testées

| Bibliothèque | Version recommandée |
|--------------|-------------------|
| `customtkinter` | >= 5.2.0 |
| `Pillow` | >= 9.0.0 |
| `matplotlib` | >= 3.5.0 |
| `tkcalendar` | >= 1.6.1 |
| `requests` | >= 2.28.0 |

---

*Généré par Notorious Py — Le constructeur visuel d'interfaces Python CustomTkinter*
