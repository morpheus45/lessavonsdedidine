/**
 * Tous les montants circulent en CENTIMES, sous forme d'entiers.
 *
 * Un prix en flottant finit toujours par produire une commande fausse :
 * 0.1 + 0.2 vaut 0.30000000000000004, et sur quelques milliers de lignes
 * la comptabilité ne tombe plus juste. Le centime entier supprime le
 * problème à la racine — on ne convertit qu'au moment de l'affichage.
 */

const FORMAT_EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/** 750 → « 7,50 € » */
export function formaterPrix(centimes: number): string {
  return FORMAT_EUR.format(centimes / 100);
}

/** 750 → « 7.50 » — la forme attendue par l'API PayPal. */
export function centimesVersPayPal(centimes: number): string {
  return (centimes / 100).toFixed(2);
}

/** Prix au kilo, pour la mention réglementaire : 750 ¢ / 100 g → « 75,00 € le kilo » */
export function prixAuKilo(centimes: number, poidsGrammes: number): string {
  if (poidsGrammes <= 0) return '—';
  return `${FORMAT_EUR.format((centimes / 100) * (1000 / poidsGrammes))} le kilo`;
}

export const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const FORMAT_DATE_COURTE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

export function formaterDate(d: Date): string {
  return FORMAT_DATE.format(d);
}

export function formaterDateCourte(d: Date): string {
  return FORMAT_DATE_COURTE.format(d);
}
