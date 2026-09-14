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
  'Saponifié à froid',
  'Surgras 8 %',
  'Cure 6 semaines',
  'Coupé au fil',
  'Petites séries',
  'Livraison offerte dès 39 €',
];

const PREUVES = [
  {
    valeur: 6,
    suffixe: '',
    unite: 'semaines',
    titre: 'De cure sur claies',
    texte: 'Le pain perd son eau et durcit. Un savon jeune fond trois fois plus vite.',
  },
  {
    valeur: 8,
    suffixe: ' %',
    unite: '',
    titre: 'De surgras',
    texte: "Une part des huiles reste non saponifiée dans le pain. C'est ce qui ne tire pas.",
  },
  {
    valeur: 4,
    suffixe: '',
    unite: 'huiles',
    titre: 'Végétales, pas une de plus',
    texte: "Olive, coco, karité, ricin. Pesées au gramme, fondues à 40 °C, rien d'autre.",
  },
];

const ETAPES: EtapeAtelier[] = [
  {
    rang: 'Jour 1 · matin',
    titre: 'La pesée',
    texte: 'Olive, coco, karité, ricin pesés au gramme et fondus à 40 °C. Un écart de 2 % change le pain.',
  },
  {
    rang: 'Jour 1 · midi',
    titre: 'La trace',
    texte: "La soude rejoint les huiles. On mixe jusqu'à ce que la pâte nappe le fouet : c'est la trace.",
  },
  {
    rang: 'Jour 1 – 3',
    titre: 'La phase de gel',
    texte: 'Coulée en moule de bois, couverte. La pâte monte seule à 70 °C, puis fige en refroidissant.',
  },
  {
    rang: 'Semaine 1 – 6',
    titre: 'La cure',
    texte: "Démoulage, découpe au fil, puis six semaines sur claies. Aucun moyen d'aller plus vite.",
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
                <p className="eyebrow mb-6">Saponification à froid · petites séries</p>
              </BlurFade>

              <TitreAnime
                texte={'Six semaines de séchage.\nPas une de moins.'}
                accent="Pas une de moins."
                className="mb-8 font-serif text-[clamp(48px,6.4vw,88px)] leading-[0.94] tracking-[-0.035em]"
              />

              <BlurFade delai={0.55}>
                <p className="mb-8 max-w-[40ch] text-[17px] text-taupe">
                  Didine pèse ses huiles au gramme, coule en moule de bois et coupe au fil.
                  Ensuite le pain attend sur claies — la seule étape qu&rsquo;on ne peut pas
                  raccourcir, et celle qui fait la différence sous la douche.
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

              {/* ── Lot réel ──────────────────────────────────────────
                  Pas un compteur d'urgence inventé : la quantité vient
                  de la table des lots, et elle baisse à chaque commande. */}
              {lotVedette && (
                <BlurFade delai={0.75}>
                  <p className="mt-10 inline-flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 border-foret py-1 pl-4 font-mono text-[12.5px] text-taupe">
                    <span>
                      Lot <strong className="font-medium text-foret">{lotVedette.reference}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      sorti de cure le{' '}
                      <strong className="font-medium text-foret">
                        {formaterDate(lotVedette.pretLe)}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="font-medium text-foret">{lotVedette.restant}</strong> pains
                      restants
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
                Quatre gestes, et <em className="italic text-grenat-2">six semaines</em>{' '}
                d&rsquo;attente
              </h2>
              <p className="mb-24 max-w-[58ch] text-[16.5px] text-foret-3">
                La saponification à froid ne cuit rien : la soude et les huiles réagissent
                seules, lentement, et la glycérine reste dans le pain au lieu d&rsquo;être
                récupérée. En échange, il faut attendre — c&rsquo;est tout le contrat.
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
