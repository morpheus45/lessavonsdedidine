import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Bandeau défilant — adapté de Magic UI.
 *
 * Purement CSS : aucun JavaScript, donc zéro kilo-octet ajouté au bundle et
 * un défilement qui tourne sur le compositeur plutôt que sur le fil
 * principal. Les keyframes vivent dans globals.css, déclarées via `@theme`
 * comme l'exige Tailwind v4 — la version d'origine les met dans
 * tailwind.config.js, qui n'existe plus en v4.
 *
 * Le contenu est dupliqué pour que la boucle soit sans couture. La copie
 * porte `aria-hidden` : un lecteur d'écran ne doit pas entendre deux fois
 * la même liste.
 */
export function Marquee({
  children,
  className,
  duree = '42s',
  pause = true,
  inverse = false,
}: {
  children: ReactNode;
  className?: string;
  duree?: string;
  /** Arrête le défilement au survol — laisse le temps de lire. */
  pause?: boolean;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn('group flex overflow-hidden', className)}
      style={{ ['--duree-defilement' as string]: duree }}
    >
      {[0, 1].map((copie) => (
        <div
          key={copie}
          aria-hidden={copie === 1 || undefined}
          className={cn(
            'flex shrink-0 animate-defilement items-center',
            inverse && '[animation-direction:reverse]',
            pause && 'group-hover:[animation-play-state:paused]',
            // Sans cette garde, un défilement permanent est un déclencheur
            // reconnu de gêne vestibulaire.
            'motion-reduce:animate-none',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/** Un élément du bandeau, avec son séparateur. */
export function ElementMarquee({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center whitespace-nowrap px-6 font-mono text-[12px] uppercase tracking-[0.2em] text-nuage">
      {children}
      <span aria-hidden="true" className="ml-6 text-or">
        ·
      </span>
    </span>
  );
}
