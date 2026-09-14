/**
 * Jeu de données de départ — offre réelle de Didine.
 *
 * Source : ses propres messages du 13 septembre 2026.
 *
 *   « Je prends une base de savon au beurre de karité bio, sans SLS. »
 *   « Fondre et verser : coupez en cubes, faites fondre au micro-ondes ou au
 *     bain-marie, parfumez, colorez et coulez dans vos moules en silicone.
 *     Le savon durcit en 30 à 60 minutes. »
 *   « 4 savons achetés le 5ème offert, pour 20 euros. »
 *   « 8 savons achetés = 2 savons offerts, pour 40 euros. »
 *   « Les vitrines, ça se vend entre 45 € et 90 euros, ça dépend de ce
 *     qu'ils veulent comme petits objets. »
 *
 * ⚠️  À FAIRE VALIDER PAR DIDINE avant toute mise en ligne :
 *     - le nombre d'objets par formule de vitrine (inventé ici)
 *     - les dimensions des cadres
 *     - la liste définitive des thèmes
 *     - le délai de fabrication d'une vitrine
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb) as (m: string, s: Buffer, l: number) => Promise<Buffer>;

async function hacher(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  return `${sel.toString('hex')}:${(await scrypt(motDePasse, sel, 64)).toString('hex')}`;
}

const jours = (n: number) => new Date(Date.now() + n * 86_400_000);

/** Les parfums réellement vus sur ses photos et cités dans ses messages. */
const PARFUMS = [
  'Café',
  'Vanille',
  'Coco-vanille',
  'Black Opium',
  'Olive',
  'Miel',
  'Menthe',
  'Fraise',
  'Bubble gum',
  'Caramel',
  'Citron',
];

/** Thèmes de vitrine repérés sur ses réalisations. */
const THEMES = [
  {
    slug: 'safari',
    nom: 'Safari',
    description: "Lion, éléphant, zèbre et girafe devant un coucher de soleil sur la savane.",
  },
  {
    slug: 'chevaux',
    nom: 'Chevaux',
    description: 'Jument, poulain et bottes de foin sur une prairie, montagnes en fond.',
  },
  {
    slug: 'salon',
    nom: 'Salon',
    description: "Canapé, meuble télé, tapis et bouquet — une pièce à vivre en miniature.",
  },
  {
    slug: 'chambre-enfant',
    nom: "Chambre d'enfant",
    description: 'Berceau, cheval à bascule et papier peint fleuri, dans des tons doux.',
  },
];

async function main() {
  console.log('Nettoyage…');
  await prisma.evenementCommande.deleteMany();
  await prisma.ligneCommande.deleteMany();
  await prisma.commande.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.variante.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.themeVitrine.deleteMany();
  await prisma.session.deleteMany();
  await prisma.administrateur.deleteMany();
  await prisma.reglage.deleteMany();

  // ── Vitrines ───────────────────────────────────────────────────────
  // Fabriquées à la commande : aucun lot, aucun stock. Le prix dépend de
  // la taille du cadre et du nombre de petits objets.
  console.log('Vitrines…');
  const vitrine = await prisma.produit.create({
    data: {
      type: 'vitrine',
      rang: 1,
      slug: 'vitrine-personnalisee',
      nom: 'Vitrine personnalisée',
      accroche: 'Une scène en miniature, au prénom de la personne',
      description:
        "Un cadre en bois peint à la main, garni d'une scène composée objet par objet, avec le prénom en lettres sur le dessus. Chaque vitrine est montée à la commande : le thème, le prénom et les petits objets sont choisis par vous.",
      inci: 'Sans objet — la vitrine est un objet de décoration, pas un cosmétique.',
      surgras: 0,
      variantes: {
        create: [
          { nom: 'Petite', poidsGrammes: 0, prixCentimes: 4500, unites: 1 },
          { nom: 'Moyenne', poidsGrammes: 0, prixCentimes: 6500, unites: 1 },
          { nom: 'Grande', poidsGrammes: 0, prixCentimes: 9000, unites: 1 },
        ],
      },
    },
  });

  for (const [i, t] of THEMES.entries()) {
    await prisma.themeVitrine.create({ data: { ...t, ordre: i } });
  }

  // ── Savons ─────────────────────────────────────────────────────────
  // Son offre est en lots, pas à l'unité : 4 achetés + 1 offert pour 20 €,
  // 8 achetés + 2 offerts pour 40 €.
  console.log('Savons…');
  const savon = await prisma.produit.create({
    data: {
      type: 'savon',
      rang: 2,
      slug: 'savons-parfumes',
      nom: 'Savons parfumés',
      accroche: `${PARFUMS.length} parfums au choix, coulés à la main`,
      description:
        "Base de savon au beurre de karité biologique, sans SLS. Fondue au bain-marie, parfumée avec un arôme naturel, colorée avec un colorant naturel, parfois enrichie de miel, puis coulée dans un moule en silicone à motif — brin d'olivier ou fleur. Prise en trente à soixante minutes, démoulage, étiquetage et mise en sachet à la main.",
      inci: 'Base commerciale au beurre de karité biologique, sans laurylsulfate de sodium (SLS). La liste INCI complète figure sur le sachet — à reporter ici depuis l’étiquette du fournisseur.',
      surgras: 0,
      variantes: {
        create: [
          { nom: 'Lot de 5 — 4 achetés, 1 offert', poidsGrammes: 0, prixCentimes: 2000, unites: 5 },
          { nom: 'Lot de 10 — 8 achetés, 2 offerts', poidsGrammes: 0, prixCentimes: 4000, unites: 10 },
        ],
      },
    },
  });

  // Une série en cours, pour que le stock affiché soit réel.
  await prisma.lot.create({
    data: {
      reference: '26-09-A',
      produitId: savon.id,
      couleLe: jours(-3),
      pretLe: jours(-3), // prêt le jour même : le savon durcit en une heure
      durableJusquLe: jours(730),
      quantiteProduite: 120,
      quantiteRestante: 96,
      notes: `Parfums de la série : ${PARFUMS.join(', ')}.`,
    },
  });

  console.log('Compte administrateur…');
  const motDePasse = 'didine2026';
  await prisma.administrateur.create({
    data: {
      email: 'didine@les-savons-de-didine.fr',
      nom: 'Didine',
      motDePasseHash: await hacher(motDePasse),
    },
  });

  await prisma.reglage.createMany({
    data: [
      { cle: 'seuil_livraison_offerte_centimes', valeur: '3900' },
      { cle: 'livraison_centimes', valeur: '490' },
      { cle: 'parfums_disponibles', valeur: PARFUMS.join('|') },
      { cle: 'delai_fabrication_vitrine_jours', valeur: '7' },
    ],
  });

  console.log('\n─────────────────────────────────────────────');
  console.log(`  Vitrines : 3 formules (45 / 65 / 90 €), ${THEMES.length} thèmes`);
  console.log(`  Savons   : 2 lots (20 / 40 €), ${PARFUMS.length} parfums`);
  console.log('  Backoffice : /admin');
  console.log(`  ${'didine@les-savons-de-didine.fr'} · ${motDePasse}`);
  console.log('\n  ⚠ À valider avec Didine : nombre d’objets et dimensions');
  console.log('    par formule, liste définitive des thèmes, délai de');
  console.log('    fabrication, et la vraie liste INCI du fournisseur.');
  console.log('─────────────────────────────────────────────\n');

  void vitrine;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
