import type { Metadata } from 'next';
import { PRODUITS } from '@/donnees/catalogue';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { CarteProduit, type ProduitCarte } from '@/components/CarteProduit';

// Site statique.

export const metadata: Metadata = {
  title: 'Les savons',
  description:
    'Savons parfumés faits main sur base au beurre de karité bio sans SLS, et vitrines personnalisées à offrir.',
};

export default function ListeSavons() {
  const gamme: ProduitCarte[] = PRODUITS.map((p) => ({
    slug: p.slug,
    rang: p.rang,
    nom: p.nom,
    accroche: p.accroche,
    prixDepuisCentimes: Math.min(...p.formules.map((f) => f.prixCentimes)),
    photo: p.photos[0],
    detail: p.formules[0]?.detail,
  }));

  return (
    <>
      <EnTeteBoutique actif="/savons" />

      <main id="contenu" className="mx-auto max-w-[1240px] px-6 py-24">
        <header className="mb-16 max-w-[60ch]">
          <p className="eyebrow mb-6">La gamme</p>
          <h1 className="mb-6 font-serif text-[clamp(38px,6vw,68px)] tracking-[-0.03em]">
            La gamme complète
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
          <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2">
            {gamme.map((p, i) => (
              <CarteProduit
                key={p.slug}
                produit={p}
                tailles="(min-width: 640px) 44vw, 100vw"
                prioritaire={i === 0}
              />
            ))}
          </div>
        )}
      </main>

      <PiedBoutique />
    </>
  );
}
