'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Révélation au défilement — adaptée de Magic UI.
 *
 * Trois écarts volontaires par rapport à l'implémentation d'origine :
 *
 *   1. Le HTML servi est déjà lisible. La version d'origine pose
 *      `opacity: 0` dès le rendu serveur : sans JavaScript, ou pendant
 *      l'hydratation, la page est blanche.
 *
 *   2. Un bloc DÉJÀ À L'ÉCRAN au chargement n'est jamais animé. Le cacher
 *      pour le faire réapparaître produirait un clignotement — et surtout,
 *      si l'observateur manquait son entrée, le bloc resterait invisible
 *      pour toujours. C'est exactement ce qui arrivait : un bloc rendu
 *      au-dessus de la zone visible restait à `opacity: 0` indéfiniment.
 *      Seul ce qui est sous la ligne de flottaison s'anime, et le cacher
 *      ne se voit donc pas.
 *
 *   3. `prefers-reduced-motion` court-circuite tout.
 *
 * Le décalage vertical reste faible (12 px) pour que ça se lise comme un
 * fondu et non comme un glissement.
 */
export function BlurFade({
  children,
  className,
  delai = 0,
  duree = 0.4,
  decalage = 12,
  flou = '5px',
  uneFois = true,
}: {
  children: ReactNode;
  className?: string;
  delai?: number;
  duree?: number;
  decalage?: number;
  flou?: string;
  uneFois?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouvementReduit = useReducedMotion();
  const [anime, setAnime] = useState(false);

  useEffect(() => {
    if (mouvementReduit) return;
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const dansLaVue = rect.top < window.innerHeight && rect.bottom > 0;
    if (dansLaVue) return;

    setAnime(true);
  }, [mouvementReduit]);

  if (!anime) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: decalage, filter: `blur(${flou})` }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: uneFois, margin: '-60px' }}
      transition={{ duration: duree, delay: delai, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Variante en cascade : anime chaque enfant avec un décalage constant.
 * Le pas reste court (0,04 s) — au-delà de 0,1 s par élément, une liste
 * longue devient poussive.
 */
export function BlurFadeCascade({
  children,
  className,
  pas = 0.04,
  delaiInitial = 0,
}: {
  children: ReactNode[];
  className?: string;
  pas?: number;
  delaiInitial?: number;
}) {
  return (
    <>
      {children.map((enfant, i) => (
        <BlurFade key={i} className={className} delai={delaiInitial + i * pas}>
          {enfant}
        </BlurFade>
      ))}
    </>
  );
}
