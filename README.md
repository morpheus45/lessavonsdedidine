# Les Savons de Didine

Boutique en ligne installable (PWA) pour une savonnerie artisanale en
saponification à froid : catalogue, paiement PayPal, et un backoffice de gestion
des commandes, des lots et des statistiques.

## État du projet

| # | Bloc | État |
|---|------|------|
| 1 | Ébauche visuelle | **À valider** |
| 2 | Boutique PWA | À venir |
| 3 | Paiement PayPal | À venir |
| 4 | Backoffice | À venir |

Chaque bloc a sa spécification puis son plan d'implémentation. On ne passe au
suivant qu'une fois le précédent livré et vérifié.

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

## Obligation réglementaire

Un savon vendu est un produit cosmétique au sens du règlement européen 1223/2009.
Avant la première vente : dossier d'information produit par recette, évaluation
de la sécurité signée, déclaration au portail CPNP, et un responsable de la mise
sur le marché établi dans l'UE. Comptez plusieurs semaines — à lancer en
parallèle du développement.

## Agents du projet

`.claude/agents/` contient quatre agents spécialisés, chargés automatiquement par
Claude Code dans ce dépôt :

| Agent | Rôle |
|-------|------|
| `savon-ui` | Écrans, jetons de design, sceau, audit d'accessibilité obligatoire |
| `savon-paiement` | PayPal, cycle de vie des commandes, obligations légales de vente |
| `savon-donnees` | Schéma Prisma, migrations, lots et cures, statistiques |
| `savon-revue` | Relecture avant commit : sécurité, accessibilité, conventions |
