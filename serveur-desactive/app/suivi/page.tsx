import type { Metadata } from 'next';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { Formulaire } from './Formulaire';

export const metadata: Metadata = {
  title: 'Suivre ma commande',
  description:
    'Retrouvez l’état de votre commande avec sa référence et l’adresse électronique utilisée pour la passer.',
  // Une page qui affiche des commandes n'a rien à faire dans un index.
  robots: { index: false },
};

export default function PageSuivi() {
  return (
    <>
      <EnTeteBoutique actif="/suivi" />

      <main id="contenu" className="mx-auto max-w-[1000px] px-6 py-24">
        <header className="mb-14 max-w-[60ch]">
          <p className="eyebrow mb-6">Votre commande</p>
          <h1 className="mb-6 font-serif text-[clamp(38px,6vw,68px)] tracking-[-0.03em]">
            Où en est ma commande&nbsp;?
          </h1>
          <p className="text-[17.5px] text-taupe">
            Indiquez votre référence et l&rsquo;adresse électronique donnée au moment de la
            commande. Les deux sont nécessaires&nbsp;: une référence se devine, et une commande
            contient votre adresse de livraison.
          </p>
        </header>

        <Formulaire />

        <section className="mt-24 border-t border-brume pt-10">
          <h2 className="mb-3 font-serif text-[24px]">Vous n&rsquo;avez plus votre référence&nbsp;?</h2>
          <p className="max-w-[58ch] text-[15.5px] text-taupe">
            Elle s&rsquo;affiche à la fin de la commande, sous la forme LD-0412, et figure sur le
            reçu du paiement.{' '}
            <Link href="/contact" className="text-grenat underline underline-offset-4">
              Écrivez à Didine
            </Link>{' '}
            si vous ne la retrouvez pas&nbsp;: elle a le détail de chaque commande.
          </p>
        </section>
      </main>

      <PiedBoutique />
    </>
  );
}
