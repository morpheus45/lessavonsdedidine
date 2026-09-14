import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { ecrire, supprimer } from './stockage';

/**
 * Réception d'une photo déposée depuis le backoffice.
 *
 * Didine envoie la photo telle que son téléphone l'a prise — souvent 4 Mo et
 * 4000 px de large. Elle n'a pas à s'occuper du format ni de la taille : la
 * réduction se fait ici, à la réception.
 *
 * Deux largeurs sont produites, 1200 px et 600 px, comme pour les photos
 * livrées avec le code. Le navigateur choisit ensuite la plus petite qui
 * convienne à l'écran.
 */

/** Au-delà, ce n'est plus une photo de téléphone — on refuse avant de décoder. */
const OCTETS_MAX = 25 * 1024 * 1024;

const LARGEURS = [
  { suffixe: '', largeur: 1200 },
  { suffixe: '@small', largeur: 600 },
] as const;

/** Formats acceptés à l'envoi. Le stockage, lui, ne contient que du WebP. */
const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export class ErreurPhoto extends Error {}

export type PhotoRecue = {
  url: string;
  urlPetite: string;
  largeur: number;
  hauteur: number;
  octets: number;
};

export async function recevoirPhoto(fichier: File): Promise<PhotoRecue> {
  if (fichier.size === 0) {
    throw new ErreurPhoto('Le fichier est vide.');
  }
  if (fichier.size > OCTETS_MAX) {
    throw new ErreurPhoto(
      `La photo pèse ${Math.round(fichier.size / 1024 / 1024)} Mo, le maximum est de 25 Mo.`,
    );
  }
  if (fichier.type && !TYPES_ACCEPTES.includes(fichier.type)) {
    throw new ErreurPhoto(`Format non accepté (${fichier.type}). Envoyez un JPEG, un PNG ou un HEIC.`);
  }

  const entree = Buffer.from(await fichier.arrayBuffer());

  // Le nom vient du contenu, pas du nom de fichier envoyé : deux envois de la
  // même photo donnent la même clé, et un nom de fichier hostile
  // (« ../../etc/passwd ») ne peut pas se retrouver dans un chemin.
  const cle = createHash('sha256').update(entree).digest('hex').slice(0, 32);

  let sorties: { cle: string; octets: number; largeur: number; hauteur: number }[];
  try {
    sorties = await Promise.all(
      LARGEURS.map(async (t) => {
        const info = await sharp(entree)
          .rotate() // respecte l'orientation EXIF, sinon la photo arrive couchée
          .resize({ width: t.largeur, withoutEnlargement: true })
          .webp({ quality: 78 }) // le grain d'une photo de téléphone masque les artefacts
          .toBuffer({ resolveWithObject: true });
        const nom = `${cle}${t.suffixe}.webp`;
        await ecrire(nom, info.data, 'image/webp');
        return { cle: nom, octets: info.info.size, largeur: info.info.width, hauteur: info.info.height };
      }),
    );
  } catch (cause) {
    // sharp refuse un fichier qui n'est pas une image, ou tronqué.
    throw new ErreurPhoto("Ce fichier n'a pas pu être lu comme une image.", { cause });
  }

  const grande = sorties[0]!;
  const petite = sorties[1]!;

  return {
    url: `/photos-envoyees/${grande.cle}`,
    urlPetite: `/photos-envoyees/${petite.cle}`,
    largeur: grande.largeur,
    hauteur: grande.hauteur,
    octets: grande.octets + petite.octets,
  };
}

/**
 * Retire les fichiers d'une photo du stockage.
 *
 * À n'appeler qu'après avoir supprimé la ligne en base : un fichier orphelin
 * coûte quelques kilo-octets, une ligne qui pointe vers un fichier disparu
 * affiche un trou sur la boutique.
 */
export async function oublierPhoto(url: string): Promise<void> {
  const nom = url.split('/').pop();
  if (!nom) return;
  await Promise.all([supprimer(nom), supprimer(nom.replace(/\.webp$/, '@small.webp'))]);
}
