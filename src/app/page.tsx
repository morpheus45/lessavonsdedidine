import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { CarteProduit, type ProduitCarte } from '@/components/CarteProduit';
import { PainSavon } from '@/components/PainSavon';

// La page dépend de la base : on la rend à la demande plutôt que de la figer
// à la construction, sinon un changement de tarif resterait invisible.
export const dynamic = 'force-dynamic';

const PREUVES = [
  {
    chiffre: '6',
    titre: 'Semaines de cure sur claies',
    texte: 'Le pain perd son eau et durcit. Un savon jeune fond trois fois plus vite.',
  },
  {
    chiffre: '8 %',
    titre: 'De surgras',
    texte: "Une part des huiles reste non saponifiée dans le pain. C'est ce qui ne tire pas.",
  },
  {
    chiffre: '4',
    titre: 'Huiles végétales',
    texte: "Olive, coco, karité, ricin. Pesées au gramme, fondues à 40 °C, rien d'autre.",
  },
];

const ETAPES = [
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

async function chargerGamme(): Promise<ProduitCarte[]> {
  const produits = await prisma.produit.findMany({
    where: { actif: true },
    orderBy: { rang: 'asc' },
    include: {
      variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
    },
  });

  return produits
    .filter((p) => p.variantes.length > 0)
    .map((p) => {
      const moinsCher = p.variantes[0]!;
      return {
        slug: p.slug,
        rang: p.rang,
        nom: p.nom,
        accroche: p.accroche,
        prixDepuisCentimes: moinsCher.prixCentimes,
        poidsGrammes: moinsCher.poidsGrammes,
      };
    });
}

export default async function Accueil() {
  const gamme = await chargerGamme();
  const [vedette, ...autres] = gamme;

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu">
        {/* ── Héros ─────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-28 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-6">Saponification à froid · petites séries</p>
            <h1 className="mb-8 font-serif text-[clamp(48px,6.4vw,88px)] leading-[0.94] tracking-[-0.035em]">
              Six semaines de séchage.
              <br />
              <em className="text-grenat">Pas une de moins.</em>
            </h1>
            <p className="mb-8 max-w-[40ch] text-[17px] text-taupe">
              Didine pèse ses huiles au gramme, coule en moule de bois et coupe au fil. Ensuite
              le pain attend sur claies — la seule étape qu&rsquo;on ne peut pas raccourcir, et
              celle qui fait la différence sous la douche.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/savons"
                className="rounded-s bg-grenat px-8 py-4 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
              >
                Voir les savons
              </Link>
              <Link
                href="/atelier"
                className="border-b border-brume-2 pb-1 text-[15px] font-medium text-graphite hover:border-graphite"
              >
                Comment c&rsquo;est fait
              </Link>
            </div>
          </div>

          <div className="grid place-items-center">
            <PainSavon slug="douceur-avoine" taille={420} />
          </div>
        </section>

        {/* ── Preuves ───────────────────────────────────────── */}
        <section className="border-y border-brume" aria-label="Notre méthode en trois chiffres">
          <div className="mx-auto grid max-w-[1240px] md:grid-cols-3">
            {PREUVES.map((p, i) => (
              <div
                key={p.titre}
                className={`px-6 py-12 ${i < PREUVES.length - 1 ? 'md:border-r md:border-brume' : ''}`}
              >
                <span className="mb-4 block font-serif text-[68px] leading-[0.86] tracking-[-0.04em] text-foret">
                  {p.chiffre}
                </span>
                <strong className="mb-2 block text-[16px]">{p.titre}</strong>
                <span className="text-[14px] text-taupe">{p.texte}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── La gamme ──────────────────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 py-28">
          <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-serif text-[46px] tracking-[-0.03em]">La gamme</h2>
            <Link
              href="/savons"
              className="border-b border-grenat pb-0.5 text-[14px] text-grenat hover:opacity-80"
            >
              Voir la série complète
            </Link>
          </header>

          {gamme.length === 0 ? (
            <p className="rounded-l border border-brume bg-neige p-8 text-taupe">
              Aucun savon n&rsquo;est publié pour le moment. Ajoutez vos recettes depuis le
              backoffice, ou lancez <code className="font-mono">npm run db:seed</code>.
            </p>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {vedette && <CarteProduit produit={vedette} vedette />}
              {autres.map((p) => (
                <CarteProduit key={p.slug} produit={p} />
              ))}
            </div>
          )}
        </section>

        {/* ── L'atelier ─────────────────────────────────────── */}
        <section className="bg-foret text-nuage">
          <div className="mx-auto max-w-[1240px] px-6 py-32">
            <p className="eyebrow mb-6 text-foret-3">Dans l&rsquo;atelier</p>
            <h2 className="mb-6 max-w-[19ch] font-serif text-[58px] tracking-[-0.035em] text-nuage">
              Quatre gestes, et <em className="text-grenat-2">six semaines</em> d&rsquo;attente
            </h2>
            <p className="mb-24 max-w-[58ch] text-[16.5px] text-foret-3">
              La saponification à froid ne cuit rien : la soude et les huiles réagissent seules,
              lentement, et la glycérine reste dans le pain au lieu d&rsquo;être récupérée. En
              échange, il faut attendre — c&rsquo;est tout le contrat.
            </p>

            <ol className="grid gap-8 md:grid-cols-4">
              {ETAPES.map((e) => (
                <li key={e.titre} className="border-t border-[#3E6454] pt-6">
                  <p className="mb-3 font-mono text-[12px] tracking-[0.18em] text-grenat-2">{e.rang}</p>
                  <h3 className="mb-3 font-serif text-[26px] tracking-[-0.02em] text-nuage">{e.titre}</h3>
                  <p className="text-[14px] leading-relaxed text-foret-3">{e.texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <PiedBoutique />
    </>
  );
}
