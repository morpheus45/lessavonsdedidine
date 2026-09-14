# Les Savons de Didine

Boutique en ligne pour Didine : **vitrines personnalisées** (dioramas au prénom,
45 / 65 / 90 €) et **savons parfumés faits main** vendus en lots. Avec backoffice
de gestion des commandes, des séries et du stock.

## État du projet

| # | Bloc | État |
|---|------|------|
| 1 | Ébauche visuelle | **À valider** |
| 2 | Boutique PWA | À venir |
| 3 | Paiement PayPal | À venir |
| 4 | Backoffice | À venir |

Chaque bloc a sa spécification puis son plan d'implémentation. On ne passe au
suivant qu'une fois le précédent livré et vérifié.

## Voir l'ébauche en ligne

**https://morpheus45.github.io/lessavonsdedidine/**

Cette adresse est publique : n'importe qui peut l'ouvrir, sans compte et sans
installation. Elle est régénérée automatiquement à chaque modification du
design poussée sur `main` — la page en ligne ne peut donc pas diverger du
fichier source.

La page porte un `noindex` : c'est un document de travail, il n'a pas à
remonter dans les moteurs de recherche sous le nom de la marque avant
l'ouverture réelle de la boutique. Le retirer se fait en une ligne dans
`scripts/build-pages.mjs`.

### Comment ça marche

`design/ebauche-visuelle.html` est écrit pour l'enveloppe des artefacts
Claude : il commence directement par `<title>`, sans doctype, sans `<head>`,
sans `<meta viewport>`. Servi tel quel par un serveur web, il s'afficherait
cassé sur mobile.

`scripts/build-pages.mjs` reconstitue un document complet autour du fragment
et l'écrit dans `_site/` (non versionné). Le workflow
`.github/workflows/pages.yml` le construit et le déploie, en refusant le
déploiement si le doctype ou le viewport manquent.

Pour le construire localement :

```bash
node scripts/build-pages.mjs && open _site/index.html
```

## L'ébauche visuelle

[`design/ebauche-visuelle.html`](design/ebauche-visuelle.html) — direction
artistique, sceau de la marque, écrans d'accueil, fiche produit, tunnel de
paiement mobile et backoffice. Ouvrez le fichier dans un navigateur.

Palette : quasi-blanc `#F2F0EB` (Pantone Cloud Dancer 2026), vert forêt profond
`#0F3A2C`, grenat `#8A2B28`. Typographie Instrument Serif + Instrument Sans.
Une première direction en beige et terracotta a été écartée comme datée ; elle
reste consultable au commit `6b621df`.

## Stack retenue

- **Next.js 15** + TypeScript + Tailwind — boutique et backoffice dans un seul projet
- **Postgres** via Prisma
- **PayPal Orders v2** côté serveur, avec vérification de signature des webhooks
- **Vercel**, déployé depuis ce dépôt

## Sécurité

Ce dépôt est public. Aucun secret ne doit y figurer : clés PayPal, chaîne de
connexion et jetons de déploiement se configurent dans les variables
d'environnement de Vercel. Le `.gitignore` bloque `.env*`, mais il ne rattrape
pas une clé écrite en dur dans un fichier source — d'où l'agent de revue.

## Procédé réel — à ne jamais déformer

Les savons sont faits en **fondre-et-verser** (melt & pour) sur une base
commerciale au beurre de karité bio, sans SLS : fondue au bain-marie, parfumée
et colorée avec des produits naturels, parfois additionnée de miel, coulée en
moule silicone. Le savon durcit en **30 à 60 minutes**.

Ce n'est **pas** de la saponification à froid. Une version antérieure du site
annonçait « six semaines de cure » et « surgras à 8 % » : c'était inventé, et
sur une boutique réelle cela constituerait une pratique commerciale trompeuse.
Ces mentions ont été retirées le 14 septembre 2026.

## Obligation réglementaire

Un savon vendu reste un produit cosmétique au sens du règlement européen
1223/2009, y compris en fondre-et-verser dès lors qu'on modifie la base
(parfum, colorant, miel). Avant la première vente : dossier d'information
produit, évaluation de la sécurité signée, déclaration au portail CPNP, et un
responsable de la mise sur le marché établi dans l'UE.

La liste INCI affichée doit être recopiée depuis l'étiquette du fournisseur de
la base — elle ne peut pas être devinée.

## Agents du projet

`.claude/agents/` contient quatre agents spécialisés, chargés automatiquement par
Claude Code dans ce dépôt :

| Agent | Rôle |
|-------|------|
| `savon-ui` | Écrans, jetons de design, sceau, audit d'accessibilité obligatoire |
| `savon-paiement` | PayPal, cycle de vie des commandes, obligations légales de vente |
| `savon-donnees` | Schéma Prisma, migrations, lots et cures, statistiques |
| `savon-revue` | Relecture avant commit : sécurité, accessibilité, conventions |
