/**
 * Le sceau de la marque, construit plutôt que dessiné.
 *
 * Bord festonné, frise de soixante perles, bandeau de texte courbe à
 * fleurons, anneau guilloché, couronne d'olivier. Écrire ces tracés à la
 * main dans un fichier SVG serait illisible et impossible à ajuster ; ils
 * sont donc calculés.
 *
 * Deux variantes seulement : `complet` au-delà de 120 px, `reduit` en
 * dessous — sous cette taille le guilloché et le texte courbe deviennent
 * de la bouillie.
 */

const C = 120; // centre du viewBox 240 × 240
const TAU = Math.PI * 2;

function pt(r: number, a: number): [number, number] {
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}
const n2 = (v: number) => v.toFixed(2);

function feston(R: number, nb: number, creux: number): string {
  const pas = TAU / nb;
  let d = '';
  for (let i = 0; i < nb; i++) {
    const a = pt(R, i * pas);
    const b = pt(R, (i + 1) * pas);
    if (!i) d += `M ${n2(a[0])} ${n2(a[1])}`;
    d += ` A ${creux} ${creux} 0 0 1 ${n2(b[0])} ${n2(b[1])}`;
  }
  return `${d} Z`;
}

/** Anneau ondé — le motif que produisent les machines à graver. */
function onde(R: number, amp: number, lobes: number, phase: number): string {
  const pts: string[] = [];
  for (let deg = 0; deg <= 360; deg += 1.5) {
    const t = (deg * Math.PI) / 180;
    const p = pt(R + amp * Math.cos(lobes * t + phase), t);
    pts.push(`${n2(p[0])} ${n2(p[1])}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/** Fleuron à quatre pointes, aux flancs concaves. */
function fleuron(r: number, angle: number): string {
  const [x, y] = pt(r, angle);
  const s = 7.5;
  const k = s * 0.22;
  return (
    `M ${n2(x)} ${n2(y - s)}` +
    ` Q ${n2(x + k)} ${n2(y - k)} ${n2(x + s)} ${n2(y)}` +
    ` Q ${n2(x + k)} ${n2(y + k)} ${n2(x)} ${n2(y + s)}` +
    ` Q ${n2(x - k)} ${n2(y + k)} ${n2(x - s)} ${n2(y)}` +
    ` Q ${n2(x - k)} ${n2(y - k)} ${n2(x)} ${n2(y - s)} Z`
  );
}

type Branche = { tige: string; feuilles: { cx: string; cy: string; rot: string }[]; olive: [number, number] };

function branche(R: number, aDeb: number, aFin: number): Branche {
  const a = pt(R, aDeb);
  const b = pt(R, aFin);
  const tige = `M ${n2(a[0])} ${n2(a[1])} A ${R} ${R} 0 0 ${aFin > aDeb ? 1 : 0} ${n2(b[0])} ${n2(b[1])}`;
  const feuilles = [];
  for (let i = 0; i < 6; i++) {
    const t = aDeb + ((aFin - aDeb) * (i + 0.5)) / 6;
    const dehors = i % 2 === 0;
    const p = pt(R + (dehors ? 7 : -7), t);
    const rot = (t * 180) / Math.PI + 90 + (dehors ? 26 : -26);
    feuilles.push({ cx: n2(p[0]), cy: n2(p[1]), rot: `rotate(${n2(rot)} ${n2(p[0])} ${n2(p[1])})` });
  }
  return { tige, feuilles, olive: pt(R, aDeb) };
}

const DEG = Math.PI / 180;
const BRANCHE_GAUCHE = branche(38, 108 * DEG, 196 * DEG);
const BRANCHE_DROITE = branche(38, 72 * DEG, -16 * DEG);
const PERLES = Array.from({ length: 60 }, (_, i) => pt(95, (i * TAU) / 60));
const POINTS_HAUT = Array.from({ length: 7 }, (_, j) => pt(36, (244 + j * (52 / 6)) * DEG));

export type ProprietesSceau = {
  taille?: number;
  /** Couleur de l'encre ; par défaut le vert forêt de la marque. */
  encre?: string;
  feuille?: string;
  olive?: string;
  variante?: 'complet' | 'reduit';
  className?: string;
};

export function Sceau({
  taille = 240,
  encre = '#0F3A2C',
  feuille = '#17503C',
  olive = '#8A2B28',
  variante = 'complet',
  className,
}: ProprietesSceau) {
  // Identifiant stable et unique par instance : deux sceaux sur une même
  // page ne doivent pas se disputer les chemins de texte.
  const id = `sc-${encre.replace('#', '')}-${variante}-${taille}`;

  if (variante === 'reduit') {
    return (
      <svg
        viewBox="0 0 240 240"
        width={taille}
        height={taille}
        className={className}
        role="img"
        aria-label="Les Savons de Didine"
      >
        <circle cx={C} cy={C} r={104} fill="none" stroke={encre} strokeWidth={9} />
        <circle cx={C} cy={C} r={85} fill="none" stroke={encre} strokeWidth={4} />
        <text
          x={C}
          y={162}
          textAnchor="middle"
          fill={encre}
          style={{ color: encre }}
          fontFamily="Instrument Serif, Georgia, serif"
          fontSize={116}
        >
          D
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 240 240"
      width={taille}
      height={taille}
      className={className}
      role="img"
      aria-label="Les Savons de Didine — saponifié à froid, fait main"
    >
      <defs>
        <path id={`${id}-h`} fill="none" d="M 49,120 A 71,71 0 0,1 191,120" />
        <path id={`${id}-b`} fill="none" d="M 34,120 A 86,86 0 0,0 206,120" />
      </defs>

      <path d={feston(112, 36, 10.8)} fill="none" stroke={encre} strokeWidth={1.4} />
      <circle cx={C} cy={C} r={106} fill="none" stroke={encre} strokeWidth={2.8} />
      <circle cx={C} cy={C} r={100} fill="none" stroke={encre} strokeWidth={0.8} />
      {PERLES.map(([x, y], i) => (
        <circle key={i} cx={n2(x)} cy={n2(y)} r={1.7} fill={encre} />
      ))}
      <circle cx={C} cy={C} r={90} fill="none" stroke={encre} strokeWidth={0.8} />

      {/* fill ET color : les outils d'audit lisent la propriété CSS `color`
          et non l'attribut `fill`, et signalent un faux défaut de contraste
          quand seul `fill` est posé. */}
      <text
        fill={encre}
        style={{ color: encre }}
        fontFamily="DM Mono, monospace"
        fontSize={14}
        letterSpacing={2}
        fontWeight={500}
      >
        <textPath href={`#${id}-h`} startOffset="50%" textAnchor="middle" fill={encre}>
          LES SAVONS DE DIDINE
        </textPath>
      </text>
      <text
        fill={encre}
        style={{ color: encre }}
        fontFamily="DM Mono, monospace"
        fontSize={10}
        letterSpacing={1.6}
        fontWeight={500}
      >
        <textPath href={`#${id}-b`} startOffset="50%" textAnchor="middle" fill={encre}>
          SAPONIFIÉ À FROID · FAIT MAIN
        </textPath>
      </text>

      <path d={fleuron(78, Math.PI)} fill={encre} />
      <path d={fleuron(78, 0)} fill={encre} />

      <circle cx={C} cy={C} r={64} fill="none" stroke={encre} strokeWidth={1.2} />
      {[0, Math.PI / 58, (2 * Math.PI) / 58].map((ph, k) => (
        <path
          key={k}
          d={onde(57, 3.2, 58, ph)}
          fill="none"
          stroke={encre}
          strokeWidth={0.55}
          strokeOpacity={0.9 - k * 0.18}
        />
      ))}
      <circle cx={C} cy={C} r={49} fill="none" stroke={encre} strokeWidth={1} />

      {[BRANCHE_GAUCHE, BRANCHE_DROITE].map((br, i) => (
        <g key={i}>
          <path d={br.tige} fill="none" stroke={feuille} strokeWidth={1.7} strokeLinecap="round" />
          {br.feuilles.map((f, j) => (
            <ellipse key={j} cx={f.cx} cy={f.cy} rx={6.6} ry={2.8} fill={feuille} transform={f.rot} />
          ))}
          <circle cx={n2(br.olive[0])} cy={n2(br.olive[1])} r={3.2} fill={olive} />
        </g>
      ))}
      {POINTS_HAUT.map(([x, y], i) => (
        <circle key={i} cx={n2(x)} cy={n2(y)} r={1.7} fill={encre} />
      ))}

      <text
        x={C}
        y={136}
        textAnchor="middle"
        fill={encre}
        style={{ color: encre }}
        fontFamily="Instrument Serif, Georgia, serif"
        fontSize={62}
      >
        D
      </text>
    </svg>
  );
}
