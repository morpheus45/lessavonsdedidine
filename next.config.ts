import type { NextConfig } from 'next';

/**
 * Site entièrement statique, publié sur GitHub Pages.
 *
 * `output: 'export'` produit des fichiers HTML : aucun serveur n'est requis,
 * mais aucune exécution serveur n'est possible non plus. Le code qui en avait
 * besoin est rangé dans `serveur-desactive/` — voir son POURQUOI.md, qui dit
 * ce qui dort et ce que ça coûte.
 *
 * `basePath` est appliqué AUSSI en développement, volontairement : le site
 * vit sous /lessavonsdedidine/ en production, et un chemin qui ne casse
 * qu'en production est un chemin qu'on découvre trop tard.
 */
const CHEMIN = '/lessavonsdedidine';

const config: NextConfig = {
  output: 'export',
  basePath: CHEMIN,
  assetPrefix: CHEMIN,

  // GitHub Pages sert /page/ plutôt que /page : sans cette option, les liens
  // internes tombent sur un 404 une fois publiés.
  trailingSlash: true,

  // Pas de serveur pour optimiser les images à la volée : elles sont réduites
  // à la construction par scripts/preparer-photos.mjs.
  images: { unoptimized: true },

  // `basePath` s'applique à next/link et next/image, mais PAS à une balise
  // <img> qui pointe vers public/. Le chemin est donc exposé au code client
  // pour que le composant Photo le préfixe lui-même — une seule source.
  env: { NEXT_PUBLIC_BASE: CHEMIN },

  reactStrictMode: true,

  outputFileTracingExcludes: {
    '*': ['./design/**', './serveur-desactive/**', './contenu/photos/**'],
  },
};

export default config;
