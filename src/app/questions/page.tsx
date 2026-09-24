import type { Metadata } from 'next';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { QUESTIONS, DEPART } from '@/donnees/questions';
import { Questionnaire } from './Questionnaire';

export const metadata: Metadata = {
  title: 'Quelques questions',
  // Cette page ne s'adresse qu'à une personne : rien à faire dans un moteur.
  robots: { index: false, follow: false },
};

/**
 * La conversation avec Didine, en accès libre.
 *
 * Pas de compte, pas de jeton : elle ouvre le lien et elle répond. Une
 * question à la fois, et sa réponse décide de la suivante — dire non aux
 * vitrines lui épargne les quatre questions qui suivaient.
 */
export default function PageQuestions() {
  const bloquantes = QUESTIONS.filter((q) => q.bloque).length;

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[720px] px-6 py-16">
        <p className="eyebrow mb-5">Pour Didine</p>
        <h1 className="mb-6 max-w-[16ch] font-serif text-[clamp(34px,6vw,56px)] leading-[1.02] tracking-[-0.035em]">
          Quelques questions, une par une
        </h1>
        <p className="mb-4 max-w-[58ch] text-[16.5px] text-taupe">
          Merci pour tes réponses — j&rsquo;ai tout appliqué. Le site est passé à l&rsquo;or et
          au noir, il porte ton nom, et tes dix-huit parfums ont remplacé les onze que
          j&rsquo;avais inventés.
        </p>
        <p className="mb-10 max-w-[58ch] text-[16.5px] text-taupe">
          Il me reste ça. Tu réponds à ton rythme, et ta réponse décide de la suivante —
          il n&rsquo;y en aura pas autant que la dernière fois. {bloquantes} d&rsquo;entre
          elles empêchent d&rsquo;ouvrir la boutique&nbsp;: elles sont signalées.
        </p>

        <Questionnaire questions={QUESTIONS} depart={[...DEPART]} />
      </main>

      <PiedBoutique />
    </>
  );
}
