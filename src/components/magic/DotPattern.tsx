import { cn } from '@/lib/utils';

/**
 * Trame de points en fond — adaptée de Magic UI.
 *
 * SVG inline avec un `<pattern>` : aucun JavaScript, aucune image à
 * télécharger, et la trame se redimensionne sans jamais pixelliser.
 *
 * L'identifiant du motif est dérivé des paramètres plutôt que tiré au sort :
 * deux trames identiques sur une même page partagent alors la même
 * définition, et le rendu serveur correspond au rendu client (un identifiant
 * aléatoire provoquerait une erreur d'hydratation).
 *
 * `aria-hidden` : c'est une texture, elle n'a rien à annoncer.
 */
export function DotPattern({
  ecart = 22,
  rayon = 1,
  className,
}: {
  ecart?: number;
  rayon?: number;
  className?: string;
}) {
  const id = `trame-${ecart}-${rayon}`;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full fill-brume-2',
        className,
      )}
    >
      <defs>
        <pattern id={id} width={ecart} height={ecart} patternUnits="userSpaceOnUse">
          <circle cx={ecart / 2} cy={ecart / 2} r={rayon} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
