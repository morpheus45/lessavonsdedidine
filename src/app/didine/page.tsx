import type { Metadata } from 'next';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { BlurFade } from '@/components/magic/BlurFade';
import { Photo } from '@/components/Photo';
import { PARFUMS } from '@/lib/catalogue';
import { didine, phraseDelaiVitrine } from '@/lib/reponses';

export const metadata: Metadata = {
  title: 'Didine',
  description:
    'La personne derrière l’atelier : travail à la commande, petites quantités, savons coulés un par un et vitrines montées objet par objet.',
};

/*
 * Cette page ne raconte pas une biographie, parce que personne ici ne la
 * connaît. Tout ce qu'elle affirme est déjà écrit ailleurs sur le site et
 * vérifiable : le travail à la commande, les petites quantités, les onze
 * parfums, les vitrines montées objet par objet.
 *
 * Partout où il faudrait la parole de Didine, la question reste posée à
 * l'écran. Un encadré visible vaut mieux qu'une phrase inventée : la phrase
 * inventée, elle, ne se corrige jamais parce que personne ne sait qu'elle
 * est fausse.
 */

/** Les photos sont posées en clair ici : cette page ne dépend pas de la base. */
const PHOTOS = {
  coffret: {
    url: '/photos/savons-coffret.webp',
    urlPetite: '/photos/savons-coffret@small.webp',
    alt: 'Coffret de quatre savons ovales au motif de brin d’olivier, posés sur du papier de soie à cœurs',
    largeur: 1080,
    hauteur: 1372,
  },
  fleurs: {
    url: '/photos/savons-fleurs.webp',
    urlPetite: '/photos/savons-fleurs@small.webp',
    alt: 'Savons en forme de fleur, teintes crème et lavande, présentés dans une caisse en bois',
    largeur: 1080,
    hauteur: 1228,
  },
  salon: {
    url: '/photos/theme-salon.webp',
    urlPetite: '/photos/theme-salon@small.webp',
    alt: 'Vitrine sur le thème salon, au prénom de Josiane : canapé, meuble télé, tapis et bouquet',
    largeur: 1200,
    hauteur: 874,
  },
  chevaux: {
    url: '/photos/theme-chevaux.webp',
    urlPetite: '/photos/theme-chevaux@small.webp',
    alt: 'Vitrine sur le thème chevaux, au prénom de Guy : jument, poulain et bottes de foin devant des montagnes',
    largeur: 1200,
    hauteur: 975,
  },
  safari: {
    url: '/photos/theme-safari.webp',
    urlPetite: '/photos/theme-safari@small.webp',
    alt: 'Vitrine sur le thème safari : lion, éléphant, zèbre et girafe devant un coucher de soleil sur la savane',
    largeur: 1200,
    hauteur: 900,
  },
} as const;

/**
 * Les deux vitrines qui portent un prénom. La troisième, le safari, illustre
 * la bande verte plus haut : une même photo deux fois sur la même page se
 * remarque tout de suite et fait paraître le catalogue plus court
 * qu'il n'est.
 */
const VITRINES = [
  { cle: 'salon', photo: PHOTOS.salon, titre: 'Salon', prenom: 'Au prénom de Josiane' },
  { cle: 'chevaux', photo: PHOTOS.chevaux, titre: 'Chevaux', prenom: 'Au prénom de Guy' },
] as const;

export default function PageDidine() {
  const r = didine;
  const delai = phraseDelaiVitrine();

  return (
    <>
      <EnTeteBoutique actif="/didine" />

      <main id="contenu">
        {/* ── Qui ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 py-24">
          <div className="grid items-center gap-14 md:grid-cols-[1.1fr_1fr]">
            <BlurFade>
              <p className="eyebrow mb-6">La personne derrière l&rsquo;atelier</p>
              <h1 className="mb-8 max-w-[16ch] font-serif text-[clamp(42px,7vw,76px)] leading-[0.95] tracking-[-0.035em]">
                Le nom de la boutique est un <em className="italic text-grenat">prénom</em>
              </h1>
              <p className="mb-6 max-w-[54ch] text-[17.5px] text-taupe">
                C&rsquo;est déjà une information&nbsp;: il n&rsquo;y a pas de chaîne de
                fabrication derrière ces savons, il y a quelqu&rsquo;un. Les savons sont fondus,
                parfumés, colorés, coulés, démoulés, étiquetés et mis en sachet à la main, un par
                un. Les vitrines sont montées objet par objet.
              </p>
              <p className="max-w-[54ch] text-[17.5px] text-taupe">
                Tout se fait à la demande, en petites quantités. Un parfum demandé le matin peut
                être coulé l&rsquo;après-midi&nbsp;: c&rsquo;est exactement ce qu&rsquo;une usine
                ne sait pas faire.
              </p>
            </BlurFade>

            <BlurFade delai={0.08}>
              <Photo
                photo={PHOTOS.coffret}
                tailles="(min-width: 768px) 46vw, 92vw"
                prioritaire
                className="aspect-[4/5] w-full rounded-l object-cover"
              />
            </BlurFade>
          </div>
        </section>

        {/* ── Ce qui manque : sa parole ───────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 pb-8">
          <BlurFade>
            {r.depuisQuand || r.pourquoi ? (
              <div className="space-y-10">
                {r.depuisQuand && <Reponse titre="Depuis quand" texte={r.depuisQuand} />}
                {r.pourquoi && <Reponse titre="Ce qui a commencé" texte={r.pourquoi} />}
              </div>
            ) : (
              <AComplete
                questions={[
                'Depuis quand est-ce que vous faites des savons ?',
                'Qu’est-ce qui vous a donné l’envie de commencer ?',
              ]}
              />
            )}
          </BlurFade>
        </section>

        {/* ── Ce qui sort de l'atelier ────────────────────────────── */}
        <section className="mt-16 bg-foret text-nuage">
          <div className="mx-auto max-w-[1240px] px-6 py-28">
            <BlurFade>
              {/* Sur fond forêt, les libellés ne reprennent pas la classe
                  « eyebrow » : sa couleur taupe est prévue pour le fond clair. */}
              <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.2em] text-foret-3">
                Deux métiers dans le même atelier
              </p>
              <h2 className="mb-20 max-w-[20ch] font-serif text-[clamp(32px,5vw,52px)] tracking-[-0.035em] text-nuage">
                Ce qui sort de <em className="italic text-grenat-2">l&rsquo;atelier</em>
              </h2>
            </BlurFade>

            <div className="grid gap-16 md:grid-cols-2">
              <BlurFade>
                <Photo
                  photo={PHOTOS.fleurs}
                  tailles="(min-width: 768px) 46vw, 92vw"
                  className="mb-8 aspect-[4/3] w-full rounded-l object-cover"
                />
                <h3 className="mb-4 font-serif text-[30px] text-nuage">Les savons</h3>
                <p className="mb-4 text-[16px] text-foret-3">
                  Une base au beurre de karité biologique, sans SLS, achetée toute faite&nbsp;:
                  c&rsquo;est ce qui garantit une formule stable. Elle est coupée en cubes, fondue
                  doucement au bain-marie, parfumée avec un arôme naturel, colorée, parfois
                  enrichie de miel, puis coulée dans un moule en silicone à motif.
                </p>
                <p className="text-[16px] text-foret-3">
                  Prise en trente à soixante minutes. {PARFUMS.length} parfums au choix, et une
                  série ne porte jamais qu&rsquo;un seul parfum.
                </p>
              </BlurFade>

              <BlurFade delai={0.08}>
                <Photo
                  photo={PHOTOS.safari}
                  tailles="(min-width: 768px) 46vw, 92vw"
                  className="mb-8 aspect-[4/3] w-full rounded-l object-cover"
                />
                <h3 className="mb-4 font-serif text-[30px] text-nuage">Les vitrines</h3>
                <p className="mb-4 text-[16px] text-foret-3">
                  Un cadre en bois peint, un fond choisi, une scène en miniature disposée objet
                  par objet, et un prénom collé en lettres sur le dessus. Rien n&rsquo;est
                  assemblé à l&rsquo;avance.
                </p>
                <p className="text-[16px] text-foret-3">
                  Chaque vitrine part d&rsquo;un cadre vide.{delai && ` ${delai}`}
                </p>
              </BlurFade>
            </div>
          </div>
        </section>

        {/* ── Ce qui manque : ses préférences ─────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 py-24">
          <BlurFade>
            {r.preference ? (
              <div className="space-y-10">
                {r.preference && <Reponse titre="Ce qu’elle préfère faire" texte={r.preference} />}
              </div>
            ) : (
              <AComplete
                questions={[
                'Entre un savon et une vitrine, qu’est-ce que vous préférez fabriquer ?',
                'Y a-t-il un parfum que vous coulez plus souvent que les autres ?',
              ]}
              />
            )}
          </BlurFade>
        </section>

        {/* ── Trois vitrines déjà montées ─────────────────────────── */}
        <section className="border-t border-brume">
          <div className="mx-auto max-w-[1240px] px-6 py-24">
            <BlurFade>
              <p className="eyebrow mb-6">Déjà fabriquées</p>
              <h2 className="mb-6 max-w-[22ch] font-serif text-[clamp(28px,4vw,42px)] tracking-[-0.03em]">
                Deux vitrines, deux prénoms
              </h2>
              <p className="mb-12 max-w-[58ch] text-[16px] text-taupe">
                Aucune n&rsquo;existait avant d&rsquo;être demandée. C&rsquo;est le principe
                même&nbsp;: on part du thème et du prénom, pas d&rsquo;un catalogue d&rsquo;objets
                tout prêts.
              </p>
            </BlurFade>

            <ul className="grid gap-8 sm:grid-cols-2">
              {VITRINES.map((vitrine, i) => (
                <li key={vitrine.cle}>
                  <BlurFade delai={i * 0.06}>
                    <Photo
                      photo={vitrine.photo}
                      tailles="(min-width: 640px) 46vw, 92vw"
                      className="mb-4 aspect-[4/3] w-full rounded-m object-cover"
                    />
                    <p className="text-[16px] font-semibold">{vitrine.titre}</p>
                    <p className="text-[14px] text-taupe">{vitrine.prenom}</p>
                  </BlurFade>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Ce qui manque : la rencontre ────────────────────────── */}
        <section className="mx-auto max-w-[1240px] px-6 pb-24">
          <BlurFade>
            {r.demande ? (
              <div className="space-y-10">
                {r.demande && <Reponse titre="Ce qu’on lui demande" texte={r.demande} />}
              </div>
            ) : (
              <AComplete
                questions={[
                'Où est-ce qu’on peut vous rencontrer en vrai ?',
                'Qu’est-ce qu’on vous demande le plus souvent ?',
              ]}
              />
            )}
          </BlurFade>
        </section>

        {/* ── Ce qui est acheté, ce qui est fait ici ──────────────── */}
        <section className="border-t border-brume">
          <div className="mx-auto max-w-[1240px] px-6 py-24">
            <BlurFade>
              <h2 className="mb-6 max-w-[24ch] font-serif text-[clamp(28px,4vw,42px)] tracking-[-0.03em]">
                Ce qui est acheté, et ce qui est fait ici
              </h2>
              <p className="mb-10 max-w-[58ch] text-[16px] text-taupe">
                La base de savon est achetée toute faite, et c&rsquo;est écrit noir sur
                blanc&nbsp;: elle vient d&rsquo;un fournisseur, au beurre de karité biologique,
                sans SLS. Le parfum, la couleur, le miel, le moule, le démoulage,
                l&rsquo;étiquetage et la mise en sachet, eux, se font ici, un par un. Une boutique
                qui prétend le contraire finit toujours par se faire rattraper.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/savons"
                  className="inline-flex min-h-[52px] cursor-pointer items-center rounded-s bg-grenat px-8 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
                >
                  Voir la gamme
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[52px] items-center rounded-s border border-graphite px-8 text-[15px] font-semibold transition-colors hover:bg-brume"
                >
                  Écrire à Didine
                </Link>
              </div>
            </BlurFade>
          </div>
        </section>
      </main>

      <PiedBoutique />
    </>
  );
}

/**
 * Une question restée sans réponse, affichée telle quelle.
 *
 * Elle est volontairement grande et centrale : cachée dans un commentaire de
 * code, elle ne serait jamais remplie. Là, elle se voit depuis le canapé.
 */
function Reponse({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="max-w-[720px]">
      <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.2em] text-grenat">{titre}</p>
      <p className="whitespace-pre-line font-serif text-[clamp(20px,2.6vw,26px)] leading-[1.45] tracking-[-0.01em]">
        {texte}
      </p>
    </div>
  );
}

function AComplete({ questions }: { questions: readonly string[] }) {
  // Largeur bornée : un encadré de 1240 px pour deux questions courtes
  // laisserait un demi-mètre de blanc mort à sa droite.
  return (
    <aside className="max-w-[780px] rounded-l border border-brume-2 bg-neige p-8 sm:p-12">
      {/* Un filet grenat plutôt qu'un bord épais : l'encadré doit sauter aux
          yeux sans prendre l'allure d'un message d'erreur. */}
      <span aria-hidden="true" className="mb-5 block h-[2px] w-14 bg-grenat" />
      <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.2em] text-grenat">
        À compléter par Didine
      </p>
      <ul className="space-y-4">
        {questions.map((question) => (
          <li
            key={question}
            className="max-w-[34ch] font-serif text-[clamp(24px,3.4vw,34px)] leading-[1.15] tracking-[-0.02em]"
          >
            {question}
          </li>
        ))}
      </ul>
      <p className="mt-8 max-w-[56ch] text-[14.5px] text-taupe">
        Cette page n&rsquo;invente pas les réponses. Tant que Didine ne les a pas données, la
        question reste affichée plutôt qu&rsquo;une jolie phrase qui ne serait pas la sienne.
      </p>
    </aside>
  );
}
