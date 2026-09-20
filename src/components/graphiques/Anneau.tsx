import { formaterPrix } from '@/lib/argent';

/**
 * Anneau de répartition — ici, vitrines contre savons.
 *
 * Les deux teintes disponibles (forêt et grenat) ont un contraste de 11:1 et
 * 7,5:1 sur le fond, mais seulement 1,5:1 l'une envers l'autre : en niveaux
 * de gris, ou pour une deutéranopie, elles se confondent. Chaque segment
 * porte donc AUSSI un motif, et la légende répète la valeur en toutes
 * lettres. La couleur ne porte jamais l'information toute seule.
 *
 * Rendu côté serveur, sans état. Le tableau en `sr-only` donne les mêmes
 * chiffres à qui n'a pas accès au dessin.
 */

const CX = 100;
const CY = 100;
const RAYON_EXT = 92;
const RAYON_INT = 60;

const TEINTES = ['var(--color-foret)', 'var(--color-grenat)', 'var(--color-or)', 'var(--color-taupe)'];

export type SegmentAnneau = {
  cle: string;
  libelle: string;
  centimes: number;
  /** Complément affiché en légende : « 24 pièces ». */
  detail?: string;
  /** Tient dans le trou de l'anneau. À défaut, le premier mot de l'étiquette. */
  libelleCourt?: string;
};

/** Espace fine insécable avant le %, comme le veut l'usage français. */
const pourcent = (n: number) => `${n} %`;

const fixe = (n: number) => Math.round(n * 100) / 100;

/** Secteur d'anneau, angles en radians, origine à midi. */
function secteur(depart: number, fin: number): string {
  const grand = fin - depart > Math.PI ? 1 : 0;
  const pt = (r: number, a: number) => `${fixe(CX + r * Math.cos(a))} ${fixe(CY + r * Math.sin(a))}`;
  return [
    `M ${pt(RAYON_EXT, depart)}`,
    `A ${RAYON_EXT} ${RAYON_EXT} 0 ${grand} 1 ${pt(RAYON_EXT, fin)}`,
    `L ${pt(RAYON_INT, fin)}`,
    `A ${RAYON_INT} ${RAYON_INT} 0 ${grand} 0 ${pt(RAYON_INT, depart)}`,
    'Z',
  ].join(' ');
}

/** Hachures pour le second segment, points pour le troisième. */
function Motif({ id, index, teinte }: { id: string; index: number; teinte: string }) {
  if (index === 1) {
    return (
      <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" fill={teinte} />
        <line x1="0" y1="0" x2="0" y2="7" stroke="var(--color-nuage)" strokeWidth="2.6" />
      </pattern>
    );
  }
  if (index === 2) {
    return (
      <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill={teinte} />
        <circle cx="3.5" cy="3.5" r="1.5" fill="var(--color-nuage)" />
      </pattern>
    );
  }
  return null;
}

export function Anneau({
  segments,
  titre,
  identifiant,
}: {
  segments: SegmentAnneau[];
  titre: string;
  identifiant: string;
}) {
  const total = segments.reduce((s, x) => s + x.centimes, 0);
  if (total <= 0 || segments.length === 0) return null;

  const ordonnes = [...segments].sort((a, b) => b.centimes - a.centimes);

  // Les parts arrondies doivent tomber à 100 % : la dernière absorbe le reste,
  // sinon la légende affiche 33 + 33 + 33 et on se demande où est passé le 1 %.
  const parts = ordonnes.map((s, i) =>
    i === ordonnes.length - 1
      ? 100 - ordonnes.slice(0, -1).reduce((acc, x) => acc + Math.round((x.centimes / total) * 100), 0)
      : Math.round((s.centimes / total) * 100),
  );

  const tranches: { segment: SegmentAnneau; part: number; teinte: string; index: number; d: string | null }[] =
    [];
  let angle = -Math.PI / 2;
  ordonnes.forEach((segment, index) => {
    const arc = (segment.centimes / total) * Math.PI * 2;
    // Un secteur qui fait le tour complet a ses deux extrémités confondues :
    // l'arc se dessinerait vide. On bascule alors sur l'anneau plein.
    const plein = segment.centimes >= total;
    tranches.push({
      segment,
      part: parts[index] ?? 0,
      teinte: TEINTES[index % TEINTES.length]!,
      index,
      d: plein ? null : secteur(angle, angle + arc),
    });
    angle += arc;
  });

  const dominant = tranches[0]!;
  const idTitre = `${identifiant}-titre`;
  const idDesc = `${identifiant}-desc`;
  const remplissage = (t: (typeof tranches)[number]) =>
    t.index === 1 || t.index === 2 ? `url(#${identifiant}-motif-${t.index})` : t.teinte;

  return (
    <figure className="m-0">
      <div className="mx-auto w-full max-w-[210px]">
        <svg
          viewBox="0 0 200 200"
          role="img"
          aria-labelledby={`${idTitre} ${idDesc}`}
          className="block h-auto w-full"
        >
          <title id={idTitre}>{titre}</title>
          <desc id={idDesc}>
            {`${tranches
              .map((t) => `${t.segment.libelle} : ${pourcent(t.part)}, soit ${formaterPrix(t.segment.centimes)}`)
              .join('. ')}.`}
          </desc>

          <defs>
            {tranches.map((t) => (
              <Motif
                key={t.segment.cle}
                id={`${identifiant}-motif-${t.index}`}
                index={t.index}
                teinte={t.teinte}
              />
            ))}
          </defs>

          {tranches.map((t) =>
            t.d ? (
              <path
                key={t.segment.cle}
                d={t.d}
                fill={remplissage(t)}
                stroke="var(--color-neige)"
                strokeWidth="1.5"
              />
            ) : (
              <circle
                key={t.segment.cle}
                cx={CX}
                cy={CY}
                r={(RAYON_EXT + RAYON_INT) / 2}
                fill="none"
                stroke={remplissage(t)}
                strokeWidth={RAYON_EXT - RAYON_INT}
              />
            ),
          )}

          <text
            x={CX}
            y={CY + 2}
            textAnchor="middle"
            fontSize="34"
            fontFamily="var(--font-serif)"
            fill="var(--color-graphite)"
          >
            {pourcent(dominant.part)}
          </text>
          {/* Le trou fait 120 unités de large : une étiquette longue en
              déborderait et viendrait s'écrire par-dessus l'anneau. */}
          <text
            x={CX}
            y={CY + 22}
            textAnchor="middle"
            fontSize="9"
            letterSpacing="1.2"
            fontFamily="var(--font-mono)"
            fill="var(--color-taupe)"
          >
            {(dominant.segment.libelleCourt ?? dominant.segment.libelle.split(' ')[0] ?? '').toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Légende masquée aux lecteurs d'écran : le tableau ci-dessous dit
          exactement la même chose, et l'entendre deux fois n'aide personne. */}
      <ul aria-hidden="true" className="mt-5 flex flex-col gap-2.5">
        {tranches.map((t) => (
          <li key={t.segment.cle} className="flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="flex items-center gap-2.5">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
                <defs>
                  <Motif id={`${identifiant}-puce-${t.index}`} index={t.index} teinte={t.teinte} />
                </defs>
                <rect
                  width="12"
                  height="12"
                  rx="2"
                  fill={
                    t.index === 1 || t.index === 2 ? `url(#${identifiant}-puce-${t.index})` : t.teinte
                  }
                />
              </svg>
              <span>
                {t.segment.libelle}
                {t.segment.detail ? (
                  <span className="ml-2 text-[12.5px] text-taupe">{t.segment.detail}</span>
                ) : null}
              </span>
            </span>
            <span className="shrink-0 font-mono tabulaire">
              {formaterPrix(t.segment.centimes)}
              <span className="ml-2 text-taupe">{pourcent(t.part)}</span>
            </span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{titre}</caption>
        <thead>
          <tr>
            <th scope="col">Métier</th>
            <th scope="col">Chiffre d&apos;affaires</th>
            <th scope="col">Part</th>
          </tr>
        </thead>
        <tbody>
          {tranches.map((t) => (
            <tr key={t.segment.cle}>
              <th scope="row">{t.segment.libelle}</th>
              <td>{formaterPrix(t.segment.centimes)}</td>
              <td>{pourcent(t.part)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{formaterPrix(total)}</td>
            <td>100 %</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}
