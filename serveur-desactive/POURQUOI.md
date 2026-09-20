# Ce qui dort ici, et ce que ça coûte

Ce dossier contient du code **qui fonctionne** et qui a été vérifié, mais qui
ne peut pas s'exécuter aujourd'hui : le site est publié sur GitHub Pages, qui
ne sert que des fichiers. Rien ici n'est compilé ni publié.

C'est un choix assumé — tout reste hébergé par GitHub — et il a un prix, que
ce fichier énonce pour qu'il ne soit pas oublié.

## Les trois manques, par ordre de gravité

### 1. Le montant du paiement vient du navigateur

Sans serveur, c'est le JavaScript de la page qui calcule ce qui est envoyé à
PayPal. **Un acheteur qui modifie ce JavaScript peut payer le montant de son
choix.**

La version serveur qui dort ici (`app/api/paiement/`, `lib/paypal-serveur.ts`)
relisait chaque prix en base et comparait le montant encaissé au montant
attendu avant de marquer la commande payée. Elle a été vérifiée : un panier
annonçant « prix : 1 centime » recevait 24,90 € en réponse.

**La parade, aujourd'hui, est humaine et obligatoire.** PayPal envoie à Didine
un courriel avec le montant réellement encaissé. Elle doit comparer ce montant
au contenu de la commande **avant d'expédier**. Une commande dont le montant ne
correspond pas ne part pas.

### 2. Aucune commande n'est enregistrée

Il n'y a pas de base de données. Le seul trace d'une commande est le courriel
de PayPal. **S'il se perd, la commande est perdue** — le prénom à graver, le
thème choisi, l'adresse, tout.

C'est pour cette raison que la page de commande construit une `description`
PayPal contenant le prénom et le thème de chaque vitrine : c'est la seule
information qui parviendra à Didine.

### 3. Pas de suivi pour la cliente

`app/suivi/` permettait à une cliente de retrouver sa commande avec sa
référence et son adresse électronique. Sans base, il n'y a rien à retrouver.

## Ce qui dort exactement

| Dossier | Ce que c'était |
|---|---|
| `app/admin/` | Backoffice complet : catalogue, séries et stock, thèmes, commandes, réglages, paiements, statistiques |
| `app/api/` | Validation du panier côté serveur, création de commande, création et capture PayPal, suivi |
| `app/photos-envoyees/` | Service des photos déposées depuis le backoffice |
| `app/suivi/` | Suivi de commande par référence + adresse |
| `lib/` | Prisma, sessions, chiffrement des secrets, règles commerciales, PayPal serveur, statistiques |
| `composants/` | Les trois graphiques du tableau de bord (courbe, barres, anneau) |
| `prisma/` | Schéma, migration Postgres, jeu de données de départ |

## Ce qui l'a remplacé

- **Catalogue** : `contenu/produits/*.md` et `contenu/themes/*.md`, modifiés
  par Didine depuis `/admin/` (Sveltia CMS, qui écrit des commits dans ce
  dépôt). Lus à la construction par `src/lib/catalogue.ts`.
- **Photos** : déposées dans `contenu/photos/`, réduites à la construction par
  `scripts/preparer-photos.mjs`.
- **Panier** : calculé dans le navigateur par `src/lib/panier-calcul.ts`, qui
  porte l'avertissement correspondant.

## Pour réveiller tout ça

Il faut un hébergeur qui exécute du code — Netlify, Render, Railway. Le dépôt
peut rester sur GitHub, l'hébergeur s'y branche et redéploie à chaque push ;
seule la fonction « répondre aux visiteurs » change de maison.

Les étapes :

1. `npm install @prisma/client prisma` (retirés du projet puisque inutilisés).
2. Remonter `prisma/`, `app/*` et `lib/*` à leur place dans le projet.
3. Dans `next.config.ts` : retirer `output: 'export'`, `basePath`,
   `assetPrefix` et `trailingSlash`.
4. Créer une base Postgres, poser `DATABASE_URL`, `SESSION_SECRET` et
   `CHIFFREMENT_CLE` dans les variables de l'hébergeur.
5. `npx prisma migrate deploy` puis `npm run db:seed`.
6. Reprendre le catalogue depuis `contenu/` — `scripts/exporter-contenu.mjs`
   fait le chemin inverse et sert de modèle.
