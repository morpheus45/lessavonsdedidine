'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { formaterPrix } from '@/lib/argent';
import { lirePanier, viderPanier } from '@/lib/panier-client';
import {
  calculerPanier,
  articlesIncomplets,
  type PanierCalcule,
  type Tarif,
  type Reglages,
} from '@/lib/panier-calcul';

/**
 * Paiement PayPal, entièrement dans le navigateur.
 *
 * ⚠️  Aucune commande n'est enregistrée nulle part. Le site est statique : il
 * n'y a ni base de données, ni serveur pour recevoir la commande. Tout ce que
 * Didine reçoit, c'est le courriel de PayPal — et c'est de ce courriel seul
 * qu'elle tirera le détail de fabrication.
 *
 * D'où la `description` construite plus bas : elle porte le prénom et le
 * thème de chaque vitrine, parce que c'est la seule information qui lui
 * parviendra. Si elle perd ce courriel, la commande est perdue.
 *
 * ⚠️  Le montant vient du navigateur. Un acheteur qui modifie le JavaScript
 * de la page peut payer ce qu'il veut. La parade est humaine : Didine compare
 * le montant encaissé au contenu de la commande AVANT d'expédier.
 */
type Etat = 'chargement' | 'vide' | 'incomplet' | 'pret' | 'paye' | 'erreur';

type BoutonsPaypal = {
  Buttons: (options: unknown) => { render: (cible: HTMLElement) => void };
};

/** PayPal refuse une description au-delà de 127 caractères. */
const DESCRIPTION_MAX = 127;

export function Commande({
  tarifs,
  nomsDesThemes,
  reglages,
  clientId,
}: {
  tarifs: Tarif[];
  nomsDesThemes: Record<string, string>;
  reglages: Reglages;
  clientId: string;
}) {
  const [panier, setPanier] = useState<PanierCalcule | null>(null);
  const [incomplets, setIncomplets] = useState<string[]>([]);
  const [etat, setEtat] = useState<Etat>('chargement');
  const [erreur, setErreur] = useState<string | null>(null);
  const cible = useRef<HTMLDivElement>(null);
  const rendu = useRef(false);

  useEffect(() => {
    const articles = lirePanier();
    if (articles.length === 0) {
      setEtat('vide');
      return;
    }

    const manquants = articlesIncomplets(articles, tarifs);
    const calcule = calculerPanier(articles, tarifs, reglages, nomsDesThemes);
    setPanier(calcule);
    setIncomplets(manquants);

    // Une vitrine sans prénom ni thème n'est pas fabricable : on refuse le
    // paiement plutôt que d'encaisser une commande impossible à honorer.
    setEtat(manquants.length > 0 ? 'incomplet' : calcule.lignes.length === 0 ? 'vide' : 'pret');
  }, [tarifs, reglages, nomsDesThemes]);

  useEffect(() => {
    if (etat !== 'pret' || !panier || !clientId || rendu.current) return;

    const monter = () => {
      const paypal = (window as unknown as { paypal?: BoutonsPaypal }).paypal;
      if (!paypal || !cible.current) return;
      rendu.current = true;

      // Le bon de fabrication, condensé : c'est tout ce que Didine recevra.
      const description = panier.lignes
        .map((l) => `${l.quantite}x ${l.libelle}${l.detailPersonnalisation ? ` (${l.detailPersonnalisation})` : ''}`)
        .join(' ; ')
        .slice(0, DESCRIPTION_MAX);

      paypal
        .Buttons({
          createOrder: (_donnees: unknown, actions: {
            order: { create: (o: unknown) => Promise<string> };
          }) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description,
                  amount: {
                    currency_code: 'EUR',
                    value: (panier.totalCentimes / 100).toFixed(2),
                    breakdown: {
                      item_total: {
                        currency_code: 'EUR',
                        value: (panier.sousTotalCentimes / 100).toFixed(2),
                      },
                      shipping: {
                        currency_code: 'EUR',
                        value: (panier.livraisonCentimes / 100).toFixed(2),
                      },
                    },
                  },
                  items: panier.lignes.map((l) => ({
                    name: l.libelle.slice(0, 127),
                    quantity: String(l.quantite),
                    unit_amount: {
                      currency_code: 'EUR',
                      value: (l.prixUnitaireCentimes / 100).toFixed(2),
                    },
                  })),
                },
              ],
            }),
          onApprove: async (_donnees: unknown, actions: {
            order: { capture: () => Promise<unknown> };
          }) => {
            await actions.order.capture();
            viderPanier();
            setEtat('paye');
          },
          onError: () => {
            setErreur("Le paiement n'a pas abouti. Rien n'a été débité. Vous pouvez réessayer, ou contacter Didine.");
            setEtat('erreur');
          },
        })
        .render(cible.current);
    };

    if ((window as unknown as { paypal?: unknown }).paypal) {
      monter();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&locale=fr_FR`;
    script.onload = monter;
    script.onerror = () => {
      setErreur("PayPal n'a pas pu être chargé. Vérifiez votre connexion, ou contactez Didine.");
      setEtat('erreur');
    };
    document.body.appendChild(script);
  }, [etat, panier, clientId]);

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[760px] px-6 py-20">
        <h1 className="mb-10 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">
          Votre commande
        </h1>

        {etat === 'chargement' && (
          <p aria-live="polite" className="text-taupe">
            Chargement…
          </p>
        )}

        {etat === 'vide' && (
          <div className="rounded-l border border-brume bg-neige p-10">
            <p className="mb-6 text-[17px] text-taupe">Votre panier est vide.</p>
            <Link
              href="/savons"
              className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
            >
              Voir la gamme
            </Link>
          </div>
        )}

        {etat === 'incomplet' && (
          <div role="alert" className="rounded-l border border-attente-bg bg-attente-bg p-8">
            <p className="mb-2 text-[16px] font-semibold text-attente">
              Il manque le prénom ou le thème.
            </p>
            <p className="mb-6 text-[14.5px] text-attente">
              Une vitrine se fabrique autour d&rsquo;un prénom et d&rsquo;une scène&nbsp;: sans
              eux, elle n&rsquo;est pas réalisable. À compléter pour&nbsp;:{' '}
              {incomplets.join(', ')}.
            </p>
            <Link
              href="/savons/vitrine-personnalisee"
              className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
            >
              Compléter ma vitrine
            </Link>
          </div>
        )}

        {etat === 'paye' && (
          <div className="rounded-l border border-foret bg-neige p-10">
            <h2 className="mb-3 font-serif text-[32px] text-foret">Merci !</h2>
            <p className="mb-2 text-[16px]">Votre paiement est enregistré chez PayPal.</p>
            <p className="mb-8 text-[15px] text-taupe">
              PayPal vous envoie un reçu par courriel, et prévient Didine avec le détail de votre
              commande. Elle vous écrit dès qu&rsquo;elle prépare votre colis. Gardez ce reçu, il
              vous servira de preuve d&rsquo;achat.
            </p>
            <Link
              href="/savons"
              className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
            >
              Retour à la boutique
            </Link>
          </div>
        )}

        {(etat === 'pret' || etat === 'erreur') && panier && (
          <>
            <ul className="mb-6 border-y border-brume">
              {panier.lignes.map((l) => (
                <li key={l.id} className="flex flex-wrap justify-between gap-3 border-b border-brume py-3.5 last:border-0">
                  <span className="text-[15px]">
                    {l.quantite} × {l.libelle}
                    {l.detailPersonnalisation && (
                      <span className="ml-2 font-mono text-[12.5px] text-grenat">
                        {l.detailPersonnalisation}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[15px] tabulaire">
                    {formaterPrix(l.totalCentimes)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mb-8 space-y-2 text-[15px]">
              <div className="flex justify-between">
                <dt>Sous-total</dt>
                <dd className="font-mono tabulaire">{formaterPrix(panier.sousTotalCentimes)}</dd>
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
              <div className="flex justify-between border-t border-brume-2 pt-3 text-[20px] font-bold">
                <dt>Total</dt>
                <dd className="font-mono tabulaire">{formaterPrix(panier.totalCentimes)}</dd>
              </div>
            </dl>

            {clientId ? (
              <>
                <div ref={cible} />
                <p className="mt-6 text-[13px] text-taupe">
                  Votre adresse de livraison est celle enregistrée chez PayPal. Vous la vérifiez
                  et pouvez la changer avant de valider.
                </p>
              </>
            ) : (
              <div className="rounded-m border border-attente-bg bg-attente-bg p-6">
                <p className="mb-2 text-[15px] font-semibold text-attente">
                  Le paiement en ligne n&rsquo;est pas encore activé.
                </p>
                <p className="text-[14px] text-attente">
                  Notez votre sélection et contactez Didine pour convenir du règlement — elle
                  prépare votre commande à la main de toute façon.
                </p>
              </div>
            )}

            <p aria-live="polite" className="mt-4 min-h-[24px] text-[14px]">
              {erreur && <span className="text-alerte">{erreur}</span>}
            </p>
          </>
        )}
      </main>

      <PiedBoutique />
    </>
  );
}
