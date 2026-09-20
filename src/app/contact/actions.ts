
/**
 * Formulaire de contact — L'ENVOI N'EST PAS BRANCHÉ. Ce qui reste à faire :
 *
 *   1. Un service d'envoi de courriel. Poser la clé d'API du service et
 *      l'adresse de destination dans les variables d'environnement de
 *      Netlify — jamais dans le dépôt — puis, ici même, remplacer le retour
 *      `aRecopier` par l'appel d'envoi. Prévoir le cas d'échec : si le
 *      service répond une erreur, il faut le DIRE à la visiteuse, pas
 *      l'avaler.
 *
 *   2. Ou bien un modèle `Message` au schéma Prisma (id, nom, email, sujet,
 *      contenu, creeLe, luLe) et un écran /admin/messages pour que Didine
 *      les relise. C'est la solution qui ne perd rien, même le jour où le
 *      service d'envoi tombe.
 *
 *   Idéalement les deux : on enregistre d'abord, on notifie ensuite.
 *
 * Tant que ni l'un ni l'autre n'existe, cette action valide la saisie, puis
 * le dit franchement et rend son texte à la visiteuse avec le moyen de
 * joindre Didine directement. Elle ne doit JAMAIS répondre « message
 * envoyé » : un formulaire qui fait semblant d'envoyer perd de vraies
 * clientes en silence, et personne ne s'en aperçoit avant des mois.
 *
 * Le message n'est pas non plus écrit dans les journaux du serveur. Ce
 * serait un faux filet de sécurité : des données personnelles entreraient
 * chez l'hébergeur sans que personne ne les relise jamais.
 */

export type Saisie = {
  nom: string;
  email: string;
  sujet: string;
  message: string;
};

export type EtatContact = {
  erreur?: string;
  /** Nom du champ fautif, pour le désigner à l'écran plutôt que dans le vide. */
  champ?: string;
  /**
   * La saisie est TOUJOURS renvoyée, valide ou non.
   *
   * React remet à zéro les champs non contrôlés dès qu'une action se
   * termine. Sans ce renvoi, une virgule oubliée dans l'adresse ferait
   * disparaître quarante lignes de message — le genre de détail qui fait
   * fermer l'onglet. Le formulaire se réaffiche donc avec ces valeurs.
   */
  saisie?: Saisie;
  /** Vrai quand tout est valide : c'est alors le texte qu'on rend à recopier. */
  verifie?: boolean;
};

const LONGUEURS = {
  nomMin: 2,
  nomMax: 120,
  emailMax: 200,
  sujetMax: 80,
  messageMin: 10,
  messageMax: 4000,
} as const;

export function preparerMessage(
  _precedent: EtatContact,
  donnees: FormData,
): EtatContact {
  const texte = (cle: string) => String(donnees.get(cle) ?? '').trim();

  const saisie: Saisie = {
    nom: texte('nom'),
    email: texte('email'),
    sujet: texte('sujet'),
    message: texte('message'),
  };

  if (saisie.nom.length < LONGUEURS.nomMin || saisie.nom.length > LONGUEURS.nomMax) {
    return {
      erreur: 'Indiquez votre nom, pour que Didine sache à qui elle répond.',
      champ: 'nom',
      saisie,
    };
  }

  // Volontairement permissif, comme au passage de commande : une expression
  // trop stricte rejette des adresses parfaitement valides.
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(saisie.email) ||
    saisie.email.length > LONGUEURS.emailMax
  ) {
    return { erreur: 'Cette adresse électronique ne semble pas valide.', champ: 'email', saisie };
  }

  // Le sujet vient d'une liste déroulante, et cette liste vit dans le
  // formulaire. On vérifie ici qu'il est présent, pas qu'il appartient à la
  // liste : rien n'est enregistré ni envoyé, la valeur ne fait que revenir à
  // l'écran de celle qui l'a choisie.
  if (!saisie.sujet || saisie.sujet.length > LONGUEURS.sujetMax) {
    return { erreur: 'Choisissez le sujet de votre message.', champ: 'sujet', saisie };
  }

  if (saisie.message.length < LONGUEURS.messageMin) {
    return {
      erreur: 'Écrivez quelques mots de plus, qu’on comprenne votre demande.',
      champ: 'message',
      saisie,
    };
  }

  if (saisie.message.length > LONGUEURS.messageMax) {
    return {
      erreur: `Message trop long : ${LONGUEURS.messageMax} caractères au maximum.`,
      champ: 'message',
      saisie,
    };
  }

  return { saisie, verifie: true };
}
