/**
 * Catalogue de la boutique.
 *
 * Sur GitHub Pages il n'y a pas de serveur, donc pas de base de données : le
 * catalogue est un fichier versionné, lu à la construction du site. Pour
 * changer un prix ou ajouter un thème, on modifie ce fichier et on pousse —
 * la publication se refait toute seule.
 *
 * Source des informations : les messages de Didine du 13 septembre 2026.
 *
 * ⚠️  À FAIRE VALIDER PAR DIDINE :
 *     - nombre d'objets et dimensions par formule de vitrine (inventés ici)
 *     - liste définitive des thèmes
 *     - délai de fabrication d'une vitrine
 *     - la vraie liste INCI figurant sur l'étiquette de sa base de savon
 */

export type Formule = {
  /** Identifiant stable, utilisé dans le panier du navigateur. */
  id: string;
  nom: string;
  prixCentimes: number;
  /** Précision affichée sous le nom, si utile. */
  detail?: string;
};

export type Produit = {
  slug: string;
  /** Photos du produit, de la principale aux secondaires. */
  photos: string[];
  type: 'vitrine' | 'savon';
  rang: number;
  nom: string;
  accroche: string;
  description: string;
  /** Mention réglementaire. Vide pour un objet de décoration. */
  inci: string;
  formules: Formule[];
  /** Une vitrine exige un prénom et un thème avant d'être commandable. */
  personnalisable: boolean;
};

export type Theme = {
  slug: string;
  nom: string;
  description: string;
  /** Photo d'une réalisation, sous /public/photos. Absente = pas encore photographié. */
  photo?: string;
};

export const PARFUMS = [
  'Café',
  'Vanille',
  'Coco-vanille',
  'Black Opium',
  'Olive',
  'Miel',
  'Menthe',
  'Fraise',
  'Bubble gum',
  'Caramel',
  'Citron',
] as const;

export const THEMES: Theme[] = [
  {
    slug: 'safari',
    nom: 'Safari',
    description: 'Lion, éléphant, zèbre et girafe devant un coucher de soleil sur la savane.',
    photo: '/photos/theme-safari.webp',
  },
  {
    slug: 'chevaux',
    nom: 'Chevaux',
    description: 'Jument, poulain et bottes de foin sur une prairie, montagnes en fond.',
    photo: '/photos/theme-chevaux.webp',
  },
  {
    slug: 'salon',
    nom: 'Salon',
    description: 'Canapé, meuble télé, tapis et bouquet — une pièce à vivre en miniature.',
    photo: '/photos/theme-salon.webp',
  },
  {
    slug: 'chambre-enfant',
    nom: "Chambre d'enfant",
    description: 'Berceau, cheval à bascule et papier peint fleuri, dans des tons doux.',
    // Pas de photo : la seule disponible porte des autocollants ajoutés dans
    // une messagerie. À remplacer par une prise de vue propre.
  },
];

export const PRODUITS: Produit[] = [
  {
    slug: 'vitrine-personnalisee',
    photos: ['/photos/theme-salon.webp', '/photos/theme-safari.webp', '/photos/theme-chevaux.webp'],
    type: 'vitrine',
    rang: 1,
    nom: 'Vitrine personnalisée',
    accroche: 'Une scène en miniature, au prénom de la personne',
    description:
      "Un cadre en bois peint à la main, garni d'une scène composée objet par objet, avec le prénom en lettres sur le dessus. Chaque vitrine est montée à la commande : le thème, le prénom et les petits objets sont choisis par vous.",
    inci: '',
    personnalisable: true,
    formules: [
      { id: 'vitrine-petite', nom: 'Petite', prixCentimes: 4500, detail: 'quelques objets' },
      { id: 'vitrine-moyenne', nom: 'Moyenne', prixCentimes: 6500, detail: 'scène complète' },
      { id: 'vitrine-grande', nom: 'Grande', prixCentimes: 9000, detail: 'scène détaillée' },
    ],
  },
  {
    slug: 'savons-parfumes',
    photos: [
      '/photos/savons-parfums.webp',
      '/photos/savons-coffret.webp',
      '/photos/savons-fleurs.webp',
      '/photos/savons-parfums-ovales.webp',
      '/photos/savons-coffret-2.webp',
    ],
    type: 'savon',
    rang: 2,
    nom: 'Savons parfumés',
    accroche: `${PARFUMS.length} parfums au choix, coulés à la main`,
    description:
      "Base de savon au beurre de karité biologique, sans SLS. Fondue au bain-marie, parfumée avec un arôme naturel, colorée avec un colorant naturel, parfois enrichie de miel, puis coulée dans un moule en silicone à motif — brin d'olivier ou fleur. Prise en trente à soixante minutes, démoulage, étiquetage et mise en sachet à la main.",
    inci: "Base commerciale au beurre de karité biologique, sans laurylsulfate de sodium (SLS). La liste INCI complète figure sur le sachet — à reporter ici depuis l'étiquette du fournisseur.",
    personnalisable: false,
    formules: [
      { id: 'savons-lot5', nom: 'Lot de 5', prixCentimes: 2000, detail: '4 achetés, 1 offert' },
      { id: 'savons-lot10', nom: 'Lot de 10', prixCentimes: 4000, detail: '8 achetés, 2 offerts' },
    ],
  },
];

/** Frais de port, et seuil au-delà duquel ils sont offerts. */
export const LIVRAISON_CENTIMES = 490;
export const SEUIL_LIVRAISON_OFFERTE_CENTIMES = 3900;

export function calculerLivraison(sousTotalCentimes: number): number {
  return sousTotalCentimes >= SEUIL_LIVRAISON_OFFERTE_CENTIMES ? 0 : LIVRAISON_CENTIMES;
}

export function produitParSlug(slug: string): Produit | undefined {
  return PRODUITS.find((p) => p.slug === slug);
}

export function formuleParId(id: string): { produit: Produit; formule: Formule } | undefined {
  for (const produit of PRODUITS) {
    const formule = produit.formules.find((f) => f.id === id);
    if (formule) return { produit, formule };
  }
  return undefined;
}

export function themeParSlug(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}
