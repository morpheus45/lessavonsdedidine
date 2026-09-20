import { prisma } from '@/lib/prisma';
import { basculerActivationTheme, deplacerTheme } from './actions';
import { FormulaireTheme, GestionPhotosTheme, SupprimerTheme } from './Formulaires';

export const dynamic = 'force-dynamic';

export default async function Themes() {
  const themes = await prisma.themeVitrine.findMany({
    // Même tri que l'action de déplacement : sans le second critère, deux
    // thèmes de même rang changeraient de place à chaque chargement.
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: {
      photos: { orderBy: { ordre: 'asc' } },
      _count: { select: { lignes: true } },
    },
  });

  const sansPhoto = themes.filter((t) => t.photos.length === 0).length;

  return (
    <>
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-[34px] tracking-[-0.025em]">Thèmes de vitrines</h1>
        <p className="max-w-[62ch] text-[14.5px] text-taupe">
          {themes.length} thème{themes.length > 1 ? 's' : ''} ·{' '}
          {themes.filter((t) => t.actif).length} proposé
          {themes.filter((t) => t.actif).length > 1 ? 's' : ''} aux clientes. L&rsquo;ordre
          ci-dessous est celui de la boutique.
        </p>
        {sansPhoto > 0 && (
          <p className="mt-3 rounded-s border border-alerte-bg bg-alerte-bg px-4 py-3 text-[13.5px] text-alerte">
            {sansPhoto} thème{sansPhoto > 1 ? 's' : ''} sans photo. Une cliente choisit son thème
            sur la photo : sans image, ce thème se vend à l&rsquo;aveugle.
          </p>
        )}
      </header>

      <section className="mb-10 rounded-m border border-brume bg-neige p-6">
        <h2 className="mb-1 font-serif text-[24px]">Ajouter un thème</h2>
        <p className="mb-6 max-w-[62ch] text-[13.5px] text-taupe">
          Un thème est une scène que vous savez monter — safari, chevaux, salon… Créez-le ici,
          puis photographiez une vitrine déjà faite pour l&rsquo;illustrer.
        </p>
        <FormulaireTheme />
      </section>

      {themes.length === 0 ? (
        <p className="rounded-m border border-brume bg-neige p-8 text-taupe">
          Aucun thème pour l&rsquo;instant. Le configurateur de vitrine restera vide tant
          qu&rsquo;il n&rsquo;y en a pas.
        </p>
      ) : (
        <ul className="grid gap-4">
          {themes.map((t, rang) => {
            const couverture = t.photos[0];

            return (
              <li key={t.id} className="rounded-m border border-brume bg-neige p-5">
                <div className="flex flex-wrap items-start gap-5">
                  {/* Réordonnancement : deux boutons suffisent, et ils restent
                      utilisables au doigt comme au clavier. Aux extrémités, le
                      bouton impossible n'est pas affiché — un espace de même
                      taille garde les cartes alignées. */}
                  <div className="flex shrink-0 flex-col gap-1">
                    {rang > 0 ? (
                      <form action={deplacerTheme.bind(null, t.id, 'haut')}>
                        <button
                          type="submit"
                          aria-label={`Monter le thème ${t.nom}`}
                          className="grid h-11 w-11 cursor-pointer place-items-center rounded-s border border-brume-2 bg-nuage text-[16px] text-taupe transition-colors hover:border-foret hover:text-foret"
                        >
                          ↑
                        </button>
                      </form>
                    ) : (
                      <span aria-hidden="true" className="block h-11 w-11" />
                    )}
                    {rang < themes.length - 1 ? (
                      <form action={deplacerTheme.bind(null, t.id, 'bas')}>
                        <button
                          type="submit"
                          aria-label={`Descendre le thème ${t.nom}`}
                          className="grid h-11 w-11 cursor-pointer place-items-center rounded-s border border-brume-2 bg-nuage text-[16px] text-taupe transition-colors hover:border-foret hover:text-foret"
                        >
                          ↓
                        </button>
                      </form>
                    ) : (
                      <span aria-hidden="true" className="block h-11 w-11" />
                    )}
                  </div>

                  {couverture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={couverture.urlPetite}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-s object-cover"
                    />
                  ) : (
                    <span className="grid h-24 w-24 shrink-0 place-items-center rounded-s border border-dashed border-brume-2 text-center font-mono text-[12px] leading-tight text-alerte">
                      sans
                      <br />
                      photo
                    </span>
                  )}

                  <div className="min-w-[240px] flex-1">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-taupe">
                      N°{String(rang + 1).padStart(2, '0')} · /{t.slug}
                    </p>
                    <h2 className="font-serif text-[24px]">{t.nom}</h2>
                    <p className="mt-1 max-w-[60ch] text-[13.5px] text-taupe">{t.description}</p>
                    <p className="mt-2 font-mono text-[12px] text-taupe">
                      {t.photos.length === 0
                        ? 'aucune photo'
                        : `${t.photos.length} photo${t.photos.length > 1 ? 's' : ''}`}
                      {t._count.lignes > 0 &&
                        ` · ${t._count.lignes} ligne${t._count.lignes > 1 ? 's' : ''} de commande`}
                    </p>
                  </div>

                  <form action={basculerActivationTheme.bind(null, t.id)}>
                    <button
                      type="submit"
                      title={t.actif ? 'Masquer ce thème' : 'Proposer ce thème'}
                      className={`min-h-[44px] min-w-[120px] cursor-pointer rounded-s border px-4 text-[13px] font-semibold transition-colors ${
                        t.actif
                          ? 'border-foret bg-foret text-nuage'
                          : 'border-brume-2 bg-nuage text-taupe hover:border-taupe'
                      }`}
                    >
                      {t.actif ? 'Proposé' : 'Masqué'}
                    </button>
                  </form>
                </div>

                {/* Ouvert d'office quand le thème n'a pas de photo : c'est
                    exactement le geste à faire, autant ne pas le cacher. */}
                <details open={t.photos.length === 0} className="mt-4 border-t border-brume pt-4">
                  {/* Pas de `display: flex` sur un summary : le navigateur
                      retire alors son triangle, et le dépliant ne se voit
                      plus. La hauteur de touche vient du remplissage. */}
                  <summary className="min-h-[44px] cursor-pointer py-2.5 font-mono text-[12.5px] uppercase tracking-[0.14em] text-taupe">
                    Modifier ce thème et ses photos
                  </summary>

                  <div className="mt-4 grid gap-8 xl:grid-cols-2">
                    <div>
                      <FormulaireTheme
                        theme={{
                          id: t.id,
                          nom: t.nom,
                          description: t.description,
                          actif: t.actif,
                        }}
                      />
                      <div className="mt-6">
                        <SupprimerTheme themeId={t.id} citations={t._count.lignes} />
                      </div>
                    </div>

                    <GestionPhotosTheme themeId={t.id} photos={t.photos} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
