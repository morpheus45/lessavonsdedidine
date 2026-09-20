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
 * réponse manque, on n'écrit rien plutôt qu'un texte d'attente qu'un visiteur
 * prendrait pour un fait.
 */
export type Reponses = {
  inci: string;
  fraisPort: string;
  seuilPortOffert: string;
  modeLivraison: string;
  delaiVitrine: string;
  taillesVitrines: string;
  themesSurMesure: string;
  emailContact: string;
  instagram: string;
  relectureParfums: string;
  depuisQuand: string;
  pourquoi: string;
  preference: string;
  demandeFrequente: string;
  divers: string;
};

const VIDE: Reponses = {
  inci: '',
  fraisPort: '',
  seuilPortOffert: '',
  modeLivraison: '',
  delaiVitrine: '',
  taillesVitrines: '',
  themesSurMesure: '',
  emailContact: '',
  instagram: '',
  relectureParfums: '',
  depuisQuand: '',
  pourquoi: '',
  preference: '',
  demandeFrequente: '',
  divers: '',
};

let cache: Reponses | null = null;

export function lireReponses(): Reponses {
  if (cache) return cache;

  const chemin = join(process.cwd(), 'contenu', 'reponses.md');
  if (!existsSync(chemin)) {
    cache = VIDE;
    return cache;
  }

  const donnees = matter(readFileSync(chemin, 'utf8')).data as Record<string, unknown>;
  const lire = (cle: keyof Reponses) => {
    const valeur = donnees[cle];
    return typeof valeur === 'string' ? valeur.trim() : '';
  };

  cache = {
    inci: lire('inci'),
    fraisPort: lire('fraisPort'),
    seuilPortOffert: lire('seuilPortOffert'),
    modeLivraison: lire('modeLivraison'),
    delaiVitrine: lire('delaiVitrine'),
    taillesVitrines: lire('taillesVitrines'),
    themesSurMesure: lire('themesSurMesure'),
    emailContact: lire('emailContact'),
    instagram: lire('instagram'),
    relectureParfums: lire('relectureParfums'),
    depuisQuand: lire('depuisQuand'),
    pourquoi: lire('pourquoi'),
    preference: lire('preference'),
    demandeFrequente: lire('demandeFrequente'),
    divers: lire('divers'),
  };
  return cache;
}

/**
 * Délai de fabrication d'une vitrine, en toutes lettres.
 *
 * Tant que Didine n'a pas répondu, on ne donne AUCUN délai : annoncer
 * « environ une semaine » sans le savoir engage sa parole à sa place, et une
 * cliente qui attend plus longtemps que promis est une cliente perdue.
 */
export function phraseDelaiVitrine(): string {
  const delai = lireReponses().delaiVitrine;
  return delai ? `Comptez ${delai} de fabrication avant expédition.` : '';
}
