import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { formaterPrix, formaterDate } from '@/lib/argent';
import { lireConfigPaiements } from '@/lib/paiements';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commande enregistrée',
  robots: { index: false, follow: false },
};

export default async function ConfirmationCommande({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  const commande = await prisma.commande.findUnique({
    where: { reference },
    include: { lignes: { include: { lot: true } } },
  });

  if (!commande) notFound();

  // État réel des moyens de paiement, tel que réglé dans le backoffice.
  const paiements = await lireConfigPaiements();
  const moyens = [
    paiements.paypal.utilisable && 'PayPal',
    paiements.cb.utilisable && 'carte bancaire',
  ].filter(Boolean) as string[];
  const paiementConfigure = moyens.length > 0;

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[840px] px-6 py-20">
        <p className="eyebrow mb-6">Commande {commande.reference}</p>
        <h1 className="mb-6 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">
          Votre commande est enregistrée
        </h1>

        {paiementConfigure ? (
          <p className="mb-10 max-w-[62ch] text-[17px] text-taupe">
            Il reste à la régler par {moyens.join(' ou ')}. Tant que le paiement n&rsquo;est
            pas confirmé, rien n&rsquo;est débité et votre commande reste réservée.
          </p>
        ) : (
          <div className="mb-10 rounded-s border border-attente-bg bg-attente-bg px-6 py-5">
            <p className="mb-2 text-[15px] font-semibold text-attente">
              Le paiement en ligne n&rsquo;est pas encore actif
            </p>
            <p className="max-w-[62ch] text-[14.5px] text-attente">
              La commande est bien enregistrée et votre article réservé, mais aucun moyen de
              paiement en ligne n&rsquo;est actif pour le moment. Didine vous recontactera pour
              convenir du règlement.
            </p>
          </div>
        )}

        <section className="mb-10 rounded-l border border-brume bg-neige p-7">
          <h2 className="mb-6 font-serif text-[26px]">Récapitulatif</h2>

          <ul className="mb-6 space-y-4 border-b border-brume pb-6">
            {commande.lignes.map((l) => (
              <li key={l.id} className="flex justify-between gap-6 text-[14.5px]">
                <span>
                  {l.libelle}
                  <span className="text-taupe"> × {l.quantite}</span>
                  {l.lot && (
                    <span className="mt-1 block font-mono text-[12px] text-taupe">
                      Série {l.lot.reference} · coulée le {formaterDate(l.lot.couleLe)}
                    </span>
                  )}
                </span>
                <span className="font-mono whitespace-nowrap tabulaire">
                  {formaterPrix(l.totalCentimes)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-3 text-[14.5px]">
            <div className="flex justify-between">
              <dt>Sous-total</dt>
              <dd className="font-mono tabulaire">{formaterPrix(commande.sousTotalCentimes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd className="font-mono tabulaire">
                {commande.livraisonCentimes === 0 ? (
                  <span className="font-semibold text-foret">Offerte</span>
                ) : (
                  formaterPrix(commande.livraisonCentimes)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-brume-2 pt-4 text-[19px] font-bold">
              <dt>Total</dt>
              <dd className="font-mono tabulaire">{formaterPrix(commande.totalCentimes)}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-serif text-[22px]">Livraison</h2>
          <address className="text-[14.5px] not-italic text-taupe">
            {commande.nom}
            <br />
            {commande.adresse}
            <br />
            {commande.codePostal} {commande.ville}
            <br />
            {commande.email}
          </address>
        </section>

        <Link
          href="/savons"
          className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
        >
          Continuer mes achats
        </Link>
      </main>

      <PiedBoutique />
    </>
  );
}
