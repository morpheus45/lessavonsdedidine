import { getStore } from '@netlify/blobs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Rangement des fichiers envoyés depuis le backoffice.
 *
 * En production les photos vont dans le stockage d'objets de Netlify. Elles
 * ne peuvent pas aller dans le dépôt : le disque d'un hébergeur sans serveur
 * permanent est remis à zéro à chaque déploiement, une photo déposée mardi
 * aurait disparu mercredi.
 *
 * En développement il n'y a pas de stockage Netlify, donc on écrit dans
 * `.photos-locales/`. C'est volontairement le même contrat des deux côtés :
 * une photo déposée en local se relit en local, sans compte ni configuration.
 */
const NOM_DU_MAGASIN = 'photos';
const DOSSIER_LOCAL = '.photos-locales';

/** Vrai quand le stockage Netlify est réellement joignable. */
function surNetlify(): boolean {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

export async function ecrire(cle: string, donnees: Buffer, typeMime: string): Promise<void> {
  if (surNetlify()) {
    // Un Buffer Node n'est pas un ArrayBuffer : on passe la vue sous-jacente,
    // restreinte à la portion réellement occupée par les données.
    const brut = donnees.buffer.slice(
      donnees.byteOffset,
      donnees.byteOffset + donnees.byteLength,
    ) as ArrayBuffer;
    await getStore(NOM_DU_MAGASIN).set(cle, brut, { metadata: { typeMime } });
    return;
  }
  const chemin = join(process.cwd(), DOSSIER_LOCAL, cle);
  await mkdir(dirname(chemin), { recursive: true });
  await writeFile(chemin, donnees);
}

export async function lire(cle: string): Promise<Buffer | null> {
  if (surNetlify()) {
    const donnees = await getStore(NOM_DU_MAGASIN).get(cle, { type: 'arrayBuffer' });
    return donnees ? Buffer.from(donnees) : null;
  }
  try {
    return await readFile(join(process.cwd(), DOSSIER_LOCAL, cle));
  } catch {
    // Fichier absent : ce n'est pas une panne, c'est une photo supprimée ou
    // une adresse inventée. L'appelant répondra 404.
    return null;
  }
}

export async function supprimer(cle: string): Promise<void> {
  if (surNetlify()) {
    await getStore(NOM_DU_MAGASIN).delete(cle);
    return;
  }
  const { unlink } = await import('node:fs/promises');
  try {
    await unlink(join(process.cwd(), DOSSIER_LOCAL, cle));
  } catch {
    // Déjà absent : le résultat voulu est atteint.
  }
}
