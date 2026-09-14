# Mettre le site en ligne

Le site se construit en production sans erreur (`npm run build` → 13 routes).
Ce qui reste à faire dépend de comptes à créer, pas de code.

---

## Le point bloquant : la base de données

Le projet utilise **SQLite**, un fichier sur le disque. Ça marche parfaitement
en local, mais **pas sur Vercel** : le système de fichiers y est éphémère et
remis à zéro à chaque déploiement. Les commandes disparaîtraient.

Passer à Postgres demande trois choses :

1. Créer une base sur [neon.tech](https://neon.tech) (gratuit pour démarrer)
2. Dans `prisma/schema.prisma`, remplacer `provider = "sqlite"` par
   `provider = "postgresql"`
3. Régénérer les migrations : `npx prisma migrate dev --name initial`

Le schéma a été écrit portable exprès — montants en centimes entiers, pas
d'enum natif, pas de type propre à un moteur. La bascule ne devrait rien
casser, mais elle doit être faite avant le premier vrai client.

---

## Option A — Vercel (hébergement réel)

Permanent, toujours allumé, adresse stable. C'est la cible.

```bash
npm i -g vercel
vercel login
vercel link
```

Puis, dans les réglages du projet sur Vercel, ajouter les variables :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | la chaîne de connexion Neon |
| `SESSION_SECRET` | une chaîne aléatoire longue — **la changer invalide les clés de paiement déjà enregistrées**, puisqu'elle sert à les chiffrer |

```bash
vercel --prod
```

---

## Option B — Tailscale Funnel (visible ce soir)

Tailscale est déjà installé sur ce poste, mais pas connecté. Deux commandes :

```bash
tailscale up
```

(ouvre le navigateur pour l'authentification, puis)

```bash
tailscale funnel 3000
```

Cela publie `http://localhost:3000` sur une adresse `https://….ts.net`
accessible publiquement, en HTTPS.

**Limites à connaître :**
- Le site n'est joignable que **pendant que ce PC est allumé** et que
  `npm run dev` tourne
- Funnel doit être autorisé une fois dans la console d'administration Tailscale
- Ce n'est pas un hébergement : c'est une fenêtre sur votre machine

---

## Avant toute mise en ligne publique

- [ ] **Changer le mot de passe administrateur.** Un mot de passe fort a été
      posé le 14 septembre 2026, mais il est connu de cette conversation.
- [ ] **Valider le contenu avec Didine** : nombre d'objets et dimensions par
      formule de vitrine, liste des thèmes, délai de fabrication, et la vraie
      liste INCI de l'étiquette de sa base.
- [ ] **Remplacer les dessins par ses photos.**
- [ ] **Écrire les CGV et les mentions légales.** Les pages sont liées depuis
      le pied de page mais n'existent pas encore.
- [ ] **Démarches cosmétiques** : dossier d'information produit, évaluation de
      la sécurité, déclaration CPNP, responsable de la mise sur le marché.
      Plusieurs semaines de délai — à lancer en parallèle.

Tant que ces points ne sont pas traités, garder `robots: noindex` (déjà en
place) et ne pas diffuser l'adresse au-delà des personnes concernées.
