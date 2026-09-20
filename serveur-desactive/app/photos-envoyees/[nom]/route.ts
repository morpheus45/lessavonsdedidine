import { lire } from '@/lib/stockage';

/**
 * Sert une photo déposée depuis le backoffice.
 *
 * Le nom du fichier est l'empreinte de son contenu : une adresse donnée
 * désigne toujours la même image, pour toujours. C'est ce qui permet de dire
 * au navigateur et au cache de Netlify de la garder un an — sans ça, chaque
 * affichage réveillerait une fonction serveur.
 */
export async function GET(_requete: Request, contexte: { params: Promise<{ nom: string }> }) {
  const { nom } = await contexte.params;

  // Le nom est produit par nous (empreinte + suffixe) : tout le reste est
  // refusé sans toucher au stockage. Cela ferme au passage la traversée de
  // répertoire (« ../ ») avant qu'elle n'atteigne le disque.
  if (!/^[0-9a-f]{32}(@small)?\.webp$/.test(nom)) {
    return new Response('Nom de fichier invalide', { status: 400 });
  }

  const donnees = await lire(nom);
  if (!donnees) {
    return new Response('Photo introuvable', { status: 404 });
  }

  return new Response(new Uint8Array(donnees), {
    headers: {
      'Content-Type': 'image/webp',
      'Content-Length': String(donnees.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
