import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { SECTIONS } from '../src/donnees/questions.ts';

/**
 * Produit le formulaire de Didine à partir de la liste des questions.
 *
 * Écrire les questions à deux endroits — le formulaire qu'elle remplit et le
 * relevé que je consulte — c'est se garantir qu'un jour l'un aura une
 * question que l'autre ignore. Les deux sont produits d'ici.
 *
 *   node scripts/generer-questionnaire.mjs
 */
const CONFIG = 'public/admin/config.yml';
const REPONSES = 'contenu/reponses.md';

/**
 * Cite une valeur pour du YAML.
 *
 * Un texte court tient sur la ligne ; un texte long devient un bloc plié,
 * lisible dans le fichier et recollé en une seule ligne à la lecture. `marge`
 * est l'indentation de la CLÉ : les lignes du bloc vont deux crans plus loin.
 */
function y(texte, marge) {
  const propre = String(texte).replace(/\s+/g, ' ').trim();
  if (propre.length <= 68) return JSON.stringify(propre);

  const lignes = [];
  let courante = '';
  for (const mot of propre.split(' ')) {
    if ((courante + ' ' + mot).trim().length > 66) {
      lignes.push(courante.trim());
      courante = mot;
    } else {
      courante = (courante + ' ' + mot).trim();
    }
  }
  if (courante) lignes.push(courante.trim());

  const creux = ' '.repeat(marge + 2);
  return '>-\n' + lignes.map((l) => creux + l).join('\n');
}

// Indentations, comptées une fois pour toutes : la collection est imbriquée
// sous `collections: > files: > fields: > fields:`, et une erreur d'un espace
// dans du YAML produit un formulaire vide sans le moindre message.
const SECTION = 10; // « - label: » d'une section
const QUESTION = 14; // « - label: » d'une question

const champs = SECTIONS.map((section) => {
  const questions = section.questions
    .map((q) => {
      const aide = q.bloque ? `EN ATTENTE POUR OUVRIR LA BOUTIQUE. ${q.aide}` : q.aide;
      return [
        `${' '.repeat(QUESTION)}- label: ${JSON.stringify(q.label)}`,
        `${' '.repeat(QUESTION + 2)}name: ${q.cle}`,
        `${' '.repeat(QUESTION + 2)}widget: ${q.long ? 'text' : 'string'}`,
        `${' '.repeat(QUESTION + 2)}required: false`,
        `${' '.repeat(QUESTION + 2)}hint: ${y(aide, QUESTION + 2)}`,
      ].join('\n');
    })
    .join('\n');

  return [
    `${' '.repeat(SECTION)}- label: ${JSON.stringify(section.titre)}`,
    `${' '.repeat(SECTION + 2)}name: ${section.cle}`,
    `${' '.repeat(SECTION + 2)}widget: object`,
    // Repliée par défaut : vingt-quatre champs déroulés d'un coup découragent.
    `${' '.repeat(SECTION + 2)}collapsed: true`,
    section.intro ? `${' '.repeat(SECTION + 2)}hint: ${y(section.intro, SECTION + 2)}` : null,
    `${' '.repeat(SECTION + 2)}fields:`,
    questions,
  ]
    .filter(Boolean)
    .join('\n');
}).join('\n\n');

const collection = `  # ── Ce qu'il manque pour finir le site ─────────────────────────────
  # PRODUIT PAR scripts/generer-questionnaire.mjs — ne pas modifier à la main.
  #
  # Uniquement des questions dont la réponse change quelque chose sur une
  # page. Rien d'administratif : l'immatriculation et les mentions légales
  # attendront que l'activité soit déclarée.
  - name: reponses
    label: À compléter
    files:
      - name: reponses
        label: Questions en attente
        file: ${REPONSES}
        description: >-
          Chaque section se déplie. Répondez à votre rythme, rien n'est à
          valider en bloc. Laissez vide ce dont vous n'êtes pas sûre : un
          blanc vaut mieux qu'une information fausse sur un site de vente.
        fields:
${champs}

`;

const config = readFileSync(CONFIG, 'utf8');
const debut = config.indexOf('  - name: reponses');
const fin = config.indexOf('  - name: produits');
if (debut === -1 || fin === -1) {
  console.error("  Repères introuvables dans config.yml — rien n'a été modifié.");
  process.exit(1);
}
// Le commentaire qui précède la collection fait partie du bloc remplacé.
const avant = config.lastIndexOf('  # ──', debut);
writeFileSync(
  CONFIG,
  config.slice(0, avant === -1 ? debut : avant) + collection + config.slice(fin),
  'utf8',
);
console.log(`  ${CONFIG}`);

if (!existsSync(REPONSES)) {
  mkdirSync('contenu', { recursive: true });
  const vide = SECTIONS.map(
    (s) => `${s.cle}:\n` + s.questions.map((q) => `  ${q.cle}: ""`).join('\n'),
  ).join('\n');
  writeFileSync(REPONSES, `---\n${vide}\n---\n`, 'utf8');
  console.log(`  ${REPONSES}`);
}

const total = SECTIONS.reduce((n, s) => n + s.questions.length, 0);
const bloquantes = SECTIONS.reduce((n, s) => n + s.questions.filter((q) => q.bloque).length, 0);
console.log(`  ${SECTIONS.length} sections · ${total} questions · ${bloquantes} bloquantes`);
