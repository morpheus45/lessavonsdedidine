# Code serveur mis de côté — 14 septembre 2026

Le site est publié sur **GitHub Pages**, qui ne sert que des fichiers
statiques. Tout ce qui a besoin d'un serveur a donc été déplacé ici plutôt
que supprimé : le travail est fait, il est testé, et il redevient utilisable
le jour où la boutique passe sur un hébergement Node.

## Ce qui dort ici

| Dossier | Contenu |
|---|---|
| `app/admin/` | Backoffice complet : connexion, tableau de bord, commandes, réglage des paiements |
| `app/api/` | Validation serveur du panier, création des commandes |
| `lib/prisma.ts` | Client de base de données |
| `lib/auth.ts` | Sessions, hachage scrypt |
| `lib/boutique.ts` | Recalcul des prix **côté serveur** — la protection contre la falsification |
| `lib/paiements.ts` | Configuration PayPal depuis le backoffice |
| `lib/chiffrement.ts` | Chiffrement AES-256-GCM des clés secrètes |

## Pour le remettre en service

1. Choisir un hébergement Node (Vercel, Railway…) — voir `MISE-EN-LIGNE.md`
2. Créer une base Postgres et basculer `prisma/schema.prisma`
3. Redéplacer `app/` et `lib/` dans `src/`
4. Retirer `output: 'export'` et `basePath` de `next.config.ts`

## Ce que la version statique perd

- **Les prix sont calculés dans le navigateur.** Un acheteur peut les
  modifier avant de payer. Didine doit vérifier le montant reçu sur son
  relevé PayPal avant d'expédier.
- Aucune commande n'est enregistrée : PayPal est le seul registre.
- Pas de backoffice, pas de gestion de stock automatique.
