'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { formaterPrix } from '@/lib/argent';
import {
  lirePanier,
  changerQuantite,
  retirer,
  ligneId,
  surChangement,
  type ArticlePanier,
} from '@/lib/panier-client';

const SEUIL_LIVRAISON_OFFERTE = 3900;

type PanierServeur = {
  lignes: {
    varianteId: string;
    libelle: string;
    prixUnitaireCentimes: number;
    quantite: number;
    totalCentimes: number;
    prenom?: string | null;
    themeNom?: string | null;
  }[];
  sousTotalCentimes: number;
  livraisonCentimes: number;
  totalCentimes: number;
};

export default function PagePanier() {
  const [articles, setArticles] = useState<ArticlePanier[]>([]);
  const [serveur, setServeur] = useState<PanierServeur | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  // Le panier n'est connu qu'après hydratation : le serveur ne voit pas le
  // localStorage. On part donc d'un état de chargement explicite plutôt que
  // d'afficher « panier vide » puis de le corriger.
  const revaloriser = useCallback(async (liste: ArticlePanier[]) => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await fetch('/api/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignes: liste.map((a) => ({
            varianteId: a.varianteId,
            quantite: a.quantite,
            prenom: a.prenom,
            themeSlug: a.themeSlug,
          })),
        }),
      });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees.erreur ?? 'Le panier n’a pas pu être vérifié.');
        setServeur(null);
      } else {
        setServeur(donnees as PanierServeur);
      }
    } catch {
      setErreur('Impossible de joindre la boutique. Vérifiez votre connexion.');
      setServeur(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const rafraichir = () => {
      const liste = lirePanier();
      setArticles(liste);
      void revaloriser(liste);
    };
    rafraichir();
    return surChangement(rafraichir);
  }, [revaloriser]);

  const vide = !chargement && articles.length === 0;
  const manquePourOffrir = serveur ? SEUIL_LIVRAISON_OFFERTE - serveur.sousTotalCentimes : 0;

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[1000px] px-6 py-20">
        <h1 className="mb-12 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">Votre panier</h1>

        {chargement && (
          <p className="text-taupe" aria-live="polite">
            Vérification du panier…
          </p>
        )}

        {vide && (
          <div className="rounded-l border border-brume bg-neige p-10">
            <p className="mb-6 text-[17px] text-taupe">Votre panier est vide.</p>
            <Link
              href="/savons"
              className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
            >
              Voir les savons
            </Link>
          </div>
        )}

        {erreur && (
          <p
            role="alert"
            className="mb-8 rounded-s border border-alerte-bg bg-alerte-bg px-5 py-4 text-[14.5px] text-alerte"
          >
            {erreur}
          </p>
        )}

        {!chargement && articles.length > 0 && (
          <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
            <ul className="border-t border-brume">
              {articles.map((a, index) => {
                // Appariement par POSITION : le serveur renvoie les lignes dans
                // l'ordre reçu. Chercher par varianteId confondrait deux
                // vitrines de même format aux prénoms différents.
                const ligne = serveur?.lignes[index];
                const id = ligneId(a);
                return (
                  <li
                    key={id}
                    className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-brume py-6"
                  >
                    <div>
                      <p className="mb-1 text-[15.5px] font-semibold">{ligne?.libelle ?? a.libelle}</p>
                      {a.prenom && (
                        <p className="mb-1 font-mono text-[12.5px] text-grenat">
                          Prénom « {a.prenom} »
                        </p>
                      )}
                      <p className="font-mono text-[12.5px] text-taupe tabulaire">
                        {formaterPrix(ligne?.prixUnitaireCentimes ?? a.prixCentimes)} l&rsquo;unité
                      </p>
                      <button
                        type="button"
                        onClick={() => retirer(id)}
                        className="mt-2 border-b border-brume-2 text-[13px] text-taupe hover:border-alerte hover:text-alerte"
                      >
                        Retirer
                      </button>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="flex items-center rounded-s border border-brume-2 bg-neige">
                        <button
                          type="button"
                          onClick={() => changerQuantite(id, a.quantite - 1)}
                          aria-label={`Diminuer la quantité de ${a.libelle}`}
                          className="min-h-[44px] px-3.5 text-[17px] hover:text-grenat"
                        >
                          −
                        </button>
                        <span className="min-w-[44px] border-x border-brume text-center font-mono leading-[44px] tabulaire">
                          {a.quantite}
                        </span>
                        <button
                          type="button"
                          onClick={() => changerQuantite(id, a.quantite + 1)}
                          aria-label={`Augmenter la quantité de ${a.libelle}`}
                          className="min-h-[44px] px-3.5 text-[17px] hover:text-grenat"
                        >
                          +
                        </button>
                      </div>
                      <p className="min-w-[90px] text-right font-mono text-[16px] tabulaire">
                        {formaterPrix(ligne?.totalCentimes ?? a.prixCentimes * a.quantite)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit rounded-l border border-brume bg-neige p-7">
              <h2 className="mb-6 font-serif text-[26px]">Récapitulatif</h2>

              {serveur ? (
                <>
                  <dl className="space-y-3 text-[14.5px]">
                    <div className="flex justify-between">
                      <dt>Sous-total</dt>
                      <dd className="font-mono tabulaire">{formaterPrix(serveur.sousTotalCentimes)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Livraison</dt>
                      <dd className="font-mono tabulaire">
                        {serveur.livraisonCentimes === 0 ? (
                          <span className="font-semibold text-foret">Offerte</span>
                        ) : (
                          formaterPrix(serveur.livraisonCentimes)
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-brume-2 pt-4 text-[19px] font-bold">
                      <dt>Total</dt>
                      <dd className="font-mono tabulaire">{formaterPrix(serveur.totalCentimes)}</dd>
                    </div>
                  </dl>

                  <p className="my-5 text-[13px] text-taupe">
                    {manquePourOffrir > 0
                      ? `Plus que ${formaterPrix(manquePourOffrir)} pour la livraison offerte.`
                      : `Seuil des ${formaterPrix(SEUIL_LIVRAISON_OFFERTE)} franchi — livraison offerte.`}
                  </p>

                  <Link
                    href="/commande"
                    className="block rounded-s bg-grenat py-3.5 text-center text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
                  >
                    Commander
                  </Link>
                </>
              ) : (
                <p className="text-[14px] text-taupe">
                  Le récapitulatif s&rsquo;affichera dès que le panier aura été vérifié.
                </p>
              )}

              <p className="mt-5 text-[12.5px] leading-relaxed text-taupe">
                Les montants sont calculés par la boutique, pas par votre navigateur : le total
                affiché est celui qui sera facturé.
              </p>
            </aside>
          </div>
        )}
      </main>

      <PiedBoutique />
    </>
  );
}
