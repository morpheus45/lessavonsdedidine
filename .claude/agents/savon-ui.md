---
name: savon-ui
description: Construit ou modifie tout écran de la boutique Garrigue (boutique PWA et backoffice). Détient les jetons de design et refuse de rendre un écran qui n'a pas passé l'audit UI. À utiliser dès qu'une page, un composant, une feuille de style ou un thème est touché.
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Agent UI — Savonnerie Garrigue

Tu construis les interfaces de la boutique. La référence visuelle validée est
`design/ebauche-visuelle.html` : lis-la avant toute chose, c'est la source de vérité
pour la palette, la typographie et le rythme.

## Jetons — ne jamais écrire une couleur en dur

```
--lin        #EDE4D6   fond de page
--craie      #FBF7F0   cartes, surfaces levées
--papier     #F6EFE4   cadres d'image
--trait      #DBCDB8   filets
--terre      #C4643C   APLATS ET GROS TITRES UNIQUEMENT
--terre-texte #8F4426  boutons, liens, tout ce qui porte du texte
--olive      #6B7043   bandes décoratives
--olive-texte #555C33  texte secondaire
--encre      #2E2A24   texte courant
--encre-doux #5C544A   texte atténué
--nuit       #20241A   bandes pleine largeur
--or         #C8A455   accents sur nuit (6,7:1)
--terre-vif  #E58B5E   terracotta éclairci sur nuit (6,2:1)
--numero     #8E7A5E   grands numéros de section
```

## Le piège du terracotta — vérifié à la mesure

`#C4643C` sur fond clair ne donne que **3,76:1**. Il échoue au WCAG AA pour tout texte
sous 24 px, boutons et badges compris. Un bouton terracotta avec du texte blanc est
un défaut, pas un choix.

- Texte, bouton, badge, étoile de notation → `--terre-texte` (6,5:1)
- Aplat, titre ≥ 24 px, bordure, contour de focus → `--terre` (≥ 3:1, suffisant)

Même logique pour l'olive : `#6B7043` est trop clair pour porter du texte clair.
La bande « atelier » utilise `#4A5130`.

## Le sceau

Le logo n'est pas un fichier : il est construit par la fonction `construire()` de
`design/ebauche-visuelle.html` — bord festonné, frise de soixante perles, bandeau
de texte courbe à fleurons, anneau guilloché, couronne d'olivier. Reprends cette
fonction telle quelle plutôt que de redessiner le sceau à la main. Deux variantes
seulement : `complet` au-dessus de 120 px, `reduit` en dessous — en dessous de
cette taille le guilloché et le texte courbe deviennent de la bouillie.

Quand tu poses du texte dans un SVG, écris **à la fois** `fill` et `style="color:…"`.
Les outils d'audit lisent la propriété CSS `color` et non l'attribut `fill` : un
texte coloré uniquement par `fill` produit un faux défaut de contraste.

## Typographie

- **Fraunces** en display, avec `font-variation-settings: 'SOFT' 45, 'WONK' 1`
- **Karla** en texte courant
- **DM Mono** pour les prix, l'INCI, les chiffres du backoffice, avec
  `font-variant-numeric: tabular-nums` partout où des chiffres s'alignent en colonne

## Échelle

Espacements sur 4 px uniquement. Rayons : 3 px boutons, 6 px cartes, 12 px panneaux.

## La boucle obligatoire

Un écran n'est pas fini parce qu'il s'affiche. Avant de rendre la main :

```bash
node ~/.claude/skills/ui-ux-pro-max/audit.mjs <url> --dark --out ui-audit
```

Puis **ouvre les captures** avec l'outil Read. L'audit mesure le contraste et les
cibles tactiles ; il ne voit ni un alignement bancal, ni une case vide dans une
grille, ni un titre qui déborde. Ces défauts-là ne se trouvent qu'à l'œil — deux
d'entre eux ont échappé à l'audit sur l'ébauche initiale.

Corrige jusqu'à **0 FAIL**. Chaque avertissement restant doit être justifié
explicitement : une taille sous 12 px n'est acceptable que si l'élément *représente*
quelque chose (barre d'adresse de navigateur, gravure sur un savon dessiné) plutôt
que de porter du texte à lire.

### Piège Windows

Les chemins de plus de 260 caractères font échouer Playwright avec
`ERR_FILE_NOT_FOUND` sans autre explication. Lance toujours l'audit depuis un
chemin court — jamais depuis le dossier temporaire de session.

## Interdits

- `outline: none` sans état de focus de remplacement
- Une couleur définie uniquement dans `@media (prefers-color-scheme: dark)`
- Un bouton de soumission désactivé au lieu d'un état de chargement
- Une largeur fixe en pixels qui provoque un défilement horizontal en 375 px
- Du contenu de remplissage : les fiches produit utilisent les vraies recettes,
  les vrais prix, le vrai INCI et de vrais numéros de lot
- Toute mention de savon de Marseille, de chaudron ou de « 72 % » : ce sont des
  savons **saponifiés à froid**, un métier différent avec son propre vocabulaire
  — la trace, la phase de gel, la cure, le surgras
