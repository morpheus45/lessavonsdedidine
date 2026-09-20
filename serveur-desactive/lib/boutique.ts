import { prisma } from './prisma';
import { lireReglagesBoutique } from '@/app/admin/(protege)/reglages/reglages-boutique';

/**
 * Règles commerciales de la boutique.
 *
 * Elles vivent ici et nulle part ailleurs : le panier côté client affiche
 * une estimation, mais c'est cette version-là qui fait foi au moment de
 * créer la commande. Un total calculé dans le navigateur est un total que
 * le client peut modifier.
 */

/**
 * Les frais de port et le seuil de gratuité ne sont plus écrits ici : Didine
 * les modifie depuis /admin/reglages, et ils sont relus en base à chaque
 * calcul. Les valeurs de repli vivent dans DEFAUTS_BOUTIQUE.
 */
export async function calculerLivraison(sousTotalCentimes: number): Promise<number> {
  const reglages = await lireReglagesBoutique();
  return sousTotalCentimes >= reglages.seuilLivraisonOfferteCentimes
    ? 0
    : reglages.livraisonCentimes;
}

export type LigneDemandee = {
  varianteId: string;
  quantite: number;
  /** Personnalisation d'une vitrine. Ignorées pour un savon. */
  prenom?: string;
  themeSlug?: string;
};

export type LigneValidee = {
  varianteId: string;
  libelle: string;
  prixUnitaireCentimes: number;
  quantite: number;
  totalCentimes: number;
  lotId: string | null;
  prenom: string | null;
  themeId: string | null;
  themeNom: string | null;
};

export type PanierValide = {
  lignes: LigneValidee[];
  sousTotalCentimes: number;
  livraisonCentimes: number;
  totalCentimes: number;
};

export class ErreurPanier extends Error {}

/**
 * Reconstruit le panier depuis la base à partir des seuls identifiants et
 * quantités envoyés par le client. Les prix ne sont jamais lus depuis la
 * requête : ils sont relus en base, puis recopiés dans la commande pour être
 * figés — changer un tarif ne doit pas réécrire l'historique comptable.
 */
export async function validerPanier(lignesDemandees: LigneDemandee[]): Promise<PanierValide> {
  if (lignesDemandees.length === 0) {
    throw new ErreurPanier('Le panier est vide.');
  }

  const ids = [...new Set(lignesDemandees.map((l) => l.varianteId))];
  const variantes = await prisma.variante.findMany({
    where: { id: { in: ids }, actif: true, produit: { actif: true } },
    include: { produit: true },
  });

  const parId = new Map(variantes.map((v) => [v.id, v]));
  const maintenant = new Date();
  const lignes: LigneValidee[] = [];

  for (const demandee of lignesDemandees) {
    const variante = parId.get(demandee.varianteId);
    if (!variante) {
      throw new ErreurPanier('Un des produits du panier n’est plus disponible.');
    }

    const quantite = Math.floor(demandee.quantite);
    if (!Number.isFinite(quantite) || quantite < 1 || quantite > 50) {
      throw new ErreurPanier(`Quantité invalide pour ${variante.produit.nom}.`);
    }

    // ── Vitrine : fabriquée à la commande ────────────────────────────
    // Pas de lot, pas de stock à décrémenter. En revanche la
    // personnalisation est obligatoire : sans prénom ni thème, Didine ne
    // peut rien fabriquer, et la commande serait ingérable.
    if (variante.produit.type === 'vitrine') {
      const prenom = (demandee.prenom ?? '').trim();
      if (prenom.length < 1 || prenom.length > 24) {
        throw new ErreurPanier(
          'Indiquez le prénom à poser sur la vitrine (24 caractères maximum).',
        );
      }

      const theme = await prisma.themeVitrine.findFirst({
        where: { slug: demandee.themeSlug ?? '', actif: true },
      });
      if (!theme) {
        throw new ErreurPanier('Choisissez un thème pour votre vitrine.');
      }

      lignes.push({
        varianteId: variante.id,
        libelle: `Vitrine ${variante.nom} — ${theme.nom}`,
        prixUnitaireCentimes: variante.prixCentimes,
        quantite,
        totalCentimes: variante.prixCentimes * quantite,
        lotId: null,
        prenom,
        themeId: theme.id,
        themeNom: theme.nom,
      });
      continue;
    }

    // ── Savon : servi depuis une série en stock ──────────────────────
    // On sert la série qui périme le plus tôt : c'est la rotation
    // correcte pour un produit daté.
    const lot = await prisma.lot.findFirst({
      where: {
        produitId: variante.produitId,
        pretLe: { lte: maintenant },
        quantiteRestante: { gte: quantite * variante.unites },
      },
      orderBy: { durableJusquLe: 'asc' },
    });

    if (!lot) {
      throw new ErreurPanier(
        `${variante.produit.nom} n’est plus en stock dans la quantité demandée.`,
      );
    }

    lignes.push({
      varianteId: variante.id,
      libelle: `${variante.produit.nom} — ${variante.nom}`,
      prixUnitaireCentimes: variante.prixCentimes,
      quantite,
      totalCentimes: variante.prixCentimes * quantite,
      lotId: lot.id,
      prenom: null,
      themeId: null,
      themeNom: null,
    });
  }

  const sousTotalCentimes = lignes.reduce((s, l) => s + l.totalCentimes, 0);
  const livraisonCentimes = await calculerLivraison(sousTotalCentimes);

  return {
    lignes,
    sousTotalCentimes,
    livraisonCentimes,
    totalCentimes: sousTotalCentimes + livraisonCentimes,
  };
}

/** Référence lisible et séquentielle : LD-0001, LD-0002… */
export async function prochaineReference(): Promise<string> {
  const derniere = await prisma.commande.findFirst({
    orderBy: { creeeLe: 'desc' },
    select: { reference: true },
  });
  const numero = derniere ? Number.parseInt(derniere.reference.split('-')[1] ?? '0', 10) + 1 : 1;
  return `LD-${String(numero).padStart(4, '0')}`;
}
