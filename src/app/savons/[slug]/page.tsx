import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { IllustrationProduit } from '@/components/PainSavon';
import { AjoutPanier } from '@/components/AjoutPanier';
import { formaterPrix, prixAuKilo, formaterDate } from '@/lib/argent';

export const dynamic = 'force-dynamic';

async function chargerProduit(slug: string) {
  return prisma.produit.findFirst({
    where: { slug, actif: true },
    include: {
      variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
      // Le lot servi est celui dont la cure est finie et qui périme le plus
      // tôt : c'est la rotation correcte pour un produit daté.
      lots: {
        where: { pretLe: { lte: new Date() }, quantiteRestante: { gt: 0 } },
        orderBy: { durableJusquLe: 'asc' },
        take: 1,
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const produit = await chargerProduit(slug);
  if (!produit) return { title: 'Savon introuvable' };
  return { title: produit.nom, description: produit.accroche };
}

export default async function FicheProduit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const produit = await chargerProduit(slug);
  if (!produit || produit.variantes.length === 0) notFound();

  const premiere = produit.variantes[0]!;
  const lot = produit.lots[0];
  const numero = `N°${String(produit.rang).padStart(2, '0')}`;

  return (
    <>
      <EnTeteBoutique actif="/savons" />

      <main id="contenu" className="mx-auto grid max-w-[1240px] items-start gap-16 px-6 py-16 lg:grid-cols-2">
        <div className="grid place-items-center rounded-m border border-brume bg-neige p-12">
          <IllustrationProduit slug={produit.slug} taille={360} />
        </div>

        <div>
          <p className="mb-5 font-mono text-[12.5px] text-taupe">{numero} · Les savons</p>
          <h1 className="mb-4 font-serif text-[58px] tracking-[-0.035em]">{produit.nom}</h1>

          <p className="mb-2 font-mono text-[30px] tabulaire">{formaterPrix(premiere.prixCentimes)}</p>
          <p className="mb-8 font-mono text-[12.5px] text-taupe">
            {premiere.poidsGrammes} g · {prixAuKilo(premiere.prixCentimes, premiere.poidsGrammes)} ·
            TVA incluse
          </p>

          <p className="mb-8 text-[16.5px] text-taupe">{produit.description}</p>

          {/* Traçabilité : obligation réglementaire, affichée sous le prix
              plutôt qu'enterrée dans un onglet. */}
          {lot ? (
            <dl className="mb-8 flex flex-wrap gap-x-8 gap-y-2 border-y border-brume py-4 font-mono text-[12.5px] text-taupe">
              <div>
                <dt className="inline">Lot </dt>
                <dd className="inline font-medium text-foret">{lot.reference}</dd>
              </div>
              <div>
                <dt className="inline">Coulé le </dt>
                <dd className="inline font-medium text-foret">{formaterDate(lot.couleLe)}</dd>
              </div>
              <div>
                <dt className="inline">Sorti de cure le </dt>
                <dd className="inline font-medium text-foret">{formaterDate(lot.pretLe)}</dd>
              </div>
              <div>
                <dt className="inline">Poids net </dt>
                <dd className="inline font-medium text-foret">{premiere.poidsGrammes} g ± 5 g</dd>
              </div>
            </dl>
          ) : (
            <p className="mb-8 rounded-s border border-attente-bg bg-attente-bg px-4 py-3 text-[14px] text-attente">
              Ce savon est en cure : aucun lot n&rsquo;est encore sorti de séchage. Il sera
              disponible dès la fin de la cure.
            </p>
          )}

          {lot ? (
            <AjoutPanier
              variantes={produit.variantes.map((v) => ({
                id: v.id,
                nom: v.nom,
                prixCentimes: v.prixCentimes,
                poidsGrammes: v.poidsGrammes,
              }))}
              nomProduit={produit.nom}
              slug={produit.slug}
              rang={produit.rang}
            />
          ) : null}

          <div className="mt-10 border-t border-brume">
            <details open className="border-b border-brume">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-[15.5px] font-semibold">
                Composition
                <span aria-hidden className="font-mono text-[18px] text-grenat">+</span>
              </summary>
              <div className="pb-5 text-[14px] leading-relaxed text-taupe">
                <p className="font-mono text-[12.5px] text-foret">{produit.inci}</p>
                <p className="mt-3">
                  La liste complète figure sur le sachet, comme l&rsquo;exige la
                  réglementation cosmétique. Elle sera reportée ici telle quelle, depuis
                  l&rsquo;étiquette du fournisseur de la base.
                </p>
              </div>
            </details>

            <details className="border-b border-brume">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-[15.5px] font-semibold">
                Utilisation et conservation
                <span aria-hidden className="font-mono text-[18px] text-grenat">+</span>
              </summary>
              <div className="pb-5 text-[14px] leading-relaxed text-taupe">
                Rangez le pain hors de l&rsquo;eau entre deux usages, sur un porte-savon qui
                draine — un savon à froid est riche en glycérine, donc il ramollit s&rsquo;il
                reste dans une flaque. À utiliser de préférence dans les 12 mois après ouverture.
              </div>
            </details>

            <details className="border-b border-brume">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-[15.5px] font-semibold">
                Livraison et retours
                <span aria-hidden className="font-mono text-[18px] text-grenat">+</span>
              </summary>
              <div className="pb-5 text-[14px] leading-relaxed text-taupe">
                Expédié sous 48 h. Livraison offerte dès 39 €. Retour accepté 14 jours si
                l&rsquo;emballage n&rsquo;est pas ouvert — un cosmétique descellé ne peut pas
                être repris pour des raisons d&rsquo;hygiène, et la loi le prévoit.
              </div>
            </details>
          </div>
        </div>
      </main>

      <PiedBoutique />
    </>
  );
}
