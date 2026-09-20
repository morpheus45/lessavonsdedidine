import matter from 'gray-matter';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Les réponses de Didine aux questions qu'elle seule peut trancher.
 *
 * Elle les saisit dans sa gestion, écran « À compléter ». Chaque champ vide
 * est une information que personne d'autre ne peut fournir sans l'inventer —
 * et ce projet a déjà publié des affirmations fausses faute d'avoir demandé.
 *
 * Le site s'affiche correctement avec tous les champs vides : là où une
 * réponse manque, on n'écrit RIEN plutôt qu'un texte d'attente qu'un visiteur
 * prendrait pour un fait. C'est la règle, et elle n'a pas d'exception.
 *
 * Les questions sont décrites dans `scripts/_questions.mjs`, qui produit le
 * formulaire. Ajouter une question ici sans l'y ajouter ne sert à rien.
 */
type Brut = Record<string, Record<string, unknown> | undefined>;

let cache: Brut | null = null;

function charger(): Brut {
  if (cache) return cache;
  const chemin = join(process.cwd(), 'contenu', 'reponses.md');
  cache = existsSync(chemin)
    ? (matter(readFileSync(chemin, 'utf8')).data as Brut)
    : {};
  return cache;
}

/** Une réponse, ou la chaîne vide. Jamais de valeur de remplacement. */
function lire(section: string, question: string): string {
  const valeur = charger()[section]?.[question];
  return typeof valeur === 'string' ? valeur.trim() : '';
}

export const reponses = {
  livraison: {
    get frais() {
      return lire('livraison', 'frais');
    },
    get seuilOffert() {
      return lire('livraison', 'seuilOffert');
    },
    get delaiExpedition() {
      return lire('livraison', 'delaiExpedition');
    },
    get mode() {
      return lire('livraison', 'mode');
    },
  },
  produits: {
    get inci() {
      return lire('produits', 'inci');
    },
    get poids() {
      return lire('produits', 'poids');
    },
    get conservation() {
      return lire('produits', 'conservation');
    },
    get delaiVitrine() {
      return lire('produits', 'delaiVitrine');
    },
    get tailles() {
      return lire('produits', 'tailles');
    },
    get surMesure() {
      return lire('produits', 'surMesure');
    },
  },
  vous: {
    get depuisQuand() {
      return lire('vous', 'depuisQuand');
    },
    get pourquoi() {
      return lire('vous', 'pourquoi');
    },
    get preference() {
      return lire('vous', 'preference');
    },
    get demande() {
      return lire('vous', 'demande');
    },
    get email() {
      return lire('vous', 'email');
    },
    get instagram() {
      return lire('vous', 'instagram');
    },
  },
};

/**
 * Délai de fabrication d'une vitrine, en toutes lettres.
 *
 * Tant que Didine n'a pas répondu, on ne donne AUCUN délai : annoncer
 * « environ une semaine » sans le savoir engage sa parole à sa place, et une
 * cliente qui attend plus longtemps que promis est une cliente perdue.
 */
export function phraseDelaiVitrine(): string {
  const delai = reponses.produits.delaiVitrine;
  return delai ? `Comptez ${delai} de fabrication avant expédition.` : '';
}

/**
 * Délai d'expédition d'un savon.
 *
 * Le site a longtemps affiché « expédié sous 48 h » sur toutes ses pages.
 * C'était inventé. Sans réponse, on ne promet rien.
 */
export function phraseDelaiExpedition(): string {
  const delai = reponses.livraison.delaiExpedition;
  return delai ? `Expédié sous ${delai}.` : '';
}
