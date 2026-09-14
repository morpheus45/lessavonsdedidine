import Link from 'next/link';
import { formaterPrix } from '@/lib/argent';
import { Photo, type PhotoAffichable } from './Photo';

export type ProduitCarte = {
  slug: string;
  rang: number;
  nom: string;
  accroche: string;
  prixDepuisCentimes: number;
  /** Première photo du produit. */
  photo?: PhotoAffichable;
  /** Précision affichée à côté du prix : « 4 achetés, 1 offert »… */
  detail?: string;
};

export function CarteProduit({
  produit,
  tailles = '(min-width: 640px) 50vw, 100vw',
  prioritaire,
}: {
  produit: ProduitCarte;
  tailles?: string;
  prioritaire?: boolean;
}) {
  const numero = `N°${String(produit.rang).padStart(2, '0')}`;

  return (
    <article className="group flex flex-col">
      <Link
        href={`/savons/${produit.slug}`}
        // Le cadre porte le recadrage : les photos vont du portrait au paysage,
        // et une grille dont chaque case a sa propre hauteur se lit mal.
        className="block overflow-hidden rounded-m border border-brume bg-neige transition-colors duration-200 hover:border-foret"
      >
        {produit.photo ? (
          <Photo
            photo={produit.photo}
            tailles={tailles}
            prioritaire={prioritaire}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </Link>

      <div className="pt-5">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-grenat">
          {numero}
        </p>
        <h3 className="mb-2 font-serif text-[clamp(24px,3vw,32px)] tracking-[-0.025em]">
          <Link href={`/savons/${produit.slug}`} className="hover:text-grenat">
            {produit.nom}
          </Link>
        </h3>
        <p className="mb-4 max-w-[44ch] text-[15px] text-taupe">{produit.accroche}</p>
        <p className="mt-auto font-mono text-[17px] tabulaire">
          <span className="text-taupe">à partir de </span>
          {formaterPrix(produit.prixDepuisCentimes)}
          {produit.detail && <span className="text-taupe"> · {produit.detail}</span>}
        </p>
      </div>
    </article>
  );
}
