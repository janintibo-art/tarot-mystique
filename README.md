# Tarot Français — 3 à 5 joueurs 🃏

Le vrai jeu de tarot français, contre des adversaires artificiels :
enchères (Petite, Garde, Garde Sans, Garde Contre), chien et écart,
appel du roi à 5 joueurs, règles complètes des plis (fournir, couper,
surcouper, l'Excuse), petit au bout, comptage des bouts et scores cumulés.

**Six jeux de cartes au choix** (Classique, Sépia, Parchemin, Héritage,
Doré, Azur) : les 21 atouts, l'Excuse et les 16 figures de chaque jeu
sont découpés des planches illustrées d'origine ; les 40 cartes de
points sont générées dans le style et les teintes de chaque planche.
Le choix se fait sur l'écran d'accueil et il est mémorisé.

## Compiler l'APK (automatique)

Chaque `git push` déclenche la compilation dans l'onglet **Actions**
du dépôt GitHub → artefact `tarot-mystique-apk`.

## Mettre à jour depuis Termux

```bash
cd ~/tarot-mystique
git add -A
git commit -m "Jeu de tarot 3-5 joueurs"
git push
```

## Règles implémentées

- Distribution : 24 cartes à 3 joueurs, 18 à 4, 15 à 5 (chien de 6 ou 3)
- L'écart interdit rois, bouts et Excuse (atouts seulement en dernier recours)
- Obligation de fournir, de couper et de surcouper ; l'Excuse ne prend
  jamais le pli mais reste à son camp (sauf au dernier pli)
- Contrat selon les bouts : 56 / 51 / 41 / 36 points
- Score = (25 + écart) × multiplicateur (1, 2, 4, 6) ± petit au bout
- À 5 joueurs : le détenteur du roi appelé devient partenaire secret
  (gains ×2 preneur, ×1 partenaire ; ×4 si le preneur joue seul)
- Scores cumulés conservés sur l'appareil

Poignées et chelem ne sont pas encore comptés.
