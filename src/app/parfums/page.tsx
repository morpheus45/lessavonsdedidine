import type { Metadata } from 'next';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { BlurFade } from '@/components/magic/BlurFade';
import { RoueDesParfums } from '@/components/graphiques/RoueDesParfums';
import { FAMILLES } from '@/donnees/parfums';

export const metadata: Metadata = {
  title: 'Les onze parfums',
  description:
    'Les onze parfums des savons de Didine, rangés par famille : gourmands, torréfiés, fruités, frais et végétaux. De quoi choisir sans sentir.',
};

export default function Parfums() {
  const total = FAMILLES.reduce((n, f) => n + f.parfums.length, 0);

  return (
    <>
      <EnTeteBoutique actif="/parfums" />

      <main id="contenu">
        <section className="mx-auto max-w-[1240px] px-6 pt-24 pb-10">
          <BlurFade>
            <p className="eyebrow mb-6">Choisir une odeur</p>
            <h1 className="mb-8 max-w-[16ch] font-serif text-[clamp(42px,7vw,76px)] leading-[0.95] tracking-[-0.035em]">
              On n&rsquo;achète pas un savon, on achète une odeur
            </h1>
            <p className="max-w-[58ch] text-[17.5px] text-taupe">
              Le problème d&rsquo;une liste de {total} parfums, c&rsquo;est qu&rsquo;elle ne dit
              pas lesquels se ressemblent. Voici les mêmes, rangés par famille&nbsp;: les voisins
              sur la roue sentent voisin. Cliquez sur un pétale pour lire ce qu&rsquo;il sent.
            </p>
          </BlurFade>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 pb-8">
          <BlurFade delai={0.1}>
            <div className="rounded-l border border-brume bg-neige px-4 py-10 sm:px-10">
              <RoueDesParfums />
            </div>
          </BlurFade>
        </section>

        {/* ── Les fiches ───────────────────────────────────────────────
            La roue est une image : elle ne se lit pas à voix haute et ne
            se parcourt pas au clavier. Ces fiches sont le même contenu,
            en texte — et c'est vers elles que pointent les pétales. */}
        <section className="mx-auto max-w-[1240px] px-6 pb-24">
          {FAMILLES.map((famille, i) => (
            <BlurFade key={famille.slug} delai={i * 0.04}>
              <div className="border-t border-brume py-10">
                <div className="mb-6 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: famille.couleur }}
                  />
                  <h2 className="font-serif text-[clamp(26px,3.4vw,36px)] tracking-[-0.025em]">
                    {famille.nom}
                  </h2>
                  <span className="font-mono text-[12.5px] text-taupe">
                    {famille.parfums.length} parfum{famille.parfums.length > 1 ? 's' : ''}
                  </span>
                </div>

                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {famille.parfums.map((p) => (
                    <li
                      key={p.slug}
                      id={`parfum-${p.slug}`}
                      // La cible d'une ancre doit se détacher, sinon on ne
                      // voit pas où l'on vient d'atterrir.
                      className="scroll-mt-24 rounded-m border border-brume bg-neige p-5 target:border-foret target:shadow-[0_0_0_3px_var(--color-foret-3)]"
                    >
                      <p className="mb-1.5 text-[16.5px] font-semibold">{p.nom}</p>
                      <p className="text-[14.5px] leading-relaxed text-taupe">{p.odeur}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </BlurFade>
          ))}

          <BlurFade>
            <div className="mt-6 rounded-m border border-attente-bg bg-attente-bg p-6">
              <p className="mb-1 text-[15px] font-semibold text-attente">
                Le rangement par famille est de nous, pas de Didine.
              </p>
              <p className="text-[14px] text-attente">
                Les onze parfums sont bien les siens. Les familles et les descriptions
                d&rsquo;odeur ci-dessus sont une aide au choix, écrite de l&rsquo;extérieur et
                qu&rsquo;elle doit relire — c&rsquo;est elle qui sent ses savons.
              </p>
            </div>
          </BlurFade>

          <BlurFade>
            <div className="mt-14 flex flex-wrap items-center gap-6">
              <Link
                href="/savons/savons-parfumes"
                className="cursor-pointer rounded-s bg-grenat px-8 py-4 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
              >
                Choisir mes savons
              </Link>
              <Link
                href="/atelier"
                className="cursor-pointer border-b border-brume-2 pb-1 text-[15px] font-medium text-graphite transition-colors hover:border-graphite"
              >
                Comment ils sont faits
              </Link>
            </div>
          </BlurFade>
        </section>
      </main>

      <PiedBoutique />
    </>
  );
}
