'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

/**
 * Parallaxe du savon dans le héros.
 *
 * Le savon remonte plus lentement que la page : c'est ce décalage, et rien
 * d'autre, qui donne la sensation de profondeur. L'amplitude reste faible
 * (±36 px) — au-delà, l'image se décolle visiblement de sa colonne et le
 * procédé devient voyant.
 *
 * Seul `transform` est animé : c'est une propriété composée, elle ne
 * déclenche ni recalcul de mise en page ni repeinture.
 */
export function SavonParallaxe({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouvementReduit = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);

  if (mouvementReduit) {
    return <div className="grid place-items-center">{children}</div>;
  }

  return (
    <div ref={ref} className="grid place-items-center">
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

export type EtapeAtelier = { rang: string; titre: string; texte: string };

/**
 * Frise des quatre gestes de l'atelier, avec une ligne qui se remplit au
 * défilement.
 *
 * Le mouvement n'est pas décoratif : la barre qui avance EST la cure. Elle
 * dit la durée du procédé au moment où le texte l'explique. C'est la seule
 * animation du site à laquelle on demande de signifier quelque chose.
 *
 * La ligne pleine est doublée d'une ligne de fond toujours visible : sans
 * JavaScript, la frise reste une frise.
 */
export function FriseAtelier({ etapes }: { etapes: EtapeAtelier[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const mouvementReduit = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 55%'],
  });
  const progression = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <ol ref={ref} className="relative grid gap-10 md:grid-cols-4">
      {/* Rail de fond — présent même sans JavaScript. */}
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 top-0 hidden h-px bg-encre-2 md:block"
      />
      {/* Remplissage — se superpose au rail. */}
      {!mouvementReduit && (
        <motion.span
          aria-hidden="true"
          style={{ scaleX: progression }}
          className="absolute left-0 right-0 top-0 hidden h-px origin-left bg-or md:block"
        />
      )}

      {etapes.map((e, i) => (
        <li key={e.titre} className="relative pt-8 md:pt-10">
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 hidden size-2.5 -translate-y-1/2 rounded-full border-2 border-encre bg-or md:block"
          />
          <p className="mb-3 font-mono text-[12px] tracking-[0.18em] text-rose-clair">{e.rang}</p>
          <h3 className="mb-3 font-serif text-[26px] tracking-[-0.02em] text-nuage">
            <span className="sr-only">Étape {i + 1} : </span>
            {e.titre}
          </h3>
          <p className="text-[14px] leading-relaxed text-rose">{e.texte}</p>
        </li>
      ))}
    </ol>
  );
}
