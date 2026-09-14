import type { Metadata } from 'next';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { clientIdPublicPaypal } from '@/lib/paiements';
import { Commande } from './Commande';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commander',
  robots: { index: false },
};

export default async function PageCommande() {
  // Lu côté serveur : la clé secrète reste en base, seul l'identifiant
  // public descend jusqu'au navigateur.
  const clientId = await clientIdPublicPaypal();

  return (
    <>
      <EnTeteBoutique />
      <main id="contenu" className="mx-auto max-w-[1000px] px-6 py-20">
        <h1 className="mb-12 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">
          Votre commande
        </h1>
        <Commande clientId={clientId} />
      </main>
      <PiedBoutique />
    </>
  );
}
