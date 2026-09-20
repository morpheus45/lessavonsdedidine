'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formaterPrix, formaterDate } from '@/lib/argent';

/**
 * Suivi d'une commande.
 *
 * Le formulaire demande deux informations parce que la référence seule se
 * devine. C'est la route /api/suivi qui tranche, et elle répond la même
 * chose qu'on se trompe de référence ou d'adresse : rien ici ne cherche à
 * deviner laquelle des deux est fausse — ce serait rendre au visiteur
 * l'information que le serveur refuse justement de donner.
 */

type LigneSuivie = { libelle: string; quantite: number };

type Suivi = {
  reference: string;
  statut: string;
  creeeLe: string;
  payeeLe: string | null;
  expedieeLe: string | null;
  lignes: LigneSuivie[];
  totalCentimes: number;
};

/** Le chemin normal d'une commande, dans l'ordre. */
const ETAPES = [
  {
    statut: 'en_attente_paiement',
    libelle: 'En attente de paiement',
    detail: 'La commande est enregistrée, le règlement n’est pas encore arrivé.',
  },
  {
    statut: 'payee',
    libelle: 'Payée',
    detail: 'Le règlement est arrivé. Didine a le détail de fabrication.',
  },
  {
    statut: 'preparee',
    libelle: 'Préparée',
    detail: 'Les pièces sont faites, étiquetées et emballées.',
  },
  { statut: 'expediee', libelle: 'Expédiée', detail: 'Le colis est parti.' },
  { statut: 'livree', libelle: 'Livrée', detail: 'Le colis est arrivé.' },
] as const;

/**
 * Les états qui sortent du chemin normal. Les poser sur la frise laisserait
 * croire qu'une commande annulée progresse encore.
 */
const HORS_FRISE: Record<string, { libelle: string; detail: string }> = {
  echouee: {
    libelle: 'Paiement non abouti',
    detail: 'Le règlement n’est pas passé et rien n’a été débité. La commande reste en attente.',
  },
  remboursement_demande: {
    libelle: 'Remboursement demandé',
    detail: 'La demande est enregistrée. Didine revient vers vous.',
  },
  remboursee: {
    libelle: 'Remboursée',
    detail: 'Le montant a été renvoyé sur le moyen de paiement utilisé.',
  },
  annulee: { libelle: 'Annulée', detail: 'Cette commande ne sera pas fabriquée.' },
};

function libelleDe(statut: string): string {
  return (
    ETAPES.find((e) => e.statut === statut)?.libelle ?? HORS_FRISE[statut]?.libelle ?? 'En cours'
  );
}

const ETIQUETTE = 'mb-2 block font-mono text-[12px] uppercase tracking-[0.16em] text-taupe';
const CHAMP = 'min-h-[48px] w-full rounded-s border border-brume-2 bg-neige px-3.5 text-[15px]';

export function Formulaire() {
  const [suivi, setSuivi] = useState<Suivi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState(false);
  // React vide les champs non contrôlés dès que l'action se termine. On
  // garde la saisie pour la réafficher : après un essai infructueux, il
  // faut pouvoir corriger un caractère, pas tout retaper.
  const [saisie, setSaisie] = useState({ reference: '', email: '' });

  async function chercher(donnees: FormData) {
    setErreur(null);
    setSuivi(null);
    setRecherche(true);
    setSaisie({
      reference: String(donnees.get('reference') ?? ''),
      email: String(donnees.get('email') ?? ''),
    });
    try {
      const reponse = await fetch('/api/suivi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: donnees.get('reference'),
          email: donnees.get('email'),
        }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) {
        setErreur(corps.erreur ?? 'La commande n’a pas pu être retrouvée.');
        return;
      }
      setSuivi(corps as Suivi);
    } catch {
      setErreur('Impossible de joindre la boutique. Vérifiez votre connexion.');
    } finally {
      setRecherche(false);
    }
  }

  return (
    <div>
      <form action={chercher} className="max-w-[620px]">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="reference" className={ETIQUETTE}>
              Référence de commande
            </label>
            <input
              id="reference"
              name="reference"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={saisie.reference}
              aria-describedby="aide-reference"
              className={`${CHAMP} font-mono uppercase tabulaire`}
            />
            <p id="aide-reference" className="mt-1.5 text-[12.5px] text-taupe">
              De la forme LD-0412, affichée à la fin de votre commande.
            </p>
          </div>

          <div>
            <label htmlFor="email" className={ETIQUETTE}>
              Adresse électronique
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={saisie.email}
              aria-describedby="aide-email"
              className={CHAMP}
            />
            <p id="aide-email" className="mt-1.5 text-[12.5px] text-taupe">
              Celle que vous avez indiquée en commandant.
            </p>
          </div>
        </div>

        {/* Jamais désactivé : un bouton grisé ne dit pas ce qui se passe.
            Il change de libellé, ce qui informe sans bloquer. */}
        <button
          type="submit"
          className="mt-7 min-h-[52px] w-full cursor-pointer rounded-s bg-grenat px-8 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 sm:w-auto"
        >
          {recherche ? 'Recherche…' : 'Voir ma commande'}
        </button>
      </form>

      <p aria-live="polite" className="mt-5 min-h-[24px] text-[14.5px]">
        {erreur && <span className="text-alerte">{erreur}</span>}
        {suivi && (
          <span className="text-foret">
            Commande {suivi.reference} retrouvée — {libelleDe(suivi.statut).toLowerCase()}.
          </span>
        )}
      </p>

      {erreur && (
        <p className="max-w-[60ch] text-[14px] text-taupe">
          Les deux informations doivent correspondre à la même commande. Si le doute persiste,{' '}
          <Link href="/contact" className="text-grenat underline underline-offset-4">
            écrivez à Didine
          </Link>
          &nbsp;: elle retrouvera votre commande.
        </p>
      )}

      {suivi && <Resultat suivi={suivi} />}
    </div>
  );
}

function Resultat({ suivi }: { suivi: Suivi }) {
  const rang = ETAPES.findIndex((e) => e.statut === suivi.statut);
  const horsFrise = HORS_FRISE[suivi.statut];

  return (
    <section
      aria-labelledby="titre-resultat"
      className="mt-10 rounded-l border border-brume bg-neige p-7 sm:p-10"
    >
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-brume pb-6">
        <h2 id="titre-resultat" className="font-mono text-[22px] tracking-[0.02em] tabulaire">
          {suivi.reference}
        </h2>
        <p className="text-[14.5px] text-taupe">
          Commandée le{' '}
          <span className="font-mono tabulaire">{formaterDate(new Date(suivi.creeeLe))}</span>
        </p>
      </header>

      {horsFrise ? (
        <div className="rounded-m border border-attente-bg bg-attente-bg p-5">
          <p className="mb-1 text-[15px] font-semibold text-attente">{horsFrise.libelle}</p>
          <p className="text-[14px] text-attente">{horsFrise.detail}</p>
        </div>
      ) : (
        <Frise rang={rang} payeeLe={suivi.payeeLe} expedieeLe={suivi.expedieeLe} />
      )}

      <h3 className="mb-4 mt-12 font-serif text-[24px]">Ce qui est commandé</h3>
      <ul className="border-t border-brume">
        {suivi.lignes.map((ligne, i) => (
          <li
            key={`${ligne.libelle}-${i}`}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-brume py-3.5"
          >
            <span className="text-[15px]">{ligne.libelle}</span>
            <span className="font-mono text-[14px] text-taupe tabulaire">× {ligne.quantite}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 flex flex-wrap items-baseline justify-between gap-4 text-[19px] font-bold">
        <span>Total</span>
        <span className="font-mono tabulaire">{formaterPrix(suivi.totalCentimes)}</span>
      </p>

      <p className="mt-8 text-[14px] text-taupe">
        Une question sur cette commande&nbsp;?{' '}
        <Link href="/contact" className="text-grenat underline underline-offset-4">
          Écrire à Didine
        </Link>
      </p>
    </section>
  );
}

/**
 * Frise des cinq états.
 *
 * La couleur ne porte jamais seule l'information : chaque étape annonce
 * aussi son état en toutes lettres pour un lecteur d'écran, et l'étape
 * courante est marquée `aria-current`. Un daltonien lit le mot, pas la
 * teinte.
 */
function Frise({
  rang,
  payeeLe,
  expedieeLe,
}: {
  rang: number;
  payeeLe: string | null;
  expedieeLe: string | null;
}) {
  return (
    <ol className="grid gap-5 sm:grid-cols-5 sm:gap-4">
      {ETAPES.map((etape, i) => {
        const faite = i < rang;
        const courante = i === rang;
        const date =
          etape.statut === 'payee' ? payeeLe : etape.statut === 'expediee' ? expedieeLe : null;

        return (
          <li
            key={etape.statut}
            aria-current={courante ? 'step' : undefined}
            className={`border-t-2 pt-3 ${
              courante ? 'border-t-grenat' : faite ? 'border-t-foret' : 'border-t-brume-2'
            }`}
          >
            <p
              className={`mb-1 font-mono text-[12px] uppercase tracking-[0.16em] ${
                courante ? 'text-grenat' : faite ? 'text-foret' : 'text-taupe'
              }`}
            >
              Étape {i + 1}
              <span className="sr-only">
                {courante ? ' — étape en cours' : faite ? ' — terminée' : ' — à venir'}
              </span>
            </p>
            <p
              className={`text-[15px] ${
                courante ? 'font-semibold text-graphite' : faite ? 'text-graphite' : 'text-taupe'
              }`}
            >
              {etape.libelle}
            </p>
            {date && (
              <p className="mt-1 font-mono text-[12.5px] text-taupe tabulaire">
                {formaterDate(new Date(date))}
              </p>
            )}
            {courante && <p className="mt-2 text-[13.5px] text-taupe">{etape.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}
