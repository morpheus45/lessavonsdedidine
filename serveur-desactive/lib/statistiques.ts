/**
 * Mesures agrégées du tableau de bord.
 *
 * Trois principes tiennent ce fichier :
 *
 *   1. Tout est agrégé EN BASE. Charger les commandes pour les additionner en
 *      JavaScript marche sur cinquante lignes et s'effondre sur dix mille ;
 *      l'index (statut, creeeLe) ne sert à rien si le tri se fait après coup.
 *
 *   2. Tout est en CENTIMES ENTIERS. Aucune division n'est faite avant
 *      l'affichage, et le panier moyen est arrondi une seule fois, ici, pour
 *      que les trois tuiles du haut se recoupent exactement.
 *
 *   3. Tout est regroupé sur l'heure de PARIS. `creeeLe` est un
 *      `timestamp without time zone` qui contient de l'UTC : une commande de
 *      23 h 30 le 31 tomberait au mois suivant si on groupait sur la colonne
 *      brute. D'où le double `AT TIME ZONE` de JOUR_PARIS ci-dessous.
 */

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Statuts qui comptent comme encaissés.
 *
 * `en_attente_paiement` et `echouee` en sont exclus : ce n'est pas de
 * l'argent. `remboursee` aussi — et comme le filtre porte sur la date de
 * création de la commande, un remboursement disparaît du mois où la vente a
 * eu lieu, pas du mois courant. C'est la règle comptable, pas un raccourci.
 */
export const STATUTS_ENCAISSES = ['payee', 'preparee', 'expediee', 'livree'];

/** Profondeur de la courbe. Un trimestre : assez pour voir une saison. */
export const FENETRE_JOURS = 90;

/**
 * La colonne stocke de l'UTC sans le dire (`timestamp without time zone`).
 * Le premier `AT TIME ZONE 'UTC'` le déclare, le second bascule à Paris.
 */
const JOUR_PARIS = Prisma.sql`(c."creeeLe" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')`;

/** Minuit parisien du premier jour de la fenêtre, exprimé en UTC pour la comparaison. */
function debutFenetreUtc(jours: number) {
  return Prisma.sql`(
    (((NOW() AT TIME ZONE 'Europe/Paris')::date - ${jours - 1}::int)::timestamp
      AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC'
  )`;
}

// ─────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────

export type PointJournalier = {
  /** Date locale au format `AAAA-MM-JJ`, telle que découpée par Postgres. */
  jour: string;
  centimes: number;
  commandes: number;
};

export type Periode = {
  centimes: number;
  commandes: number;
  /** CA ÷ commandes, arrondi une seule fois : les tuiles doivent se recouper. */
  panierMoyenCentimes: number;
};

export type Part = {
  cle: string;
  libelle: string;
  detail?: string;
  centimes: number;
  quantite: number;
};

export type Statistiques = {
  fenetreJours: number;
  /** Une entrée par jour, trous compris : une journée sans vente vaut 0. */
  parJour: PointJournalier[];
  fenetre: Periode;
  moisCourant: Periode;
  moisPrecedent: Periode;
  /** `null` quand le mois précédent est vide — on ne divise pas par zéro. */
  ecartMensuelPourcent: number | null;
  parProduit: Part[];
  parFormat: Part[];
  parTheme: Part[];
  /** Vitrines contre savons : lequel des deux métiers la fait vivre. */
  parMetier: Part[];
  /**
   * Somme des lignes, hors frais de livraison. Les répartitions se rapportent
   * à ce total et NON au chiffre d'affaires : mélanger les deux ferait des
   * pourcentages qui ne tombent pas à 100 %.
   */
  totalArticlesCentimes: number;
  /** Encaissé depuis l'ouverture, toutes périodes confondues. */
  historique: Periode;
  /** Commandes existantes mais pas encore encaissées (attente, échec, annulation). */
  commandesNonEncaissees: number;
  /** Vrai tant qu'aucune vente n'a jamais été encaissée : l'état vide, le vrai. */
  aucuneVente: boolean;
};

// ─────────────────────────────────────────────────────────────────────
// OUTILS
// ─────────────────────────────────────────────────────────────────────

/** Postgres renvoie les SUM en `bigint`, que Prisma rend en `BigInt`. */
function entier(valeur: bigint | number | null | undefined): number {
  return valeur == null ? 0 : Number(valeur);
}

function periode(centimes: number, commandes: number): Periode {
  return {
    centimes,
    commandes,
    panierMoyenCentimes: commandes > 0 ? Math.round(centimes / commandes) : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────
// REQUÊTES
// ─────────────────────────────────────────────────────────────────────

type LigneJour = { jour: string; centimes: bigint; commandes: bigint };

/**
 * Chiffre d'affaires jour par jour, trous comblés côté base.
 *
 * Le `generate_series` évite d'avoir à reconstruire le calendrier en
 * JavaScript, où l'on se trompe de fuseau une fois sur deux.
 */
export async function chiffreAffairesParJour(jours = FENETRE_JOURS): Promise<PointJournalier[]> {
  const lignes = await prisma.$queryRaw<LigneJour[]>`
    WITH bornes AS (
      SELECT ((NOW() AT TIME ZONE 'Europe/Paris')::date - ${jours - 1}::int) AS premier,
             (NOW() AT TIME ZONE 'Europe/Paris')::date AS dernier
    ),
    calendrier AS (
      SELECT generate_series(b.premier, b.dernier, INTERVAL '1 day')::date AS jour FROM bornes b
    ),
    ventes AS (
      SELECT ${JOUR_PARIS}::date AS jour,
             SUM(c."totalCentimes")::bigint AS centimes,
             COUNT(*)::bigint AS commandes
        FROM "Commande" c
       WHERE c.statut IN (${Prisma.join(STATUTS_ENCAISSES)})
         AND c."creeeLe" >= ${debutFenetreUtc(jours)}
       GROUP BY 1
    )
    SELECT to_char(k.jour, 'YYYY-MM-DD') AS jour,
           COALESCE(v.centimes, 0)::bigint AS centimes,
           COALESCE(v.commandes, 0)::bigint AS commandes
      FROM calendrier k
      LEFT JOIN ventes v ON v.jour = k.jour
     ORDER BY k.jour
  `;

  return lignes.map((l) => ({
    jour: l.jour,
    centimes: entier(l.centimes),
    commandes: entier(l.commandes),
  }));
}

type LigneMois = { periode: string; centimes: bigint; commandes: bigint };

/** Mois en cours et mois précédent, découpés sur le calendrier parisien. */
export async function totauxMensuels() {
  const lignes = await prisma.$queryRaw<LigneMois[]>`
    WITH reperes AS (
      SELECT date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris') AS courant,
             date_trunc('month', NOW() AT TIME ZONE 'Europe/Paris') - INTERVAL '1 month' AS precedent
    )
    SELECT CASE WHEN date_trunc('month', ${JOUR_PARIS}) = r.courant THEN 'courant' ELSE 'precedent' END AS periode,
           SUM(c."totalCentimes")::bigint AS centimes,
           COUNT(*)::bigint AS commandes
      FROM "Commande" c, reperes r
     WHERE c.statut IN (${Prisma.join(STATUTS_ENCAISSES)})
       AND c."creeeLe" >= ((r.precedent AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC')
     GROUP BY 1
  `;

  const lire = (cle: string) => {
    const l = lignes.find((x) => x.periode === cle);
    return periode(entier(l?.centimes), entier(l?.commandes));
  };

  const courant = lire('courant');
  const precedent = lire('precedent');

  return {
    courant,
    precedent,
    // Une hausse « infinie » depuis zéro ne veut rien dire : on n'affiche rien.
    ecartPourcent:
      precedent.centimes > 0
        ? Math.round(((courant.centimes - precedent.centimes) / precedent.centimes) * 1000) / 10
        : null,
  };
}

type LigneVariante = {
  varianteId: string;
  varianteNom: string;
  produitId: string;
  produitNom: string;
  produitType: string;
  centimes: bigint;
  quantite: bigint;
};

/**
 * Une seule requête au grain le plus fin (la variante) ; produit et métier
 * s'en déduisent par somme. Trois requêtes auraient pu se contredire, une
 * seule ne le peut pas.
 */
export async function repartitionParFormat(jours = FENETRE_JOURS): Promise<LigneVariante[]> {
  return prisma.$queryRaw<LigneVariante[]>`
    SELECT v.id   AS "varianteId",
           v.nom  AS "varianteNom",
           p.id   AS "produitId",
           p.nom  AS "produitNom",
           p.type AS "produitType",
           SUM(l."totalCentimes")::bigint AS centimes,
           SUM(l.quantite)::bigint        AS quantite
      FROM "LigneCommande" l
      JOIN "Commande" c ON c.id = l."commandeId"
      JOIN "Variante" v ON v.id = l."varianteId"
      JOIN "Produit"  p ON p.id = v."produitId"
     WHERE c.statut IN (${Prisma.join(STATUTS_ENCAISSES)})
       AND c."creeeLe" >= ${debutFenetreUtc(jours)}
     GROUP BY v.id, v.nom, p.id, p.nom, p.type
     ORDER BY centimes DESC
  `;
}

type LigneTheme = { id: string; nom: string; centimes: bigint; quantite: bigint };

/** Thèmes de vitrines les plus demandés, par nombre d'exemplaires commandés. */
export async function repartitionParTheme(jours = FENETRE_JOURS): Promise<Part[]> {
  const lignes = await prisma.$queryRaw<LigneTheme[]>`
    SELECT t.id, t.nom,
           SUM(l."totalCentimes")::bigint AS centimes,
           SUM(l.quantite)::bigint        AS quantite
      FROM "LigneCommande" l
      JOIN "Commande"     c ON c.id = l."commandeId"
      JOIN "ThemeVitrine" t ON t.id = l."themeId"
     WHERE c.statut IN (${Prisma.join(STATUTS_ENCAISSES)})
       AND c."creeeLe" >= ${debutFenetreUtc(jours)}
     GROUP BY t.id, t.nom
     ORDER BY quantite DESC, t.nom ASC
  `;

  return lignes.map((l) => ({
    cle: l.id,
    libelle: l.nom,
    centimes: entier(l.centimes),
    quantite: entier(l.quantite),
  }));
}

// ─────────────────────────────────────────────────────────────────────
// ASSEMBLAGE
// ─────────────────────────────────────────────────────────────────────

const LIBELLES_METIER: Record<string, string> = {
  vitrine: 'Vitrines personnalisées',
  savon: 'Savons',
};

export async function chargerStatistiques(jours = FENETRE_JOURS): Promise<Statistiques> {
  // Requêtes indépendantes : elles partent ensemble. En série, le tableau de
  // bord attendrait cinq allers-retours au lieu d'un.
  const [parJour, mensuel, formats, parTheme, historique, nonEncaissees] = await Promise.all([
    chiffreAffairesParJour(jours),
    totauxMensuels(),
    repartitionParFormat(jours),
    repartitionParTheme(jours),
    prisma.commande.aggregate({
      where: { statut: { in: STATUTS_ENCAISSES } },
      _sum: { totalCentimes: true },
      _count: true,
    }),
    prisma.commande.count({ where: { statut: { notIn: STATUTS_ENCAISSES } } }),
  ]);

  // Les totaux de la fenêtre se déduisent de la série : impossible que la
  // courbe et le chiffre affiché au-dessus racontent deux histoires.
  const fenetre = periode(
    parJour.reduce((s, p) => s + p.centimes, 0),
    parJour.reduce((s, p) => s + p.commandes, 0),
  );

  const parFormat: Part[] = formats.map((f) => ({
    cle: f.varianteId,
    libelle: f.varianteNom,
    detail: f.produitNom,
    centimes: entier(f.centimes),
    quantite: entier(f.quantite),
  }));

  const parProduit = regrouper(
    formats,
    (f) => f.produitId,
    (f) => f.produitNom,
  );

  const parMetier = regrouper(
    formats,
    (f) => f.produitType,
    (f) => LIBELLES_METIER[f.produitType] ?? f.produitType,
  );

  return {
    fenetreJours: jours,
    parJour,
    fenetre,
    moisCourant: mensuel.courant,
    moisPrecedent: mensuel.precedent,
    ecartMensuelPourcent: mensuel.ecartPourcent,
    parProduit,
    parFormat,
    parTheme,
    parMetier,
    totalArticlesCentimes: parFormat.reduce((s, f) => s + f.centimes, 0),
    historique: periode(
      entier(historique._sum.totalCentimes),
      typeof historique._count === 'number' ? historique._count : 0,
    ),
    commandesNonEncaissees: nonEncaissees,
    aucuneVente: (typeof historique._count === 'number' ? historique._count : 0) === 0,
  };
}

function regrouper(
  lignes: LigneVariante[],
  cle: (l: LigneVariante) => string,
  libelle: (l: LigneVariante) => string,
): Part[] {
  const paniers = new Map<string, Part>();
  for (const l of lignes) {
    const k = cle(l);
    const courant = paniers.get(k) ?? { cle: k, libelle: libelle(l), centimes: 0, quantite: 0 };
    courant.centimes += entier(l.centimes);
    courant.quantite += entier(l.quantite);
    paniers.set(k, courant);
  }
  return [...paniers.values()].sort((a, b) => b.centimes - a.centimes);
}

/**
 * Ce que la boutique sait d'elle-même avant sa première vente.
 *
 * Sert uniquement à l'état vide : un tableau de bord qui n'affiche que des
 * tirets donne l'impression d'être cassé, alors qu'il attend simplement des
 * commandes. Ces quatre chiffres-là sont vrais dès aujourd'hui.
 */
export async function apercuCatalogue() {
  const [produits, formats, themes, stock] = await Promise.all([
    prisma.produit.count({ where: { actif: true } }),
    prisma.variante.count({ where: { actif: true } }),
    prisma.themeVitrine.count({ where: { actif: true } }),
    prisma.lot.aggregate({ _sum: { quantiteRestante: true }, _count: true }),
  ]);

  return {
    produits,
    formats,
    themes,
    series: typeof stock._count === 'number' ? stock._count : 0,
    unitesEnStock: stock._sum.quantiteRestante ?? 0,
  };
}
