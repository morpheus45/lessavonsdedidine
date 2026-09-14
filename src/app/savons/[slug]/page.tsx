import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { lireProduit, lireThemes } from '@/lib/catalogue-serveur';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { Galerie } from '@/components/Galerie';
import { AjoutPanier } from '@/components/AjoutPanier';
import { ConfigurateurVitrine } from '@/components/ConfigurateurVitrine';
import { formaterPrix } from '@/lib/argent';

// Le catalogue est modifiable depuis le backoffice : la fiche est donc
// reconstruite à la demande, pas figée à la construction.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const produit = await lireProduit(slug);
  if (!produit) return { title: 'Article introuvable' };
  return { title: produit.nom, description: produit.accroche };
}

export default async function FicheProduit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const produit = await lireProduit(slug);
  if (!produit) notFound();

  const themes = produit.personnalisable ? await lireThemes() : [];
  const premiere = produit.formules[0]!;
  const moinsCher = Math.min(...produit.formules.map((f) => f.prixCentimes));

  return (
    <>
      <EnTeteBoutique actif="/savons" />

      <main
        id="contenu"
        className="mx-auto grid max-w-[1240px] items-start gap-16 px-6 py-16 lg:grid-cols-2"
      >
        <Galerie photos={produit.photos} nom={produit.nom} />

        <div>
          <p className="mb-5 font-mono text-[12.5px] text-taupe">
            {produit.type === 'vitrine' ? 'Sur mesure' : 'Fait main'} · Les savons
          </p>
          <h1 className="mb-4 font-serif text-[58px] tracking-[-0.035em]">{produit.nom}</h1>

          <p className="mb-2 font-mono text-[30px] tabulaire">
            <span className="text-[18px] text-taupe">à partir de </span>
            {formaterPrix(moinsCher)}
          </p>
          <p className="mb-8 font-mono text-[12.5px] text-taupe">TVA incluse</p>

          <p className="mb-8 text-[16.5px] text-taupe">{produit.description}</p>

          {produit.personnalisable ? (
            <ConfigurateurVitrine
              formules={produit.formules.map((f) => ({
                id: f.id,
                nom: f.nom,
                prixCentimes: f.prixCentimes,
              }))}
              themes={themes.map((t) => ({
                slug: t.slug,
                nom: t.nom,
                description: t.description,
                photo: t.photo,
              }))}
            />
          ) : (
            <AjoutPanier
              variantes={produit.formules.map((f) => ({
                id: f.id,
                nom: f.nom,
                prixCentimes: f.prixCentimes,
              }))}
              nomProduit={produit.nom}
              slug={produit.slug}
            />
          )}

          <div className="mt-10 border-t border-brume">
            {produit.inci && (
              <details open className="border-b border-brume">
                <summary className="flex cursor-pointer items-center justify-between py-5 text-[15.5px] font-semibold">
                  Composition
                  <span aria-hidden className="font-mono text-[18px] text-grenat">+</span>
                </summary>
                <div className="pb-5 text-[14px] leading-relaxed text-taupe">
                  <p className="font-mono text-[12.5px] text-foret">{produit.inci}</p>
                  <p className="mt-3">
                    La liste complète figure sur le sachet, comme l&rsquo;exige la
                    réglementation cosmétique.
                  </p>
                </div>
              </details>
            )}

            <details className="border-b border-brume">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-[15.5px] font-semibold">
                {produit.type === 'vitrine' ? 'Fabrication' : 'Utilisation et conservation'}
                <span aria-hidden className="font-mono text-[18px] text-grenat">+</span>
              </summary>
              <div className="pb-5 text-[14px] leading-relaxed text-taupe">
                {produit.type === 'vitrine'
                  ? "Chaque vitrine est montée à la commande : cadre peint, fond choisi, objets disposés un par un, et le prénom en lettres collées sur le dessus. Comptez environ une semaine avant expédition."
                  : "Rangez le pain hors de l’eau entre deux usages, sur un porte-savon qui draine. À utiliser de préférence dans les 12 mois après ouverture."}
              </div>
            </details>

            <details className="border-b border-brume">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-[15.5px] font-semibold">
                Livraison et retours
                <span aria-hidden className="font-mono text-[18px] text-grenat">+</span>
              </summary>
              <div className="pb-5 text-[14px] leading-relaxed text-taupe">
                Livraison offerte dès 39 €.{' '}
                {produit.type === 'vitrine'
                  ? "Une vitrine étant confectionnée à votre demande et portant un prénom, elle n’ouvre pas droit à rétractation — c’est prévu par la loi pour les biens personnalisés."
                  : "Retour accepté 14 jours si l’emballage n’est pas ouvert : un cosmétique descellé ne peut pas être repris pour des raisons d’hygiène."}
              </div>
            </details>
          </div>
        </div>
      </main>

      <PiedBoutique />
    </>
  );
}
