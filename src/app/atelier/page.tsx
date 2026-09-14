import type { Metadata } from 'next';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { FriseAtelier, type EtapeAtelier } from '@/components/ScenesAnimees';
import { BlurFade } from '@/components/magic/BlurFade';
import { Photo } from '@/components/Photo';
import { PARFUMS, lireThemes } from '@/lib/catalogue-serveur';

export const metadata: Metadata = {
  title: "L'atelier",
  description:
    "Comment sont faits les savons et les vitrines : base au beurre de karité bio sans SLS, fondue, parfumée, coulée à la main.",
};

const ETAPES: EtapeAtelier[] = [
  {
    rang: 'Étape 1',
    titre: 'La base',
    texte:
      'Une base de savon au beurre de karité biologique, sans SLS. Opaque, douce, choisie pour laver sans décaper.',
  },
  {
    rang: 'Étape 2',
    titre: 'La fonte',
    texte:
      'Coupée en cubes puis fondue au bain-marie, doucement. Une base surchauffée perd sa tenue et se rétracte en refroidissant.',
  },
  {
    rang: 'Étape 3',
    titre: 'Le parfum',
    texte:
      "Arôme naturel, colorant naturel, parfois du miel. C'est ici que se décide le savon : au gramme et au nez.",
  },
  {
    rang: 'Étape 4',
    titre: 'La coulée',
    texte:
      "Versée en moule de silicone à motif — brin d'olivier ou fleur. Prise en trente à soixante minutes, puis démoulage, étiquetage et mise en sachet à la main.",
  },
];

export const dynamic = 'force-dynamic';

export default async function Atelier() {
  const themes = await lireThemes();

  return (
    <>
      <EnTeteBoutique actif="/atelier" />

      <main id="contenu">
        <section className="mx-auto max-w-[1240px] px-6 py-24">
          <BlurFade>
            <p className="eyebrow mb-6">Comment c&rsquo;est fait</p>
            <h1 className="mb-8 max-w-[18ch] font-serif text-[clamp(42px,7vw,76px)] leading-[0.95] tracking-[-0.035em]">
              Rien n&rsquo;est fabriqué en série
            </h1>
            <p className="max-w-[60ch] text-[17.5px] text-taupe">
              Didine travaille en petites quantités, à la demande. Un parfum demandé le matin
              peut être coulé l&rsquo;après-midi. C&rsquo;est la raison d&rsquo;être de
              l&rsquo;atelier : faire ce qu&rsquo;une usine ne fait pas — une pièce à la fois,
              pour une personne à la fois.
            </p>
          </BlurFade>
        </section>

        {/* ── Les savons ──────────────────────────────────────────── */}
        <section className="bg-foret text-nuage">
          <div className="mx-auto max-w-[1240px] px-6 py-28">
            <BlurFade>
              <p className="eyebrow mb-6 text-foret-3">Les savons</p>
              <h2 className="mb-6 max-w-[20ch] font-serif text-[clamp(32px,5vw,52px)] tracking-[-0.035em] text-nuage">
                Quatre gestes, et le savon est{' '}
                <em className="italic text-grenat-2">prêt en une heure</em>
              </h2>
              <p className="mb-20 max-w-[58ch] text-[16.5px] text-foret-3">
                La base est achetée toute faite — c&rsquo;est ce qui permet de garantir une
                formule stable et sans SLS. Tout le reste, parfum, couleur, moulage, démoulage
                et emballage, se fait à la main, un par un.
              </p>
            </BlurFade>

            <FriseAtelier etapes={ETAPES} />

            <Photo
              photo={{
                url: '/photos/savons-parfums-ovales.webp',
                urlPetite: '/photos/savons-parfums-ovales@small.webp',
                alt: 'Cinq savons ovales étiquetés à la main : miel, café, olive, black opium et coco-vanille',
                largeur: 1200,
                hauteur: 1029,
              }}
              tailles="(min-width: 1240px) 1192px, 100vw"
              className="mt-20 aspect-[16/9] w-full rounded-l object-cover"
            />
          </div>
        </section>

        {/* ── Les parfums ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 py-24">
          <BlurFade>
            <h2 className="mb-4 font-serif text-[clamp(28px,4vw,42px)] tracking-[-0.03em]">
              {PARFUMS.length} parfums
            </h2>
            <p className="mb-8 max-w-[58ch] text-[16px] text-taupe">
              Chaque série est coulée dans un seul parfum. Vous choisissez les vôtres au moment
              de la commande.
            </p>
            <ul className="flex flex-wrap gap-2.5">
              {PARFUMS.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-brume-2 bg-neige px-4 py-2 text-[14px]"
                >
                  {p}
                </li>
              ))}
            </ul>
          </BlurFade>
        </section>

        {/* ── Les vitrines ────────────────────────────────────────── */}
        <section className="border-t border-brume">
          <div className="mx-auto max-w-[1240px] px-6 py-24">
            <BlurFade>
              <p className="eyebrow mb-6">Les vitrines</p>
              <h2 className="mb-6 max-w-[22ch] font-serif text-[clamp(28px,4vw,42px)] tracking-[-0.03em]">
                Une scène montée objet par objet
              </h2>
              <p className="mb-10 max-w-[58ch] text-[16px] text-taupe">
                Le cadre est peint, le fond choisi, les petits objets disposés un par un, et le
                prénom collé en lettres sur le dessus. Rien n&rsquo;est assemblé à
                l&rsquo;avance&nbsp;: chaque vitrine part d&rsquo;un cadre vide. Comptez environ
                une semaine de fabrication.
              </p>

              <ul className="grid gap-5 sm:grid-cols-2">
                {themes.map((t) => (
                  <li
                    key={t.slug}
                    className="overflow-hidden rounded-m border border-brume bg-neige"
                  >
                    {t.photo && (
                      <Photo
                        photo={t.photo}
                        tailles="(min-width: 640px) 46vw, 92vw"
                        className="aspect-[4/3] w-full object-cover"
                        // Le nom et la description suivent : décrire la photo
                        // en plus ferait entendre deux fois la même chose.
                        alt=""
                      />
                    )}
                    <div className="p-5">
                      <p className="mb-1.5 text-[16px] font-semibold">{t.nom}</p>
                      <p className="text-[14px] text-taupe">{t.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-[14.5px] text-taupe">
                Un thème qui ne figure pas dans cette liste&nbsp;? Demandez — c&rsquo;est du
                sur-mesure.
              </p>

              <Link
                href="/savons/vitrine-personnalisee"
                className="mt-8 inline-block cursor-pointer rounded-s bg-grenat px-8 py-4 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
              >
                Composer une vitrine
              </Link>
            </BlurFade>
          </div>
        </section>
      </main>

      <PiedBoutique />
    </>
  );
}
