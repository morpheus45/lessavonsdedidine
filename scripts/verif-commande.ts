// Vérifie qu'une commande a bien réservé son stock et journalisé son état.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.commande.findFirst({
    orderBy: { creeeLe: 'desc' },
    include: { lignes: { include: { lot: true, variante: true } }, evenements: true },
  });
  if (!c) { console.log('Aucune commande.'); return; }

  console.log(`Commande ${c.reference} — statut « ${c.statut} »`);
  console.log(`  client   : ${c.nom} <${c.email}>`);
  console.log(`  montants : sous-total ${c.sousTotalCentimes} + livraison ${c.livraisonCentimes} = ${c.totalCentimes} centimes`);
  console.log(`  cohérent : ${c.sousTotalCentimes + c.livraisonCentimes === c.totalCentimes ? 'OUI' : 'NON — INCOHERENCE'}`);
  console.log('  lignes :');
  for (const l of c.lignes) {
    console.log(`    ${l.libelle} × ${l.quantite} = ${l.totalCentimes} c  | lot ${l.lot?.reference ?? 'aucun'} (reste ${l.lot?.quantiteRestante})`);
  }
  console.log('  journal :');
  for (const e of c.evenements) console.log(`    ${e.statut} par ${e.auteur} — ${e.detail ?? ''}`);

  const lot = c.lignes[0]?.lot;
  if (lot) {
    console.log(`\n  Stock du lot ${lot.reference} : produit ${lot.quantiteProduite}, reste ${lot.quantiteRestante}`);
    const attendu = lot.quantiteProduite - (c.lignes[0]!.quantite * c.lignes[0]!.variante.unites);
    console.log(`  Décrément correct : ${lot.quantiteRestante === attendu ? 'OUI' : `NON (attendu ${attendu})`}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
