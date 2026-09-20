'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { formaterPrix } from '@/lib/argent';
import { lirePanier, changerQuantite, retirer, surChangement } from '@/lib/panier-client';
import {
  calculerPanier,
  type PanierCalcule,
  type Tarif,
  type Reglages,
} from '@/lib/panier-calcul';

/**
 * Le panier.
 *
 * Les articles vivent dans le navigateur, et les montants s'y calculent
 * aussi : sur GitHub Pages il n'y a pas de serveur pour les recalculer. Les
 * tarifs affichés sont ceux figés à la dernière construction du site.
 *
 * Conséquence, énoncée sans détour : un acheteur qui modifie le JavaScript de
 * la page peut payer un montant de son choix. Didine doit donc vérifier le
 * montant reçu sur son courriel PayPal avant d'expédier. Voir l'avertissement
 * en tête de `src/lib/panier-calcul.ts`.
 */
export function Panier({
  tarifs,
  nomsDesThemes,
  reglages,
}: {
  tarifs: Tarif[];
  nomsDesThemes: Record<string, string>;
  reglages: Reglages;
}) {
  const [panier, setPanier] = useState<PanierCalcule | null>(null);
  const [charge, setCharge] = useState(false);

  // Le panier n'est connu qu'après hydratation : on part d'un état « pas
  // encore chargé » explicite plutôt que d'afficher « panier vide » puis de
  // se corriger sous les yeux de la visiteuse.
  useEffect(() => {
    const rafraichir = () => {
      setPanier(calculerPanier(lirePanier(), tarifs, reglages, nomsDesThemes));
      setCharge(true);
    };
    rafraichir();
    return surChangement(rafraichir);
  }, [tarifs, reglages, nomsDesThemes]);

  const vide = !panier || panier.lignes.length === 0;

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[1000px] px-6 py-20">
        <h1 className="mb-12 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">
          Votre panier
        </h1>

        {panier && panier.obsoletes.length > 0 && (
          <p
            role="alert"
            className="mb-8 rounded-s border border-attente-bg bg-attente-bg px-5 py-4 text-[14.5px] text-attente"
          >
            Ces articles ne sont plus au catalogue et ont été retirés du total&nbsp;:{' '}
            {panier.obsoletes.join(', ')}.
          </p>
        )}

        {!charge ? (
          <p aria-live="polite" className="text-taupe">
            Chargement…
          </p>
        ) : vide ? (
          <div className="rounded-l border border-brume bg-neige p-10">
            <p className="mb-6 text-[17px] text-taupe">Votre panier est vide.</p>
            <Link
              href="/savons"
              className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
            >
              Voir la gamme
            </Link>
          </div>
        ) : (
          panier && (
            <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
              <ul className="border-t border-brume">
                {panier.lignes.map((l) => (
                  <li
                    key={l.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-brume py-6"
                  >
                    <div>
                      <p className="mb-1 text-[15.5px] font-semibold">{l.libelle}</p>
                      {l.detailPersonnalisation && (
                        <p className="mb-1 font-mono text-[12.5px] text-grenat">
                          {l.detailPersonnalisation}
                        </p>
                      )}
                      <p className="font-mono text-[12.5px] text-taupe tabulaire">
                        {formaterPrix(l.prixUnitaireCentimes)} l&rsquo;unité
                      </p>
                      <button
                        type="button"
                        onClick={() => retirer(l.id)}
                        className="mt-2 cursor-pointer border-b border-brume-2 text-[13px] text-taupe hover:border-alerte hover:text-alerte"
                      >
                        Retirer
                      </button>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="flex items-center rounded-s border border-brume-2 bg-neige">
                        <button
                          type="button"
                          onClick={() => changerQuantite(l.id, l.quantite - 1)}
                          aria-label={`Diminuer la quantité de ${l.libelle}`}
                          className="min-h-[44px] cursor-pointer px-3.5 text-[17px] hover:text-grenat"
                        >
                          −
                        </button>
                        <span className="min-w-[44px] border-x border-brume text-center font-mono leading-[44px] tabulaire">
                          {l.quantite}
                        </span>
                        <button
                          type="button"
                          onClick={() => changerQuantite(l.id, l.quantite + 1)}
                          aria-label={`Augmenter la quantité de ${l.libelle}`}
                          className="min-h-[44px] cursor-pointer px-3.5 text-[17px] hover:text-grenat"
                        >
                          +
                        </button>
                      </div>
                      <p className="min-w-[90px] text-right font-mono text-[16px] tabulaire">
                        {formaterPrix(l.totalCentimes)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <aside className="h-fit rounded-l border border-brume bg-neige p-7">
                <h2 className="mb-6 font-serif text-[26px]">Récapitulatif</h2>

                <dl className="space-y-3 text-[14.5px]">
                  <div className="flex justify-between">
                    <dt>Sous-total</dt>
                    <dd className="font-mono tabulaire">
                      {formaterPrix(panier.sousTotalCentimes)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Livraison</dt>
                    <dd className="font-mono tabulaire">
                      {panier.livraisonCentimes === 0 ? (
                        <span className="font-semibold text-foret">Offerte</span>
                      ) : (
                        formaterPrix(panier.livraisonCentimes)
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-brume-2 pt-4 text-[19px] font-bold">
                    <dt>Total</dt>
                    <dd className="font-mono tabulaire">{formaterPrix(panier.totalCentimes)}</dd>
                  </div>
                </dl>

                <p className="my-5 text-[13px] text-taupe">
                  {panier.manquePourLivraisonOfferte > 0
                    ? `Plus que ${formaterPrix(panier.manquePourLivraisonOfferte)} pour la livraison offerte.`
                    : `Seuil des ${formaterPrix(reglages.seuilLivraisonOfferteCentimes)} franchi — livraison offerte.`}
                </p>

                <Link
                  href="/commande"
                  className="block cursor-pointer rounded-s bg-grenat py-3.5 text-center text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
                >
                  Commander
                </Link>
              </aside>
            </div>
          )
        )}
      </main>

      <PiedBoutique />
    </>
  );
}
