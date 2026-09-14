import type { NextConfig } from 'next';

/**
 * Application Next.js complète, hébergée sur Netlify.
 *
 * Le site a été statique un temps (GitHub Pages). Il ne l'est plus : une
 * boutique a besoin d'un serveur pour enregistrer une commande, encaisser un
 * paiement sans que le montant soit modifiable dans le navigateur, et
 * recevoir les photos que Didine dépose depuis le backoffice.
 *
 * Le dépôt, lui, reste sur GitHub : Netlify s'y branche et redéploie à
 * chaque push.
 */
const config: NextConfig = {
  reactStrictMode: true,

  // L'ébauche visuelle n'est pas l'application.
  outputFileTracingExcludes: {
    '*': ['./design/**', './_site/**'],
  },
};

export default config;
