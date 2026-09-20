'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { preparerMessage, type EtatContact, type Saisie } from './actions';

/**
 * Formulaire de contact.
 *
 * Il valide, mais il n'envoie rien : le projet n'a encore ni service
 * d'envoi de courriel, ni table où poser un message (voir l'en-tête de
 * actions.ts). Le formulaire le dit donc en toutes lettres à la
 * soumission, et rend son texte à la visiteuse pour qu'elle puisse le
 * recopier dans son courrielleur. C'est moins confortable qu'un vrai envoi,
 * et infiniment moins grave qu'un « message envoyé » qui ment.
 */

/**
 * Seule liste des sujets. Elle sert à orienter une lectrice humaine, pas à
 * router quoi que ce soit — d'où l'absence de codes techniques.
 */
const SUJETS = [
  'Une commande en cours',
  'Un thème de vitrine sur mesure',
  'Une question sur les savons',
  'Autre',
] as const;

const INITIAL: EtatContact = {};

const ETIQUETTE = 'mb-2 block font-mono text-[12px] uppercase tracking-[0.16em] text-taupe';
const CHAMP = 'w-full rounded-s border border-brume-2 bg-neige px-3.5 text-[15px]';

export function Formulaire() {
  const [etat, action, enCours] = useActionState(preparerMessage, INITIAL);

  // React remet à zéro les champs non contrôlés dès que l'action se termine.
  // Les valeurs renvoyées par l'action sont donc réinjectées en valeur par
  // défaut : une erreur de saisie ne doit jamais effacer le message.
  const saisie = etat.saisie;

  // Le sujet demande un traitement à part. Un <select> n'applique
  // « defaultValue » qu'au montage : après la remise à zéro il retombait sur
  // « Choisissez un sujet » pendant que le reste du formulaire, lui, restait
  // rempli — on renvoyait la visiteuse choisir une deuxième fois. On garde
  // donc son choix et on le repose sur la liste après chaque rendu.
  const [sujet, setSujet] = useState('');
  const refSujet = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (refSujet.current && refSujet.current.value !== sujet) {
      refSujet.current.value = sujet;
    }
  });

  return (
    <div>
      <form action={action}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="nom" className={ETIQUETTE}>
              Votre nom
            </label>
            <input
              id="nom"
              name="nom"
              required
              autoComplete="name"
              defaultValue={saisie?.nom ?? ''}
              aria-invalid={etat.champ === 'nom' || undefined}
              className={`${CHAMP} min-h-[48px]`}
            />
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
              defaultValue={saisie?.email ?? ''}
              aria-invalid={etat.champ === 'email' || undefined}
              aria-describedby="aide-email"
              className={`${CHAMP} min-h-[48px]`}
            />
            <p id="aide-email" className="mt-1.5 text-[12.5px] text-taupe">
              Pour que Didine puisse vous répondre.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sujet" className={ETIQUETTE}>
              Sujet
            </label>
            <select
              id="sujet"
              ref={refSujet}
              name="sujet"
              required
              defaultValue=""
              onChange={(evenement) => setSujet(evenement.target.value)}
              aria-invalid={etat.champ === 'sujet' || undefined}
              className={`${CHAMP} min-h-[48px] py-3`}
            >
              <option value="" disabled>
                Choisissez un sujet
              </option>
              {SUJETS.map((choix) => (
                <option key={choix} value={choix}>
                  {choix}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="message" className={ETIQUETTE}>
              Votre message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={8}
              maxLength={4000}
              defaultValue={saisie?.message ?? ''}
              aria-invalid={etat.champ === 'message' || undefined}
              aria-describedby="aide-message"
              className={`${CHAMP} py-3 leading-[1.6]`}
            />
            <p id="aide-message" className="mt-1.5 text-[12.5px] text-taupe">
              Pour une vitrine&nbsp;: le thème, le prénom à poser dessus, et la date à laquelle
              vous en avez besoin.
            </p>
          </div>
        </div>

        {/* Jamais désactivé : un bouton grisé ne dit pas ce qui se passe.
            Il change de libellé, ce qui informe sans bloquer. */}
        <button
          type="submit"
          className="mt-8 min-h-[52px] w-full cursor-pointer rounded-s bg-grenat px-8 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 sm:w-auto"
        >
          {enCours ? 'Vérification…' : 'Préparer mon message'}
        </button>
      </form>

      <p aria-live="polite" className="mt-5 min-h-[24px] text-[14.5px]">
        {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
        {etat.verifie && (
          <span className="text-attente">
            Message vérifié, mais pas encore envoyable&nbsp;: lisez ce qui suit.
          </span>
        )}
      </p>

      {/* La clé remet à zéro le retour de la copie quand le texte change :
          « Message copié » ne doit pas survivre au message qu'il désignait. */}
      {etat.verifie && saisie && <NonBranche key={saisie.message} message={saisie} />}
    </div>
  );
}

/**
 * Ce qu'on affiche à la place d'un faux accusé d'envoi : l'aveu, le moyen
 * de contact direct, et le texte rendu pour qu'il ne soit pas perdu.
 */
function NonBranche({ message }: { message: Saisie }) {
  const [copie, setCopie] = useState<string | null>(null);

  const texteComplet = `Sujet : ${message.sujet}\nDe : ${message.nom} (${message.email})\n\n${message.message}`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(texteComplet);
      setCopie('Message copié. Collez-le dans votre courrielleur.');
    } catch {
      setCopie('La copie automatique a échoué : sélectionnez le texte ci-dessous à la main.');
    }
  }

  return (
    <section
      aria-labelledby="titre-non-branche"
      className="mt-8 rounded-l border border-brume-2 bg-neige p-7 sm:p-10"
    >
      <span aria-hidden="true" className="mb-5 block h-[2px] w-14 bg-grenat" />
      <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.2em] text-grenat">
        Votre message n’est pas parti
      </p>
      <h2 id="titre-non-branche" className="mb-4 font-serif text-[clamp(26px,4vw,34px)] tracking-[-0.02em]">
        L’envoi depuis le site n’est pas encore en service
      </h2>
      <p className="mb-6 max-w-[58ch] text-[15.5px] text-taupe">
        Votre message est complet et correctement rempli, mais la boutique n’a pas encore de quoi
        l’acheminer. Plutôt que de vous laisser croire qu’il est parti, le voici&nbsp;: copiez-le
        et envoyez-le directement à Didine.
      </p>

      <div className="mb-6 rounded-m border border-attente-bg bg-attente-bg p-5">
        <p className="mb-1 font-mono text-[12px] uppercase tracking-[0.16em] text-attente">
          Écrire à
        </p>
        <p className="text-[17px] font-semibold text-attente">
          adresse électronique de Didine — à compléter
        </p>
      </div>

      <div className="rounded-m border border-brume bg-nuage p-5">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.16em] text-taupe">
          Votre message
        </p>
        <p className="whitespace-pre-wrap text-[15px] leading-[1.7]">{texteComplet}</p>
      </div>

      <button
        type="button"
        onClick={copier}
        className="mt-5 min-h-[44px] cursor-pointer rounded-s border border-graphite px-6 text-[14.5px] font-semibold transition-colors hover:bg-brume"
      >
        Copier le message
      </button>

      <p aria-live="polite" className="mt-3 min-h-[20px] text-[13.5px] text-taupe">
        {copie}
      </p>

      <p className="mt-6 text-[14px] text-taupe">
        Si votre message concerne une commande déjà passée, son état est consultable
        immédiatement&nbsp;:{' '}
        <Link href="/suivi" className="text-grenat underline underline-offset-4">
          suivre ma commande
        </Link>
        .
      </p>
    </section>
  );
}
