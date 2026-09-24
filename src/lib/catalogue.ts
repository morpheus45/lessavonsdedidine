import matter from 'gray-matter';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Le catalogue, lu dans des fichiers versionnés.
 *
 * Le site est publié sur GitHub Pages, qui ne sert que des fichiers : il n'y
 * a ni serveur ni base de données. Le catalogue vit donc dans `contenu/`, que
 * Didine modifie depuis /admin/ — le CMS écrit un commit dans le dépôt, et la
 * publication se refait toute seule.
 *
 * Tout est lu à la CONSTRUCTION, jamais à la demande. Une erreur ici fait
 * échouer le déploiement plutôt que d'afficher une page cassée en ligne, et
 * c'est voulu : mieux vaut ne pas publier qu'afficher un prix faux.
 */

const RACINE = join(process.cwd(), 'contenu');

export type Photo = {
  url: string;
  urlPetite: string;
  alt: string;
  /** Renseignées à la construction, en lisant le fichier produit. */
  largeur: number;
  hauteur: number;
};

export type Formule = {
  /** Identifiant stable, reconstruit depuis le produit et le nom du format. */
  id: string;
  nom: string;
  prixCentimes: number;
  unites: number;
};

export type Produit = {
  slug: string;
  type: 'savon' | 'vitrine';
  rang: number;
  nom: string;
  accroche: string;
  description: string;
  inci: string;
  personnalisable: boolean;
  photos: Photo[];
  formules: Formule[];
};

export type Theme = {
  slug: string;
  nom: string;
  description: string;
  ordre: number;
  photo?: Photo;
};

/** « Lot de 5 — 4 achetés, 1 offert » → « lot-de-5-4-achetes-1-offert ». */
function enSlug(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function lireDossier(nom: string): { slug: string; donnees: Record<string, unknown> }[] {
  const dossier = join(RACINE, nom);
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      slug: f.replace(/\.md$/, ''),
      donnees: matter(readFileSync(join(dossier, f), 'utf8')).data as Record<string, unknown>,
    }));
}

/**
 * Dimensions des photos, produites par `scripts/preparer-photos.mjs` à la
 * construction. Sans elles la page saute au moment où l'image arrive.
 */
type Dimensions = Record<string, { largeur: number; hauteur: number }>;

let dimensions: Dimensions | null = null;
function lireDimensions(): Dimensions {
  if (dimensions) return dimensions;
  const chemin = join(process.cwd(), 'public', 'photos', 'dimensions.json');
  dimensions = existsSync(chemin)
    ? (JSON.parse(readFileSync(chemin, 'utf8')) as Dimensions)
    : {};
  return dimensions;
}

function enPhoto(brut: unknown): Photo | null {
  if (typeof brut !== 'object' || brut === null) return null;
  const { fichier, alt } = brut as { fichier?: unknown; alt?: unknown };
  if (typeof fichier !== 'string' || !fichier) return null;

  // Le CMS enregistre le chemin public complet ; l'export historique n'a que
  // le nom du fichier. On accepte les deux et on ne garde que le nom.
  const nom = fichier.split('/').pop()!;
  const taille = lireDimensions()[nom] ?? { largeur: 1200, hauteur: 900 };

  return {
    url: `/photos/${nom}`,
    urlPetite: `/photos/${nom.replace(/\.webp$/, '@small.webp')}`,
    // Une photo sans description est invisible pour un lecteur d'écran. On
    // n'invente rien : vide, elle sera signalée par la vérification.
    alt: typeof alt === 'string' ? alt : '',
    largeur: taille.largeur,
    hauteur: taille.hauteur,
  };
}

let cacheProduits: Produit[] | null = null;

export function lireProduits(): Produit[] {
  if (cacheProduits) return cacheProduits;

  const produits = lireDossier('produits')
    .map(({ slug, donnees }) => {
      const type: Produit['type'] = donnees.type === 'vitrine' ? 'vitrine' : 'savon';
      const formules = (Array.isArray(donnees.formules) ? donnees.formules : [])
        .map((f): Formule | null => {
          if (typeof f !== 'object' || f === null) return null;
          const { nom, prixCentimes, unites } = f as Record<string, unknown>;
          if (typeof nom !== 'string' || typeof prixCentimes !== 'number') return null;
          return {
            id: `${slug}--${enSlug(nom)}`,
            nom,
            prixCentimes,
            unites: typeof unites === 'number' ? unites : 1,
          };
        })
        .filter((f): f is Formule => f !== null);

      return {
        slug,
        type,
        rang: typeof donnees.rang === 'number' ? donnees.rang : 99,
        nom: String(donnees.nom ?? slug),
        accroche: String(donnees.accroche ?? ''),
        description: String(donnees.description ?? ''),
        // La composition n'a pas de sens pour un objet de décoration.
        inci: type === 'savon' ? String(donnees.inci ?? '') : '',
        personnalisable: type === 'vitrine',
        photos: (Array.isArray(donnees.photos) ? donnees.photos : [])
          .map(enPhoto)
          .filter((p): p is Photo => p !== null),
        formules,
        actif: donnees.actif !== false,
      };
    })
    // Un produit sans prix n'est pas commandable, et un produit hors ligne ne
    // doit pas apparaître : mieux vaut ne rien montrer qu'une fiche morte.
    .filter((p) => p.actif && p.formules.length > 0)
    .map(({ actif: _actif, ...p }) => p)
    .sort((a, b) => a.rang - b.rang);

  cacheProduits = produits;
  return produits;
}

export function produitParSlug(slug: string): Produit | undefined {
  return lireProduits().find((p) => p.slug === slug);
}

export function formuleParId(id: string): { produit: Produit; formule: Formule } | undefined {
  for (const produit of lireProduits()) {
    const formule = produit.formules.find((f) => f.id === id);
    if (formule) return { produit, formule };
  }
  return undefined;
}

let cacheThemes: Theme[] | null = null;

export function lireThemes(): Theme[] {
  if (cacheThemes) return cacheThemes;

  const themes = lireDossier('themes')
    .filter(({ donnees }) => donnees.actif !== false)
    .map(({ slug, donnees }) => {
      const photos = (Array.isArray(donnees.photos) ? donnees.photos : [])
        .map(enPhoto)
        .filter((p): p is Photo => p !== null);
      return {
        slug,
        nom: String(donnees.nom ?? slug),
        description: String(donnees.description ?? ''),
        ordre: typeof donnees.ordre === 'number' ? donnees.ordre : 99,
        photo: photos[0],
      };
    })
    .sort((a, b) => a.ordre - b.ordre);

  cacheThemes = themes;
  return themes;
}

export function themeParSlug(slug: string): Theme | undefined {
  return lireThemes().find((t) => t.slug === slug);
}

/*
 * Les frais de port ne sont plus ici : ils viennent de contenu/reglages.md,
 * donnés par Didine. Les valeurs qui étaient écrites à cet endroit — 4,90 €
 * et gratuité à 39 € — étaient les miennes, et elles ont facturé de vraies
 * clientes pendant des semaines. Voir src/lib/reponses.ts.
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
