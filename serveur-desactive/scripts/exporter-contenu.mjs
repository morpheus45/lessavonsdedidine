import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Sort le catalogue de la base vers des fichiers versionnés.
 *
 * Utilisé une fois, pour la bascule : le site redevient statique, donc la
 * source de vérité repasse de Postgres à des fichiers Markdown que le CMS
 * modifie par des commits. Gardé au dépôt parce qu'il resservira le jour où
 * l'on remettra une base — dans l'autre sens, ce sera le même travail.
 */
const prisma = new PrismaClient();

/** Échappe une valeur pour du YAML de frontmatter. */
function y(valeur) {
  if (valeur === null || valeur === undefined) return '';
  const texte = String(valeur);
  // Les guillemets doubles et les apostrophes typographiques sont fréquents
  // dans les descriptions : on cite systématiquement et on échappe.
  return `"${texte.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const produits = await prisma.produit.findMany({
  orderBy: { rang: 'asc' },
  include: {
    variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } },
    photos: { orderBy: { ordre: 'asc' } },
  },
});

mkdirSync('contenu/produits', { recursive: true });
for (const p of produits) {
  const lignes = [
    '---',
    `nom: ${y(p.nom)}`,
    `type: ${y(p.type)}`,
    `rang: ${p.rang}`,
    `actif: ${p.actif}`,
    `accroche: ${y(p.accroche)}`,
    `description: ${y(p.description)}`,
    `inci: ${y(p.inci)}`,
    'formules:',
    ...p.variantes.flatMap((v) => [
      `  - nom: ${y(v.nom)}`,
      `    prixCentimes: ${v.prixCentimes}`,
      `    unites: ${v.unites}`,
      `    poidsGrammes: ${v.poidsGrammes}`,
    ]),
    'photos:',
    ...p.photos.flatMap((ph) => [
      `  - fichier: ${y(ph.url.split('/').pop())}`,
      `    alt: ${y(ph.alt)}`,
    ]),
    '---',
  ];
  writeFileSync(join('contenu/produits', `${p.slug}.md`), lignes.join('\n') + '\n', 'utf8');
  console.log(`  contenu/produits/${p.slug}.md`);
}

const themes = await prisma.themeVitrine.findMany({
  orderBy: { ordre: 'asc' },
  include: { photos: { orderBy: { ordre: 'asc' } } },
});

mkdirSync('contenu/themes', { recursive: true });
for (const t of themes) {
  const lignes = [
    '---',
    `nom: ${y(t.nom)}`,
    `ordre: ${t.ordre}`,
    `actif: ${t.actif}`,
    `description: ${y(t.description)}`,
    'photos:',
    ...t.photos.flatMap((ph) => [
      `  - fichier: ${y(ph.url.split('/').pop())}`,
      `    alt: ${y(ph.alt)}`,
    ]),
    '---',
  ];
  writeFileSync(join('contenu/themes', `${t.slug}.md`), lignes.join('\n') + '\n', 'utf8');
  console.log(`  contenu/themes/${t.slug}.md`);
}

await prisma.$disconnect();
console.log(`\n  ${produits.length} produits, ${themes.length} thèmes.`);
