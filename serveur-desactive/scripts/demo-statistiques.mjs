import { PrismaClient } from '@prisma/client';

/**
 * Commandes de démonstration, pour travailler sur le tableau de bord.
 *
 * Un tableau de bord ne se conçoit pas sur une base vide : on ne voit ni si
 * la courbe respire, ni si les étiquettes se chevauchent, ni si les
 * pourcentages tombent juste. Ce script pose de quoi regarder.
 *
 *   node scripts/demo-statistiques.mjs poser
 *   node scripts/demo-statistiques.mjs effacer
 *
 * Il REFUSE de tourner sur autre chose qu'une base locale. Des commandes
 * inventées dans la vraie base fausseraient la comptabilité de Didine, et
 * une pièce comptable ne se supprime pas à la légère.
 */
const prisma = new PrismaClient();
const PREFIXE = 'DEMO-';

if (!process.env.DATABASE_URL?.includes('localhost')) {
  console.error('  Refusé : ce script ne tourne que sur la base locale.');
  process.exit(1);
}

const action = process.argv[2];

if (action === 'effacer') {
  const ids = (await prisma.commande.findMany({
    where: { reference: { startsWith: PREFIXE } },
    select: { id: true },
  })).map((c) => c.id);
  await prisma.evenementCommande.deleteMany({ where: { commandeId: { in: ids } } });
  await prisma.ligneCommande.deleteMany({ where: { commandeId: { in: ids } } });
  const { count } = await prisma.commande.deleteMany({ where: { id: { in: ids } } });
  console.log(`  ${count} commandes de démonstration effacées.`);
  await prisma.$disconnect();
  process.exit(0);
}

const variantes = await prisma.variante.findMany({ include: { produit: true } });
const themes = await prisma.themeVitrine.findMany();
const hasard = (n) => Math.floor(Math.random() * n);

let posees = 0;
for (let jour = 88; jour >= 0; jour--) {
  // Une boutique n'a pas une commande par jour : environ deux sur cinq.
  if (Math.random() > 0.42) continue;

  const quand = new Date(Date.now() - jour * 86_400_000);
  quand.setHours(9 + hasard(11), hasard(60));

  const nb = 1 + hasard(2);
  const lignes = [];
  let sousTotal = 0;

  for (let i = 0; i < nb; i++) {
    const v = variantes[hasard(variantes.length)];
    const quantite = 1 + hasard(2);
    const total = v.prixCentimes * quantite;
    sousTotal += total;
    const vitrine = v.produit.type === 'vitrine';
    lignes.push({
      varianteId: v.id,
      libelle: `${v.produit.nom} — ${v.nom}`,
      prixUnitaireCentimes: v.prixCentimes,
      quantite,
      totalCentimes: total,
      prenom: vitrine ? ['Josiane', 'Guy', 'Lucie', 'Marcel'][hasard(4)] : null,
      themeId: vitrine ? themes[hasard(themes.length)].id : null,
    });
  }

  const livraison = sousTotal >= 3900 ? 0 : 490;
  posees++;

  await prisma.commande.create({
    data: {
      reference: `${PREFIXE}${String(posees).padStart(4, '0')}`,
      statut: jour < 3 ? 'payee' : jour < 10 ? 'expediee' : 'livree',
      email: `demo${posees}@exemple.fr`,
      nom: 'Cliente de démonstration',
      adresse: '1 rue de la Démonstration',
      codePostal: '00000',
      ville: 'Démonstration',
      sousTotalCentimes: sousTotal,
      livraisonCentimes: livraison,
      totalCentimes: sousTotal + livraison,
      moyenPaiement: 'paypal',
      creeeLe: quand,
      payeeLe: quand,
      lignes: { create: lignes },
    },
  });
}

console.log(`  ${posees} commandes de démonstration posées sur 90 jours.`);
await prisma.$disconnect();
