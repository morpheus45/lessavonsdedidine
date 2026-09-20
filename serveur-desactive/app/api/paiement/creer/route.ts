import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ouvrirCommandePaypal, ErreurPaypal } from '@/lib/paypal-serveur';

/**
 * Ouvre le paiement d'une commande déjà enregistrée.
 *
 * Le navigateur n'envoie que la référence. Le montant est relu en base ici :
 * il n'est jamais accepté depuis la requête.
 */
export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: 'Requête illisible.' }, { status: 400 });
  }

  const reference = (corps as { reference?: unknown }).reference;
  if (typeof reference !== 'string' || !reference) {
    return NextResponse.json({ erreur: 'Référence manquante.' }, { status: 400 });
  }

  const commande = await prisma.commande.findUnique({ where: { reference } });
  if (!commande) {
    return NextResponse.json({ erreur: 'Commande introuvable.' }, { status: 404 });
  }
  if (commande.statut !== 'en_attente_paiement') {
    return NextResponse.json({ erreur: 'Cette commande est déjà réglée.' }, { status: 409 });
  }

  try {
    const orderId = await ouvrirCommandePaypal(commande);
    await prisma.commande.update({
      where: { id: commande.id },
      data: { paypalOrderId: orderId, moyenPaiement: 'paypal' },
    });
    return NextResponse.json({ orderId });
  } catch (e) {
    if (e instanceof ErreurPaypal) {
      console.error('PayPal (création) :', e.message);
      return NextResponse.json({ erreur: e.message }, { status: 502 });
    }
    throw e;
  }
}
