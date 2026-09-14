'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { formaterPrix } from '@/lib/argent';
import { lirePanier, viderPanier, surChangement, type ArticlePanier } from '@/lib/panier-client';
import { calculerPanier, articlesIncomplets, type PanierCalcule } from '@/lib/panier-calcul';

/**
 * Paiement PayPal sans serveur.
 *
 * L'identifiant client PayPal est PUBLIC par conception : il est visible dans
 * le code de n'importe quelle boutique. Aucune clé secrète n'intervient ici,
 * et c'est cohérent — sans serveur, il n'y aurait nulle part où la garder.
 *
 * ⚠️  Le montant envoyé à PayPal est calculé dans le navigateur. Voir
 *     l'avertissement détaillé dans `lib/panier-calcul.ts`. La parade est que
 *     Didine vérifie le montant reçu sur son relevé PayPal avant d'expédier.
 *
 * Comme aucune commande n'est enregistrée côté boutique, tout ce dont Didine
 * a besoin pour fabriquer — prénom, thème, formule — est inscrit dans la
 * commande PayPal, et lui parvient donc par sa notification de paiement.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => {
        render: (cible: HTMLElement) => Promise<void>;
        close?: () => void;
      };
    };
  }
}

type Etat = 'chargement' | 'vide' | 'incomplet' | 'pret' | 'paye' | 'erreur';

export default function PageCommande() {
  const [articles, setArticles] = useState<ArticlePanier[]>([]);
  const [panier, setPanier] = useState<PanierCalcule | null>(null);
  const [etat, setEtat] = useState<Etat>('chargement');
  const [manques, setManques] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const boutons = useRef<HTMLDivElement>(null);
  const rendu = useRef(false);

  useEffect(() => {
    const rafraichir = () => {
      const liste = lirePanier();
      const calcul = calculerPanier(liste);
      const incomplets = articlesIncomplets(liste);
      setArticles(liste);
      setPanier(calcul);
      setManques(incomplets);
      setEtat(
        calcul.lignes.length === 0 ? 'vide' : incomplets.length > 0 ? 'incomplet' : 'pret',
      );
    };
    rafraichir();
    return surChangement(rafraichir);
  }, []);

  /** Description envoyée à PayPal — c'est le bon de fabrication de Didine. */
  const decrire = useCallback((p: PanierCalcule) => {
    return p.lignes
      .map((l) => {
        const perso = l.detailPersonnalisation ? ` (${l.detailPersonnalisation})` : '';
        return `${l.quantite}× ${l.libelle}${perso}`;
      })
      .join(' | ');
  }, []);

  useEffect(() => {
    if (etat !== 'pret' || !panier || !CLIENT_ID || rendu.current) return;

    let annule = false;

    const monter = () => {
      if (annule || !window.paypal || !boutons.current || rendu.current) return;
      rendu.current = true;
      boutons.current.innerHTML = '';

      window.paypal
        .Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 48 },

          createOrder: (_donnees: unknown, actions: never) => {
            const total = (panier.totalCentimes / 100).toFixed(2);
            const articlesTotal = (panier.sousTotalCentimes / 100).toFixed(2);
            const port = (panier.livraisonCentimes / 100).toFixed(2);

            return (actions as unknown as {
              order: { create: (o: Record<string, unknown>) => Promise<string> };
            }).order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  // Tronqué à 127 caractères : limite imposée par PayPal.
                  description: decrire(panier).slice(0, 127),
                  amount: {
                    currency_code: 'EUR',
                    value: total,
                    breakdown: {
                      item_total: { currency_code: 'EUR', value: articlesTotal },
                      shipping: { currency_code: 'EUR', value: port },
                    },
                  },
                  items: panier.lignes.map((l) => ({
                    name: l.libelle.slice(0, 127),
                    description: (l.detailPersonnalisation ?? '').slice(0, 127) || undefined,
                    quantity: String(l.quantite),
                    unit_amount: {
                      currency_code: 'EUR',
                      value: (l.prixUnitaireCentimes / 100).toFixed(2),
                    },
                  })),
                },
              ],
            });
          },

          onApprove: async (_donnees: unknown, actions: never) => {
            const detail = await (actions as unknown as {
              order: { capture: () => Promise<{ id?: string }> };
            }).order.capture();
            if (annule) return;
            setReference(detail?.id ?? null);
            setEtat('paye');
            viderPanier();
          },

          onError: () => {
            if (annule) return;
            setMessage(
              "Le paiement n'a pas abouti. Rien n'a été débité. Vous pouvez réessayer, ou contacter Didine.",
            );
            setEtat('erreur');
          },

          onCancel: () => {
            if (annule) return;
            setMessage('Paiement annulé. Votre panier est conservé.');
          },
        })
        .render(boutons.current)
        .catch(() => {
          if (!annule) {
            setMessage("Le module de paiement n'a pas pu s'afficher.");
            setEtat('erreur');
          }
        });
    };

    if (window.paypal) {
      monter();
    } else {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=EUR&locale=fr_FR`;
      script.onload = monter;
      script.onerror = () => {
        if (!annule) {
          setMessage('Impossible de joindre PayPal. Vérifiez votre connexion.');
          setEtat('erreur');
        }
      };
      document.body.appendChild(script);
    }

    return () => {
      annule = true;
    };
  }, [etat, panier, decrire]);

  // ── Paiement réussi ────────────────────────────────────────────────
  if (etat === 'paye') {
    return (
      <>
        <EnTeteBoutique />
        <main id="contenu" className="mx-auto max-w-[760px] px-6 py-24">
          <p className="eyebrow mb-6">Paiement reçu</p>
          <h1 className="mb-6 font-serif text-[clamp(36px,6vw,58px)] tracking-[-0.03em]">
            Merci, votre commande est passée
          </h1>
          {reference && (
            <p className="mb-6 font-mono text-[13px] text-taupe">
              Référence PayPal : {reference}
            </p>
          )}
          <p className="mb-8 max-w-[60ch] text-[16.5px] text-taupe">
            PayPal vous envoie un reçu par courriel, et Didine reçoit votre commande avec le
            détail de ce qu&rsquo;il faut fabriquer. Elle vous recontactera pour la livraison.
          </p>
          <Link
            href="/savons"
            className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
          >
            Retour à la boutique
          </Link>
        </main>
        <PiedBoutique />
      </>
    );
  }

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[1000px] px-6 py-20">
        <h1 className="mb-12 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">
          Commande
        </h1>

        {etat === 'chargement' && (
          <p aria-live="polite" className="text-taupe">
            Chargement du panier…
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

        {panier && panier.lignes.length > 0 && (
          <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
            <div>
              {/* Une vitrine sans prénom ni thème n'est pas fabricable : on
                  bloque le paiement plutôt que d'encaisser l'inhonorable. */}
              {manques.length > 0 && (
                <div
                  role="alert"
                  className="mb-8 rounded-m border border-attente-bg bg-attente-bg px-5 py-4"
                >
                  <p className="mb-1.5 text-[14.5px] font-semibold text-attente">
                    Une personnalisation manque
                  </p>
                  <p className="text-[13.5px] text-attente">
                    {manques.join(', ')} — il faut choisir un thème et indiquer un prénom.{' '}
                    <Link href="/savons/vitrine-personnalisee" className="underline">
                      Compléter la vitrine
                    </Link>
                  </p>
                </div>
              )}

              {!CLIENT_ID ? (
                <div className="rounded-m border border-attente-bg bg-attente-bg px-6 py-5">
                  <p className="mb-2 text-[15px] font-semibold text-attente">
                    Le paiement en ligne n&rsquo;est pas encore actif
                  </p>
                  <p className="max-w-[60ch] text-[14.5px] text-attente">
                    Le compte PayPal de la savonnerie n&rsquo;est pas encore relié. Notez votre
                    sélection et contactez Didine pour convenir du règlement — elle prépare
                    votre commande dès l&rsquo;accord.
                  </p>
                </div>
              ) : manques.length === 0 ? (
                <>
                  <h2 className="mb-2 font-serif text-[28px]">Régler la commande</h2>
                  <p className="mb-6 max-w-[56ch] text-[14.5px] text-taupe">
                    Par PayPal, ou par carte bancaire sans compte PayPal. L&rsquo;adresse de
                    livraison est demandée par PayPal pendant le paiement.
                  </p>
                  <div ref={boutons} className="max-w-[420px]" />
                </>
              ) : null}

              {message && (
                <p
                  aria-live="polite"
                  className="mt-6 rounded-s border border-brume bg-neige px-5 py-4 text-[14.5px] text-taupe"
                >
                  {message}
                </p>
              )}

              <p className="mt-8 text-[12.5px] text-taupe">
                Paiement traité par PayPal. Aucune donnée de carte ne transite par ce site ni
                n&rsquo;y est conservée. En réglant, vous acceptez les{' '}
                <Link href="/cgv" className="border-b border-grenat text-grenat">
                  conditions générales de vente
                </Link>
                .
              </p>
            </div>

            <aside className="h-fit rounded-l border border-brume bg-neige p-7">
              <h2 className="mb-6 font-serif text-[26px]">Votre commande</h2>

              <ul className="mb-6 space-y-3 border-b border-brume pb-6 text-[14px]">
                {panier.lignes.map((l) => (
                  <li key={l.id}>
                    <span className="flex justify-between gap-4">
                      <span>
                        {l.libelle}
                        <span className="text-taupe"> × {l.quantite}</span>
                      </span>
                      <span className="font-mono whitespace-nowrap tabulaire">
                        {formaterPrix(l.totalCentimes)}
                      </span>
                    </span>
                    {l.detailPersonnalisation && (
                      <span className="mt-0.5 block font-mono text-[12px] text-grenat">
                        {l.detailPersonnalisation}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <dl className="space-y-3 text-[14.5px]">
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
                <div className="flex justify-between border-t border-brume-2 pt-4 text-[19px] font-bold">
                  <dt>À régler</dt>
                  <dd className="font-mono tabulaire">{formaterPrix(panier.totalCentimes)}</dd>
                </div>
              </dl>

              <Link
                href="/panier"
                className="mt-6 block border-b border-brume-2 pb-0.5 text-center text-[13.5px] text-taupe hover:border-graphite hover:text-graphite"
              >
                Modifier le panier
              </Link>
            </aside>
          </div>
        )}
      </main>

      <PiedBoutique />
    </>
  );
}
