import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { capturerCommandePaypal, ErreurPaypal } from '@/lib/paypal-serveur';

/**
 * Encaisse une commande, puis la marque payée.
 *
 * Le montant encaissé est comparé au total attendu avant de basculer le
 * statut. S'ils diffèrent, la commande N'EST PAS marquée payée : elle est
 * signalée pour que Didine regarde avant d'expédier. Un écart signifie soit
 * une manipulation, soit un bogue — dans les deux cas il ne faut pas
 * expédier en silence.
 */
export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: 'Requête illisible.' }, { status: 400 });
  }

  const orderId = (corps as { orderId?: unknown }).orderId;
  if (typeof orderId !== 'string' || !orderId) {
    return NextResponse.json({ erreur: 'Paiement inconnu.' }, { status: 400 });
  }

  const commande = await prisma.commande.findUnique({ where: { paypalOrderId: orderId } });
  if (!commande) {
    return NextResponse.json({ erreur: 'Commande introuvable.' }, { status: 404 });
  }
  if (commande.statut === 'payee') {
    // Rejouer la même capture ne doit pas produire d'erreur : l'acheteur a
    // rechargé la page, la commande est déjà payée, on le lui confirme.
    return NextResponse.json({ reference: commande.reference, deja: true });
  }

  try {
    const capture = await capturerCommandePaypal(orderId);

    if (capture.encaisseCentimes !== commande.totalCentimes) {
      await prisma.$transaction([
        prisma.commande.update({
          where: { id: commande.id },
          data: { statut: 'echouee', paypalCaptureId: capture.captureId },
        }),
        prisma.evenementCommande.create({
          data: {
            commandeId: commande.id,
            statut: 'echouee',
            auteur: 'systeme',
            detail: `Montant encaissé ${capture.encaisseCentimes} c ≠ total attendu ${commande.totalCentimes} c. À vérifier avant toute expédition.`,
          },
        }),
      ]);
      return NextResponse.json(
        { erreur: 'Le montant encaissé ne correspond pas. Contactez la boutique.' },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.commande.update({
        where: { id: commande.id },
        data: { statut: 'payee', payeeLe: new Date(), paypalCaptureId: capture.captureId },
      }),
      prisma.evenementCommande.create({
        data: {
          commandeId: commande.id,
          statut: 'payee',
          auteur: 'paypal',
          detail: `Encaissement ${capture.captureId} (${capture.statut}).`,
        },
      }),
    ]);

    return NextResponse.json({ reference: commande.reference });
  } catch (e) {
    if (e instanceof ErreurPaypal) {
      console.error('PayPal (capture) :', e.message);
      return NextResponse.json({ erreur: e.message }, { status: 502 });
    }
    throw e;
  }
}
