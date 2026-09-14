/**
 * Vitrine statique publiée sur GitHub Pages.
 *
 * Pourquoi une vitrine et pas la boutique : GitHub Pages ne sert que des
 * fichiers. Pas de serveur, donc pas de base de données, pas d'actions
 * serveur, pas de panier, pas de backoffice, pas de PayPal. La boutique qui
 * encaisse a besoin d'un hébergement Node — voir MISE-EN-LIGNE.md.
 *
 * Cette page-ci est générée depuis la VRAIE base : les produits, les prix et
 * les thèmes affichés sont ceux du catalogue, pas des valeurs recopiées à la
 * main qui divergeraient au premier changement de tarif.
 *
 * Elle dit explicitement ce qu'elle est. Laisser croire qu'on peut commander
 * ici serait pire que de ne rien publier.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const SORTIE = '_site';
const prisma = new PrismaClient();

const prix = (centimes) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(centimes / 100);

const echapper = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function main() {
  const produits = await prisma.produit.findMany({
    where: { actif: true },
    orderBy: { rang: 'asc' },
    include: { variantes: { where: { actif: true }, orderBy: { prixCentimes: 'asc' } } },
  });
  const themes = await prisma.themeVitrine.findMany({
    where: { actif: true },
    orderBy: { ordre: 'asc' },
  });

  const vitrines = produits.filter((p) => p.type === 'vitrine');
  const savons = produits.filter((p) => p.type === 'savon');

  const carte = (p) => `
    <article class="carte">
      <p class="gamme">${p.type === 'vitrine' ? 'Sur mesure' : 'Fait main'}</p>
      <h3>${echapper(p.nom)}</h3>
      <p class="accroche">${echapper(p.accroche)}</p>
      <ul class="formules">
        ${p.variantes
          .map((v) => `<li><span>${echapper(v.nom)}</span><b>${prix(v.prixCentimes)}</b></li>`)
          .join('')}
      </ul>
    </article>`;

  const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Savons parfumés faits main et vitrines personnalisées — Les Savons de Didine.">
<title>Les Savons de Didine</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap">
<style>
  :root{
    color-scheme:light;
    --nuage:#f2f0eb; --neige:#fbfaf8; --brume:#e6e3dc; --brume2:#d3cfc6;
    --foret:#0f3a2c; --foret3:#a8c0a0; --or:#c8a455;
    --grenat:#8a2b28; --grenat2:#dda39d;
    --graphite:#2a2a28; --taupe:#6e665c;
    --serif:'Instrument Serif',Georgia,serif;
    --sans:'Instrument Sans',system-ui,sans-serif;
    --mono:'DM Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--nuage);color:var(--graphite);font-family:var(--sans);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
  h1,h2,h3{font-family:var(--serif);font-weight:400;margin:0;line-height:.98;letter-spacing:-.025em;text-wrap:balance}
  p{margin:0}
  .page{max-width:1100px;margin:0 auto;padding:0 24px}
  .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--taupe)}

  .bandeau{background:var(--foret);color:var(--nuage);font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;text-align:center;padding:10px 24px}
  .bandeau i{color:var(--or);font-style:normal;margin:0 10px}

  header.hero{padding:80px 0 64px}
  header.hero h1{font-size:clamp(46px,9vw,104px);letter-spacing:-.035em;line-height:.92}
  header.hero h1 em{font-style:italic;color:var(--grenat)}
  header.hero .sous{font-size:clamp(17px,2vw,20px);color:var(--taupe);max-width:54ch;margin-top:28px}

  .avis{margin:0 0 56px;border-left:2px solid var(--grenat);padding:6px 0 6px 20px;max-width:62ch}
  .avis b{display:block;margin-bottom:6px}
  .avis p{font-size:14.5px;color:var(--taupe)}

  section{padding:56px 0;border-top:1px solid var(--brume)}
  section > h2{font-size:clamp(30px,4.4vw,44px);margin-bottom:12px}
  section > .intro{color:var(--taupe);max-width:62ch;margin-bottom:36px;font-size:16.5px}

  .grille{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
  .carte{background:var(--neige);border:1px solid var(--brume);border-radius:10px;padding:26px}
  .carte .gamme{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--grenat);margin-bottom:10px}
  .carte h3{font-size:27px;margin-bottom:10px}
  .carte .accroche{font-size:14.5px;color:var(--taupe);margin-bottom:20px}
  .formules{list-style:none;margin:0;padding:0;border-top:1px solid var(--brume)}
  .formules li{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--brume);font-size:14.5px}
  .formules b{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap}

  .themes{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
  .themes span{border:1px solid var(--brume2);background:var(--neige);border-radius:20px;padding:7px 15px;font-size:13.5px}

  .bande{background:var(--foret);color:var(--nuage);padding:64px 0;border:0}
  .bande h2{color:var(--nuage);max-width:20ch;font-size:clamp(28px,4vw,42px)}
  .bande p{color:var(--foret3);max-width:60ch;margin-top:18px;font-size:16px}
  .etapes{display:grid;gap:26px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-top:48px}
  .etapes div{border-top:1px solid #3e6454;padding-top:18px}
  .etapes h3{font-size:21px;color:var(--nuage);margin-bottom:8px}
  .etapes p{font-size:13.5px;color:var(--foret3);margin:0}
  .etapes .rang{font-family:var(--mono);font-size:12px;letter-spacing:.16em;color:var(--grenat2);margin-bottom:8px}

  footer{padding:48px 0 72px;border-top:1px solid var(--brume);font-family:var(--mono);font-size:12px;color:var(--taupe)}
  @media(max-width:640px){header.hero{padding:48px 0 40px}section{padding:40px 0}}
</style>
</head>
<body>

<div class="bandeau">
  Beurre de karité bio <i>·</i> Sans SLS <i>·</i> Miel et arômes naturels <i>·</i> Fait main en petites séries
</div>

<div class="page">

  <header class="hero">
    <p class="eyebrow">Savons parfumés &amp; vitrines personnalisées</p>
    <h1>Les Savons<br>de <em>Didine</em></h1>
    <p class="sous">
      Des savons coulés à la main, et des vitrines montées objet par objet
      au prénom de la personne. Tout est fabriqué en petites séries.
    </p>
  </header>

  <div class="avis">
    <b>Ceci est un aperçu, pas la boutique.</b>
    <p>
      Cette page montre le catalogue et le design. On ne peut pas encore
      commander&nbsp;: le panier, le paiement et la gestion des commandes
      existent, mais ils ont besoin d'un hébergement avec serveur, que
      GitHub&nbsp;Pages ne fournit pas. Les prix affichés sont ceux du vrai
      catalogue.
    </p>
  </div>

  ${
    vitrines.length
      ? `<section>
    <h2>Les vitrines</h2>
    <p class="intro">
      Un cadre en bois peint à la main, garni d'une scène composée objet par
      objet, avec le prénom en lettres sur le dessus. Chaque vitrine est montée
      à la commande.
    </p>
    <div class="grille">${vitrines.map(carte).join('')}</div>
    ${
      themes.length
        ? `<p class="eyebrow" style="margin-top:34px;margin-bottom:10px">Thèmes disponibles</p>
    <div class="themes">${themes.map((t) => `<span>${echapper(t.nom)}</span>`).join('')}</div>`
        : ''
    }
  </section>`
      : ''
  }

  ${
    savons.length
      ? `<section>
    <h2>Les savons</h2>
    <p class="intro">
      Base au beurre de karité biologique, sans SLS. Fondue au bain-marie,
      parfumée et colorée avec des produits naturels, parfois enrichie de miel,
      puis coulée dans un moule à motif — brin d'olivier ou fleur.
    </p>
    <div class="grille">${savons.map(carte).join('')}</div>
  </section>`
      : ''
  }

</div>

<section class="bande">
  <div class="page">
    <p class="eyebrow" style="color:var(--or);margin-bottom:18px">Dans l'atelier</p>
    <h2>Quatre gestes, et le savon est prêt en une heure</h2>
    <p>
      Fondre, parfumer, colorer, couler. Le procédé est court, et c'est ce qui
      permet le sur-mesure : un parfum demandé le matin peut être coulé
      l'après-midi, sans stock à écouler.
    </p>
    <div class="etapes">
      <div><p class="rang">Étape 1</p><h3>La base</h3><p>Au beurre de karité biologique, sans SLS. Opaque, douce, choisie pour ne pas décaper.</p></div>
      <div><p class="rang">Étape 2</p><h3>La fonte</h3><p>Coupée en cubes puis fondue au bain-marie, doucement.</p></div>
      <div><p class="rang">Étape 3</p><h3>Le parfum</h3><p>Arôme naturel, colorant naturel, parfois du miel.</p></div>
      <div><p class="rang">Étape 4</p><h3>La coulée</h3><p>En moule de silicone à motif. Prise en trente à soixante minutes.</p></div>
    </div>
  </div>
</section>

<div class="page">
  <footer>
    Les Savons de Didine · Aperçu du catalogue · Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
  </footer>
</div>

</body>
</html>
`;

  mkdirSync(SORTIE, { recursive: true });
  writeFileSync(join(SORTIE, 'index.html'), page, 'utf8');

  console.log(
    `_site/index.html écrit — ${vitrines.length} vitrine(s), ${savons.length} gamme(s) de savon, ` +
      `${themes.length} thème(s), ${Math.round(Buffer.byteLength(page, 'utf8') / 1024)} ko`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
