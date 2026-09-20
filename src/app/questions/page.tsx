import type { Metadata } from 'next';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { SECTIONS } from '@/donnees/questions';
import { Questionnaire } from './Questionnaire';

export const metadata: Metadata = {
  title: 'Questions pour Didine',
  // Cette page n'a rien à faire dans un moteur de recherche : elle ne
  // s'adresse qu'à une personne.
  robots: { index: false, follow: false },
};

/**
 * Le questionnaire, en accès libre.
 *
 * Pas de connexion, pas de compte, pas de jeton : elle ouvre le lien et elle
 * répond. Ses réponses ne partent nulle part tant qu'elle ne clique pas — il
 * n'y a d'ailleurs aucun serveur pour les recevoir.
 *
 * L'écran de gestion sait écrire dans le dépôt, lui, mais au prix d'une
 * identification GitHub. Demander ça pour répondre à des questions n'avait
 * aucun sens.
 */
export default function PageQuestions() {
  const total = SECTIONS.reduce((n, s) => n + s.questions.length, 0);
  const bloquantes = SECTIONS.reduce((n, s) => n + s.questions.filter((q) => q.bloque).length, 0);

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[780px] px-6 py-16">
        <p className="eyebrow mb-5">Pour Didine</p>
        <h1 className="mb-6 max-w-[18ch] font-serif text-[clamp(36px,6vw,60px)] leading-[1] tracking-[-0.035em]">
          Ce que j&rsquo;ai inventé et qu&rsquo;il faut corriger
        </h1>
        <p className="mb-4 max-w-[62ch] text-[17px] text-taupe">
          Pour construire la boutique, j&rsquo;ai dû écrire des choses que personne ne
          m&rsquo;avait dites — des délais, des tarifs de livraison, des descriptions. Elles
          sont sur le site en ce moment, et elles engagent votre parole.
        </p>
        <p className="mb-4 max-w-[62ch] text-[17px] text-taupe">
          Voici {total} questions. {bloquantes} d&rsquo;entre elles empêchent d&rsquo;ouvrir la
          boutique tant qu&rsquo;elles restent sans réponse&nbsp;: elles sont marquées.
        </p>
        <p className="mb-12 max-w-[62ch] text-[17px] text-taupe">
          Répondez à votre rythme, dans l&rsquo;ordre que vous voulez. Vos réponses sont
          gardées dans ce navigateur, vous pouvez fermer la page et revenir.{' '}
          <strong className="text-graphite">
            Laissez vide ce dont vous n&rsquo;êtes pas sûre
          </strong>{' '}
          — un blanc vaut mieux qu&rsquo;une information fausse sur un site de vente.
        </p>

        <Questionnaire sections={SECTIONS} />
      </main>

      <PiedBoutique />
    </>
  );
}
