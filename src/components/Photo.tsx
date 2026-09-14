export type PhotoAffichable = {
  url: string;
  urlPetite: string;
  alt: string;
  largeur: number;
  hauteur: number;
};

/**
 * Une photo, servie dans la plus petite taille qui convienne.
 *
 * Pas de next/image : les deux largeurs sont déjà produites, soit à la
 * construction pour les photos livrées avec le code, soit à la réception
 * pour celles que Didine dépose depuis le backoffice. Une balise <img> avec
 * un `srcset` fait le même travail sans code client.
 */
export type ProprietesPhoto = {
  photo: PhotoAffichable;
  /**
   * Largeur d'affichage prévue, pour que le navigateur choisisse la bonne
   * taille avant d'avoir mis la page en page. Défaut : pleine largeur.
   */
  tailles?: string;
  /** Une photo au-dessus de la ligne de flottaison ne doit pas être différée. */
  prioritaire?: boolean;
  className?: string;
  /**
   * Remplace la description enregistrée. À ne mettre qu'à `""`, et seulement
   * quand le texte voisin décrit déjà la photo : la répéter la ferait
   * entendre deux fois.
   */
  alt?: string;
};

export function Photo({ photo, tailles = '100vw', prioritaire, className, alt }: ProprietesPhoto) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={photo.url}
      srcSet={`${photo.urlPetite} 600w, ${photo.url} 1200w`}
      sizes={tailles}
      width={photo.largeur}
      height={photo.hauteur}
      alt={alt ?? photo.alt}
      loading={prioritaire ? 'eager' : 'lazy'}
      // La première photo doit être décodée avant peinture, les autres non :
      // « async » sur une image visible d'emblée la fait apparaître en retard.
      decoding={prioritaire ? 'sync' : 'async'}
      fetchPriority={prioritaire ? 'high' : undefined}
      className={className}
    />
  );
}
