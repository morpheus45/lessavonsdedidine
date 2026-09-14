'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Titre révélé mot à mot.
 *
 * Trois contraintes tenues :
 *
 *   1. Le texte est rendu entier côté serveur. Un titre est ce qu'un moteur
 *      de recherche lit en premier — il ne peut pas dépendre du JavaScript.
 *      Le découpage n'a lieu qu'après montage côté client.
 *
 *   2. Découpage par MOTS, pas par caractères. Un découpage caractère par
 *      caractère crée un élément DOM par lettre ; réservé aux titres très
 *      courts, il devient coûteux et illisible pour les lecteurs d'écran
 *      au-delà.
 *
 *   3. Le titre complet reste disponible d'un bloc pour les technologies
 *      d'assistance : les fragments animés sont masqués (`aria-hidden`) et
 *      doublés d'un texte accessible.
 */
type MotDecoupe = { mot: string; estAccent: boolean };

/**
 * Découpe une ligne en mots, en marquant ceux qui appartiennent à l'accent.
 *
 * Le repérage se fait par POSITION, pas par appartenance : tester
 * `accent.split(' ').includes(mot)` colorerait le « de » de « de séchage »
 * parce que « Pas une de moins. » contient lui aussi un « de ». La position
 * est la seule information qui distingue les deux.
 */
function decouper(ligne: string, accent?: string): MotDecoupe[] {
  const enMots = (fragment: string, estAccent: boolean): MotDecoupe[] =>
    fragment
      .split(' ')
      .filter(Boolean)
      .map((mot) => ({ mot, estAccent }));

  if (!accent) return enMots(ligne, false);

  const debut = ligne.indexOf(accent);
  if (debut === -1) return enMots(ligne, false);

  return [
    ...enMots(ligne.slice(0, debut), false),
    ...enMots(accent, true),
    ...enMots(ligne.slice(debut + accent.length), false),
  ];
}

export function TitreAnime({
  texte,
  className,
  accent,
  pas = 0.07,
  delai = 0.1,
  balise: Balise = 'h1',
}: {
  /** Le titre, lignes séparées par « \n ». */
  texte: string;
  className?: string;
  /** Partie mise en italique grenat — doit apparaître telle quelle dans `texte`. */
  accent?: string;
  pas?: number;
  delai?: number;
  balise?: 'h1' | 'h2';
}) {
  const mouvementReduit = useReducedMotion();
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  const lignes = texte.split('\n');

  const rendreStatique = (): ReactNode =>
    lignes.map((ligne, i) => (
      <span key={i} className="block">
        {accent && ligne.includes(accent) ? (
          <>
            {ligne.slice(0, ligne.indexOf(accent))}
            <em className="italic text-grenat">{accent}</em>
            {ligne.slice(ligne.indexOf(accent) + accent.length)}
          </>
        ) : (
          ligne
        )}
      </span>
    ));

  if (!monte || mouvementReduit) {
    return <Balise className={className}>{rendreStatique()}</Balise>;
  }

  let index = 0;

  return (
    <Balise className={className}>
      <span className="sr-only">{texte.replace(/\n/g, ' ')}</span>
      <span aria-hidden="true">
        {lignes.map((ligne, l) => (
          <span key={l} className="block">
            {decouper(ligne, accent).map(({ mot, estAccent }) => {
              const i = index++;
              return (
                <motion.span
                  key={`${l}-${i}`}
                  // overflow-hidden sur le parent + y initial : le mot
                  // semble monter depuis sa propre ligne de base.
                  className="inline-block overflow-hidden align-bottom"
                  initial={{ opacity: 0, y: '0.35em' }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: delai + i * pas,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className={cn(estAccent && 'italic text-grenat')}>{mot}</span>
                  {' '}
                </motion.span>
              );
            })}
          </span>
        ))}
      </span>
    </Balise>
  );
}
