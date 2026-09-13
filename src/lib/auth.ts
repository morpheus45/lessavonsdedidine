import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const scrypt = promisify(scryptCb) as (
  mdp: string,
  sel: Buffer,
  longueur: number,
) => Promise<Buffer>;

const NOM_COOKIE = 'session_didine';
const DUREE_MS = 1000 * 60 * 60 * 12; // 12 heures

/**
 * Mots de passe hachés avec scrypt — fourni par Node, donc aucune dépendance
 * externe à maintenir. Un sel aléatoire par compte : deux administrateurs
 * ayant le même mot de passe n'ont pas le même hachage, et une table
 * précalculée ne sert à rien.
 */
export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  const derive = await scrypt(motDePasse, sel, 64);
  return `${sel.toString('hex')}:${derive.toString('hex')}`;
}

export async function verifierMotDePasse(motDePasse: string, stocke: string): Promise<boolean> {
  const [selHex, hashHex] = stocke.split(':');
  if (!selHex || !hashHex) return false;

  const attendu = Buffer.from(hashHex, 'hex');
  const obtenu = await scrypt(motDePasse, Buffer.from(selHex, 'hex'), attendu.length);

  // Comparaison à temps constant : une comparaison naïve fuit la longueur du
  // préfixe correct et permet de reconstruire le hachage octet par octet.
  return obtenu.length === attendu.length && timingSafeEqual(obtenu, attendu);
}

export async function ouvrirSession(administrateurId: string): Promise<void> {
  const jeton = randomBytes(32).toString('hex');
  const expireLe = new Date(Date.now() + DUREE_MS);

  await prisma.session.create({ data: { jeton, administrateurId, expireLe } });
  await prisma.administrateur.update({
    where: { id: administrateurId },
    data: { derniereConnexion: new Date() },
  });

  const boite = await cookies();
  boite.set(NOM_COOKIE, jeton, {
    httpOnly: true, // inaccessible au JavaScript de la page : un XSS ne vole pas la session
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expireLe,
  });
}

export async function fermerSession(): Promise<void> {
  const boite = await cookies();
  const jeton = boite.get(NOM_COOKIE)?.value;
  if (jeton) await prisma.session.deleteMany({ where: { jeton } });
  boite.delete(NOM_COOKIE);
}

export type AdministrateurConnecte = { id: string; email: string; nom: string };

export async function administrateurCourant(): Promise<AdministrateurConnecte | null> {
  const boite = await cookies();
  const jeton = boite.get(NOM_COOKIE)?.value;
  if (!jeton) return null;

  const session = await prisma.session.findUnique({
    where: { jeton },
    include: { administrateur: true },
  });

  if (!session || session.expireLe < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.administrateur.id,
    email: session.administrateur.email,
    nom: session.administrateur.nom,
  };
}

/** Purge les sessions expirées — appelée à la connexion, sans tâche planifiée. */
export async function purgerSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expireLe: { lt: new Date() } } });
}
