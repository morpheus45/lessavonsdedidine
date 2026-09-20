'use client';

import { useActionState, useState } from 'react';
import { enregistrerReglages, type EtatReglages } from './actions';
// Import de type uniquement : `reglages-boutique.ts` ouvre une connexion
// Prisma, et un import de valeur l'embarquerait dans le paquet du navigateur.
// La longueur maximale arrive donc par une propriété, pas par une constante
// importée — une seule source, côté serveur.
import type { ReglagesBoutique } from './reglages-boutique';

const ETIQUETTE = 'mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe';
const CHAMP = 'min-h-[46px] w-full rounded-s border border-brume-2 bg-nuage px-3 py-2.5 text-[14px]';
const INITIAL: EtatReglages = {};

/** 490 → « 4,90 » : la forme dans laquelle Didine saisit un montant. */
function enEuros(centimes: number): string {
  return (centimes / 100).toFixed(2).replace('.', ',');
}

export function FormulaireReglages({
  reglages,
  longueurMaxMessage,
}: {
  reglages: ReglagesBoutique;
  longueurMaxMessage: number;
}) {
  const [etat, action, enCours] = useActionState(enregistrerReglages, INITIAL);
  const [message, setMessage] = useState(reglages.messageAccueil);

  const restants = longueurMaxMessage - message.length;

  return (
    <form action={action} className="max-w-[680px]">
      {/* ── Livraison ──────────────────────────────────────────── */}
      <section className="mb-6 rounded-m border border-brume bg-neige p-6">
        <h2 className="mb-1 font-serif text-[24px]">Livraison</h2>
        <p className="mb-6 text-[13.5px] text-taupe">
          Ces deux montants décident du total payé par le client. Ils sont appliqués côté
          serveur au moment de créer la commande : un panier affiché dans le navigateur n&rsquo;a
          jamais le dernier mot.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="livraison" className={ETIQUETTE}>
              Frais de port (€)
            </label>
            <input
              id="livraison"
              name="livraison"
              required
              inputMode="decimal"
              autoComplete="off"
              defaultValue={enEuros(reglages.livraisonCentimes)}
              aria-describedby="livraison-aide"
              className={`${CHAMP} tabulaire font-mono`}
            />
            <span id="livraison-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              Ajoutés à chaque commande sous le seuil ci-contre. Zéro offre la livraison à tout
              le monde.
            </span>
          </div>

          <div>
            <label htmlFor="seuil" className={ETIQUETTE}>
              Livraison offerte dès (€)
            </label>
            <input
              id="seuil"
              name="seuil"
              required
              inputMode="decimal"
              autoComplete="off"
              defaultValue={enEuros(reglages.seuilLivraisonOfferteCentimes)}
              aria-describedby="seuil-aide"
              className={`${CHAMP} tabulaire font-mono`}
            />
            <span id="seuil-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              Montant du panier, hors frais de port, à partir duquel le port n&rsquo;est plus
              facturé.
            </span>
          </div>
        </div>
      </section>

      {/* ── Vitrines ───────────────────────────────────────────── */}
      <section className="mb-6 rounded-m border border-brume bg-neige p-6">
        <h2 className="mb-1 font-serif text-[24px]">Vitrines personnalisées</h2>
        <p className="mb-6 text-[13.5px] text-taupe">
          Une vitrine n&rsquo;est pas prise sur une série en stock : elle est fabriquée après la
          commande, avec le prénom et le thème choisis.
        </p>

        <div className="sm:max-w-[260px]">
          <label htmlFor="delaiVitrine" className={ETIQUETTE}>
            Délai de fabrication (jours)
          </label>
          <input
            id="delaiVitrine"
            name="delaiVitrine"
            type="number"
            min={0}
            max={120}
            step={1}
            required
            inputMode="numeric"
            defaultValue={reglages.delaiFabricationVitrineJours}
            aria-describedby="delai-aide"
            className={`${CHAMP} tabulaire font-mono`}
          />
          <span id="delai-aide" className="mt-1.5 block text-[12.5px] text-taupe">
            Annoncé au client avant qu&rsquo;il commande. Mieux vaut l&rsquo;allonger en période
            chargée que faire attendre sans prévenir.
          </span>
        </div>
      </section>

      {/* ── Bandeau d'accueil ──────────────────────────────────── */}
      <section className="mb-6 rounded-m border border-brume bg-neige p-6">
        <h2 className="mb-1 font-serif text-[24px]">Message d&rsquo;accueil</h2>
        <p className="mb-6 text-[13.5px] text-taupe">
          Une phrase affichée en haut de la boutique : congés, marché de Noël, nouveau parfum.
          Laissez le champ vide et aucun bandeau n&rsquo;apparaît.
        </p>

        <label htmlFor="messageAccueil" className={ETIQUETTE}>
          Phrase affichée (facultative)
        </label>
        <input
          id="messageAccueil"
          name="messageAccueil"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={longueurMaxMessage}
          autoComplete="off"
          aria-describedby="message-aide"
          className={CHAMP}
        />
        <span id="message-aide" className="mt-1.5 block text-[12.5px] text-taupe">
          {restants} caractère{restants > 1 ? 's' : ''} restant{restants > 1 ? 's' : ''} sur{' '}
          {longueurMaxMessage}. Au-delà, le bandeau passe sur deux lignes et repousse la boutique
          vers le bas.
        </span>

        {message.trim().length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe">
              Aperçu
            </p>
            {/* Rendu dans les couleurs du bandeau réel : juger la longueur
                d'une phrase sur un fond différent ne sert à rien. */}
            <p className="rounded-s bg-foret px-5 py-3 text-center text-[13.5px] text-nuage">
              {message.trim()}
            </p>
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={enCours}
        className="min-h-[50px] cursor-pointer rounded-s bg-grenat px-8 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {enCours ? 'Enregistrement…' : 'Enregistrer les réglages'}
      </button>

      <p aria-live="polite" className="mt-3 min-h-[24px] text-[14px]">
        {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
        {etat.succes && <span className="text-ok">{etat.succes}</span>}
      </p>
    </form>
  );
}
