import matter from 'gray-matter';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Les réglages de la boutique, tels que Didine les a donnés.
 *
 * Ce module ne lit QUE `contenu/reglages.md`, qui est public et ne contient
 * que ce qui est destiné aux clientes.
 *
 * Ses réponses personnelles — adresse électronique, façon de vendre,
 * fournisseur — ne sont jamais versionnées. Elles ont un temps atterri dans
 * ce dépôt, qui est public : c'était une erreur, et la leçon est ici pour
 * qu'on ne la refasse pas. Rien de personnel ne doit passer par un fichier
 * du dépôt.
 *
 * Un réglage vide n'est jamais remplacé par une valeur de secours : le site
 * n'annonce RIEN plutôt qu'une information qu'elle n'a pas donnée.
 */
type Brut = Record<string, unknown>;

let cache: Brut | null = null;

function charger(): Brut {
  if (cache) return cache;
  const chemin = join(process.cwd(), 'contenu', 'reglages.md');
  cache = existsSync(chemin) ? (matter(readFileSync(chemin, 'utf8')).data as Brut) : {};
  return cache;
}

function texte(cle: string): string {
  const valeur = charger()[cle];
  return typeof valeur === 'string' ? valeur.trim() : '';
}

function nombre(cle: string, defaut: number): number {
  const valeur = charger()[cle];
  return typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : defaut;
}

export const reglages = {
  /** Frais de port en centimes. 5 € au 24 septembre 2026. */
  get livraisonCentimes() {
    return nombre('livraisonCentimes', 500);
  },
  /** Seuil de gratuité en centimes. 50 € au 24 septembre 2026. */
  get seuilLivraisonOfferteCentimes() {
    return nombre('seuilLivraisonOfferteCentimes', 5000);
  },
  get modeLivraison() {
    return texte('modeLivraison');
  },
  get delaiExpedition() {
    return texte('delaiExpedition');
  },
  get delaiVitrine() {
    return texte('delaiVitrine');
  },
  get poidsSavonGrammes() {
    return nombre('poidsSavonGrammes', 0);
  },
  get conservation() {
    return texte('conservation');
  },
};

/**
 * Délai de fabrication d'une vitrine, en toutes lettres.
 *
 * Sans réponse de Didine, on ne promet rien. Annoncer un délai sans le savoir
 * engage sa parole à sa place, et une cliente qui attend plus longtemps que
 * promis est une cliente perdue.
 */
export function phraseDelaiVitrine(): string {
  const delai = reglages.delaiVitrine;
  return delai ? `Comptez ${delai} de fabrication avant expédition.` : '';
}

/** Délai d'expédition d'un savon. Vide tant qu'il n'est pas connu. */
export function phraseDelaiExpedition(): string {
  const delai = reglages.delaiExpedition;
  return delai ? `Expédié sous ${delai}.` : '';
}

/** Mode de livraison, pour le pied de page. */
export function phraseModeLivraison(): string {
  const mode = reglages.modeLivraison;
  return mode ? `Envoi par ${mode}.` : '';
}

/**
 * Ce que Didine dit d'elle, pour la page qui la présente.
 *
 * Ses mots, pas les miens. Un champ vide ne se remplit pas : la page montre
 * alors la question restée ouverte, ce qui est honnête, plutôt qu'une phrase
 * brodée à partir de deux mots.
 */
let cacheDidine: Brut | null = null;

function chargerDidine(): Brut {
  if (cacheDidine) return cacheDidine;
  const chemin = join(process.cwd(), 'contenu', 'didine.md');
  cacheDidine = existsSync(chemin) ? (matter(readFileSync(chemin, 'utf8')).data as Brut) : {};
  return cacheDidine;
}

function texteDidine(cle: string): string {
  const valeur = chargerDidine()[cle];
  return typeof valeur === 'string' ? valeur.trim() : '';
}

export const didine = {
  get depuisQuand() {
    return texteDidine('depuisQuand');
  },
  get pourquoi() {
    return texteDidine('pourquoi');
  },
  get preference() {
    return texteDidine('preference');
  },
  get demande() {
    return texteDidine('demandeFrequente');
  },
};
