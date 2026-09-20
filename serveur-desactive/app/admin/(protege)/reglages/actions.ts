'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { administrateurCourant } from '@/lib/auth';
import { formaterPrix } from '@/lib/argent';
import {
  enregistrerReglagesBoutique,
  LONGUEUR_MAX_MESSAGE,
  type ReglagesBoutique,
} from './reglages-boutique';

/**
 * Réglages de la boutique.
 *
 * L'action revérifie la session. La garde de `layout.tsx` protège
 * l'affichage des pages, pas cette fonction : une action serveur s'appelle
 * par une requête HTTP directe, sans passer par la mise en page. Et ici
 * l'enjeu est direct — qui atteint cette action fixe le prix de la
 * livraison.
 */
async function exigerAdministrateur() {
  const admin = await administrateurCourant();
  if (!admin) redirect('/admin/connexion');
  return admin;
}

export type EtatReglages = { erreur?: string; succes?: string };

/**
 * Lit un montant saisi « 4,90 », « 4.90 » ou « 5 » et le rend en centimes.
 *
 * Didine saisit des euros, la base ne connaît que des centimes entiers : la
 * conversion est faite ici, une fois, plutôt que devinée à chaque lecture.
 */
function enCentimes(saisie: string): number | null {
  const net = saisie.trim().replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(net)) return null;
  return Math.round(Number(net) * 100);
}

/** Plus haut, ce n'est plus un délai de fabrication mais une erreur de saisie. */
const DELAI_MAX_JOURS = 120;

export async function enregistrerReglages(
  _precedent: EtatReglages,
  donnees: FormData,
): Promise<EtatReglages> {
  await exigerAdministrateur();

  const livraisonCentimes = enCentimes(String(donnees.get('livraison') ?? ''));
  const seuilCentimes = enCentimes(String(donnees.get('seuil') ?? ''));
  const delaiBrut = String(donnees.get('delaiVitrine') ?? '').trim();
  const messageAccueil = String(donnees.get('messageAccueil') ?? '').trim();

  if (livraisonCentimes === null) {
    return { erreur: 'Frais de port invalides. Écrivez par exemple 4,90.' };
  }
  if (seuilCentimes === null) {
    return { erreur: 'Seuil de livraison offerte invalide. Écrivez par exemple 39.' };
  }

  // Un seuil sous les frais de port offrirait la livraison dès le premier
  // article : la règle n'aurait plus de sens et le client paierait le port
  // sur les commandes les plus chères seulement.
  if (seuilCentimes < livraisonCentimes) {
    return {
      erreur: `Le seuil de livraison offerte (${formaterPrix(seuilCentimes)}) ne peut pas être inférieur aux frais de port (${formaterPrix(livraisonCentimes)}).`,
    };
  }

  if (!/^-?\d+$/.test(delaiBrut)) {
    return { erreur: 'Délai de fabrication invalide : indiquez un nombre entier de jours.' };
  }
  const delaiJours = Number.parseInt(delaiBrut, 10);
  if (delaiJours < 0) return { erreur: 'Le délai de fabrication ne peut pas être négatif.' };
  if (delaiJours > DELAI_MAX_JOURS) {
    return { erreur: `Un délai de plus de ${DELAI_MAX_JOURS} jours est sûrement une erreur.` };
  }

  if (messageAccueil.length > LONGUEUR_MAX_MESSAGE) {
    return {
      erreur: `Le message d’accueil tient sur une ligne : ${LONGUEUR_MAX_MESSAGE} caractères au maximum, il en fait ${messageAccueil.length}.`,
    };
  }

  const valeurs: ReglagesBoutique = {
    livraisonCentimes,
    seuilLivraisonOfferteCentimes: seuilCentimes,
    delaiFabricationVitrineJours: delaiJours,
    messageAccueil,
  };

  await enregistrerReglagesBoutique(valeurs);

  revalidatePath('/admin/reglages');
  revalidatePath('/');
  revalidatePath('/savons');
  revalidatePath('/panier');

  return {
    succes:
      livraisonCentimes === 0
        ? 'Réglages enregistrés. La livraison est offerte sur toutes les commandes.'
        : `Réglages enregistrés. Livraison ${formaterPrix(livraisonCentimes)}, offerte dès ${formaterPrix(seuilCentimes)}.`,
  };
}
