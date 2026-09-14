'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formaterPrix } from '@/lib/argent';
import { lirePanier, viderPanier, type ArticlePanier } from '@/lib/panier-client';

/**
 * Passage de commande.
 *
 * L'ordre des opérations est celui qui protège l'acheteuse comme la boutique :
 *
 *   1. la commande est enregistrée chez nous, avec ses montants recalculés
 *      en base — rien n'est accepté depuis le navigateur ;
 *   2. PayPal est ouvert sur ces montants-là ;
 *   3. l'encaissement est déclenché et vérifié côté serveur.
 *
 * Si l'acheteuse ferme la fenêtre entre 1 et 3, la commande reste « en
 * attente de paiement » dans le backoffice. Elle n'est pas perdue.
 */
type Etape = 'coordonnees' | 'paiement' | 'payee';

type Totaux = { sousTotalCentimes: number; livraisonCentimes: number; totalCentimes: number };

type PaypalBoutons = {
  Buttons: (options: unknown) => { render: (cible: HTMLElement) => void };
};

export function Commande({ clientId }: { clientId: string | null }) {
  const [articles, setArticles] = useState<ArticlePanier[]>([]);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [etape, setEtape] = useState<Etape>('coordonnees');
  const [reference, setReference] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const cibleBoutons = useRef<HTMLDivElement>(null);
  const boutonsRendus = useRef(false);

  // Totaux affichés : ceux du serveur, pas ceux du navigateur.
  useEffect(() => {
    const liste = lirePanier();
    setArticles(liste);
    if (liste.length === 0) return;

    void fetch('/api/panier', {
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
    })
      .then((r) => r.json())
      .then((c) => setTotaux(c))
      .catch(() => setErreur('Impossible de joindre la boutique.'));
  }, []);

  async function enregistrerCommande(donnees: FormData) {
    setErreur(null);
    setEnvoi(true);
    try {
      const reponse = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignes: articles.map((a) => ({
            varianteId: a.varianteId,
            quantite: a.quantite,
            prenom: a.prenom,
            themeSlug: a.themeSlug,
          })),
          email: donnees.get('email'),
          nom: donnees.get('nom'),
          adresse: donnees.get('adresse'),
          codePostal: donnees.get('codePostal'),
          ville: donnees.get('ville'),
          pays: 'FR',
          telephone: donnees.get('telephone') || null,
        }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) {
        setErreur(corps.erreur ?? 'La commande n’a pas pu être enregistrée.');
        return;
      }
      setReference(corps.reference);
      setEtape('paiement');
    } catch {
      setErreur('Impossible de joindre la boutique.');
    } finally {
      setEnvoi(false);
    }
  }

  // Boutons PayPal : chargés seulement une fois la commande enregistrée.
  useEffect(() => {
    if (etape !== 'paiement' || !clientId || !reference || boutonsRendus.current) return;

    const monter = () => {
      const paypal = (window as unknown as { paypal?: PaypalBoutons }).paypal;
      if (!paypal || !cibleBoutons.current) return;
      boutonsRendus.current = true;

      paypal
        .Buttons({
          createOrder: async () => {
            const r = await fetch('/api/paiement/creer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference }),
            });
            const c = await r.json();
            if (!r.ok) throw new Error(c.erreur ?? 'Paiement indisponible.');
            return c.orderId;
          },
          onApprove: async (donnees: { orderID: string }) => {
            const r = await fetch('/api/paiement/capturer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: donnees.orderID }),
            });
            const c = await r.json();
            if (!r.ok) {
              setErreur(c.erreur ?? 'L’encaissement a échoué.');
              return;
            }
            viderPanier();
            setEtape('payee');
          },
          onError: () => setErreur('Le paiement n’a pas abouti. Rien n’a été débité.'),
        })
        .render(cibleBoutons.current);
    };

    if ((window as unknown as { paypal?: unknown }).paypal) {
      monter();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&locale=fr_FR`;
    script.onload = monter;
    script.onerror = () => setErreur('PayPal n’a pas pu être chargé.');
    document.body.appendChild(script);
  }, [etape, clientId, reference]);

  if (etape === 'payee') {
    return (
      <div className="rounded-l border border-foret bg-neige p-10">
        <h2 className="mb-3 font-serif text-[32px] text-foret">Merci !</h2>
        <p className="mb-2 text-[16px]">
          Votre commande <strong className="font-mono">{reference}</strong> est payée.
        </p>
        <p className="mb-8 text-[15px] text-taupe">
          PayPal vous envoie un reçu par courriel. Didine reçoit votre commande avec le détail de
          fabrication et vous écrit dès qu&rsquo;elle part.
        </p>
        <Link
          href="/savons"
          className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-l border border-brume bg-neige p-10">
        <p className="mb-6 text-[17px] text-taupe">Votre panier est vide.</p>
        <Link
          href="/savons"
          className="inline-block rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage"
        >
          Voir la gamme
        </Link>
      </div>
    );
  }

  const etiquette = 'mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe';
  const champ =
    'w-full min-h-[48px] rounded-s border border-brume-2 bg-neige px-3.5 text-[15px]';

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_340px]">
      <div>
        {etape === 'coordonnees' ? (
          <form action={enregistrerCommande}>
            <h2 className="mb-6 font-serif text-[26px]">Livraison</h2>

            <div className="mb-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nom" className={etiquette}>
                  Nom et prénom
                </label>
                <input id="nom" name="nom" required autoComplete="name" className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className={etiquette}>
                  Adresse électronique
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-describedby="aide-email"
                  className={champ}
                />
                <p id="aide-email" className="mt-1.5 text-[12.5px] text-taupe">
                  Pour le suivi de votre commande, rien d&rsquo;autre.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="adresse" className={etiquette}>
                  Adresse
                </label>
                <input
                  id="adresse"
                  name="adresse"
                  required
                  autoComplete="street-address"
                  className={champ}
                />
              </div>
              <div>
                <label htmlFor="codePostal" className={etiquette}>
                  Code postal
                </label>
                <input
                  id="codePostal"
                  name="codePostal"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={champ}
                />
              </div>
              <div>
                <label htmlFor="ville" className={etiquette}>
                  Ville
                </label>
                <input
                  id="ville"
                  name="ville"
                  required
                  autoComplete="address-level2"
                  className={champ}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="telephone" className={etiquette}>
                  Téléphone (facultatif)
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  className={champ}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={envoi}
              className="min-h-[52px] w-full cursor-pointer rounded-s bg-grenat px-6 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {envoi ? 'Enregistrement…' : 'Continuer vers le paiement'}
            </button>
          </form>
        ) : (
          <div>
            <h2 className="mb-2 font-serif text-[26px]">Paiement</h2>
            <p className="mb-6 text-[14.5px] text-taupe">
              Commande <strong className="font-mono">{reference}</strong> enregistrée. Elle est
              conservée même si vous fermez cette page.
            </p>

            {clientId ? (
              <div ref={cibleBoutons} />
            ) : (
              <div className="rounded-m border border-attente-bg bg-attente-bg p-6">
                <p className="mb-2 text-[15px] font-semibold text-attente">
                  Le paiement en ligne n&rsquo;est pas encore activé.
                </p>
                <p className="text-[14px] text-attente">
                  Votre commande est bien enregistrée sous la référence{' '}
                  <strong className="font-mono">{reference}</strong>. Contactez Didine pour
                  convenir du règlement — elle a tout le détail de votre commande.
                </p>
              </div>
            )}
          </div>
        )}

        <p aria-live="polite" className="mt-4 min-h-[24px] text-[14px]">
          {erreur && <span className="text-alerte">{erreur}</span>}
        </p>
      </div>

      <aside className="h-fit rounded-l border border-brume bg-neige p-7">
        <h2 className="mb-6 font-serif text-[24px]">Votre commande</h2>
        {totaux ? (
          <dl className="space-y-3 text-[14.5px]">
            <div className="flex justify-between">
              <dt>Sous-total</dt>
              <dd className="font-mono tabulaire">{formaterPrix(totaux.sousTotalCentimes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd className="font-mono tabulaire">
                {totaux.livraisonCentimes === 0 ? (
                  <span className="font-semibold text-foret">Offerte</span>
                ) : (
                  formaterPrix(totaux.livraisonCentimes)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-brume-2 pt-4 text-[19px] font-bold">
              <dt>Total</dt>
              <dd className="font-mono tabulaire">{formaterPrix(totaux.totalCentimes)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-taupe">Calcul…</p>
        )}
        <p className="mt-5 text-[13px] text-taupe">
          Montants calculés par la boutique, pas par votre navigateur.
        </p>
      </aside>
    </div>
  );
}
