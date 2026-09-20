import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { SECTIONS } from '../src/donnees/questions.ts';

/**
 * Relève les réponses de Didine et en fait un fichier consultable.
 *
 * Elle répond dans sa gestion ; chaque enregistrement est un commit. Ce
 * script récupère le dépôt, affiche où on en est et écrit `REPONSES.md` —
 * de quoi reprendre le travail sans relire toute une conversation.
 *
 *   npm run reponses
 */
const SOURCE = 'contenu/reponses.md';
const SORTIE = 'REPONSES.md';

try {
  execSync('git fetch --quiet origin main && git merge --ff-only --quiet origin/main', {
    stdio: 'pipe',
  });
} catch {
  // Branche locale en avance, ou travail en cours : on lit ce qu'on a plutôt
  // que de refuser de répondre.
  console.log("  (dépôt non synchronisé — lecture de la copie locale)\n");
}

if (!existsSync(SOURCE)) {
  console.error(`  ${SOURCE} est absent. Lancez d'abord scripts/generer-questionnaire.mjs.`);
  process.exit(1);
}

// Windows écrit des fins de ligne CRLF, et les expressions ci-dessous ne
// connaissent que le saut de ligne simple. Sans cette normalisation, chaque
// valeur ressort avec un retour chariot collé au bout, et aucune ne
// correspond.
const CR = String.fromCharCode(13);
const brut = readFileSync(SOURCE, 'utf8').split(CR).join('');

/**
 * Lit une réponse dans le frontmatter imbriqué.
 *
 * Écrit à la main plutôt qu'avec un analyseur YAML : ce script doit tourner
 * même si les dépendances ne sont pas installées, c'est souvent la première
 * chose qu'on lance en reprenant le projet.
 */
function valeur(section, question) {
  const bloc = brut.match(new RegExp(`^${section}:\\n((?:[ \\t]+.*\\n)*)`, 'm'));
  if (!bloc) return '';
  const corps = bloc[1];

  const simple = corps.match(new RegExp(`^[ \\t]+${question}:[ \\t]*["']?(.*?)["']?[ \\t]*$`, 'm'));
  if (simple && simple[1].trim() && !simple[1].trim().startsWith('>') && simple[1].trim() !== '|') {
    return simple[1].trim();
  }
  // Bloc plié : la clé, puis des lignes plus indentées.
  const plie = corps.match(new RegExp(`^([ \\t]+)${question}:[ \\t]*[>|][-+]?\\n((?:\\1[ \\t]+.*\\n)+)`, 'm'));
  if (plie) {
    return plie[2].split('\n').map((l) => l.trim()).filter(Boolean).join(' ');
  }
  return '';
}

let repondues = 0;
let total = 0;
const bloquantes = [];
const lignes = ['# Réponses de Didine', ''];

for (const section of SECTIONS) {
  const faites = section.questions
    .map((q) => ({ q, v: valeur(section.cle, q.cle) }))
    .filter((x) => x.v);
  const manquent = section.questions.filter((q) => !valeur(section.cle, q.cle));
  total += section.questions.length;
  repondues += faites.length;

  lignes.push(`## ${section.titre}`, '');

  for (const { q, v } of faites) {
    lignes.push(`**${q.label}**`, '', v, '');
  }
  if (manquent.length) {
    lignes.push('Sans réponse :', '');
    for (const q of manquent) {
      lignes.push(`- ${q.label}${q.bloque ? '  ← bloque la boutique' : ''}`);
      if (q.bloque) bloquantes.push(q.label);
    }
    lignes.push('');
  }
}

lignes.push('---', '', `${repondues} réponses sur ${total}.`);
if (bloquantes.length) {
  lignes.push(
    '',
    `**${bloquantes.length} réponses manquent pour pouvoir ouvrir la boutique.** ` +
      "Ce sont celles dont l'absence laisse le site affirmer quelque chose de faux, " +
      'ou empêche une cliente de commander.',
  );
}

try {
  const quand = execSync(`git log -1 --format=%cd --date=format:"%d/%m/%Y à %H:%M" -- ${SOURCE}`, {
    encoding: 'utf8',
  }).trim();
  if (quand) lignes.push('', `*Dernière modification : ${quand}.*`);
} catch {
  // Pas d'historique : sans importance.
}

writeFileSync(SORTIE, lignes.join('\n') + '\n', 'utf8');

// ── Le même état, à l'écran ──────────────────────────────────────────
console.log('\n  RÉPONSES DE DIDINE');
console.log('  ' + '─'.repeat(62) + '\n');

for (const section of SECTIONS) {
  const faites = section.questions
    .map((q) => ({ q, v: valeur(section.cle, q.cle) }))
    .filter((x) => x.v);
  console.log(`  ${section.titre.toUpperCase()}  (${faites.length}/${section.questions.length})`);
  for (const q of section.questions) {
    const v = valeur(section.cle, q.cle);
    const marque = v ? '✓' : q.bloque ? '!' : '·';
    console.log(`    ${marque} ${q.label}`);
    if (v) {
      for (const bout of v.match(/.{1,58}(\s|$)/g) ?? [v]) {
        console.log(`        ${bout.trim()}`);
      }
    }
  }
  console.log('');
}

console.log('  ' + '─'.repeat(62));
console.log(`  ${repondues} sur ${total} répondues · ${bloquantes.length} bloquantes restantes`);
console.log(`  Relevé écrit dans ${SORTIE}\n`);
