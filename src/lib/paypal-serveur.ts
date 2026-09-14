import { identifiantsPaypal } from './paiements';

/**
 * Appels serveur à PayPal.
 *
 * Tout se passe ici, jamais dans le navigateur. Le navigateur ne voit que
 * l'identifiant public et le numéro de commande PayPal ; le montant est
 * envoyé par ce fichier, à partir du total relu en base. C'est la différence
 * de fond avec la version statique du site, où le montant partait du
 * navigateur et pouvait donc être modifié par l'acheteur.
 */

export class ErreurPaypal extends Error {}

async function jeton(): Promise<{ acces: string; base: string }> {
  const ids = await identifiantsPaypal();
  if (!ids) throw new ErreurPaypal("PayPal n'est pas configuré dans le backoffice.");

  const reponse = await fetch(`${ids.base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${ids.clientId}:${ids.secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!reponse.ok) {
    throw new ErreurPaypal(`PayPal a refusé les identifiants (${reponse.status}).`);
  }
  const corps = (await reponse.json()) as { access_token?: string };
  if (!corps.access_token) throw new ErreurPaypal('PayPal n’a pas renvoyé de jeton.');
  return { acces: corps.access_token, base: ids.base };
}

/** Montant en centimes → « 45.00 », la forme attendue par PayPal. */
function enEuros(centimes: number): string {
  return (centimes / 100).toFixed(2);
}

/**
 * Ouvre une commande chez PayPal pour une commande déjà enregistrée chez nous.
 *
 * `reference` est notre numéro : il remonte dans le tableau de bord PayPal de
 * Didine, ce qui permet de rapprocher un encaissement d'une commande sans
 * avoir à chercher.
 */
export async function ouvrirCommandePaypal(commande: {
  reference: string;
  totalCentimes: number;
  sousTotalCentimes: number;
  livraisonCentimes: number;
}): Promise<string> {
  const { acces, base } = await jeton();

  const reponse = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: commande.reference,
          custom_id: commande.reference,
          amount: {
            currency_code: 'EUR',
            value: enEuros(commande.totalCentimes),
            breakdown: {
              item_total: { currency_code: 'EUR', value: enEuros(commande.sousTotalCentimes) },
              shipping: { currency_code: 'EUR', value: enEuros(commande.livraisonCentimes) },
            },
          },
        },
      ],
    }),
  });

  const corps = (await reponse.json()) as { id?: string };
  if (!reponse.ok || !corps.id) {
    throw new ErreurPaypal(`PayPal a refusé la création de la commande (${reponse.status}).`);
  }
  return corps.id;
}

export type CapturePaypal = {
  captureId: string;
  /** Montant réellement encaissé, en centimes. À comparer au total attendu. */
  encaisseCentimes: number;
  statut: string;
};

export async function capturerCommandePaypal(orderId: string): Promise<CapturePaypal> {
  const { acces, base } = await jeton();

  const reponse = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${acces}`,
      'Content-Type': 'application/json',
      // Sans cette en-tête, un double clic ou un réseau qui bégaie peut
      // encaisser deux fois. PayPal renvoie alors la première capture.
      'PayPal-Request-Id': `capture-${orderId}`,
    },
  });

  const corps = (await reponse.json()) as {
    status?: string;
    purchase_units?: { payments?: { captures?: { id: string; amount: { value: string } }[] } }[];
  };

  const capture = corps.purchase_units?.[0]?.payments?.captures?.[0];
  if (!reponse.ok || !capture) {
    throw new ErreurPaypal(`L'encaissement a échoué (${reponse.status}).`);
  }

  return {
    captureId: capture.id,
    encaisseCentimes: Math.round(Number(capture.amount.value) * 100),
    statut: corps.status ?? 'INCONNU',
  };
}
