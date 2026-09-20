import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

/**
 * Affiche les réponses de Didine, telles qu'elles sont dans le dépôt.
 *
 * Elle répond dans sa gestion ; chaque enregistrement est un commit. Ce
 * script récupère le dépôt et montre où on en est — ce qui est répondu, ce
 * qui manque, et depuis quand.
 *
 *   npm run reponses
 */
const FICHIER = 'contenu/reponses.md';

const QUESTIONS = [
  ['inci', 'Liste INCI de la base de savon', true],
  ['fraisPort', 'Frais de livraison', true],
  ['seuilPortOffert', 'Livraison offerte à partir de', true],
  ['modeLivraison', 'Comment elle livre', false],
  ['delaiVitrine', 'Délai pour monter une vitrine', true],
  ['taillesVitrines', 'Ce qui distingue les trois tailles', false],
  ['themesSurMesure', 'Thèmes sur mesure acceptés ?', false],
  ['emailContact', 'Adresse de contact publique', true],
  ['instagram', 'Compte Instagram', false],
  ['relectureParfums', 'Relecture du rangement des parfums', false],
  ['depuisQuand', 'Depuis quand elle fait du savon', false],
  ['pourquoi', 'Ce qui lui a donné envie', false],
  ['preference', 'Ce qu’elle préfère fabriquer', false],
  ['demandeFrequente', 'Ce qu’on lui demande le plus', false],
  ['divers', 'Autre chose', false],
];

try {
  execSync('git fetch --quiet origin main && git merge --ff-only --quiet origin/main', {
    stdio: 'pipe',
  });
} catch {
  // Une branche locale en avance, ou un travail en cours : on lit quand même
  // ce qu'on a plutôt que de refuser de répondre.
  console.log('  (dépôt non synchronisé — lecture de la copie locale)\n');
}

if (!existsSync(FICHIER)) {
  console.error(`  ${FICHIER} est absent.`);
  process.exit(1);
}

const brut = readFileSync(FICHIER, 'utf8');
const valeur = (cle) => {
  // Le frontmatter écrit par le CMS : soit `cle: "valeur"`, soit un bloc
  // multiligne `cle: >-` suivi de lignes indentées.
  const simple = brut.match(new RegExp(`^${cle}:[ \\t]*["']?(.*?)["']?[ \\t]*$`, 'm'));
  if (simple && simple[1].trim() && !simple[1].trim().startsWith('>')) return simple[1].trim();

  const bloc = brut.match(new RegExp(`^${cle}:[ \\t]*[>|][-+]?\\n((?:[ \\t]+.*\\n)+)`, 'm'));
  if (bloc) return bloc[1].split('\n').map((l) => l.trim()).filter(Boolean).join(' ');
  return '';
};

let repondues = 0;
const manquantes = [];

console.log('\n  RÉPONSES DE DIDINE\n  ' + '─'.repeat(64) + '\n');

for (const [cle, libelle, urgent] of QUESTIONS) {
  const v = valeur(cle);
  if (v) {
    repondues++;
    console.log(`  ✓ ${libelle}`);
    for (const ligne of v.match(/.{1,66}(\s|$)/g) ?? [v]) {
      console.log(`      ${ligne.trim()}`);
    }
    console.log('');
  } else {
    manquantes.push([libelle, urgent]);
  }
}

if (manquantes.length) {
  console.log('  EN ATTENTE\n');
  for (const [libelle, urgent] of manquantes) {
    console.log(`  ${urgent ? '!' : '·'} ${libelle}${urgent ? '   (bloque le site)' : ''}`);
  }
  console.log('');
}

console.log('  ' + '─'.repeat(64));
console.log(`  ${repondues} sur ${QUESTIONS.length} répondues.`);

try {
  const quand = execSync(`git log -1 --format=%cd --date=relative -- ${FICHIER}`, {
    encoding: 'utf8',
  }).trim();
  const qui = execSync(`git log -1 --format=%an -- ${FICHIER}`, { encoding: 'utf8' }).trim();
  if (quand) console.log(`  Dernière modification : ${quand}, par ${qui}.`);
} catch {
  // Pas d'historique : le fichier n'a jamais été commité. Sans importance.
}
console.log('');
