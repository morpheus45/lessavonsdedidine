/**
 * Construction de la page publiée sur GitHub Pages.
 *
 * ⚠️  14 septembre 2026 — l'ébauche visuelle n'est PLUS publiée.
 *
 * Elle décrivait les savons comme « saponifiés à froid », avec « six semaines
 * de cure » et un « surgras à 8 % ». C'est faux : Didine travaille en
 * fondre-et-verser sur une base commerciale au beurre de karité bio sans SLS,
 * et le savon durcit en 30 à 60 minutes.
 *
 * Publier ces mentions sur la boutique d'un commerce réel serait une pratique
 * commerciale trompeuse. Ce script publie donc une page d'attente véridique,
 * qui écrase au passage le contenu resté en cache sur le CDN de GitHub.
 *
 * Pour republier l'ébauche : corriger `design/ebauche-visuelle.html`, puis
 * remettre l'enveloppe d'origine ci-dessous (voir l'historique Git).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SORTIE = '_site';

const PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Les Savons de Didine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400&display=swap">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 32px;
    background: #f2f0eb;
    color: #2a2a28;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.6;
  }
  main { max-width: 56ch; }
  .eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #6e665c;
    margin: 0 0 24px;
  }
  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-weight: 400;
    font-size: clamp(38px, 7vw, 64px);
    line-height: 0.98;
    letter-spacing: -0.03em;
    margin: 0 0 24px;
  }
  h1 em { font-style: italic; color: #8a2b28; }
  p { margin: 0 0 18px; color: #6e665c; }
  .encadre {
    margin-top: 32px;
    border-left: 2px solid #8a2b28;
    padding: 4px 0 4px 20px;
    font-size: 14.5px;
  }
  .encadre strong { color: #2a2a28; }
  footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e6e3dc;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #6e665c;
  }
</style>
</head>
<body>
<main>
  <p class="eyebrow">Savons &amp; vitrines faits main</p>
  <h1>La boutique est <em>en cours d'écriture</em></h1>

  <p>
    Le site est en construction. La page qui se trouvait ici décrivait un
    procédé de fabrication qui n'était pas le bon&nbsp;: elle a été retirée.
  </p>

  <div class="encadre">
    <p style="margin-bottom:10px">
      <strong>Pourquoi cette page a été retirée</strong>
    </p>
    <p style="margin:0">
      L'ébauche annonçait des savons « saponifiés à froid » avec « six semaines
      de cure ». Ce n'est pas le procédé réel de l'atelier. Plutôt que de
      laisser une description inexacte en ligne le temps de la corriger, elle a
      été retirée le jour même.
    </p>
  </div>

  <footer>
    Les Savons de Didine · page d'attente · 14 septembre 2026
  </footer>
</main>
</body>
</html>
`;

mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'index.html'), PAGE, 'utf8');

const taille = Math.round(Buffer.byteLength(PAGE, 'utf8') / 1024);
console.log(`_site/index.html écrit — page d'attente, ${taille} ko`);
console.log("L'ébauche n'est pas publiée : son contenu produit est faux (voir l'en-tête de ce fichier).");
