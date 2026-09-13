'use client';

/**
 * Le panier vit dans le navigateur — un visiteur doit pouvoir remplir son
 * panier sans créer de compte.
 *
 * Ce qui est stocké ici n'est JAMAIS une source de vérité sur les prix :
 * seuls des identifiants de variante et des quantités. Le serveur relit les
 * prix en base au moment de créer la commande (voir `src/lib/boutique.ts`).
 * Un total calculé dans le navigateur est un total que le client peut
 * modifier.
 */

const CLE = 'panier-didine-v1';
const EVENEMENT = 'panier-didine:maj';

export type ArticlePanier = {
  varianteId: string;
  quantite: number;
  /** Copies d'affichage uniquement — le serveur ne les lit pas. */
  libelle: string;
  prixCentimes: number;
  slug: string;
};

export function lirePanier(): ArticlePanier[] {
  if (typeof window === 'undefined') return [];
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return [];
    const donnees = JSON.parse(brut) as unknown;
    if (!Array.isArray(donnees)) return [];
    return donnees.filter(
      (a): a is ArticlePanier =>
        typeof a === 'object' &&
        a !== null &&
        typeof (a as ArticlePanier).varianteId === 'string' &&
        Number.isInteger((a as ArticlePanier).quantite),
    );
  } catch {
    // Navigation privée, stockage désactivé, quota plein : on repart d'un
    // panier vide plutôt que de casser la page.
    return [];
  }
}

function ecrire(articles: ArticlePanier[]): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(articles));
  } catch {
    /* stockage indisponible — le panier ne survivra pas au rechargement */
  }
  window.dispatchEvent(new CustomEvent(EVENEMENT));
}

export function ajouter(article: ArticlePanier): void {
  const articles = lirePanier();
  const existant = articles.find((a) => a.varianteId === article.varianteId);
  if (existant) {
    existant.quantite = Math.min(50, existant.quantite + article.quantite);
  } else {
    articles.push({ ...article, quantite: Math.min(50, article.quantite) });
  }
  ecrire(articles);
}

export function changerQuantite(varianteId: string, quantite: number): void {
  const articles = lirePanier();
  const article = articles.find((a) => a.varianteId === varianteId);
  if (!article) return;
  if (quantite < 1) {
    ecrire(articles.filter((a) => a.varianteId !== varianteId));
    return;
  }
  article.quantite = Math.min(50, Math.floor(quantite));
  ecrire(articles);
}

export function retirer(varianteId: string): void {
  ecrire(lirePanier().filter((a) => a.varianteId !== varianteId));
}

export function viderPanier(): void {
  ecrire([]);
}

export function nombreArticles(articles: ArticlePanier[]): number {
  return articles.reduce((n, a) => n + a.quantite, 0);
}

export function sousTotal(articles: ArticlePanier[]): number {
  return articles.reduce((s, a) => s + a.prixCentimes * a.quantite, 0);
}

/** S'abonner aux changements du panier, y compris depuis un autre onglet. */
export function surChangement(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener('storage', rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener('storage', rappel);
  };
}
