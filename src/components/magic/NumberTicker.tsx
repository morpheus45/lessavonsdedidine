'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

/**
 * Compteur qui s'incrémente à l'entrée dans l'écran — adapté de Magic UI.
 *
 * Écarts volontaires :
 *
 *   1. La valeur finale est rendue côté serveur. Le chiffre « 11 » de
 *      « onze parfums » est une information, pas une décoration :
 *      il doit être lisible sans JavaScript et par un lecteur d'écran.
 *      L'animation ne remplace la valeur qu'après montage.
 *
 *   2. `prefers-reduced-motion` désactive le comptage.
 *
 *   3. `aria-hidden` sur la valeur animée, doublée d'un texte accessible
 *      figé : un lecteur d'écran n'annonce pas « 1, 2, 3, 4, 5, 6 ».
 */
export function NumberTicker({
  valeur,
  duree = 1400,
  suffixe = '',
  className,
}: {
  valeur: number;
  duree?: number;
  suffixe?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: '-40px' });
  const mouvementReduit = useReducedMotion();

  const [monte, setMonte] = useState(false);
  const [affiche, setAffiche] = useState(valeur);

  useEffect(() => setMonte(true), []);

  useEffect(() => {
    if (!monte || mouvementReduit || !visible) return;

    let image = 0;
    const debut = performance.now();
    setAffiche(0);

    const avancer = (maintenant: number) => {
      const t = Math.min((maintenant - debut) / duree, 1);
      // Sortie exponentielle : rapide au début, s'installe doucement.
      const progression = 1 - Math.pow(2, -10 * t);
      setAffiche(Math.round(valeur * (t === 1 ? 1 : progression)));
      if (t < 1) image = requestAnimationFrame(avancer);
    };

    image = requestAnimationFrame(avancer);
    return () => cancelAnimationFrame(image);
  }, [monte, mouvementReduit, visible, valeur, duree]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">
        {affiche}
        {suffixe}
      </span>
      <span className="sr-only">
        {valeur}
        {suffixe}
      </span>
    </span>
  );
}
