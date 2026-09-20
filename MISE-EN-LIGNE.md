# Mettre la boutique en ligne

Le dépôt reste sur GitHub. Ce qui change, c'est l'endroit qui **exécute** le
site : GitHub Pages ne sait servir que des fichiers, et une boutique a besoin
d'un serveur pour enregistrer une commande, encaisser un paiement sans que le
montant soit modifiable dans le navigateur, et recevoir les photos que Didine
dépose depuis le backoffice.

Il y a **deux comptes à créer**, tous les deux gratuits. Je ne peux pas les
créer à votre place — il faut une adresse électronique et accepter des
conditions d'utilisation.

---

## 1. La base de données — Supabase

<https://supabase.com> → créer un compte → **New project**, région *Europe
(Frankfurt)*. Choisir un mot de passe de base de données et le garder.

L'offre gratuite autorise l'usage commercial et ne demande pas de carte
bancaire.

Dans **Project Settings → Database → Connection string**, prendre l'entrée
**Transaction pooler** (port 6543) et y remettre le mot de passe à la place
de `[YOUR-PASSWORD]`. C'est **le seul élément à récupérer ici**.

> Pourquoi le *pooler* et pas la connexion directe : sur Netlify, chaque
> requête réveille une petite fonction isolée qui ouvre sa propre connexion.
> Sans regroupement, Postgres atteint sa limite de connexions et refuse du
> monde un jour d'affluence — exactement le jour où il ne faut pas.

### ⚠️ La mise en pause au bout de 7 jours

Un projet gratuit se met en pause après **7 jours sans la moindre requête**,
et il faut alors le réveiller à la main depuis leur tableau de bord. Pendant
ce temps la boutique est inaccessible.

La parade est déjà dans le dépôt : `.github/workflows/reveil-supabase.yml`
demande une page de la boutique chaque lundi. Pour l'activer, ajouter dans
**Settings → Secrets and variables → Actions → Variables** du dépôt GitHub :

| Nom | Valeur |
|---|---|
| `ADRESSE_BOUTIQUE` | l'adresse Netlify du site, sans barre oblique finale |

Sans cette variable la tâche ne fait rien et le signale.

## 2. L'hébergement — Netlify

<https://netlify.com> → créer un compte → **Add new project → Import an
existing project** → autoriser GitHub → choisir `morpheus45/lessavonsdedidine`.

Le plan gratuit de Netlify **autorise l'usage commercial**. Celui de Vercel
l'interdit explicitement pour une boutique en ligne : c'est pourquoi on ne
l'utilise pas ici, malgré son affinité avec Next.js.

Netlify lit `netlify.toml` : il n'y a rien à configurer dans l'interface.

### Les variables d'environnement

Dans **Project configuration → Environment variables**, ajouter :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | la chaîne copiée chez Supabase (pooler, port 6543) |
| `SESSION_SECRET` | une longue phrase au hasard, ≥ 32 caractères |
| `CHIFFREMENT_CLE` | une autre, ≥ 32 caractères |

`SESSION_SECRET` signe les sessions du backoffice. `CHIFFREMENT_CLE` chiffre
la clé secrète PayPal avant de l'écrire en base — sans elle, une fuite de la
base livrerait le compte PayPal de Didine.

Pour en produire deux au hasard :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Ces trois valeurs ne doivent jamais entrer dans le dépôt.** Le workflow de
vérification échoue si `.env` s'y retrouve.

## 3. Développer sans rien installer

Une base Postgres locale est fournie, sans compte ni droits administrateur :

```bash
npm run db:locale     # démarre Postgres sur le port 55432 (à laisser ouvert)
npm run db:reset      # crée les tables et remplit le catalogue
npm run dev           # la boutique sur http://localhost:3000
```

Les binaires se téléchargent à la première exécution. Les données vivent dans
`.base-locale/`, qui n'est pas versionné.

## 4. Le premier remplissage

Une fois le premier déploiement passé, depuis le poste :

```bash
npx prisma migrate deploy
npm run db:seed
```

avec `DATABASE_URL` pointant sur la base Supabase. Cela crée les tables, les deux
produits actuels avec leurs photos, les quatre thèmes, et **le compte
administrateur** — dont le mot de passe s'affiche à la fin. À changer.

### Et les photos ?

Supabase propose aussi un stockage de fichiers, mais les photos déposées
depuis le backoffice n'y vont pas : elles utilisent le stockage intégré de
Netlify, qui ne demande **aucune clé et aucune configuration**. Une pièce de
moins à régler, et une de moins à laisser fuiter.

En développement local, elles vont simplement dans `.photos-locales/`.
Le code ne connaît que trois fonctions — `ecrire`, `lire`, `supprimer`
(`src/lib/stockage.ts`) — donc changer d'hébergeur de fichiers un jour ne
touchera qu'un seul fichier.

## 5. Brancher PayPal

<https://developer.paypal.com> → se connecter avec le compte **professionnel**
de Didine → **Apps & Credentials** → *Create App*.

Relever le **Client ID** et le **Secret**, puis les saisir dans le backoffice,
sur `/admin/paiements`. Ils ne se mettent pas dans les variables Netlify : le
secret est chiffré en base, pour que Didine puisse le changer seule.

Commencer en **Sandbox** pour faire un achat de bout en bout, puis basculer en
**Production**.

## 6. Éteindre l'ancienne adresse

L'ancien site GitHub Pages reste en ligne tant qu'on ne l'éteint pas, et il
servirait une version périmée de la boutique — avec un panier qui ne mène
nulle part.

Dans **Settings → Pages** du dépôt, passer *Source* à **None**.

> Le CDN de GitHub garde les pages en cache jusqu'à une heure après l'arrêt.
> C'est déjà arrivé sur ce projet : couper la publication n'a pas suffi, il a
> fallu publier une page honnête par-dessus pour vider le cache. Si l'ancienne
> adresse reste consultable, ne pas s'inquiéter tout de suite — mais vérifier
> le lendemain.

---

## Ce que Didine peut faire seule

Sur `/admin/catalogue` :

- **créer un produit ou un coffret** — nom, accroche, descriptif, composition ;
- **lui donner des formats** — « Lot de 5 », « Grande »… chacun avec son prix ;
- **déposer des photos** depuis son téléphone. Elles sont redressées selon
  l'orientation de la prise de vue, réduites en 1200 et 600 px et converties
  en WebP à la réception. Elle n'a rien à préparer, et rien à installer ;
- **mettre en vente**, une fois qu'il y a au moins un prix et une photo.

Un produit est toujours créé en **brouillon** : rien n'apparaît en boutique
avant qu'elle ne le publie.

La description de chaque photo est obligatoire. C'est ce que lisent les
personnes aveugles, et ce que lit Google.

## Ce qui reste à obtenir de Didine

- la **liste INCI réelle**, recopiée de l'étiquette de sa base de savon — la
  réglementation cosmétique l'impose, et le champ contient aujourd'hui un
  texte d'attente ;
- le nombre d'objets et les dimensions par formule de vitrine (inventés) ;
- le délai de fabrication d'une vitrine ;
- une photo **sans autocollants** pour le thème « chambre d'enfant » : la
  seule disponible en porte deux, ajoutés dans une messagerie ;
- les **31 mentions à trous** des CGV et des mentions légales — identité,
  adresse, numéro SIRET, assurance, médiateur de la consommation.
