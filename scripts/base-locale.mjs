import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Postgres local, uniquement pour développer et vérifier.
 *
 * La base de production est ailleurs (Supabase) : celle-ci ne demande aucun
 * compte, tourne sur le port 55432 et range ses données dans `.base-locale/`,
 * qui n'est pas versionné.
 */
const DOSSIER = join(process.cwd(), '.base-locale');
const PORT = 55432;

const pg = new EmbeddedPostgres({
  databaseDir: DOSSIER,
  user: 'savonnerie',
  password: 'savonnerie',
  port: PORT,
  persistent: true,
});

try {
  if (!existsSync(DOSSIER)) {
    console.log('  Téléchargement des binaires PostgreSQL…');
    await pg.initialise();
    await pg.start();
    await pg.createDatabase('savonnerie');
  } else {
    await pg.start();
  }
  console.log(`  Postgres écoute sur le port ${PORT}.`);
} catch (e) {
  // « database system is ready » puis un échec signifie presque toujours
  // qu'une instance tourne déjà sur ce port. Ce n'est pas une panne.
  console.error('  Démarrage impossible :', e?.message ?? e);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await pg.stop().catch(() => {});
    process.exit(0);
  });
}

// Maintient le processus en vie tant qu'on ne l'interrompt pas.
setInterval(() => {}, 1 << 30);
