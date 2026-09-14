import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { CarteProduit, type ProduitCarte } from '@/components/CarteProduit';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Les savons',
  description:
    'Savons parfumés faits main sur base au beurre de karité bio sans SLS, et vitrines personnalisées à offrir.',
};

export default async function ListeSavons() {
  const produits = await prisma.produit.findMany({
    where: { actif: true },
    orderBy: { rang: 'asc' },
    include: { variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } } },
  });

  const gamme: ProduitCarte[] = produits
    .filter((p) => p.variantes.length > 0)
    .map((p) => ({
      slug: p.slug,
      rang: p.rang,
      nom: p.nom,
      accroche: p.accroche,
      prixDepuisCentimes: p.variantes[0]!.prixCentimes,
      poidsGrammes: p.variantes[0]!.poidsGrammes,
    }));

  return (
    <>
      <EnTeteBoutique actif="/savons" />

      <main id="contenu" className="mx-auto max-w-[1240px] px-6 py-24">
        <header className="mb-16 max-w-[60ch]">
          <p className="eyebrow mb-6">La gamme</p>
          <h1 className="mb-6 font-serif text-[clamp(38px,6vw,68px)] tracking-[-0.03em]">
            {gamme.length} recettes, numérotées
          </h1>
          <p className="text-[17.5px] text-taupe">
            Les savons partent d&rsquo;une base au beurre de karité biologique, sans SLS&nbsp;:
            fondue au bain-marie, parfumée et colorée avec des produits naturels, coulée dans
            un moule à motif. Les vitrines, elles, sont montées à la commande — cadre, thème,
            prénom et petits objets sont choisis par vous.
          </p>
        </header>

        {gamme.length === 0 ? (
          <p className="rounded-l border border-brume bg-neige p-8 text-taupe">
            Aucun savon n&rsquo;est publié pour le moment.
          </p>
        ) : (
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {gamme.map((p) => (
              <CarteProduit key={p.slug} produit={p} />
            ))}
          </div>
        )}
      </main>

      <PiedBoutique />
    </>
  );
}
