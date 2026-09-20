/**
 * Barres horizontales pour les répartitions : par produit, par format, par thème.
 *
 * Une seule série, donc une seule teinte : la couleur ne code rien ici, tout
 * est écrit en toutes lettres à côté de la barre. La plus longue barre donne
 * l'échelle — pas le total, sinon les petites lignes deviennent invisibles.
 *
 * Rendu côté serveur, sans état ni mesure du DOM. Le `<table>` en `sr-only`
 * qui suit porte exactement les mêmes chiffres : c'est lui que lira un
 * lecteur d'écran, auquel un SVG ne dit rien.
 */

// Comme pour la courbe : le `viewBox` colle à la largeur réelle de la carte
// pour que le texte du SVG sorte à sa taille nominale, ni grossi ni fondu.
const LARGEUR = 600;
const HAUTEUR_LIGNE = 46;
const EPAISSEUR = 7;

/** Espace fine insécable avant le %, comme le veut l'usage français. */
const pourcent = (n: number) => `${n} %`;

export type Barre = {
  cle: string;
  libelle: string;
  /** Précision affichée en gris à côté de l'étiquette : « 12 vendus ». */
  detail?: string;
  /** Sert à l'échelle. En centimes quand il s'agit d'argent. */
  valeur: number;
  /** Déjà formaté par l'appelant : la mise en forme des montants ne se devine pas. */
  valeurAffichee: string;
};

export function BarresHorizontales({
  donnees,
  titre,
  identifiant,
  teinte = 'var(--color-foret)',
  enTeteValeur = 'Chiffre d’affaires',
}: {
  donnees: Barre[];
  titre: string;
  identifiant: string;
  teinte?: string;
  enTeteValeur?: string;
}) {
  if (donnees.length === 0) return null;

  const maximum = Math.max(...donnees.map((d) => d.valeur));
  const total = donnees.reduce((s, d) => s + d.valeur, 0);
  const hauteur = donnees.length * HAUTEUR_LIGNE;
  const tete = donnees[0]!;

  const idTitre = `${identifiant}-titre`;
  const idDesc = `${identifiant}-desc`;

  const part = (valeur: number) => (total > 0 ? Math.round((valeur / total) * 100) : 0);

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${LARGEUR} ${hauteur}`}
        role="img"
        aria-labelledby={`${idTitre} ${idDesc}`}
        className="block h-auto w-full min-w-[380px]"
      >
        <title id={idTitre}>{titre}</title>
        <desc id={idDesc}>
          {`${donnees.length} entrée${donnees.length > 1 ? 's' : ''}, en tête ${tete.libelle} avec ${tete.valeurAffichee}, soit ${pourcent(part(tete.valeur))} du total.`}
        </desc>

        {donnees.map((d, i) => {
          const y = i * HAUTEUR_LIGNE;
          // Une part minuscule reste visible : une barre de zéro pixel se lit
          // comme une absence de donnée, ce qui serait faux.
          const longueur =
            maximum > 0 && d.valeur > 0 ? Math.max(3, (d.valeur / maximum) * LARGEUR) : 0;

          return (
            <g key={d.cle}>
              <text x="0" y={y + 13} fontSize="13" fill="var(--color-graphite)">
                {d.libelle}
                {/* `dx` plutôt qu'une espace : XML les réduit toutes à rien. */}
                {d.detail ? (
                  <tspan dx="9" fill="var(--color-taupe)" fontSize="12">
                    {d.detail}
                  </tspan>
                ) : null}
              </text>
              <text
                x={LARGEUR}
                y={y + 13}
                textAnchor="end"
                fontSize="13"
                fontFamily="var(--font-mono)"
                fill="var(--color-graphite)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {d.valeurAffichee}
              </text>
              <rect
                x="0"
                y={y + 22}
                width={LARGEUR}
                height={EPAISSEUR}
                rx={EPAISSEUR / 2}
                fill="var(--color-brume)"
              />
              {longueur > 0 && (
                <rect
                  x="0"
                  y={y + 22}
                  width={longueur}
                  height={EPAISSEUR}
                  rx={EPAISSEUR / 2}
                  fill={teinte}
                />
              )}
            </g>
          );
        })}
      </svg>
      </div>

      <table className="sr-only">
        <caption>{titre}</caption>
        <thead>
          <tr>
            <th scope="col">Intitulé</th>
            <th scope="col">{enTeteValeur}</th>
            <th scope="col">Part</th>
          </tr>
        </thead>
        <tbody>
          {donnees.map((d) => (
            <tr key={d.cle}>
              <th scope="row">
                {d.libelle}
                {d.detail ? ` (${d.detail})` : ''}
              </th>
              <td>{d.valeurAffichee}</td>
              <td>{pourcent(part(d.valeur))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
