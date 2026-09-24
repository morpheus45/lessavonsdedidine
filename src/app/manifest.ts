import type { MetadataRoute } from 'next';

/**
 * Manifeste de l'application installable.
 *
 * `layout.tsx` le déclarait déjà, mais le fichier n'existait pas : la page
 * demandait donc un manifeste inexistant à chaque chargement, et le site ne
 * s'installait pas. C'est aussi la raison pour laquelle il n'y avait aucune
 * icône dans l'onglet.
 */
// Un export statique doit savoir écrire ce fichier une fois pour toutes :
// sans cette ligne, Next refuse de le produire.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Les douceurs&Didine',
    short_name: 'Douceurs&Didine',
    description:
      'Savons parfumés et vitrines personnalisées, faits main en petites séries.',
    lang: 'fr',
    start_url: '/lessavonsdedidine/',
    display: 'standalone',
    // Le fond d'écran de démarrage reprend le quasi-blanc du site : un blanc
    // pur ferait un éclair avant que la page ne s'affiche.
    background_color: '#faf3f4',
    theme_color: '#12100f',
    orientation: 'portrait-primary',
    icons: [
      { src: '/lessavonsdedidine/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/lessavonsdedidine/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // `maskable` autorise Android à recadrer l'icône dans sa propre forme.
      // Le monogramme est centré et tient dans le cercle intérieur, il
      // survit donc au rognage.
      { src: '/lessavonsdedidine/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'La gamme', url: '/lessavonsdedidine/savons/' },
      { name: 'Les parfums', url: '/lessavonsdedidine/parfums/' },
      { name: 'Le panier', url: '/lessavonsdedidine/panier/' },
    ],
  };
}
