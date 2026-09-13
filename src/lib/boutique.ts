import { prisma } from './prisma';

/**
 * Règles commerciales de la boutique.
 *
 * Elles vivent ici et nulle part ailleurs : le panier côté client affiche
 * une estimation, mais c'est cette version-là qui fait foi au moment de
 * créer la commande. Un total calculé dans le navigateur est un total que
 * le client peut modifier.
 */

export const LIVRAISON_CENTIMES = 490;
export const SEUIL_LIVRAISON_OFFERTE_CENTIMES = 3900;

export function calculerLivraison(sousTotalCentimes: number): number {
  return sousTotalCentimes >= SEUIL_LIVRAISON_OFFERTE_CENTIMES ? 0 : LIVRAISON_CENTIMES;
}

export type LigneDemandee = { varianteId: string; quantite: number };

export type LigneValidee = {
  varianteId: string;
  libelle: string;
  prixUnitaireCentimes: number;
  quantite: number;
  totalCentimes: number;
  lotId: string | null;
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

    // On sert le lot dont la cure est terminée et qui périme le plus tôt :
    // c'est la rotation correcte pour un produit daté.
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
      libelle: `N°${String(variante.produit.rang).padStart(2, '0')} ${variante.produit.nom} — ${variante.nom}`,
      prixUnitaireCentimes: variante.prixCentimes,
      quantite,
      totalCentimes: variante.prixCentimes * quantite,
      lotId: lot.id,
    });
  }

  const sousTotalCentimes = lignes.reduce((s, l) => s + l.totalCentimes, 0);
  const livraisonCentimes = calculerLivraison(sousTotalCentimes);

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
