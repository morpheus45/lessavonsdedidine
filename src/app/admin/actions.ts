'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  verifierMotDePasse,
  ouvrirSession,
  fermerSession,
  purgerSessions,
  administrateurCourant,
} from '@/lib/auth';

export type EtatConnexion = { erreur?: string };

/**
 * Connexion au backoffice.
 *
 * Le message d'erreur est volontairement identique que l'adresse soit
 * inconnue ou le mot de passe faux : distinguer les deux permettrait de
 * découvrir quelles adresses existent.
 *
 * Un mot de passe est vérifié même quand l'administrateur n'existe pas, pour
 * que la réponse prenne le même temps dans les deux cas — sinon la durée de
 * réponse trahit l'existence du compte.
 */
export async function seConnecter(
  _precedent: EtatConnexion,
  donnees: FormData,
): Promise<EtatConnexion> {
  const email = String(donnees.get('email') ?? '').trim().toLowerCase();
  const motDePasse = String(donnees.get('motDePasse') ?? '');

  if (!email || !motDePasse) {
    return { erreur: 'Renseignez votre adresse et votre mot de passe.' };
  }

  await purgerSessions();

  const administrateur = await prisma.administrateur.findUnique({ where: { email } });

  // Hachage bidon de longueur réaliste : même coût de calcul qu'un vrai.
  const reference =
    administrateur?.motDePasseHash ??
    '00000000000000000000000000000000:' + '0'.repeat(128);

  const valide = await verifierMotDePasse(motDePasse, reference);

  if (!administrateur || !valide) {
    return { erreur: 'Adresse ou mot de passe incorrect.' };
  }

  await ouvrirSession(administrateur.id);
  redirect('/admin');
}

export async function seDeconnecter(): Promise<void> {
  await fermerSession();
  redirect('/admin/connexion');
}

/** Transitions autorisées. Toute autre combinaison est refusée. */
const TRANSITIONS: Record<string, string[]> = {
  en_attente_paiement: ['payee', 'annulee'],
  payee: ['preparee', 'remboursee', 'annulee'],
  preparee: ['expediee', 'remboursee'],
  expediee: ['livree', 'remboursement_demande'],
  livree: ['remboursement_demande'],
  remboursement_demande: ['remboursee'],
};

export type EtatStatut = { erreur?: string; succes?: string };

/**
 * Changement de statut d'une commande.
 *
 * Trois garde-fous :
 *   - la session est revérifiée ici, pas seulement dans la mise en page :
 *     une action serveur est une porte d'entrée à part entière
 *   - la transition doit figurer dans la table ci-dessus, sinon refus
 *   - chaque changement laisse un événement daté et signé. Quand un client
 *     conteste, c'est la seule réponse possible.
 */
export async function changerStatut(
  _precedent: EtatStatut,
  donnees: FormData,
): Promise<EtatStatut> {
  const admin = await administrateurCourant();
  if (!admin) return { erreur: 'Session expirée. Reconnectez-vous.' };

  const commandeId = String(donnees.get('commandeId') ?? '');
  const nouveau = String(donnees.get('statut') ?? '');

  const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
  if (!commande) return { erreur: 'Commande introuvable.' };

  const permises = TRANSITIONS[commande.statut] ?? [];
  if (!permises.includes(nouveau)) {
    return {
      erreur: `Passage de « ${commande.statut} » à « ${nouveau} » non autorisé.`,
    };
  }

  await prisma.$transaction([
    prisma.commande.update({
      where: { id: commandeId },
      data: {
        statut: nouveau,
        ...(nouveau === 'payee' ? { payeeLe: new Date() } : {}),
        ...(nouveau === 'expediee' ? { expedieeLe: new Date() } : {}),
      },
    }),
    prisma.evenementCommande.create({
      data: {
        commandeId,
        statut: nouveau,
        auteur: admin.email,
        detail: `Changement manuel depuis le backoffice (${commande.statut} → ${nouveau}).`,
      },
    }),
  ]);

  revalidatePath('/admin');
  revalidatePath('/admin/commandes');
  return { succes: `Commande ${commande.reference} passée en « ${nouveau} ».` };
}
