/**
 * Registre des photos.
 *
 * Une photo sans texte alternatif est invisible pour un lecteur d'écran, et
 * les textes sont écrits une fois ici plutôt que recopiés dans chaque page :
 * c'est la même photo, donc la même description, où qu'elle apparaisse.
 *
 * Les dimensions servent à réserver la place avant le chargement — sans elles
 * la page saute au moment où l'image arrive.
 *
 * Toutes les photos sont de Didine. Chacune existe en deux largeurs, 1200 px
 * (`nom.webp`) et 600 px (`nom@small.webp`), produites par
 * `scripts/optimiser-photos.mjs`. Leurs proportions vont du portrait au
 * paysage : un affichage en grille doit donc recadrer, pas déformer.
 */
export type FichePhoto = { alt: string; largeur: number; hauteur: number };

export const PHOTOS: Record<string, FichePhoto> = {
  '/photos/savons-parfums.webp': {
    alt: 'Six savons en forme de fleur emballés et étiquetés : caramel, citron, fraise, bubble gum, miel et menthe',
    largeur: 1080,
    hauteur: 932,
  },
  '/photos/savons-fleurs.webp': {
    alt: 'Savons en forme de fleur, teintes crème et lavande, présentés dans une caisse en bois',
    largeur: 1080,
    hauteur: 1228,
  },
  '/photos/savons-coffret.webp': {
    alt: 'Coffret de quatre savons ovales au motif de brin d’olivier, posés sur du papier de soie à cœurs',
    largeur: 1080,
    hauteur: 1372,
  },
  '/photos/savons-parfums-ovales.webp': {
    alt: 'Cinq savons ovales étiquetés à la main : miel, café, olive, black opium et coco-vanille',
    largeur: 1200,
    hauteur: 1029,
  },
  '/photos/savons-coffret-2.webp': {
    alt: 'Coffret de quatre savons ovales parfumés café, olive et vanille, et un savon bleu',
    largeur: 1079,
    hauteur: 1094,
  },
  '/photos/theme-safari.webp': {
    alt: 'Vitrine sur le thème safari : lion, éléphant, zèbre et girafe devant un coucher de soleil sur la savane',
    largeur: 1200,
    hauteur: 900,
  },
  '/photos/theme-salon.webp': {
    alt: 'Vitrine sur le thème salon, au prénom de Josiane : canapé, meuble télé, tapis et bouquet',
    largeur: 1200,
    hauteur: 874,
  },
  '/photos/theme-chevaux.webp': {
    alt: 'Vitrine sur le thème chevaux, au prénom de Guy : jument, poulain et bottes de foin devant des montagnes',
    largeur: 1200,
    hauteur: 975,
  },
};

export function fichePhoto(chemin: string): FichePhoto | undefined {
  return PHOTOS[chemin];
}
