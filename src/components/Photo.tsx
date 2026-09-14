import { fichePhoto } from '@/donnees/photos';

/**
 * Une photo de Didine, servie dans la plus petite taille qui convienne.
 *
 * Pas de next/image : sans serveur il n'y a rien à optimiser à la volée, et
 * les deux tailles sont déjà produites à l'avance. Une balise <img> avec un
 * `srcset` fait le même travail sans code client.
 */
const BASE = process.env.NEXT_PUBLIC_BASE ?? '';

export type ProprietesPhoto = {
  /** Chemin de la grande version, tel qu'il figure dans le catalogue. */
  chemin: string;
  /**
   * Largeur d'affichage prévue, pour que le navigateur choisisse la bonne
   * taille avant d'avoir mis la page en page. Défaut : pleine largeur.
   */
  tailles?: string;
  /** Une photo au-dessus de la ligne de flottaison ne doit pas être différée. */
  prioritaire?: boolean;
  className?: string;
  /**
   * Remplace le texte alternatif du registre. À n'utiliser que si le contexte
   * rend la description générique trompeuse.
   */
  alt?: string;
};

export function Photo({ chemin, tailles = '100vw', prioritaire, className, alt }: ProprietesPhoto) {
  const fiche = fichePhoto(chemin);
  const petite = chemin.replace(/\.webp$/, '@small.webp');

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`${BASE}${chemin}`}
      srcSet={`${BASE}${petite} 600w, ${BASE}${chemin} 1200w`}
      sizes={tailles}
      width={fiche?.largeur}
      height={fiche?.hauteur}
      alt={alt ?? fiche?.alt ?? ''}
      loading={prioritaire ? 'eager' : 'lazy'}
      // La première photo doit être décodée avant peinture, les autres non :
      // « async » sur une image visible d'emblée la fait apparaître en retard.
      decoding={prioritaire ? 'sync' : 'async'}
      fetchPriority={prioritaire ? 'high' : undefined}
      className={className}
    />
  );
}
