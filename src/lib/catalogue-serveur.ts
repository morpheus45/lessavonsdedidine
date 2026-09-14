import { prisma } from './prisma';

/**
 * Lecture du catalogue pour la boutique.
 *
 * Le catalogue était un fichier versionné tant que le site était statique.
 * Il vit maintenant en base, parce que Didine doit pouvoir ajouter un
 * produit, un prix ou une photo sans qu'on redéploie le site.
 *
 * Seuls les produits actifs sortent d'ici : un brouillon du backoffice ne
 * doit jamais apparaître en boutique.
 */

export type PhotoPublique = {
  url: string;
  urlPetite: string;
  alt: string;
  largeur: number;
  hauteur: number;
};

export type FormulePublique = {
  id: string;
  nom: string;
  prixCentimes: number;
  unites: number;
};

export type ProduitPublic = {
  id: string;
  slug: string;
  type: string;
  rang: number;
  nom: string;
  accroche: string;
  description: string;
  inci: string;
  personnalisable: boolean;
  photos: PhotoPublique[];
  formules: FormulePublique[];
};

export type ThemePublic = {
  slug: string;
  nom: string;
  description: string;
  photo?: PhotoPublique;
};

const SELECTION = {
  variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
  photos: { orderBy: { ordre: 'asc' } },
} as const;

type LigneProduit = {
  id: string;
  slug: string;
  type: string;
  rang: number;
  nom: string;
  accroche: string;
  description: string;
  inci: string;
  variantes: { id: string; nom: string; prixCentimes: number; unites: number }[];
  photos: PhotoPublique[];
};

function enProduitPublic(p: LigneProduit): ProduitPublic {
  return {
    id: p.id,
    slug: p.slug,
    type: p.type,
    rang: p.rang,
    nom: p.nom,
    accroche: p.accroche,
    description: p.description,
    // La composition d'une vitrine n'a pas de sens : c'est un objet de
    // décoration. Le seed y met une phrase explicative qu'on n'affiche pas.
    inci: p.type === 'savon' ? p.inci : '',
    personnalisable: p.type === 'vitrine',
    photos: p.photos,
    formules: p.variantes,
  };
}

export async function lireProduits(): Promise<ProduitPublic[]> {
  const produits = await prisma.produit.findMany({
    where: { actif: true },
    orderBy: { rang: 'asc' },
    include: SELECTION,
  });
  // Un produit sans prix affichable n'est pas commandable : mieux vaut ne pas
  // le montrer du tout que d'afficher une fiche sans bouton.
  return produits.filter((p) => p.variantes.length > 0).map(enProduitPublic);
}

export async function lireProduit(slug: string): Promise<ProduitPublic | null> {
  const produit = await prisma.produit.findFirst({
    where: { slug, actif: true },
    include: SELECTION,
  });
  return produit ? enProduitPublic(produit) : null;
}

export async function lireThemes(): Promise<ThemePublic[]> {
  const themes = await prisma.themeVitrine.findMany({
    where: { actif: true },
    orderBy: { ordre: 'asc' },
    include: { photos: { orderBy: { ordre: 'asc' }, take: 1 } },
  });
  return themes.map((t) => ({
    slug: t.slug,
    nom: t.nom,
    description: t.description,
    photo: t.photos[0],
  }));
}

/**
 * Parfums proposés.
 *
 * Encore une liste en dur : ce sont des arômes achetés, ils changent
 * rarement, et leur donner une table du backoffice serait un écran de plus à
 * entretenir pour rien. À déplacer en base le jour où Didine les fait varier.
 */
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
