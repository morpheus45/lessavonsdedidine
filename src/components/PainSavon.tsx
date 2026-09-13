/**
 * Illustration d'un pain de savon.
 *
 * Ce sont des dessins, pas des photographies : ils tiennent la mise en page
 * tant que les vraies prises de vue n'existent pas. Dès que Didine fournit
 * ses photos, ce composant est remplacé par un <Image> — l'API des pages
 * ne change pas.
 *
 * Chaque recette a sa teinte, pour que la gamme se distingue au premier
 * coup d'œil dans la grille.
 */

type Teinte = { corps: string; tranche: string; contour: string; sceau: string };

const TEINTES: Record<string, Teinte> = {
  'douceur-avoine': { corps: '#E4DFD2', tranche: '#F1EDE3', contour: '#C4BCA9', sceau: '#5F5949' },
  'argile-verte': { corps: '#C9D2C2', tranche: '#D8DFD2', contour: '#A9B5A2', sceau: '#4C5A48' },
  'lavandin-romarin': { corps: '#CEC8DA', tranche: '#DED9E7', contour: '#ADA4BF', sceau: '#4F476090' },
  'shampoing-solide': { corps: '#E5CFC7', tranche: '#EFDCD5', contour: '#C6ABA1', sceau: '#7A5F57' },
};

const DEFAUT: Teinte = TEINTES['douceur-avoine'] as Teinte;

/** Flocons d'avoine — positions fixes, pour que le rendu soit stable entre serveur et client. */
const FLOCONS: [number, number, number][] = [
  [0.22, 0.32, 3],
  [0.36, 0.78, 2.5],
  [0.78, 0.26, 2.8],
  [0.86, 0.82, 3.2],
  [0.16, 0.84, 2.3],
];

export function PainSavon({
  slug,
  taille = 240,
  avecFlocons,
}: {
  slug: string;
  taille?: number;
  avecFlocons?: boolean;
}) {
  const t = TEINTES[slug] ?? DEFAUT;
  const L = 240;
  const H = 170;
  const flocons = avecFlocons ?? slug === 'douceur-avoine';

  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      width={taille}
      height={(taille * H) / L}
      role="img"
      aria-label="Pain de savon coupé à la main"
    >
      <rect x={14} y={16} width={212} height={138} rx={12} fill={t.corps} stroke={t.contour} strokeWidth={1.5} />
      <rect x={14} y={16} width={212} height={16} rx={8} fill={t.tranche} />
      {flocons &&
        FLOCONS.map(([fx, fy, r], i) => (
          <circle key={i} cx={14 + fx * 212} cy={32 + fy * 118} r={r} fill={t.contour} />
        ))}
      <circle cx={120} cy={90} r={42} fill="none" stroke={t.sceau} strokeWidth={1.2} strokeOpacity={0.55} />
      <circle cx={120} cy={90} r={37} fill="none" stroke={t.sceau} strokeWidth={0.7} strokeOpacity={0.45} />
      <text
        x={120}
        y={107}
        textAnchor="middle"
        fill={t.sceau}
        style={{ color: t.sceau }}
        fontFamily="Instrument Serif, Georgia, serif"
        fontSize={42}
        opacity={0.75}
      >
        D
      </text>
    </svg>
  );
}

/** Coffret : les quatre pains alignés dans leur écrin. */
export function Coffret({ taille = 240 }: { taille?: number }) {
  return (
    <svg viewBox="0 0 240 170" width={taille} height={(taille * 170) / 240} role="img" aria-label="Coffret de quatre pains de savon">
      <rect x={14} y={34} width={212} height={102} rx={5} fill="#EDE9DF" stroke="#C4BCA9" strokeWidth={1.5} />
      {[
        ['#E4DFD2', 26],
        ['#C9D2C2', 76],
        ['#CEC8DA', 126],
        ['#E5CFC7', 176],
      ].map(([couleur, x], i) => (
        <rect key={i} x={x as number} y={46} width={40} height={78} rx={4} fill={couleur as string} />
      ))}
    </svg>
  );
}

export function IllustrationProduit({ slug, taille }: { slug: string; taille?: number }) {
  if (slug === 'coffret-quatre-recettes') return <Coffret taille={taille} />;
  return <PainSavon slug={slug} taille={taille} />;
}
