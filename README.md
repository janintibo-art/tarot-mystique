# 🌙 Tarot Mystique

Application Android de tirage de tarot divinatoire (arcanes majeurs), avec vos propres illustrations de cartes.

- **Carte du jour** : tirage d'une carte
- **Passé · Présent · Futur** : tirage de trois cartes
- Cartes à l'endroit ou **renversées**, avec interprétations en français
- Choix des cartes dans un éventail, animation de retournement 3D
- 100 % hors-ligne, aucune permission demandée

L'APK est compilé **automatiquement par GitHub Actions** : rien à installer sur le téléphone à part git.

---

## 🚀 Mise en ligne depuis Termux (téléphone)

### 1. Préparer le dossier

Décompresse le zip dans Termux (adapte le chemin si besoin) :

```bash
pkg install unzip git -y
cd ~
unzip /sdcard/Download/tarot-mystique.zip
cd tarot-mystique
```

> Si Termux n'a pas accès au stockage : `termux-setup-storage` puis autorise l'accès.

### 2. Créer le dépôt sur GitHub

Sur le site github.com (navigateur du téléphone) :
1. **New repository** → nom : `tarot-mystique`
2. Laisse-le **vide** (pas de README, pas de .gitignore)
3. Crée un **Personal Access Token** si tu n'en as pas : *Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token*, coche la case **repo**. Garde-le précieusement, il servira de mot de passe.

### 3. Pousser le code

Dans Termux, à la racine du dossier `tarot-mystique` :

```bash
git init
git add .
git commit -m "Tarot Mystique - premiere version"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/tarot-mystique.git
git push -u origin main
```

Quand git demande le mot de passe → colle ton **token** (pas ton mot de passe GitHub).

### 4. Récupérer l'APK

1. Sur github.com, ouvre ton dépôt → onglet **Actions**
2. Le workflow **Build APK** se lance tout seul (2 à 4 minutes)
3. Clique sur l'exécution terminée (coche verte ✅) → section **Artifacts** → télécharge **tarot-mystique-apk**
4. Décompresse le zip téléchargé, installe `tarot-mystique.apk` (autorise « sources inconnues » si demandé)

### 💡 Astuce : APK en Release (lien direct)

Pour un lien de téléchargement direct sans passer par les artifacts :

```bash
git tag v1.0
git push origin v1.0
```

L'APK apparaîtra dans l'onglet **Releases** du dépôt.

---

## 🗂 Arborescence

```
tarot-mystique/
├── .github/workflows/build-apk.yml   ← compilation automatique de l'APK
├── build.gradle                      ← config Gradle racine
├── settings.gradle
├── gradle.properties
├── .gitignore
└── app/
    ├── build.gradle                  ← config du module Android
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/mystique/tarot/MainActivity.java
        ├── assets/
        │   ├── index.html            ← tout le jeu (interface + logique)
        │   └── cards/                ← les 10 arcanes + dos de carte (WebP)
        └── res/
            ├── values/strings.xml
            └── mipmap-*/ic_launcher.png
```

## 🎴 Les arcanes inclus

Le Bateleur (I) · La Papesse (II) · La Justice (VIII) · L'Hermite (IX) · La Roue de Fortune (X) · Tempérance (XIV) · La Maison Dieu (XVI) · L'Étoile (XVII) · La Lune (XVIII) · Le Soleil (XIX)

## ✏️ Personnaliser

- **Interprétations, textes, probabilité de carte renversée** : tout est dans `app/src/main/assets/index.html` (tableau `ARCANES` et constante `PROBA_RENVERSEE`)
- **Ajouter une carte** : dépose l'image WebP dans `assets/cards/` et ajoute une entrée dans le tableau `ARCANES`
- **Nom / icône de l'appli** : `res/values/strings.xml` et les `mipmap-*/ic_launcher.png`

Après chaque modification : `git add . && git commit -m "maj" && git push` → nouvel APK automatiquement.
