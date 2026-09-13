/**
 * Construit le site statique publié sur GitHub Pages.
 *
 * `design/ebauche-visuelle.html` est écrit pour l'enveloppe des artefacts
 * Claude : il commence directement par <title>, <link> et <style>, sans
 * doctype, sans <head>, sans <body>, et surtout sans <meta viewport>.
 * Servi tel quel par un serveur web, il s'afficherait cassé sur mobile.
 *
 * Ce script reconstitue un document HTML complet autour du fragment, et
 * l'écrit dans `_site/index.html`. Rien n'est dupliqué dans le dépôt : la
 * source reste l'unique fichier de design, et la page publiée est
 * régénérée à chaque push par le workflow `.github/workflows/pages.yml`.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'design', 'ebauche-visuelle.html');
const sortie = join(racine, '_site');

const fragment = readFileSync(source, 'utf8');

/* Le fragment se termine toujours par son bloc <style> avant le contenu :
   tout ce qui précède appartient au <head>, le reste au <body>. */
const fin = fragment.indexOf('</style>');
if (fin === -1) {
  console.error('Bloc <style> introuvable dans ' + source + ' — structure inattendue.');
  process.exit(1);
}
const tete = fragment.slice(0, fin + '</style>'.length);
const corps = fragment.slice(fin + '</style>'.length);

if (!/<title>/.test(tete)) {
  console.error('Balise <title> introuvable dans l’en-tête — structure inattendue.');
  process.exit(1);
}

const document = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Ébauche visuelle de la boutique Les Savons de Didine : direction artistique, identité, écrans de la boutique, tunnel de paiement et backoffice.">
<!-- Document de travail : on ne veut pas qu'il soit référencé sous le nom
     de la marque avant l'ouverture réelle de la boutique. -->
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<style>img{max-width:100%}[hidden]{display:none!important}</style>
${tete}
</head>
<body>
${corps}
</body>
</html>
`;

mkdirSync(sortie, { recursive: true });
writeFileSync(join(sortie, 'index.html'), document, 'utf8');

const ko = Math.round(Buffer.byteLength(document, 'utf8') / 1024);
console.log(`_site/index.html écrit — ${ko} ko`);
