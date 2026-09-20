import { prisma } from './prisma';
import { chiffrer, dechiffrer, apercu } from './chiffrement';

/**
 * Configuration des moyens de paiement, réglable depuis le backoffice.
 *
 * Pourquoi en base plutôt qu'en variables d'environnement : Didine doit
 * pouvoir relier son compte PayPal elle-même, sans toucher au code ni
 * redéployer. Les secrets sont chiffrés au repos (voir `chiffrement.ts`) et
 * ne remontent jamais jusqu'au navigateur.
 */

export type MoyenPaiement = 'paypal' | 'cb' | 'wero';

export type EtatPaiement = {
  /** Activé par Didine ET techniquement utilisable. */
  utilisable: boolean;
  /** Coché dans le backoffice. */
  active: boolean;
  /** Ce qui manque, s'il manque quelque chose. */
  blocage: string | null;
};

export type ConfigPaiements = {
  paypal: EtatPaiement & {
    environnement: 'sandbox' | 'production';
    clientIdApercu: string;
    secretRenseigne: boolean;
    webhookRenseigne: boolean;
  };
  cb: EtatPaiement;
  wero: EtatPaiement;
};

const CLES = {
  paypalActif: 'paypal_actif',
  paypalEnv: 'paypal_environnement',
  paypalClientId: 'paypal_client_id',
  paypalSecret: 'paypal_secret_chiffre',
  paypalWebhook: 'paypal_webhook_id',
  cbActif: 'cb_actif',
} as const;

async function lireReglages(): Promise<Map<string, string>> {
  const lignes = await prisma.reglage.findMany({
    where: { cle: { in: Object.values(CLES) } },
  });
  return new Map(lignes.map((l) => [l.cle, l.valeur]));
}

export async function lireConfigPaiements(): Promise<ConfigPaiements> {
  const r = await lireReglages();

  const clientId = r.get(CLES.paypalClientId) ?? '';
  const secret = dechiffrer(r.get(CLES.paypalSecret));
  const webhook = r.get(CLES.paypalWebhook) ?? '';
  const paypalActif = r.get(CLES.paypalActif) === '1';
  const cbActif = r.get(CLES.cbActif) === '1';

  // Un paiement n'est utilisable que si TOUT est là. Afficher un bouton
  // PayPal sans clé secrète produirait une erreur au moment de payer —
  // c'est-à-dire au pire moment possible.
  const paypalComplet = Boolean(clientId && secret);
  const blocagePaypal = !clientId
    ? "L'identifiant client PayPal n'est pas renseigné."
    : !secret
      ? "La clé secrète PayPal n'est pas renseignée."
      : !webhook
        ? "L'identifiant de webhook manque : les paiements fonctionneront, mais la boutique ne sera pas prévenue automatiquement des remboursements et litiges."
        : null;

  return {
    paypal: {
      active: paypalActif,
      utilisable: paypalActif && paypalComplet,
      blocage: blocagePaypal,
      environnement: r.get(CLES.paypalEnv) === 'production' ? 'production' : 'sandbox',
      clientIdApercu: apercu(clientId),
      secretRenseigne: Boolean(secret),
      webhookRenseigne: Boolean(webhook),
    },
    cb: {
      active: cbActif,
      // La carte passe par PayPal (champs de carte hébergés) : sans compte
      // PayPal configuré, il n'y a rien pour encaisser une carte.
      utilisable: cbActif && paypalComplet,
      blocage: paypalComplet
        ? null
        : 'La carte bancaire passe par le compte PayPal : configurez PayPal d’abord.',
    },
    wero: {
      active: false,
      utilisable: false,
      // Vérifié le 14 septembre 2026 : Wero e-commerce est ouvert en
      // Allemagne (nov. 2025) et en Belgique (mars 2026) ; la France est
      // annoncée pour fin 2026. Et l'accès passe par un prestataire de
      // paiement, pas en direct.
      blocage:
        "Wero n’est pas encore ouvert au e-commerce en France — lancement annoncé pour fin 2026. L’accès se fera via un prestataire de paiement (HiPay, PayPlug…), pas en direct.",
    },
  };
}

/** Secrets déchiffrés, pour l'appel serveur à PayPal. Jamais exposé au client. */
export async function identifiantsPaypal(): Promise<{
  clientId: string;
  secret: string;
  webhookId: string;
  base: string;
} | null> {
  const r = await lireReglages();
  const clientId = r.get(CLES.paypalClientId) ?? '';
  const secret = dechiffrer(r.get(CLES.paypalSecret));
  if (!clientId || !secret) return null;

  const production = r.get(CLES.paypalEnv) === 'production';
  return {
    clientId,
    secret,
    webhookId: r.get(CLES.paypalWebhook) ?? '',
    base: production ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
  };
}

type Entrees = {
  paypalActif: boolean;
  cbActif: boolean;
  environnement: 'sandbox' | 'production';
  clientId: string;
  /** Chaîne vide = ne pas modifier le secret déjà enregistré. */
  secret: string;
  webhookId: string;
};

export async function enregistrerPaiements(e: Entrees): Promise<void> {
  const ecrire = async (cle: string, valeur: string) => {
    await prisma.reglage.upsert({ where: { cle }, create: { cle, valeur }, update: { valeur } });
  };

  await ecrire(CLES.paypalActif, e.paypalActif ? '1' : '0');
  await ecrire(CLES.cbActif, e.cbActif ? '1' : '0');
  await ecrire(CLES.paypalEnv, e.environnement);
  await ecrire(CLES.paypalClientId, e.clientId.trim());
  await ecrire(CLES.paypalWebhook, e.webhookId.trim());

  // Un champ secret vide signifie « je ne touche pas au secret existant ».
  // Sans cette règle, rouvrir la page et enregistrer effacerait la clé.
  if (e.secret.trim()) {
    await ecrire(CLES.paypalSecret, chiffrer(e.secret.trim()));
  }
}

/**
 * Vérifie les identifiants auprès de PayPal en demandant un jeton.
 * C'est le seul moyen honnête de dire « c'est bon » : accepter une clé sans
 * la tester, c'est découvrir qu'elle est fausse au premier vrai paiement.
 */
export async function testerPaypal(): Promise<{ ok: boolean; message: string }> {
  const ids = await identifiantsPaypal();
  if (!ids) return { ok: false, message: 'Identifiant client ou clé secrète manquant.' };

  try {
    const reponse = await fetch(`${ids.base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${ids.clientId}:${ids.secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (reponse.ok) {
      const env = ids.base.includes('sandbox') ? 'bac à sable' : 'production';
      return { ok: true, message: `Connexion à PayPal réussie (${env}).` };
    }
    if (reponse.status === 401) {
      return { ok: false, message: 'PayPal refuse ces identifiants. Vérifiez la clé et l’environnement choisi.' };
    }
    return { ok: false, message: `PayPal a répondu ${reponse.status}.` };
  } catch {
    return { ok: false, message: 'Impossible de joindre PayPal. Vérifiez la connexion réseau.' };
  }
}

/**
 * Identifiant client PayPal destiné au navigateur.
 *
 * Celui-ci n'est pas un secret : il figure dans l'adresse du script PayPal
 * chargé par la page. Il est renvoyé à part pour qu'aucun appelant n'ait à
 * manipuler l'objet qui contient, lui, la clé secrète.
 */
export async function clientIdPublicPaypal(): Promise<string | null> {
  const config = await lireConfigPaiements();
  if (!config.paypal.utilisable) return null;
  const r = await lireReglages();
  return r.get(CLES.paypalClientId) ?? null;
}
