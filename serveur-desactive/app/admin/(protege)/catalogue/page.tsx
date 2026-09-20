import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formaterPrix } from '@/lib/argent';
import { basculerPublication } from './actions';

export const dynamic = 'force-dynamic';

export default async function Catalogue() {
  const produits = await prisma.produit.findMany({
    orderBy: { rang: 'asc' },
    include: {
      variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
      photos: { orderBy: { ordre: 'asc' }, take: 1 },
    },
  });

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[34px] tracking-[-0.02em]">Catalogue</h1>
          <p className="mt-1 text-[14px] text-taupe">
            {produits.length} produit{produits.length > 1 ? 's' : ''} ·{' '}
            {produits.filter((p) => p.actif).length} en vente
          </p>
        </div>
        <Link
          href="/admin/catalogue/nouveau"
          className="rounded-s bg-grenat px-5 py-3 text-[14px] font-semibold text-nuage transition-opacity hover:opacity-90"
        >
          Nouveau produit
        </Link>
      </header>

      {produits.length === 0 ? (
        <p className="rounded-l border border-brume bg-neige p-8 text-taupe">
          Aucun produit. Commencez par en créer un.
        </p>
      ) : (
        <ul className="grid gap-4">
          {produits.map((p) => {
            const prix = p.variantes.map((v) => v.prixCentimes);
            const photo = p.photos[0];
            const publiable = p.variantes.length > 0 && p.photos.length > 0;

            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-5 rounded-m border border-brume bg-neige p-4"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.urlPetite}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-s object-cover"
                  />
                ) : (
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-s border border-dashed border-brume-2 font-mono text-[10px] text-taupe">
                    sans
                    <br />
                    photo
                  </span>
                )}

                <div className="min-w-[200px] flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-taupe">
                    N°{String(p.rang).padStart(2, '0')} · {p.type}
                  </p>
                  <Link
                    href={`/admin/catalogue/${p.id}`}
                    className="font-serif text-[22px] hover:text-grenat"
                  >
                    {p.nom}
                  </Link>
                  <p className="text-[13.5px] text-taupe">{p.accroche}</p>
                </div>

                <p className="font-mono text-[15px] tabulaire">
                  {prix.length === 0 ? (
                    <span className="text-alerte">aucun prix</span>
                  ) : (
                    `dès ${formaterPrix(Math.min(...prix))}`
                  )}
                </p>

                <form action={basculerPublication.bind(null, p.id)}>
                  <button
                    type="submit"
                    disabled={!p.actif && !publiable}
                    title={
                      !p.actif && !publiable
                        ? 'Il faut au moins un format avec un prix et une photo.'
                        : undefined
                    }
                    className={`min-w-[110px] cursor-pointer rounded-s border px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      p.actif
                        ? 'border-foret bg-foret text-nuage'
                        : 'border-brume-2 bg-nuage text-taupe hover:border-taupe'
                    }`}
                  >
                    {p.actif ? 'En vente' : 'Brouillon'}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
