'use client';

import { useState } from 'react';

/**
 * Formulaire de contact.
 *
 * L'adresse de Didine n'apparaît NULLE PART sur le site. Le message part vers
 * Web3Forms, qui le lui transmet par courriel : la page ne contient qu'une
 * clé publique servant d'alias. C'est ce qui permet d'avoir un formulaire qui
 * marche vraiment sur un site sans serveur, sans livrer son adresse aux
 * robots à spam.
 *
 * Sans clé configurée, le formulaire ne fait PAS semblant : il le dit. Un
 * formulaire qui avale les messages en silence perd de vraies clientes.
 */
const POINT_ENVOI = 'https://api.web3forms.com/submit';

const SUJETS = [
  'Une commande en cours',
  'Un thème de vitrine sur mesure',
  'Une question sur les savons',
  'Autre',
] as const;

type Etat = 'saisie' | 'envoi' | 'envoye' | 'erreur';

const ETIQUETTE = 'mb-2 block text-[14px] font-semibold';
const CHAMP =
  'w-full rounded-s border border-brume-2 bg-neige px-3.5 py-3 text-[15px] focus:border-encre focus:outline-none';

export function Formulaire({ cle }: { cle: string }) {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [etat, setEtat] = useState<Etat>('saisie');
  const [erreur, setErreur] = useState<string | null>(null);
  const [champFautif, setChampFautif] = useState<string | null>(null);

  function valider(): string | null {
    if (nom.trim().length < 2) {
      setChampFautif('nom');
      return 'Indiquez votre nom.';
    }
    // Volontairement permissif : une adresse valide prend des formes que les
    // vérifications trop strictes rejettent à tort, et le vrai contrôle est
    // qu'elle reçoive la réponse.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setChampFautif('email');
      return 'Cette adresse électronique ne semble pas valide.';
    }
    if (!sujet) {
      setChampFautif('sujet');
      return 'Choisissez le sujet de votre message.';
    }
    if (message.trim().length < 10) {
      setChampFautif('message');
      return 'Écrivez quelques mots de plus, Didine ne saura pas quoi répondre.';
    }
    setChampFautif(null);
    return null;
  }

  async function envoyer(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const probleme = valider();
    if (probleme) {
      setErreur(probleme);
      return;
    }

    setErreur(null);
    setEtat('envoi');

    const donnees = new FormData(evenement.currentTarget);
    donnees.append('access_key', cle);
    donnees.append('subject', `Boutique — ${sujet}`);
    donnees.append('from_name', 'Les douceurs&Didine');

    try {
      const reponse = await fetch(POINT_ENVOI, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: donnees,
      });
      const corps = (await reponse.json()) as { success?: boolean; message?: string };

      if (!reponse.ok || !corps.success) {
        // On DIT que ça a échoué. Afficher « merci » sur un envoi raté est la
        // pire issue possible : la cliente attend une réponse qui ne viendra
        // jamais.
        setErreur(
          "Votre message n'est pas parti. Réessayez dans un instant — et si ça recommence, prévenez-nous autrement.",
        );
        setEtat('erreur');
        return;
      }
      setEtat('envoye');
    } catch {
      setErreur('Impossible de joindre le service de messagerie. Vérifiez votre connexion.');
      setEtat('erreur');
    }
  }

  if (etat === 'envoye') {
    return (
      <div className="rounded-l border border-encre bg-neige p-8">
        <h2 className="mb-3 font-serif text-[28px] text-encre">Message envoyé</h2>
        <p className="mb-2 text-[16px]">
          Didine l&rsquo;a reçu et vous répondra à <strong>{email.trim()}</strong>.
        </p>
        <p className="text-[14.5px] text-taupe">
          Elle fabrique tout à la main&nbsp;: comptez un délai de réponse d&rsquo;un ou deux
          jours. Pensez à regarder vos courriers indésirables.
        </p>
      </div>
    );
  }

  if (!cle) {
    return (
      <div className="rounded-l border border-attente-bg bg-attente-bg p-8">
        <p className="mb-2 text-[16px] font-semibold text-attente">
          Le formulaire n&rsquo;est pas encore en service.
        </p>
        <p className="text-[14.5px] text-attente">
          Il manque la configuration de la messagerie. Plutôt que de vous laisser écrire un
          message qui n&rsquo;arriverait nulle part, on préfère vous le dire. Revenez bientôt.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} noValidate>
      {/* Piège à robots : un humain ne voit pas ce champ et ne le remplit
          donc jamais. Web3Forms écarte tout envoi où il est rempli. */}
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="nom" className={ETIQUETTE}>
            Votre nom
          </label>
          <input
            id="nom"
            name="name"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            aria-invalid={champFautif === 'nom' || undefined}
            className={`${CHAMP} min-h-[48px]`}
          />
        </div>

        <div>
          <label htmlFor="email" className={ETIQUETTE}>
            Votre adresse électronique
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={champFautif === 'email' || undefined}
            aria-describedby="aide-email"
            className={`${CHAMP} min-h-[48px]`}
          />
          <p id="aide-email" className="mt-1.5 text-[12.5px] text-taupe">
            C&rsquo;est là que Didine vous répondra.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="sujet" className={ETIQUETTE}>
          Le sujet
        </label>
        <select
          id="sujet"
          name="sujet"
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          aria-invalid={champFautif === 'sujet' || undefined}
          className={`${CHAMP} min-h-[48px]`}
        >
          <option value="">Choisissez un sujet</option>
          {SUJETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <label htmlFor="message" className={ETIQUETTE}>
          Votre message
        </label>
        <textarea
          id="message"
          name="message"
          rows={7}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={champFautif === 'message' || undefined}
          className={CHAMP}
        />
      </div>

      <button
        type="submit"
        disabled={etat === 'envoi'}
        className="mt-7 min-h-[52px] w-full cursor-pointer rounded-s bg-onyx px-6 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {etat === 'envoi' ? 'Envoi…' : 'Envoyer le message'}
      </button>

      <p aria-live="polite" className="mt-3 min-h-[24px] text-[14px]">
        {erreur && <span className="text-alerte">{erreur}</span>}
      </p>

      <p className="mt-4 max-w-[58ch] text-[12.5px] text-taupe">
        Votre nom et votre adresse servent uniquement à vous répondre. Ils ne sont pas
        conservés sur ce site, qui n&rsquo;a pas de base de données, et ne sont transmis à
        personne d&rsquo;autre.
      </p>
    </form>
  );
}
