import Link from 'next/link';
import { formaterPrix } from '@/lib/argent';
import { IllustrationProduit } from './PainSavon';

export type ProduitCarte = {
  slug: string;
  rang: number;
  nom: string;
  accroche: string;
  prixDepuisCentimes: number;
  poidsGrammes: number;
};

export function CarteProduit({ produit, vedette }: { produit: ProduitCarte; vedette?: boolean }) {
  const numero = `N°${String(produit.rang).padStart(2, '0')}`;

  if (vedette) {
    return (
      <article className="col-span-full grid items-center gap-12 lg:grid-cols-2">
        <Link
          href={`/savons/${produit.slug}`}
          className="grid min-h-[340px] place-items-center rounded-m border border-brume bg-neige p-8 transition-colors hover:border-foret"
        >
          <IllustrationProduit slug={produit.slug} taille={270} />
        </Link>
        <div>
          <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-grenat">
            {numero} · Le plus vendu
          </p>
          <h3 className="mb-4 font-serif text-[52px] tracking-[-0.03em]">
            <Link href={`/savons/${produit.slug}`} className="hover:text-grenat">
              {produit.nom}
            </Link>
          </h3>
          <p className="mb-6 max-w-[44ch] text-[16.5px] text-taupe">{produit.accroche}</p>
          <p className="font-mono text-[22px] tabulaire">
            {formaterPrix(produit.prixDepuisCentimes)}
            <span className="text-taupe"> · {produit.poidsGrammes} g</span>
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col">
      <Link
        href={`/savons/${produit.slug}`}
        className="grid min-h-[190px] place-items-center rounded-m border border-brume bg-neige p-6 transition-all duration-200 hover:-translate-y-1 hover:border-foret"
      >
        <IllustrationProduit slug={produit.slug} taille={150} />
      </Link>
      <div className="pt-4">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-grenat">{numero}</p>
        <h3 className="mb-2 font-serif text-[24px] tracking-[-0.02em]">
          <Link href={`/savons/${produit.slug}`} className="hover:text-grenat">
            {produit.nom}
          </Link>
        </h3>
        <p className="mb-4 text-[14px] text-taupe">{produit.accroche}</p>
        <p className="mt-auto font-mono text-[16px] tabulaire">
          {formaterPrix(produit.prixDepuisCentimes)}
        </p>
      </div>
    </article>
  );
}
