import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FormulaireProduit, GestionVariantes } from '../Formulaires';
import { GestionPhotos } from '../FormulairePhoto';

export const dynamic = 'force-dynamic';

export default async function FicheAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produit = await prisma.produit.findUnique({
    where: { id },
    include: {
      variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
      photos: { orderBy: { ordre: 'asc' } },
    },
  });
  if (!produit) notFound();

  return (
    <>
      <header className="mb-8">
        <Link
          href="/admin/catalogue"
          className="mb-3 inline-block border-b border-brume-2 text-[13px] text-taupe hover:border-taupe"
        >
          ← Catalogue
        </Link>
        <h1 className="font-serif text-[34px] tracking-[-0.02em]">{produit.nom}</h1>
        <p className="mt-1 font-mono text-[12.5px] text-taupe">
          /savons/{produit.slug} · {produit.actif ? 'en vente' : 'brouillon'}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <FormulaireProduit
          produit={{
            id: produit.id,
            nom: produit.nom,
            type: produit.type,
            accroche: produit.accroche,
            description: produit.description,
            inci: produit.inci,
          }}
        />

        <div className="grid gap-6">
          <GestionVariantes produitId={produit.id} variantes={produit.variantes} />
          <GestionPhotos produitId={produit.id} photos={produit.photos} />
        </div>
      </div>
    </>
  );
}
