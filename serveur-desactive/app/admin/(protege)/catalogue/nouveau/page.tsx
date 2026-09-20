import Link from 'next/link';
import { FormulaireProduit } from '../Formulaires';

export const dynamic = 'force-dynamic';

export default function NouveauProduit() {
  return (
    <>
      <header className="mb-8">
        <Link
          href="/admin/catalogue"
          className="mb-3 inline-block border-b border-brume-2 text-[13px] text-taupe hover:border-taupe"
        >
          ← Catalogue
        </Link>
        <h1 className="font-serif text-[34px] tracking-[-0.02em]">Nouveau produit</h1>
        <p className="mt-1 text-[14px] text-taupe">
          Le produit est créé en brouillon. Vous ajoutez ensuite ses formats, ses prix et ses
          photos, puis vous le mettez en vente.
        </p>
      </header>

      <div className="max-w-[640px]">
        <FormulaireProduit />
      </div>
    </>
  );
}
