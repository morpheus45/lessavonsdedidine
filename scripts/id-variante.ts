// Utilitaire de test : renvoie l'identifiant d'une variante réelle.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const v = await prisma.variante.findFirst({
    where: { produit: { slug: 'douceur-avoine' } },
    orderBy: { prixCentimes: 'asc' },
  });
  console.log(v ? v.id : 'AUCUNE');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
