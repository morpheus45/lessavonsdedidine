import { FAMILLES, type Parfum } from '@/donnees/parfums';

/**
 * La roue des parfums.
 *
 * Choisir un savon, c'est choisir une odeur — et une liste de dix-huit noms
 * ne dit pas lesquels se ressemblent. La roue les range par famille : on voit
 * d'un coup que le bonbon et le bubble gum sont voisins, et que le café est
 * seul de son côté.
 *
 * Entièrement dessinée côté serveur, sans une ligne de JavaScript. Chaque
 * pétale est un lien vers la fiche du parfum plus bas dans la page : ça
 * fonctionne au clavier, sans JavaScript, et sur un lecteur d'écran.
 *
 * La couleur ne porte jamais l'information seule — chaque pétale est
 * étiqueté, et la famille est écrite en toutes lettres sur l'anneau.
 */

const RAYON_INT = 78;
const RAYON_EXT = 196;
const BANDE_INT = 204;
const BANDE_EXT = 232;
const TAILLE = 560;
const C = TAILLE / 2;

/** Un angle en degrés → un point sur le cercle. 0° pointe vers le haut. */
function point(angle: number, rayon: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [C + rayon * Math.cos(rad), C + rayon * Math.sin(rad)];
}

/** Secteur d'anneau entre deux angles et deux rayons. */
function secteur(a1: number, a2: number, rInt: number, rExt: number): string {
  const [x1, y1] = point(a1, rExt);
  const [x2, y2] = point(a2, rExt);
  const [x3, y3] = point(a2, rInt);
  const [x4, y4] = point(a1, rInt);
  const grand = a2 - a1 > 180 ? 1 : 0;
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rExt} ${rExt} 0 ${grand} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rInt} ${rInt} 0 ${grand} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** Arc simple, pour faire courir un texte dessus. */
function arc(a1: number, a2: number, rayon: number): string {
  const [x1, y1] = point(a1, rayon);
  const [x2, y2] = point(a2, rayon);
  const grand = a2 - a1 > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rayon} ${rayon} 0 ${grand} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

type Petale = {
  parfum: Parfum;
  famille: (typeof FAMILLES)[number];
  debut: number;
  fin: number;
};

export function RoueDesParfums() {
  const total = FAMILLES.reduce((n, f) => n + f.parfums.length, 0);
  const pas = 360 / total;

  const petales: Petale[] = [];
  const arcsFamille: { famille: (typeof FAMILLES)[number]; debut: number; fin: number }[] = [];

  let angle = 0;
  for (const famille of FAMILLES) {
    const debutFamille = angle;
    for (const parfum of famille.parfums) {
      petales.push({ parfum, famille, debut: angle, fin: angle + pas });
      angle += pas;
    }
    arcsFamille.push({ famille, debut: debutFamille, fin: angle });
  }

  const description = FAMILLES.map((f) => `${f.nom} : ${f.parfums.map((p) => p.nom).join(', ')}`).join(' — ');

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${TAILLE} ${TAILLE}`}
        className="mx-auto block h-auto w-full max-w-[560px]"
        role="img"
        aria-labelledby="roue-titre roue-desc"
      >
        <title id="roue-titre">Les parfums, rangés par famille</title>
        <desc id="roue-desc">{description}</desc>

        {petales.map(({ parfum, famille, debut, fin }) => {
          // Un demi-degré de retrait de chaque côté : le liseré de fond qui
          // apparaît entre deux pétales vaut mieux qu'un trait dessiné, il
          // reste net à toutes les tailles.
          const milieu = (debut + fin) / 2;
          const [tx, ty] = point(milieu, (RAYON_INT + RAYON_EXT) / 2);
          // À gauche du cercle, un texte suivant le rayon se lirait à
          // l'envers : on le retourne.
          const aGauche = milieu > 180;
          const rotation = aGauche ? milieu + 90 : milieu - 90;

          return (
            <a key={parfum.slug} href={`#parfum-${parfum.slug}`} className="group">
              <path
                d={secteur(debut + 0.45, fin - 0.45, RAYON_INT, RAYON_EXT)}
                fill={famille.teinte}
                className="transition-[fill] duration-200 group-hover:fill-[--survol] group-focus-visible:fill-[--survol]"
                style={{ '--survol': famille.couleur } as React.CSSProperties}
              />
              <text
                x={tx}
                y={ty}
                transform={`rotate(${rotation.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1f1b1c"
                style={{ color: '#1f1b1c' }}
                className="pointer-events-none text-[14px] font-medium"
              >
                {parfum.nom}
              </text>
            </a>
          );
        })}

        {arcsFamille.map(({ famille, debut, fin }) => {
          const id = `arc-${famille.slug}`;
          // Sous l'horizontale, l'arc se lit tête en bas : on le parcourt
          // dans l'autre sens pour que le texte reste à l'endroit.
          const milieu = (debut + fin) / 2;
          const inverse = milieu > 90 && milieu < 270;
          const rayon = inverse ? BANDE_INT + 9 : BANDE_EXT - 10;
          const d = inverse
            ? arc(fin - 1.4, debut + 1.4, rayon).replace('0 0 1', '0 0 0')
            : arc(debut + 1.4, fin - 1.4, rayon);

          return (
            <g key={famille.slug}>
              <path d={secteur(debut + 0.45, fin - 0.45, BANDE_INT, BANDE_EXT)} fill={famille.couleur} />
              <path id={id} d={d} fill="none" />
              <text
                fill="#1f1b1c"
                style={{ color: '#1f1b1c' }}
                className="text-[11px] font-semibold tracking-[0.16em] uppercase"
              >
                <textPath
                  href={`#${id}`}
                  startOffset="50%"
                  textAnchor="middle"
                  // Sans cela, le texte colle à la courbe et mord sur le bord.
                  dominantBaseline={inverse ? 'hanging' : 'auto'}
                >
                  {famille.nom}
                </textPath>
              </text>
            </g>
          );
        })}

        <circle cx={C} cy={C} r={RAYON_INT - 8} fill="#12100f" />
        <text
          x={C}
          y={C - 8}
          textAnchor="middle"
          fill="#faf3f4"
          style={{ color: '#faf3f4' }}
          className="font-serif text-[46px]"
        >
          {total}
        </text>
        <text
          x={C}
          y={C + 22}
          textAnchor="middle"
          fill="#e8bfc7"
          style={{ color: '#e8bfc7' }}
          className="text-[12px] font-semibold tracking-[0.2em] uppercase"
        >
          parfums
        </text>
      </svg>
    </figure>
  );
}
