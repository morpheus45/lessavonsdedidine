import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/**
 * Chiffrement des secrets stockés en base.
 *
 * Une clé secrète PayPal en clair dans une table, c'est une fuite de compte
 * marchand au premier accès à la base — sauvegarde égarée, injection SQL,
 * poste d'admin compromis. Elle est donc chiffrée au repos.
 *
 * AES-256-GCM : chiffre ET authentifie. Sans l'étiquette d'authentification,
 * un attaquant pouvant modifier la base pourrait altérer le chiffré sans
 * qu'on s'en aperçoive au déchiffrement.
 *
 * La clé de chiffrement vit dans l'environnement, jamais en base — sinon on
 * rangerait la clé du coffre à l'intérieur du coffre.
 */

const ALGO = 'aes-256-gcm';

function cleMaitresse(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court : impossible de chiffrer les secrets de paiement.",
    );
  }
  // Sel fixe : on a besoin d'une clé déterministe, pas d'un hachage de mot
  // de passe. L'entropie vient de SESSION_SECRET.
  return scryptSync(secret, 'savons-de-didine-paiements', 32);
}

/** Renvoie « iv:etiquette:chiffre », le tout en hexadécimal. */
export function chiffrer(clair: string): string {
  if (!clair) return '';
  const iv = randomBytes(12);
  const chiffreur = createCipheriv(ALGO, cleMaitresse(), iv);
  const chiffre = Buffer.concat([chiffreur.update(clair, 'utf8'), chiffreur.final()]);
  return [iv.toString('hex'), chiffreur.getAuthTag().toString('hex'), chiffre.toString('hex')].join(':');
}

/**
 * Déchiffre une valeur produite par `chiffrer`.
 * Renvoie null si la valeur est absente, malformée, ou si l'authentification
 * échoue — on ne renvoie jamais un déchiffrement douteux comme s'il était bon.
 */
export function dechiffrer(stocke: string | null | undefined): string | null {
  if (!stocke) return null;
  const parts = stocke.split(':');
  if (parts.length !== 3) return null;

  try {
    const [ivHex, tagHex, chiffreHex] = parts;
    const dechiffreur = createDecipheriv(ALGO, cleMaitresse(), Buffer.from(ivHex!, 'hex'));
    dechiffreur.setAuthTag(Buffer.from(tagHex!, 'hex'));
    return Buffer.concat([
      dechiffreur.update(Buffer.from(chiffreHex!, 'hex')),
      dechiffreur.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Aperçu affichable d'un secret : jamais la valeur, seulement de quoi
 * reconnaître qu'on a collé la bonne clé.
 */
export function apercu(valeur: string | null): string {
  if (!valeur) return '';
  if (valeur.length <= 8) return '••••';
  return `${valeur.slice(0, 4)}••••${valeur.slice(-4)}`;
}
