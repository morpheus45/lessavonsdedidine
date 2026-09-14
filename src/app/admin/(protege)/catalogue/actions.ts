'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { administrateurCourant } from '@/lib/auth';
import { recevoirPhoto, oublierPhoto, ErreurPhoto } from '@/lib/photos-serveur';

/**
 * Gestion du catalogue depuis le backoffice.
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

/** « Coffret de Noël » → « coffret-de-noel ». */
function enSlug(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Lit un prix saisi « 45 », « 45,50 » ou « 45.50 » et le rend en centimes. */
function enCentimes(saisie: string): number | null {
  const net = saisie.trim().replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(net)) return null;
  return Math.round(Number(net) * 100);
}

// ─────────────────────────────────────────────────────────────────────
// PRODUITS
// ─────────────────────────────────────────────────────────────────────

export async function enregistrerProduit(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const id = String(donnees.get('id') ?? '').trim();
  const nom = String(donnees.get('nom') ?? '').trim();
  const accroche = String(donnees.get('accroche') ?? '').trim();
  const description = String(donnees.get('description') ?? '').trim();
  const inci = String(donnees.get('inci') ?? '').trim();
  const type = String(donnees.get('type') ?? 'savon');

  if (nom.length < 2) return { erreur: 'Donnez un nom au produit.' };
  if (accroche.length < 2) return { erreur: "Écrivez une accroche : c'est la phrase sous le nom." };
  if (description.length < 10) return { erreur: 'La description est trop courte.' };
  if (type !== 'savon' && type !== 'vitrine') return { erreur: 'Type inconnu.' };

  // Un cosmétique doit porter sa composition. Un objet de décoration, non.
  if (type === 'savon' && inci.length < 10) {
    return {
      erreur:
        "La composition est obligatoire pour un savon : recopiez la liste INCI de l'étiquette du fournisseur.",
    };
  }

  if (id) {
    await prisma.produit.update({
      where: { id },
      data: { nom, accroche, description, inci, type },
    });
  } else {
    const slug = enSlug(nom);
    if (!slug) return { erreur: 'Ce nom ne donne pas d’adresse valide.' };
    if (await prisma.produit.findUnique({ where: { slug } })) {
      return { erreur: `Un produit utilise déjà l’adresse « ${slug} ». Changez le nom.` };
    }
    // Le rang décide de l'ordre d'affichage ; le nouveau produit passe en fin
    // de gamme, Didine le remonte ensuite si elle veut.
    const dernier = await prisma.produit.findFirst({ orderBy: { rang: 'desc' } });
    const cree = await prisma.produit.create({
      data: {
        slug,
        nom,
        accroche,
        description,
        inci,
        type,
        rang: (dernier?.rang ?? 0) + 1,
        actif: false, // rien n'est mis en vente sans une relecture
      },
    });
    revalidatePath('/admin/catalogue');
    redirect(`/admin/catalogue/${cree.id}`);
  }

  revalidatePath('/admin/catalogue');
  revalidatePath('/');
  revalidatePath('/savons');
  return { succes: 'Produit enregistré.' };
}

export async function basculerPublication(id: string): Promise<void> {
  await exigerAdministrateur();
  const produit = await prisma.produit.findUnique({
    where: { id },
    include: { variantes: true, photos: true },
  });
  if (!produit) return;

  // Publier un produit sans prix ni photo afficherait une fiche vide.
  if (!produit.actif && (produit.variantes.length === 0 || produit.photos.length === 0)) return;

  await prisma.produit.update({ where: { id }, data: { actif: !produit.actif } });
  revalidatePath('/admin/catalogue');
  revalidatePath('/');
  revalidatePath('/savons');
}

// ─────────────────────────────────────────────────────────────────────
// FORMATS ET PRIX
// ─────────────────────────────────────────────────────────────────────

export async function enregistrerVariante(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const produitId = String(donnees.get('produitId') ?? '');
  const varianteId = String(donnees.get('varianteId') ?? '').trim();
  const nom = String(donnees.get('nom') ?? '').trim();
  const prixCentimes = enCentimes(String(donnees.get('prix') ?? ''));
  const unites = Number(donnees.get('unites') ?? 1);
  const poidsGrammes = Number(donnees.get('poids') ?? 0);

  if (nom.length < 1) return { erreur: 'Nommez le format : « Lot de 5 », « Grande »…' };
  if (prixCentimes === null) return { erreur: 'Prix invalide. Écrivez par exemple 45 ou 45,50.' };
  if (prixCentimes <= 0) return { erreur: 'Le prix doit être supérieur à zéro.' };
  if (!Number.isInteger(unites) || unites < 1) return { erreur: 'Le nombre d’unités doit valoir au moins 1.' };
  if (!Number.isInteger(poidsGrammes) || poidsGrammes < 0) return { erreur: 'Poids invalide.' };

  if (varianteId) {
    await prisma.variante.update({
      where: { id: varianteId },
      data: { nom, prixCentimes, unites, poidsGrammes },
    });
  } else {
    await prisma.variante.create({
      data: { produitId, nom, prixCentimes, unites, poidsGrammes },
    });
  }

  revalidatePath(`/admin/catalogue/${produitId}`);
  revalidatePath('/');
  revalidatePath('/savons');
  return { succes: 'Format enregistré.' };
}

/**
 * Retire un format de la vente.
 *
 * Sans suppression en base : une variante est citée par des lignes de
 * commande déjà passées, et effacer la ligne effacerait l'historique
 * comptable. On la désactive, elle disparaît de la boutique.
 */
export async function retirerVariante(varianteId: string, produitId: string): Promise<void> {
  await exigerAdministrateur();
  await prisma.variante.update({ where: { id: varianteId }, data: { actif: false } });
  revalidatePath(`/admin/catalogue/${produitId}`);
  revalidatePath('/');
  revalidatePath('/savons');
}

// ─────────────────────────────────────────────────────────────────────
// PHOTOS
// ─────────────────────────────────────────────────────────────────────

/**
 * Dépôt d'une photo.
 *
 * Didine envoie le fichier tel quel, depuis son téléphone. La réduction aux
 * deux tailles d'affichage se fait à la réception — voir `photos-serveur.ts`.
 */
export async function envoyerPhoto(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const produitId = String(donnees.get('produitId') ?? '') || null;
  const themeId = String(donnees.get('themeId') ?? '') || null;
  const alt = String(donnees.get('alt') ?? '').trim();
  const fichier = donnees.get('fichier');

  if (!produitId && !themeId) return { erreur: 'Photo non rattachée.' };
  if (!(fichier instanceof File)) return { erreur: 'Choisissez une photo.' };
  if (alt.length < 10) {
    return {
      erreur:
        'Décrivez la photo en une phrase : c’est ce que lisent les personnes aveugles, et Google.',
    };
  }

  let recue;
  try {
    recue = await recevoirPhoto(fichier);
  } catch (cause) {
    if (cause instanceof ErreurPhoto) return { erreur: cause.message };
    throw cause;
  }

  const dernier = await prisma.photo.findFirst({
    where: produitId ? { produitId } : { themeId },
    orderBy: { ordre: 'desc' },
  });

  await prisma.photo.create({
    data: {
      ...recue,
      alt,
      ordre: (dernier?.ordre ?? -1) + 1,
      produitId,
      themeId,
    },
  });

  if (produitId) revalidatePath(`/admin/catalogue/${produitId}`);
  revalidatePath('/');
  revalidatePath('/savons');
  return { succes: `Photo ajoutée (${Math.round(recue.octets / 1024)} Ko après réduction).` };
}

export async function supprimerPhoto(photoId: string): Promise<void> {
  await exigerAdministrateur();
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  // La ligne d'abord, le fichier ensuite : une ligne qui pointe vers un
  // fichier disparu afficherait un trou sur la boutique, alors qu'un fichier
  // orphelin ne coûte que quelques kilo-octets.
  await prisma.photo.delete({ where: { id: photoId } });

  // Les photos livrées avec le code vivent dans le dépôt, pas dans le
  // stockage : il n'y a rien à y effacer.
  if (photo.url.startsWith('/photos-envoyees/')) {
    await oublierPhoto(photo.url);
  }

  if (photo.produitId) revalidatePath(`/admin/catalogue/${photo.produitId}`);
  revalidatePath('/');
  revalidatePath('/savons');
}
