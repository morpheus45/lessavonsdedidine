import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'C:/Users/cedri/.claude/uploads/240d1c44-1361-44e0-8ce1-6435c0ae19da';
const DST = 'public/photos';
mkdirSync(DST, { recursive: true });

// Correspondance établie depuis l'ordre d'affichage des envois.
// Les captures d'écran (1080×2400, interface du téléphone visible) sont écartées.
const PHOTOS = [
  ['b9fbb2fb', 'savons-parfums',        'Six savons fleur emballés, étiquetés caramel, citron, fraise, bubble gum, miel et menthe'],
  ['4ea94640', 'savons-fleurs',          'Savons en forme de fleur, teintes crème et lavande, dans une caisse en bois'],
  ['e2bb347a', 'savons-coffret',         'Coffret de quatre savons ovales au motif de brin d’olivier, sur papier de soie à cœurs'],
  ['33bbbdd6', 'savons-parfums-ovales',  'Cinq savons ovales étiquetés : miel, café, olive, black opium et coco-vanille'],
  ['aa89f3c0', 'savons-coffret-2',       'Coffret de quatre savons ovales : café, olive, vanille et bleu'],
  ['464b7a23', 'theme-safari',           'Vitrine sur le thème safari : lion, éléphant, zèbre et girafe devant un coucher de soleil'],
  ['166726ba', 'theme-salon',            'Vitrine sur le thème salon, au prénom de Josiane : canapé, meuble télé et tapis'],
  ['6d26ae57', 'theme-chevaux',          'Vitrine sur le thème chevaux, au prénom de Guy : jument, poulain et bottes de foin'],
  ['6f6ef6c0', 'theme-chambre-enfant',   'Vitrine sur le thème chambre d’enfant : berceau, cheval à bascule et papier peint fleuri'],
];

const TAILLES = [
  { suffixe: '',      largeur: 1200 },
  { suffixe: '@small', largeur: 600 },
];

let avant = 0, apres = 0;

for (const [prefixe, nom] of PHOTOS) {
  const source = join(SRC, `${prefixe}-image.jpg`);
  const meta = await sharp(source).metadata();
  avant += meta.size ?? 0;

  for (const t of TAILLES) {
    const sortie = join(DST, `${nom}${t.suffixe}.webp`);
    const info = await sharp(source)
      .rotate()                                   // respecte l'orientation EXIF du téléphone
      .resize({ width: t.largeur, withoutEnlargement: true })
      .webp({ quality: 78 })                      // 78 : le grain d'une photo au téléphone masque les artefacts
      .toFile(sortie);
    apres += info.size;
  }
  console.log(`  ${nom.padEnd(24)} ${meta.width}×${meta.height} → 1200 + 600 px`);
}

console.log(`\n  ${Math.round(avant / 1024 / 1024 * 10) / 10} Mo → ${Math.round(apres / 1024 / 1024 * 10) / 10} Mo (deux tailles chacune)`);
