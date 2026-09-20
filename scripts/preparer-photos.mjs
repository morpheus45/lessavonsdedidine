import sharp from 'sharp';
import { mkdirSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, parse } from 'node:path';

/**
 * Prépare les photos avant la construction du site.
 *
 * Didine dépose ses photos depuis /admin/ : le CMS les commit telles qu'elles
 * sortent du téléphone, souvent 4 Mo et 4000 px de large. Ce script les
 * redresse, les réduit aux deux tailles d'affichage et les convertit en WebP.
 * Elle n'a rien à préparer — c'est le sens de « des photos qui se réduisent
 * seules ».
 *
 *   source : contenu/photos/      (versionné, ce que Didine envoie)
 *   sortie : public/photos/       (produit, jamais versionné)
 */
const SOURCE = 'contenu/photos';
const SORTIE = 'public/photos';

const LARGEURS = [
  { suffixe: '', largeur: 1200 },
  { suffixe: '@small', largeur: 600 },
];

/** Formats qu'un téléphone peut produire. */
const ACCEPTES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif']);

if (!existsSync(SOURCE)) {
  console.error(`  ${SOURCE} est absent : rien à préparer.`);
  process.exit(0);
}

// On repart d'un dossier vide : une photo retirée du contenu ne doit pas
// survivre dans le site publié.
rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(SORTIE, { recursive: true });

const fichiers = readdirSync(SOURCE).filter((f) => ACCEPTES.has(parse(f).ext.toLowerCase()));
const dimensions = {};
let avant = 0;
let apres = 0;

for (const fichier of fichiers) {
  const { name } = parse(fichier);
  const entree = join(SOURCE, fichier);
  const meta = await sharp(entree).metadata();
  avant += meta.size ?? 0;

  for (const taille of LARGEURS) {
    const nom = `${name}${taille.suffixe}.webp`;
    const info = await sharp(entree)
      // Sans cela, une photo prise en portrait arrive couchée : l'appareil
      // n'a pas tourné les pixels, il a seulement noté l'orientation.
      .rotate()
      .resize({ width: taille.largeur, withoutEnlargement: true })
      // 78 : le grain d'une photo de téléphone masque les artefacts, et le
      // gain de poids est considérable par rapport à 90.
      .webp({ quality: 78 })
      .toFile(join(SORTIE, nom));

    apres += info.size;
    if (taille.suffixe === '') {
      dimensions[`${name}.webp`] = { largeur: info.width, hauteur: info.height };
    }
  }

  console.log(`  ${name.padEnd(26)} ${meta.width}×${meta.height} → 1200 + 600 px`);
}

// Lu par src/lib/catalogue.ts pour réserver la place de chaque image avant
// son chargement : sans dimensions, la page saute quand la photo arrive.
writeFileSync(join(SORTIE, 'dimensions.json'), JSON.stringify(dimensions, null, 2), 'utf8');

const mo = (o) => `${Math.round((o / 1024 / 1024) * 10) / 10} Mo`;
console.log(
  `\n  ${fichiers.length} photos · ${mo(avant)} → ${mo(apres)} en deux tailles chacune.`,
);
