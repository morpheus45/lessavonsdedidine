import { NextResponse } from 'next/server';
import { validerPanier, ErreurPanier, type LigneDemandee } from '@/lib/boutique';

/**
 * Valide un panier et renvoie ses vrais montants.
 *
 * Le navigateur envoie uniquement des identifiants de variante et des
 * quantités. Les prix sont relus en base ici — jamais acceptés depuis la
 * requête. C'est ce qui garantit que le montant affiché au client est celui
 * qui sera facturé, et qu'un panier trafiqué ne passe pas.
 */
export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: 'Requête illisible.' }, { status: 400 });
  }

  const lignes = extraireLignes(corps);
  if (lignes === null) {
    return NextResponse.json({ erreur: 'Format de panier invalide.' }, { status: 400 });
  }

  if (lignes.length === 0) {
    return NextResponse.json({
      lignes: [],
      sousTotalCentimes: 0,
      livraisonCentimes: 0,
      totalCentimes: 0,
    });
  }

  try {
    const panier = await validerPanier(lignes);
    return NextResponse.json({
      lignes: panier.lignes.map((l) => ({
        varianteId: l.varianteId,
        libelle: l.libelle,
        prixUnitaireCentimes: l.prixUnitaireCentimes,
        quantite: l.quantite,
        totalCentimes: l.totalCentimes,
      })),
      sousTotalCentimes: panier.sousTotalCentimes,
      livraisonCentimes: panier.livraisonCentimes,
      totalCentimes: panier.totalCentimes,
    });
  } catch (e) {
    if (e instanceof ErreurPanier) {
      return NextResponse.json({ erreur: e.message }, { status: 409 });
    }
    console.error('Validation du panier :', e);
    return NextResponse.json({ erreur: 'Erreur interne.' }, { status: 500 });
  }
}

function extraireLignes(corps: unknown): LigneDemandee[] | null {
  if (typeof corps !== 'object' || corps === null) return null;
  const brut = (corps as { lignes?: unknown }).lignes;
  if (!Array.isArray(brut)) return null;

  const lignes: LigneDemandee[] = [];
  for (const l of brut) {
    if (typeof l !== 'object' || l === null) return null;
    const { varianteId, quantite } = l as { varianteId?: unknown; quantite?: unknown };
    if (typeof varianteId !== 'string' || !varianteId) return null;
    if (typeof quantite !== 'number' || !Number.isInteger(quantite)) return null;
    lignes.push({ varianteId, quantite });
  }
  return lignes;
}
