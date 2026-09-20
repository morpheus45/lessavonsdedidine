'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { administrateurCourant } from '@/lib/auth';

/**
 * Séries de fabrication et stock.
 *
 * Chaque action revérifie la session. La garde de `layout.tsx` protège
 * l'affichage des pages, pas ces fonctions : une action serveur s'appelle
 * par une requête HTTP directe, sans passer par la mise en page.
 */
async function exigerAdministrateur() {
  const admin = await administrateurCourant();
  if (!admin) redirect('/admin/connexion');
  return admin;
}

export type EtatFormulaire = { erreur?: string; succes?: string };

/**
 * Lit un « 2026-09-20 » d'un champ `<input type="date">`.
 *
 * Construite en UTC volontairement : une série porte une date de calendrier,
 * pas un instant. Passer par le fuseau du serveur ferait basculer la date
 * d'un jour selon l'endroit où tourne l'application, et une date de
 * durabilité minimale fausse d'un jour est une mention d'étiquette fausse.
 */
function lireDate(saisie: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(saisie.trim());
  if (!m) return null;

  const [annee, mois, jour] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(annee, mois - 1, jour));

  // Rejette le 31 février, que `Date.UTC` accepterait en glissant au 3 mars.
  if (date.getUTCFullYear() !== annee || date.getUTCMonth() !== mois - 1) return null;
  return date;
}

/**
 * Le signe moins est accepté à la lecture pour que la validation puisse
 * répondre « négatif » plutôt que « illisible » : un champ rejeté sans
 * explication utile se ressaisit à l'identique.
 */
function lireEntier(saisie: string): number | null {
  const net = saisie.trim();
  if (!/^-?\d+$/.test(net)) return null;
  const n = Number(net);
  return Number.isSafeInteger(n) ? n : null;
}

const FORMAT_JOUR = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// ─────────────────────────────────────────────────────────────────────
// CRÉATION D'UNE SÉRIE
// ─────────────────────────────────────────────────────────────────────

export async function creerSerie(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const produitId = String(donnees.get('produitId') ?? '').trim();
  // La référence finit imprimée sur l'étiquette, toujours en capitales. La
  // contrainte d'unicité, elle, distingue « 26-09-a » de « 26-09-A » : sans
  // cette normalisation, deux séries voisines pourraient coexister et un
  // rappel sanitaire désignerait la mauvaise.
  const reference = String(donnees.get('reference') ?? '').trim().toUpperCase();
  const couleLe = lireDate(String(donnees.get('couleLe') ?? ''));
  const durableJusquLe = lireDate(String(donnees.get('durableJusquLe') ?? ''));
  const quantiteProduite = lireEntier(String(donnees.get('quantiteProduite') ?? ''));
  const notes = String(donnees.get('notes') ?? '').trim();

  if (!produitId) return { erreur: 'Choisissez le savon fabriqué dans cette série.' };
  if (reference.length < 2) {
    return { erreur: 'Donnez une référence à la série, par exemple 26-09-A.' };
  }
  if (reference.length > 32) return { erreur: 'La référence ne doit pas dépasser 32 caractères.' };
  if (!couleLe) return { erreur: 'Indiquez la date de coulée.' };
  if (!durableJusquLe) return { erreur: 'Indiquez la date de durabilité minimale.' };
  if (durableJusquLe <= couleLe) {
    return { erreur: 'La date de durabilité doit être postérieure à la date de coulée.' };
  }
  if (quantiteProduite === null || quantiteProduite < 1) {
    return { erreur: 'La quantité produite doit valoir au moins 1.' };
  }
  if (quantiteProduite > 100_000) {
    return { erreur: 'Quantité produite invraisemblable : vérifiez la saisie.' };
  }

  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit) return { erreur: 'Ce produit n’existe plus.' };
  if (produit.type !== 'savon') {
    // Une vitrine est fabriquée à la commande : lui inventer une série de
    // fabrication créerait un stock fantôme que personne ne décrémente.
    return { erreur: 'Une vitrine est fabriquée à la commande : elle n’a pas de série.' };
  }

  if (await prisma.lot.findUnique({ where: { reference } })) {
    return { erreur: `La référence « ${reference} » est déjà utilisée par une autre série.` };
  }

  try {
    await prisma.lot.create({
      data: {
        reference,
        produitId,
        couleLe,
        // Un fondre-et-verser durcit en trente à soixante minutes : il n'y a
        // pas de cure, la série est vendable le jour même de la coulée.
        pretLe: couleLe,
        durableJusquLe,
        quantiteProduite,
        quantiteRestante: quantiteProduite,
        notes: notes || null,
      },
    });
  } catch (cause) {
    // Deux créations simultanées passent toutes deux la vérification
    // ci-dessus ; seule la contrainte d'unicité de la base tranche.
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002') {
      return { erreur: `La référence « ${reference} » est déjà utilisée par une autre série.` };
    }
    throw cause;
  }

  revalidatePath('/admin/series');
  revalidatePath('/admin');
  return {
    succes: `Série ${reference} enregistrée : ${quantiteProduite} savons disponibles à la vente.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// CORRECTION MANUELLE DU STOCK
// ─────────────────────────────────────────────────────────────────────

/**
 * Recompte de la quantité restante après une casse, un don ou une erreur de
 * comptage.
 *
 * Le motif est obligatoire et vient s'ajouter aux notes de la série, daté et
 * signé. Une quantité qui bouge sans explication rend le stock invérifiable,
 * et c'est exactement ce qu'un contrôle demande à reconstituer.
 */
export async function corrigerStock(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const admin = await exigerAdministrateur();

  const lotId = String(donnees.get('lotId') ?? '').trim();
  const quantiteRestante = lireEntier(String(donnees.get('quantiteRestante') ?? ''));
  const motif = String(donnees.get('motif') ?? '').trim();

  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) return { erreur: 'Série introuvable.' };

  if (quantiteRestante === null) {
    return { erreur: 'Indiquez la quantité restante, en nombre entier de savons.' };
  }
  if (quantiteRestante < 0) {
    return { erreur: 'La quantité restante ne peut pas être négative.' };
  }
  if (quantiteRestante > lot.quantiteProduite) {
    return {
      erreur: `La série n’a produit que ${lot.quantiteProduite} savons : il ne peut pas en rester davantage.`,
    };
  }
  if (motif.length < 3) {
    return { erreur: 'Expliquez la correction en quelques mots : casse, don, erreur de comptage…' };
  }
  if (quantiteRestante === lot.quantiteRestante) {
    return { erreur: 'Cette quantité est déjà celle enregistrée.' };
  }

  const ligne = `${FORMAT_JOUR.format(new Date())} — ${lot.quantiteRestante} → ${quantiteRestante} : ${motif} (${admin.email})`;

  await prisma.lot.update({
    where: { id: lotId },
    data: {
      quantiteRestante,
      notes: lot.notes ? `${lot.notes}\n${ligne}` : ligne,
    },
  });

  revalidatePath('/admin/series');
  revalidatePath('/admin');
  revalidatePath('/savons');
  return { succes: `Série ${lot.reference} corrigée : ${quantiteRestante} savons restants.` };
}
