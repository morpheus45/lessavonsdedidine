import { prisma } from '@/lib/prisma';

/**
 * Réglages commerciaux de la boutique, modifiables sans redéploiement.
 *
 * Ce module est destiné à remplacer, dans `src/lib/boutique.ts`, les deux
 * constantes écrites en dur :
 *
 *   - LIVRAISON_CENTIMES              → livraisonCentimes
 *   - SEUIL_LIVRAISON_OFFERTE_CENTIMES → seuilLivraisonOfferteCentimes
 *
 * `calculerLivraison()` deviendra alors asynchrone, ou recevra les réglages
 * déjà lus. Le raccordement est fait à la main, ailleurs : ce fichier ne
 * modifie rien tout seul.
 *
 * Deux réglages s'y ajoutent, qui n'avaient jusqu'ici aucun endroit où
 * vivre : le délai de fabrication annoncé pour une vitrine, et le bandeau
 * d'accueil de la boutique.
 *
 * Les valeurs sont stockées en texte dans la table `Reglage` — un couple
 * clé/valeur, sans migration à écrire quand un réglage s'ajoute. Une valeur
 * absente ou illisible retombe sur son défaut plutôt que de faire tomber la
 * boutique : un réglage mal saisi ne doit jamais empêcher de vendre.
 */

export const CLES_BOUTIQUE = {
  livraison: 'boutique_livraison_centimes',
  seuil: 'boutique_seuil_livraison_offerte_centimes',
  delaiVitrine: 'boutique_delai_fabrication_vitrine_jours',
  messageAccueil: 'boutique_message_accueil',
} as const;

export type ReglagesBoutique = {
  livraisonCentimes: number;
  seuilLivraisonOfferteCentimes: number;
  delaiFabricationVitrineJours: number;
  /** Chaîne vide = aucun bandeau affiché. */
  messageAccueil: string;
};

/** Les valeurs actuellement en dur dans `src/lib/boutique.ts`. */
export const DEFAUTS_BOUTIQUE: ReglagesBoutique = {
  livraisonCentimes: 490,
  seuilLivraisonOfferteCentimes: 3900,
  delaiFabricationVitrineJours: 7,
  messageAccueil: '',
};

/** Longueur au-delà de laquelle le bandeau cesse d'être un bandeau. */
export const LONGUEUR_MAX_MESSAGE = 160;

function entierOuDefaut(valeur: string | undefined, defaut: number): number {
  if (valeur === undefined) return defaut;
  const n = Number.parseInt(valeur, 10);
  return Number.isSafeInteger(n) && n >= 0 ? n : defaut;
}

export async function lireReglagesBoutique(): Promise<ReglagesBoutique> {
  const lignes = await prisma.reglage.findMany({
    where: { cle: { in: Object.values(CLES_BOUTIQUE) } },
  });
  const r = new Map(lignes.map((l) => [l.cle, l.valeur]));

  return {
    livraisonCentimes: entierOuDefaut(
      r.get(CLES_BOUTIQUE.livraison),
      DEFAUTS_BOUTIQUE.livraisonCentimes,
    ),
    seuilLivraisonOfferteCentimes: entierOuDefaut(
      r.get(CLES_BOUTIQUE.seuil),
      DEFAUTS_BOUTIQUE.seuilLivraisonOfferteCentimes,
    ),
    delaiFabricationVitrineJours: entierOuDefaut(
      r.get(CLES_BOUTIQUE.delaiVitrine),
      DEFAUTS_BOUTIQUE.delaiFabricationVitrineJours,
    ),
    messageAccueil: (r.get(CLES_BOUTIQUE.messageAccueil) ?? DEFAUTS_BOUTIQUE.messageAccueil).trim(),
  };
}

export async function enregistrerReglagesBoutique(valeurs: ReglagesBoutique): Promise<void> {
  const aEcrire: [string, string][] = [
    [CLES_BOUTIQUE.livraison, String(valeurs.livraisonCentimes)],
    [CLES_BOUTIQUE.seuil, String(valeurs.seuilLivraisonOfferteCentimes)],
    [CLES_BOUTIQUE.delaiVitrine, String(valeurs.delaiFabricationVitrineJours)],
    [CLES_BOUTIQUE.messageAccueil, valeurs.messageAccueil],
  ];

  // En une transaction : quatre écritures séparées pourraient laisser un
  // seuil de livraison offerte enregistré sans les frais de port qui vont
  // avec, c'est-à-dire une boutique qui facture une somme incohérente.
  await prisma.$transaction(
    aEcrire.map(([cle, valeur]) =>
      prisma.reglage.upsert({ where: { cle }, create: { cle, valeur }, update: { valeur } }),
    ),
  );
}
