# MOMO ⚡ — compagnon de jeu

Application web qui remplace le matériel du jeu **MOMO** : les mots se crient à voix haute autour de la table,
l'appli gère les piles de cartes, affiche les contraintes du tour, compte les cartes ramassées, les manches et la victoire.

🔗 https://timpionnier.github.io/momo/

## Modes

- **Règle officielle** (2–6 joueurs) : 12 cartes chacun, le dernier à trouver ou le premier qui se trompe ramasse,
  le moins de cartes gagne la manche, 3 manches pour devenir le Roi du MOMO. À 2 joueurs : 2 piles de 11, 2 mots par tour.
- **Équipe** (4 ou 6) : scores cumulés par équipe.
- **Survie** (4–6) : 7 cartes, élimination du plus chargé, mort subite en cas d'égalité, finale à 2 piles de 5.
- **Variante tranquille** (2–8) : pioche commune, cartes qui s'accumulent, chrono 15 s, fin à la 2ᵉ carte Flash.

Cas spéciaux gérés : cumul des bleues, annulation rouge/bleu, inversion (et double inversion), thèmes multiples,
accent anglais, Flash, malus du premier à répondre, « personne ne trouve » / « plusieurs sèchent ».

## Développement

```bash
npm install
npm run dev     # http://localhost:5173/momo/
npm test        # Vitest + Testing Library
npm run build   # tsc + vite build
```

Raccourcis : `Espace`/`Entrée` action principale, `1`–`9` choisir un joueur, `U` annuler, `R` règles, `C` chrono (variante).

La partie en cours est sauvegardée automatiquement dans le `localStorage`.

## Déploiement

Chaque push sur `main` lance `.github/workflows/deploy.yml` : tests → build → publication sur GitHub Pages
(dans les réglages du dépôt, *Pages → Source* doit être sur **GitHub Actions**).
