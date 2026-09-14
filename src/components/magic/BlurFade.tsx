'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Révélation au défilement — adaptée de Magic UI.
 *
 * Deux écarts volontaires par rapport à l'implémentation d'origine :
 *
 *   1. Le composant part d'un état VISIBLE. La version d'origine pose
 *      `opacity: 0` dès le rendu serveur : sans JavaScript, ou pendant
 *      l'hydratation, la page est blanche. Ici l'animation ne s'arme
 *      qu'après montage côté client — le HTML servi est lisible tel quel.
 *
 *   2. `prefers-reduced-motion` court-circuite tout : on rend l'état final
 *      immédiatement, sans transition.
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
  const visible = useInView(ref, { once: uneFois, margin: '-60px' });
  const mouvementReduit = useReducedMotion();

  // Tant que le composant n'est pas monté côté client, on ne masque rien.
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  if (!monte || mouvementReduit) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: decalage, filter: `blur(${flou})` }}
      animate={visible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={{ duration: duree, delay: delai, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
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
