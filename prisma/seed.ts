/**
 * Jeu de données de départ.
 *
 * ⚠️  LES CINQ RECETTES CI-DESSOUS SONT DES PLACEHOLDERS.
 *     Elles viennent de l'ébauche visuelle, pas de Didine. Dès que ses
 *     vraies recettes, ses vrais prix et ses vraies listes INCI sont
 *     connus, c'est ce fichier qu'il faut modifier — puis `npm run db:reset`.
 *
 * Les données doivent rester réalistes : un jeu d'essai avec « Produit 1,
 * Produit 2 » rend toute revue d'interface impossible, on ne voit plus si
 * la mise en page tient avec de vrais libellés.
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb) as (m: string, s: Buffer, l: number) => Promise<Buffer>;

async function hacher(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  const derive = await scrypt(motDePasse, sel, 64);
  return `${sel.toString('hex')}:${derive.toString('hex')}`;
}

const jours = (n: number) => new Date(Date.now() + n * 86_400_000);

type Recette = {
  rang: number;
  slug: string;
  nom: string;
  accroche: string;
  description: string;
  inci: string;
  surgras: number;
  variantes: { nom: string; poidsGrammes: number; prixCentimes: number; unites: number }[];
};

const RECETTES: Recette[] = [
  {
    rang: 1,
    slug: 'douceur-avoine',
    nom: "Douceur d'avoine",
    accroche: 'Avoine colloïdale et miel de lavandin',
    description:
      "Avoine colloïdale moulue à l'atelier et miel de lavandin. Surgras à 8 % : une part des huiles n'est pas saponifiée et reste dans le pain, ce qui évite la sensation de tiraillement après la douche.",
    inci: 'Olea Europaea Fruit Oil, Aqua, Cocos Nucifera Oil, Sodium Hydroxide, Butyrospermum Parkii Butter, Ricinus Communis Seed Oil, Avena Sativa Kernel Flour, Mel',
    surgras: 8,
    variantes: [
      { nom: '1 pain', poidsGrammes: 100, prixCentimes: 750, unites: 1 },
      { nom: 'Lot de 3', poidsGrammes: 300, prixCentimes: 2000, unites: 3 },
    ],
  },
  {
    rang: 2,
    slug: 'argile-verte',
    nom: 'Argile verte',
    accroche: 'Peaux mixtes à grasses',
    description:
      "Argile verte montmorillonite incorporée à la trace. Elle absorbe l'excès de sébum sans décaper — le surgras compense ce que l'argile emporte.",
    inci: 'Olea Europaea Fruit Oil, Aqua, Cocos Nucifera Oil, Sodium Hydroxide, Butyrospermum Parkii Butter, Illite, Ricinus Communis Seed Oil',
    surgras: 8,
    variantes: [{ nom: '1 pain', poidsGrammes: 100, prixCentimes: 700, unites: 1 }],
  },
  {
    rang: 3,
    slug: 'lavandin-romarin',
    nom: 'Lavandin & romarin',
    accroche: "Huiles essentielles distillées à 20 km de l'atelier",
    description:
      "Lavandin grosso et romarin à cinéole, ajoutés hors chauffe pour préserver les molécules aromatiques. Déconseillé aux femmes enceintes et aux enfants de moins de trois ans.",
    inci: 'Olea Europaea Fruit Oil, Aqua, Cocos Nucifera Oil, Sodium Hydroxide, Butyrospermum Parkii Butter, Lavandula Hybrida Oil, Rosmarinus Officinalis Leaf Oil, Linalool, Limonene',
    surgras: 8,
    variantes: [{ nom: '1 pain', poidsGrammes: 100, prixCentimes: 700, unites: 1 }],
  },
  {
    rang: 4,
    slug: 'coffret-quatre-recettes',
    nom: 'Les quatre recettes',
    accroche: 'Dans un écrin de carton recyclé',
    description:
      "Les quatre pains de la gamme, dans un coffret de carton recyclé non blanchi. Chaque pain porte son propre numéro de lot.",
    inci: 'Voir la composition de chaque pain sur sa fiche',
    surgras: 8,
    variantes: [{ nom: 'Coffret de 4', poidsGrammes: 400, prixCentimes: 2600, unites: 4 }],
  },
  {
    rang: 5,
    slug: 'shampoing-solide',
    nom: 'Shampoing solide',
    accroche: 'Sans sulfate · environ 60 lavages',
    description:
      "Base lavante douce sans sulfate, enrichie en huile de ricin. Un temps d'adaptation de deux à trois semaines est normal : le cuir chevelu régule sa production de sébum.",
    inci: 'Sodium Cocoyl Isethionate, Aqua, Ricinus Communis Seed Oil, Butyrospermum Parkii Butter, Cetearyl Alcohol, Panthenol',
    surgras: 5,
    variantes: [{ nom: '1 pain', poidsGrammes: 80, prixCentimes: 950, unites: 1 }],
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
  await prisma.session.deleteMany();
  await prisma.administrateur.deleteMany();
  await prisma.reglage.deleteMany();

  console.log('Produits et variantes…');
  for (const r of RECETTES) {
    await prisma.produit.create({
      data: {
        rang: r.rang,
        slug: r.slug,
        nom: r.nom,
        accroche: r.accroche,
        description: r.description,
        inci: r.inci,
        surgras: r.surgras,
        variantes: { create: r.variantes.map((v) => ({ ...v })) },
      },
    });
  }

  console.log('Lots…');
  const produits = await prisma.produit.findMany({ orderBy: { rang: 'asc' } });
  const lettres = ['A', 'B', 'C', 'D', 'E'];

  for (const [i, p] of produits.entries()) {
    // Un lot déjà sorti de cure, vendable aujourd'hui.
    await prisma.lot.create({
      data: {
        reference: `26-09-${lettres[i]}`,
        produitId: p.id,
        couleLe: jours(-42),
        pretLe: jours(-1),
        durableJusquLe: jours(365),
        quantiteProduite: 60,
        quantiteRestante: 60 - i * 6,
      },
    });

    // Un lot encore en cure : il doit apparaître dans le backoffice comme
    // à venir, et ne jamais être servi à un client.
    await prisma.lot.create({
      data: {
        reference: `26-10-${lettres[i]}`,
        produitId: p.id,
        couleLe: jours(-9),
        pretLe: jours(33),
        durableJusquLe: jours(398),
        quantiteProduite: 60,
        quantiteRestante: 60,
        notes: 'En cure — ne pas mettre en vente avant la date de sortie.',
      },
    });
  }

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
      { cle: 'delai_expedition_heures', valeur: '48' },
    ],
  });

  console.log('\n─────────────────────────────────────────────');
  console.log(`  ${produits.length} produits, ${produits.length * 2} lots`);
  console.log('  Backoffice : /admin');
  console.log('  Identifiant : didine@les-savons-de-didine.fr');
  console.log(`  Mot de passe : ${motDePasse}   ← à changer avant toute mise en ligne`);
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
