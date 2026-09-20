'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { administrateurCourant } from '@/lib/auth';
import { recevoirPhoto, oublierPhoto, ErreurPhoto } from '@/lib/photos-serveur';

/**
 * Thèmes de vitrines.
 *
 * Une cliente choisit son thème sur photo. Tant que les thèmes viennent du
 * jeu de données de départ, en ajouter un demande un déploiement, et un thème
 * sans photo se vend à l'aveugle. Cet écran ferme les deux trous.
 *
 * Chaque action revérifie la session. La garde de `layout.tsx` protège
 * l'affichage des pages, pas ces fonctions : une action serveur s'appelle par
 * une requête HTTP directe, sans passer par la mise en page.
 */
async function exigerAdministrateur() {
  const admin = await administrateurCourant();
  if (!admin) redirect('/admin/connexion');
  return admin;
}

export type EtatFormulaire = { erreur?: string; succes?: string };

/** « Chambre d'enfant » → « chambre-d-enfant ». */
function enSlug(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Pages où un thème se montre à la cliente.
 *
 * La fiche vitrine s'atteint par `/savons/<slug du produit>` : on passe la
 * forme paramétrée pour rafraîchir toutes les fiches d'un coup, sans avoir à
 * deviner laquelle propose des thèmes.
 */
function rafraichirVitrines(): void {
  revalidatePath('/admin/themes');
  revalidatePath('/atelier');
  revalidatePath('/savons/[slug]', 'page');
}

// ─────────────────────────────────────────────────────────────────────
// THÈMES
// ─────────────────────────────────────────────────────────────────────

export async function creerTheme(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const nom = String(donnees.get('nom') ?? '').trim();
  const description = String(donnees.get('description') ?? '').trim();
  const actif = donnees.get('actif') === 'on';

  if (nom.length < 2) return { erreur: 'Donnez un nom au thème.' };
  if (description.length < 10) {
    return {
      erreur: 'Décrivez la scène en une phrase : c’est ce que lit la cliente avant de choisir.',
    };
  }

  const slug = enSlug(nom);
  if (!slug) return { erreur: 'Ce nom ne donne pas d’adresse valide.' };

  const pris = await prisma.themeVitrine.findUnique({ where: { slug } });
  if (pris) {
    return {
      erreur: `Le thème « ${pris.nom} » utilise déjà l’adresse « ${slug} ». Changez le nom.`,
    };
  }

  // Le nouveau thème passe en fin de liste ; Didine le remonte ensuite.
  const dernier = await prisma.themeVitrine.findFirst({ orderBy: { ordre: 'desc' } });

  await prisma.themeVitrine.create({
    data: { slug, nom, description, actif, ordre: (dernier?.ordre ?? -1) + 1 },
  });

  rafraichirVitrines();
  return {
    succes: `Thème « ${nom} » créé. Ajoutez-lui une photo : c’est dessus que la cliente choisit.`,
  };
}

export async function enregistrerTheme(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const themeId = String(donnees.get('themeId') ?? '');
  const nom = String(donnees.get('nom') ?? '').trim();
  const description = String(donnees.get('description') ?? '').trim();
  const actif = donnees.get('actif') === 'on';

  if (!themeId) return { erreur: 'Thème introuvable.' };
  if (nom.length < 2) return { erreur: 'Donnez un nom au thème.' };
  if (description.length < 10) {
    return {
      erreur: 'Décrivez la scène en une phrase : c’est ce que lit la cliente avant de choisir.',
    };
  }

  // Le slug ne suit PAS le nom : il voyage dans le panier enregistré par le
  // navigateur de la cliente et dans les commandes déjà passées. Le changer
  // ferait disparaître le thème d'un panier en cours de route.
  await prisma.themeVitrine.update({
    where: { id: themeId },
    data: { nom, description, actif },
  });

  rafraichirVitrines();
  return { succes: 'Thème enregistré.' };
}

export async function basculerActivationTheme(themeId: string): Promise<void> {
  await exigerAdministrateur();
  const theme = await prisma.themeVitrine.findUnique({ where: { id: themeId } });
  if (!theme) return;

  await prisma.themeVitrine.update({ where: { id: themeId }, data: { actif: !theme.actif } });
  rafraichirVitrines();
}

/**
 * Remonte ou descend un thème d'un cran.
 *
 * La liste entière est renumérotée plutôt que d'échanger deux valeurs : le
 * jeu de données de départ peut poser deux thèmes au même rang, et échanger
 * deux nombres égaux ne déplacerait rien du tout.
 */
export async function deplacerTheme(themeId: string, sens: 'haut' | 'bas'): Promise<void> {
  await exigerAdministrateur();

  const themes = await prisma.themeVitrine.findMany({
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
  });

  const depart = themes.findIndex((t) => t.id === themeId);
  const arrivee = sens === 'haut' ? depart - 1 : depart + 1;
  if (depart === -1 || arrivee < 0 || arrivee >= themes.length) return;

  const deplace = themes[depart]!;
  const voisin = themes[arrivee]!;
  themes[depart] = voisin;
  themes[arrivee] = deplace;

  await prisma.$transaction(
    themes.map((t, rang) =>
      prisma.themeVitrine.update({ where: { id: t.id }, data: { ordre: rang } }),
    ),
  );

  rafraichirVitrines();
}

/**
 * Suppression d'un thème — refusée dès qu'une commande le cite.
 *
 * Une ligne de commande garde le thème choisi par la cliente : c'est ce qui
 * permet de répondre, deux ans après, à « qu'est-ce que j'avais commandé ? ».
 * Effacer le thème effacerait cette réponse. Dans ce cas on le masque, ce qui
 * donne le même résultat côté boutique sans toucher à l'historique.
 */
export async function supprimerTheme(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const themeId = String(donnees.get('themeId') ?? '');
  const theme = await prisma.themeVitrine.findUnique({
    where: { id: themeId },
    include: { photos: true, _count: { select: { lignes: true } } },
  });
  if (!theme) return { erreur: 'Thème introuvable.' };

  if (theme._count.lignes > 0) {
    await prisma.themeVitrine.update({ where: { id: themeId }, data: { actif: false } });
    rafraichirVitrines();
    return {
      erreur:
        `« ${theme.nom} » figure sur ${theme._count.lignes} ligne` +
        `${theme._count.lignes > 1 ? 's' : ''} de commande : une commande est une pièce ` +
        'comptable conservée dix ans, le thème ne peut plus être supprimé. Il vient d’être ' +
        'masqué : il n’est plus proposé aux clientes.',
    };
  }

  // Les lignes Photo partent en cascade avec le thème ; les fichiers du
  // stockage, eux, ne partent que si on les efface nous-mêmes.
  await prisma.themeVitrine.delete({ where: { id: themeId } });

  for (const photo of theme.photos) {
    // Les photos livrées avec le code vivent dans le dépôt : rien à effacer.
    if (photo.url.startsWith('/photos-envoyees/')) await oublierPhoto(photo.url);
  }

  rafraichirVitrines();
  return { succes: `Thème « ${theme.nom} » supprimé.` };
}

// ─────────────────────────────────────────────────────────────────────
// PHOTOS
// ─────────────────────────────────────────────────────────────────────

/**
 * Dépôt d'une photo de thème.
 *
 * Didine envoie le fichier tel quel, depuis son téléphone. Redressement selon
 * l'orientation EXIF, réduction en 1200 et 600 px et conversion en WebP se
 * font à la réception — voir `photos-serveur.ts`.
 */
export async function envoyerPhotoTheme(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  await exigerAdministrateur();

  const themeId = String(donnees.get('themeId') ?? '');
  const alt = String(donnees.get('alt') ?? '').trim();
  const fichier = donnees.get('fichier');

  if (!themeId) return { erreur: 'Photo non rattachée à un thème.' };
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
    where: { themeId },
    orderBy: { ordre: 'desc' },
  });

  await prisma.photo.create({
    data: { ...recue, alt, ordre: (dernier?.ordre ?? -1) + 1, themeId },
  });

  rafraichirVitrines();
  return { succes: `Photo ajoutée (${Math.round(recue.octets / 1024)} Ko après réduction).` };
}

export async function retirerPhotoTheme(photoId: string): Promise<void> {
  await exigerAdministrateur();

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  // La ligne d'abord, le fichier ensuite : une ligne qui pointe vers un
  // fichier disparu afficherait un trou sur la boutique, alors qu'un fichier
  // orphelin ne coûte que quelques kilo-octets.
  await prisma.photo.delete({ where: { id: photoId } });

  if (photo.url.startsWith('/photos-envoyees/')) {
    await oublierPhoto(photo.url);
  }

  rafraichirVitrines();
}
