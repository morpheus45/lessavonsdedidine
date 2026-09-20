import { formaterPrix, formaterDateCourte } from '@/lib/argent';
import type { PointJournalier } from '@/lib/statistiques';

/**
 * Chiffre d'affaires jour par jour : aire remplie sous une courbe lissée.
 *
 * Rendu ENTIÈREMENT côté serveur. Pas de `'use client'`, pas d'état, pas de
 * mesure du DOM : la géométrie se calcule à partir des données, et le SVG
 * s'adapte en largeur par son seul `viewBox`. Le tableau de bord n'envoie
 * donc pas une ligne de JavaScript pour afficher ce graphique — une
 * bibliothèque de courbes aurait pesé plus lourd que toute la page.
 *
 * Un graphique n'étant lisible par aucun lecteur d'écran, le même jeu de
 * données est doublé d'un `<table>` en `sr-only` juste en dessous. Ce n'est
 * pas une option : sans lui, l'information n'existe que pour les voyants.
 */

// Le `viewBox` est dimensionné pour que 1 unité vaille à peu près 1 pixel à la
// largeur où la carte s'affiche vraiment (~1 000 px sur un écran de bureau) :
// sinon les étiquettes d'axe grossissent ou fondent avec la fenêtre.
const L = 980;
const H = 300;
const MARGE = { haut: 22, droite: 20, bas: 42, gauche: 72 };
const LARGEUR = L - MARGE.gauche - MARGE.droite;
const HAUTEUR = H - MARGE.haut - MARGE.bas;
const BAS = MARGE.haut + HAUTEUR;

/** Deux décimales suffisent dans un `d` : au-delà, on alourdit le HTML pour rien. */
const fixe = (n: number) => Math.round(n * 100) / 100;

/**
 * Plafond « rond » de l'axe des montants.
 *
 * Un axe qui s'arrête à 1 347 € se lit mal ; il s'arrête à 1 500 €.
 */
function echelleHaute(maximum: number): number {
  if (maximum <= 0) return 1000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maximum)));
  for (const pas of [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (pas * magnitude >= maximum) return Math.round(pas * magnitude);
  }
  return Math.round(10 * magnitude);
}

/**
 * Lissage de Catmull-Rom converti en Bézier cubique.
 *
 * Les points de contrôle sont bornés à la zone de tracé : sans cette borne,
 * une chute brutale fait plonger la courbe sous l'axe et le graphique
 * dessine un chiffre d'affaires négatif, qui n'existe pas.
 */
function cheminLisse(sommets: { x: number; y: number }[]): string {
  const premier = sommets[0];
  if (!premier) return '';
  if (sommets.length === 1) return `M ${fixe(premier.x)} ${fixe(premier.y)}`;

  const borne = (y: number) => Math.min(BAS, Math.max(MARGE.haut, y));
  const tension = 0.8;
  let d = `M ${fixe(premier.x)} ${fixe(premier.y)}`;

  for (let i = 0; i < sommets.length - 1; i++) {
    const p1 = sommets[i]!;
    const p2 = sommets[i + 1]!;
    const p0 = sommets[i - 1] ?? p1;
    const p3 = sommets[i + 2] ?? p2;

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = borne(p1.y + ((p2.y - p0.y) / 6) * tension);
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = borne(p2.y - ((p3.y - p1.y) / 6) * tension);

    d += ` C ${fixe(c1x)} ${fixe(c1y)}, ${fixe(c2x)} ${fixe(c2y)}, ${fixe(p2.x)} ${fixe(p2.y)}`;
  }
  return d;
}

/** « 2026-09-20 » → Date. Midi UTC : aucun fuseau ne fait basculer le jour. */
const enDate = (jour: string) => new Date(`${jour}T12:00:00Z`);

export function CourbeChiffreAffaires({
  points,
  identifiant = 'courbe-ca',
}: {
  points: PointJournalier[];
  identifiant?: string;
}) {
  const premier = points[0];
  const dernier = points[points.length - 1];
  if (!premier || !dernier || points.length < 2) return null;

  const montants = points.map((p) => p.centimes);
  const total = montants.reduce((s, v) => s + v, 0);
  const maximum = Math.max(...montants);
  const echelle = echelleHaute(maximum);
  const moyenne = total / points.length;

  const x = (i: number) => MARGE.gauche + (i / (points.length - 1)) * LARGEUR;
  const y = (centimes: number) => MARGE.haut + HAUTEUR * (1 - centimes / echelle);

  const sommets = points.map((p, i) => ({ x: x(i), y: y(p.centimes) }));
  const courbe = cheminLisse(sommets);

  // Une boutique qui vend tous les deux ou trois jours produit une courbe
  // surtout faite de zéros : on y lit les à-coups, pas la tendance. La
  // moyenne glissante sur sept jours donne la seconde lecture. Les deux sont
  // tracées — lisser seul cacherait les jours réellement creux, et c'est une
  // information que Didine doit garder.
  const FENETRE = 7;
  const glissante = montants.map((_, i) => {
    const tranche = montants.slice(Math.max(0, i - FENETRE + 1), i + 1);
    return tranche.reduce((somme, v) => somme + v, 0) / tranche.length;
  });
  const courbeGlissante = cheminLisse(glissante.map((v, i) => ({ x: x(i), y: y(v) })));
  const derniereGlissante = glissante[glissante.length - 1] ?? 0;
  const aire = `${courbe} L ${fixe(x(points.length - 1))} ${BAS} L ${fixe(x(0))} ${BAS} Z`;

  const graduations = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    part: f,
    centimes: Math.round(echelle * f),
  }));

  // L'axe des dates s'accroche aux débuts de mois : trois ou quatre repères
  // lisibles, là où un découpage régulier donnerait des dates arbitraires.
  const debutsDeMois = points
    .map((p, i) => (p.jour.slice(8) === '01' ? i : -1))
    .filter((i) => i >= 0 && i < points.length - 7);
  const reperes = [...(debutsDeMois[0] && debutsDeMois[0] > 12 ? [0] : []), ...debutsDeMois];
  if (reperes.length === 0) reperes.push(0);
  reperes.push(points.length - 1);

  const iMeilleur = montants.indexOf(maximum);
  const meilleur = points[iMeilleur];

  // Tendance : première moitié de la période contre seconde. Une phrase, pas
  // une courbe, parce que c'est ce que lira un lecteur d'écran.
  const milieu = Math.floor(points.length / 2);
  const debutPeriode = montants.slice(0, milieu).reduce((s, v) => s + v, 0);
  const finPeriode = montants.slice(milieu).reduce((s, v) => s + v, 0);
  const tendance =
    total === 0
      ? 'Aucune vente encaissée sur la période.'
      : debutPeriode === 0
        ? 'Les ventes ont démarré dans la seconde moitié de la période.'
        : finPeriode >= debutPeriode
          ? `Tendance en hausse : ${formaterPrix(finPeriode)} sur la seconde moitié contre ${formaterPrix(debutPeriode)} sur la première.`
          : `Tendance en baisse : ${formaterPrix(finPeriode)} sur la seconde moitié contre ${formaterPrix(debutPeriode)} sur la première.`;

  const idTitre = `${identifiant}-titre`;
  const idDesc = `${identifiant}-desc`;

  return (
    <figure className="m-0">
      {/* En dessous de 680 px, la courbe défile plutôt que de se réduire :
          des étiquettes de 6 px ne seraient lisibles par personne. */}
      <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${L} ${H}`}
        role="img"
        aria-labelledby={`${idTitre} ${idDesc}`}
        className="block h-auto w-full min-w-[680px]"
      >
        {/* Un seul nœud texte : React refuse un `<title>` composé de plusieurs enfants. */}
        <title id={idTitre}>
          {`Chiffre d'affaires encaissé, du ${formaterDateCourte(enDate(premier.jour))} au ${formaterDateCourte(enDate(dernier.jour))}`}
        </title>
        <desc id={idDesc}>
          {`Deux courbes sur ${points.length} journées, total ${formaterPrix(total)}. En vert, le chiffre d'affaires jour par jour ; en doré, sa moyenne glissante sur sept jours, à ${formaterPrix(Math.round(derniereGlissante))} en fin de période. ${tendance}`}
        </desc>

        <defs>
          <linearGradient id={`${identifiant}-degrade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-foret)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-foret)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Grille : présente, jamais bavarde. */}
        {graduations.map((g) => (
          <g key={g.part}>
            <line
              x1={MARGE.gauche}
              y1={y(g.centimes)}
              x2={L - MARGE.droite}
              y2={y(g.centimes)}
              stroke={g.part === 0 ? 'var(--color-brume-2)' : 'var(--color-brume)'}
              strokeWidth="1"
            />
            <text
              x={MARGE.gauche - 10}
              y={y(g.centimes) + 3.5}
              textAnchor="end"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="var(--color-taupe)"
            >
              {formaterPrix(g.centimes)}
            </text>
          </g>
        ))}

        <path d={aire} fill={`url(#${identifiant}-degrade)`} />
        <path
          d={courbe}
          fill="none"
          stroke="var(--color-foret)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          // Le quotidien passe au second plan : il porte le détail, pas la
          // lecture d'ensemble.
          opacity="0.45"
        />
        {total > 0 && (
          <path
            d={courbeGlissante}
            fill="none"
            stroke="var(--color-or)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {total > 0 && (
          <g>
            {/* Le trait s'arrête avant son étiquette : sinon les pointillés
                traversent le texte et on ne lit plus ni l'un ni l'autre. */}
            <line
              x1={MARGE.gauche}
              y1={y(moyenne)}
              x2={L - MARGE.droite - 150}
              y2={y(moyenne)}
              stroke="var(--color-taupe)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* La ligne porte son nom : une couleur seule n'informe personne. */}
            <text
              x={L - MARGE.droite}
              y={y(moyenne) + 4}
              textAnchor="end"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="var(--color-taupe)"
            >
              {`moyenne ${formaterPrix(Math.round(moyenne))}`}
            </text>
          </g>
        )}

        {meilleur && maximum > 0 && (
          <g>
            <circle cx={x(iMeilleur)} cy={y(maximum)} r="3.5" fill="var(--color-grenat)" />
            <text
              x={x(iMeilleur)}
              y={y(maximum) - 10}
              textAnchor={
                x(iMeilleur) > L - 170 ? 'end' : x(iMeilleur) < MARGE.gauche + 120 ? 'start' : 'middle'
              }
              fontSize="11"
              fontFamily="var(--font-mono)"
              fill="var(--color-grenat)"
            >
              {formaterPrix(maximum)}
            </text>
          </g>
        )}

        {reperes.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={BAS + 20}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fontSize="11"
            fontFamily="var(--font-mono)"
            fill="var(--color-taupe)"
          >
            {formaterDateCourte(enDate(points[i]!.jour))}
          </text>
        ))}
      </svg>
      </div>

      <table className="sr-only">
        <caption>
          Chiffre d&apos;affaires encaissé jour par jour, du{' '}
          {formaterDateCourte(enDate(premier.jour))} au {formaterDateCourte(enDate(dernier.jour))}
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Chiffre d&apos;affaires</th>
            <th scope="col">Commandes</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.jour}>
              <th scope="row">{formaterDateCourte(enDate(p.jour))}</th>
              <td>{formaterPrix(p.centimes)}</td>
              <td>{p.commandes}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total de la période</th>
            <td>{formaterPrix(total)}</td>
            <td>{points.reduce((s, p) => s + p.commandes, 0)}</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}
