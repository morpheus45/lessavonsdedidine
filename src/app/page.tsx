import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { CarteProduit, type ProduitCarte } from '@/components/CarteProduit';
import { PainSavon } from '@/components/PainSavon';
import { TitreAnime } from '@/components/TitreAnime';
import { SavonParallaxe, FriseAtelier, type EtapeAtelier } from '@/components/ScenesAnimees';
import { Marquee, ElementMarquee } from '@/components/magic/Marquee';
import { DotPattern } from '@/components/magic/DotPattern';
import { NumberTicker } from '@/components/magic/NumberTicker';
import { BlurFade } from '@/components/magic/BlurFade';
import { formaterDate } from '@/lib/argent';

export const dynamic = 'force-dynamic';

const ARGUMENTS = [
  'Beurre de karité bio',
  'Sans SLS',
  'Miel et arômes naturels',
  'Colorants naturels',
  'Fait main en petites séries',
  'Livraison offerte dès 39 €',
];

const PREUVES = [
  {
    valeur: 11,
    suffixe: '',
    unite: 'parfums',
    titre: 'Au choix, à la commande',
    texte: "Café, vanille, coco-vanille, black opium, olive, miel, menthe, fraise, bubble gum, caramel, citron.",
  },
  {
    valeur: 0,
    suffixe: '',
    unite: 'SLS',
    titre: 'Aucun sulfate moussant',
    texte: 'La base est choisie sans laurylsulfate de sodium, enrichie en beurre de karité bio.',
  },
  {
    valeur: 100,
    suffixe: ' %',
    unite: '',
    titre: 'Coulé et emballé à la main',
    texte: "Chaque savon sort d'un moule en silicone, est démoulé, étiqueté et ensaché un par un.",
  },
];

const ETAPES: EtapeAtelier[] = [
  {
    rang: 'Étape 1',
    titre: 'La base',
    texte: 'Une base au beurre de karité biologique, sans SLS. Opaque, douce, choisie pour ne pas décaper.',
  },
  {
    rang: 'Étape 2',
    titre: 'La fonte',
    texte: 'Coupée en cubes puis fondue au bain-marie, doucement — une base surchauffée perd sa transparence et sa tenue.',
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
      "Versée en moule de silicone à motif — brin d'olivier ou fleur. Prise en trente à soixante minutes, puis démoulage à la main.",
  },
];

type LotCourant = { reference: string; restant: number; pretLe: Date } | null;

async function chargerGamme(): Promise<{ gamme: ProduitCarte[]; lotVedette: LotCourant }> {
  const produits = await prisma.produit.findMany({
    where: { actif: true },
    orderBy: { rang: 'asc' },
    include: {
      variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
      lots: {
        where: { pretLe: { lte: new Date() }, quantiteRestante: { gt: 0 } },
        orderBy: { durableJusquLe: 'asc' },
        take: 1,
      },
    },
  });

  const utilisables = produits.filter((p) => p.variantes.length > 0);

  const gamme = utilisables.map((p) => ({
    slug: p.slug,
    rang: p.rang,
    nom: p.nom,
    accroche: p.accroche,
    prixDepuisCentimes: p.variantes[0]!.prixCentimes,
    poidsGrammes: p.variantes[0]!.poidsGrammes,
  }));

  const lot = utilisables[0]?.lots[0];
  return {
    gamme,
    lotVedette: lot
      ? { reference: lot.reference, restant: lot.quantiteRestante, pretLe: lot.pretLe }
      : null,
  };
}

export default async function Accueil() {
  const { gamme, lotVedette } = await chargerGamme();
  const [vedette, ...autres] = gamme;

  return (
    <>
      {/* ── Bandeau défilant ────────────────────────────────────────
          Il porte la méthode, pas une promotion. La référence empile
          une pastille « -10 % » sur toutes ses pages ; ici c'est le
          procédé qui défile. */}
      <div className="bg-foret">
        <Marquee duree="48s" className="py-2.5">
          {ARGUMENTS.map((a) => (
            <ElementMarquee key={a}>{a}</ElementMarquee>
          ))}
        </Marquee>
      </div>

      <EnTeteBoutique />

      <main id="contenu">
        {/* ── Héros ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <DotPattern ecart={26} rayon={1} className="opacity-60 [mask-image:radial-gradient(60%_50%_at_50%_40%,black,transparent)]" />

          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-28 lg:grid-cols-2">
            <div>
              <BlurFade delai={0}>
                <p className="eyebrow mb-6">Savons parfumés · faits main · petites séries</p>
              </BlurFade>

              <TitreAnime
                texte={'Onze parfums,\ncoulés à la main.'}
                accent="coulés à la main."
                className="mb-8 font-serif text-[clamp(48px,6.4vw,88px)] leading-[0.94] tracking-[-0.035em]"
              />

              <BlurFade delai={0.55}>
                <p className="mb-8 max-w-[40ch] text-[17px] text-taupe">
                  Didine part d&rsquo;une base au beurre de karité bio, sans SLS. Elle la fond au
                  bain-marie, la parfume et la colore avec des arômes et des colorants naturels,
                  puis la coule dans des moules à motif. Démoulé, étiqueté, ensaché&nbsp;: un par un.
                </p>
              </BlurFade>

              <BlurFade delai={0.65}>
                <div className="flex flex-wrap items-center gap-6">
                  <Link
                    href="/savons"
                    className="cursor-pointer rounded-s bg-grenat px-8 py-4 text-[15px] font-semibold text-nuage transition-opacity duration-200 hover:opacity-90"
                  >
                    Voir les savons
                  </Link>
                  <Link
                    href="/atelier"
                    className="cursor-pointer border-b border-brume-2 pb-1 text-[15px] font-medium text-graphite transition-colors duration-200 hover:border-graphite"
                  >
                    Comment c&rsquo;est fait
                  </Link>
                </div>
              </BlurFade>

              {/* ── Série en cours ───────────────────────────────────
                  Pas un compteur d'urgence inventé : la quantité vient de
                  la base et baisse à chaque commande. La référence de série
                  reste utile — c'est elle qui figure sur l'étiquette, et la
                  réglementation cosmétique impose de pouvoir la retrouver. */}
              {lotVedette && (
                <BlurFade delai={0.75}>
                  <p className="mt-10 inline-flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 border-foret py-1 pl-4 font-mono text-[12.5px] text-taupe">
                    <span>
                      Série{' '}
                      <strong className="font-medium text-foret">{lotVedette.reference}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      coulée le{' '}
                      <strong className="font-medium text-foret">
                        {formaterDate(lotVedette.pretLe)}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="font-medium text-foret">{lotVedette.restant}</strong> savons
                      disponibles
                    </span>
                  </p>
                </BlurFade>
              )}
            </div>

            <SavonParallaxe>
              <PainSavon slug="douceur-avoine" taille={420} />
            </SavonParallaxe>
          </div>
        </section>

        {/* ── Preuves ──────────────────────────────────────────────── */}
        <section className="border-y border-brume" aria-label="Notre méthode en trois chiffres">
          <div className="mx-auto grid max-w-[1240px] md:grid-cols-3">
            {PREUVES.map((p, i) => (
              <BlurFade
                key={p.titre}
                delai={i * 0.08}
                className={i < PREUVES.length - 1 ? 'md:border-r md:border-brume' : ''}
              >
                <div className="px-6 py-12">
                  <span className="mb-4 block font-serif text-[68px] leading-[0.86] tracking-[-0.04em] text-foret">
                    <NumberTicker valeur={p.valeur} suffixe={p.suffixe} />
                    {p.unite && <span className="ml-2 text-[34px]">{p.unite}</span>}
                  </span>
                  <strong className="mb-2 block text-[16px]">{p.titre}</strong>
                  <span className="text-[14px] text-taupe">{p.texte}</span>
                </div>
              </BlurFade>
            ))}
          </div>
        </section>

        {/* ── La gamme ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 py-28">
          <BlurFade>
            <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-serif text-[46px] tracking-[-0.03em]">La gamme</h2>
              <Link
                href="/savons"
                className="cursor-pointer border-b border-grenat pb-0.5 text-[14px] text-grenat transition-opacity hover:opacity-80"
              >
                Voir la série complète
              </Link>
            </header>
          </BlurFade>

          {gamme.length === 0 ? (
            <p className="rounded-l border border-brume bg-neige p-8 text-taupe">
              Aucun savon n&rsquo;est publié pour le moment. Lancez{' '}
              <code className="font-mono">npm run db:seed</code>.
            </p>
          ) : (
            <div className="grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {vedette && (
                <BlurFade className="col-span-full">
                  <CarteProduit produit={vedette} vedette />
                </BlurFade>
              )}
              {autres.map((p, i) => (
                <BlurFade
                  key={p.slug}
                  delai={i * 0.05}
                  // Quinconce : une rangée parfaitement alignée se lit comme
                  // un peigne. Le décalage casse la régularité sans désordre.
                  className={i % 2 === 1 ? 'lg:mt-10' : ''}
                >
                  <CarteProduit produit={p} />
                </BlurFade>
              ))}
            </div>
          )}
        </section>

        {/* ── L'atelier ────────────────────────────────────────────── */}
        <section className="bg-foret text-nuage">
          <div className="mx-auto max-w-[1240px] px-6 py-32">
            <BlurFade>
              <p className="eyebrow mb-6 text-foret-3">Dans l&rsquo;atelier</p>
              <h2 className="mb-6 max-w-[19ch] font-serif text-[58px] tracking-[-0.035em] text-nuage">
                Quatre gestes, et le savon est <em className="italic text-grenat-2">prêt en une heure</em>
              </h2>
              <p className="mb-24 max-w-[58ch] text-[16.5px] text-foret-3">
                Fondre, parfumer, colorer, couler. Le procédé est court, et c&rsquo;est
                justement ce qui permet de faire du sur-mesure&nbsp;: un parfum demandé le matin
                peut être coulé l&rsquo;après-midi, en petite série, sans stock à écouler.
              </p>
            </BlurFade>

            <FriseAtelier etapes={ETAPES} />
          </div>
        </section>
      </main>

      <PiedBoutique />
    </>
  );
}
