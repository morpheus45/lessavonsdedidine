/**
 * Les questions posées à Didine, en un seul endroit.
 *
 * Trois choses en sortent : la page publique /questions/, le formulaire de sa
 * gestion, et le relevé que je consulte. Deux listes qui divergent, c'est une
 * question qu'on croit posée et qui ne l'est pas.
 */
export type Question = {
  cle: string;
  label: string;
  aide: string;
  /** Champ multiligne, pour une réponse qui demande des phrases. */
  long?: boolean;
  /** Sans cette réponse, le site affirme du faux ou reste incommandable. */
  bloque?: boolean;
};

export type Section = {
  cle: string;
  titre: string;
  intro: string;
  questions: Question[];
};

export const SECTIONS: Section[] = [
  {
    cle: 'livraison',
    titre: 'La livraison',
    intro:
      "Ces chiffres s'affichent déjà sur le site, et c'est moi qui les ai écrits sans vous les demander.",
    questions: [
      {
        cle: 'frais',
        label: 'Combien facturez-vous la livraison ?',
        aide: "Le site annonce 4,90 €. C'est un chiffre que j'ai inventé. Exemple de réponse : « 5,50 », ou « 0 » si vous l'offrez toujours.",
        bloque: true,
      },
      {
        cle: 'seuilOffert',
        label: 'À partir de quel montant est-elle offerte ?',
        aide: 'Inventé aussi : le site annonce « offerte dès 39 € ». Exemple : « 50 », ou « jamais ».',
        bloque: true,
      },
      {
        cle: 'delaiExpedition',
        label: "Sous combien de temps expédiez-vous un savon ?",
        aide: "Le site affirme « expédié sous 48 h » sur toutes ses pages. Je l'ai inventé. Exemple : « 3 à 4 jours ».",
        bloque: true,
      },
      {
        cle: 'mode',
        label: 'Comment livrez-vous ?',
        aide: 'La Poste, point relais, en main propre ? Et partout en France, ou seulement autour de chez vous ?',
        long: true,
      },
    ],
  },
  {
    cle: 'produits',
    titre: 'Les produits',
    intro: 'Ce que le site dit de vos savons et de vos vitrines.',
    questions: [
      {
        cle: 'inci',
        label: 'La liste INCI de votre base de savon',
        aide: "Recopiez mot à mot l'étiquette de votre fournisseur, dans le même ordre. La fiche contient aujourd'hui un texte d'attente.",
        long: true,
        bloque: true,
      },
      {
        cle: 'poids',
        label: 'Combien pèse un savon ?',
        aide: "En grammes. Le site n'affiche aucun poids aujourd'hui, alors qu'un cosmétique doit le porter.",
      },
      {
        cle: 'conservation',
        label: 'Combien de temps se garde un savon ?',
        aide: "J'ai écrit « de préférence dans les 12 mois après ouverture » sans le savoir. Vrai ?",
      },
      {
        cle: 'delaiVitrine',
        label: 'Combien de temps pour monter une vitrine ?',
        aide: "J'avais écrit « environ une semaine ». Je l'ai retiré du site en attendant : aucun délai n'est annoncé pour l'instant.",
        bloque: true,
      },
      {
        cle: 'tailles',
        label: 'Ce qui distingue la petite, la moyenne et la grande vitrine',
        aide: "J'ai inventé « quelques objets », « scène complète », « scène détaillée », et je n'ai aucune dimension.",
        long: true,
      },
      {
        cle: 'surMesure',
        label: 'Acceptez-vous un thème qui ne figure pas dans la liste ?',
        aide: "Le site l'affirme aujourd'hui, sans que personne l'ait confirmé. Y a-t-il des thèmes que vous ne savez pas ou ne voulez pas faire ?",
        long: true,
      },
      {
        cle: 'petitesSeries',
        label: 'Travaillez-vous vraiment à la commande, en petites quantités ?',
        aide: "Le site le répète partout : « faits main en petites séries », « à la demande ». Je l'ai déduit, pas vérifié.",
        long: true,
      },
    ],
  },
  {
    cle: 'visuel',
    titre: "L'allure du site",
    intro:
      "Tout ce que vous voyez — couleurs, logo, typographie — vient de moi. Rien n'a été validé par vous, et tout peut changer.",
    questions: [
      {
        cle: 'couleurs',
        label: 'Les couleurs vous plaisent-elles ?',
        aide: "Vert forêt, crème, rouge grenat, un peu de doré. Dites franchement si ça ne vous ressemble pas — c'est votre boutique.",
        long: true,
      },
      {
        cle: 'logo',
        label: 'Le logo — le rond vert avec le D',
        aide: "Je l'ai dessiné faute de mieux. Avez-vous déjà un logo, une enseigne, quelque chose que vous utilisez sur vos étiquettes ?",
        long: true,
      },
      {
        cle: 'etiquettes',
        label: 'Vos étiquettes et vos emballages actuels',
        aide: "J'ai vu « FAIT MAIN · AVEC AMOUR » sur vos autocollants et je l'ai repris. Décrivez ce que vous utilisez — ou déposez-en une photo dans Produits.",
        long: true,
      },
      {
        cle: 'nom',
        label: 'Le nom de la boutique est-il le bon ?',
        aide: "Le site s'appelle « Les Savons de Didine ». Mais vous faites aussi des vitrines, qui ne sont pas des savons. Est-ce le nom que vous voulez ?",
        long: true,
      },
      {
        cle: 'aVoir',
        label: "Ce qui vous gêne quand vous regardez le site",
        aide: 'Une page, une photo, une phrase. Même « je ne sais pas dire pourquoi mais ça ne me plaît pas » est une réponse utile.',
        long: true,
      },
    ],
  },
  {
    cle: 'vous',
    titre: 'Vous',
    intro: "Pour la page qui parle de vous, aujourd'hui vide de votre parole.",
    questions: [
      { cle: 'depuisQuand', label: 'Depuis quand faites-vous du savon ?', aide: 'Une année suffit.' },
      {
        cle: 'pourquoi',
        label: "Qu'est-ce qui vous a donné envie de commencer ?",
        aide: "Deux ou trois phrases, avec vos mots. C'est ce qui distingue une boutique artisanale d'un site de revente.",
        long: true,
      },
      {
        cle: 'preference',
        label: 'Ce que vous préférez fabriquer',
        aide: 'Les savons, les vitrines ? Et pourquoi ?',
        long: true,
      },
      {
        cle: 'demande',
        label: "Ce qu'on vous demande le plus souvent",
        aide: 'Un parfum, un thème ? Ça aide à mettre en avant ce qui se vend.',
        long: true,
      },
      {
        cle: 'email',
        label: 'Votre adresse électronique, celle que les clientes verront',
        aide: 'Elle sera PUBLIQUE, donc visible des robots à spam : prenez-en une dédiée à la boutique. Sans elle, personne ne peut vous joindre.',
        bloque: true,
      },
      {
        cle: 'instagram',
        label: 'Votre compte Instagram',
        aide: 'Pour un lien depuis le site. Exemple : didine991. Laissez vide si vous préférez.',
      },
    ],
  },
  {
    cle: 'divers',
    titre: 'Le reste',
    intro: '',
    questions: [
      {
        cle: 'parfums',
        label: 'Les parfums rangés par famille — mon rangement tient-il ?',
        aide: "Allez voir la page « Les parfums ». J'ai rangé vos onze parfums en six familles et décrit chaque odeur, sans les avoir jamais sentis.",
        long: true,
      },
      {
        cle: 'autre',
        label: 'Autre chose à me dire',
        aide: "Une erreur que vous avez vue, une idée, une question. Tout ce qui ne rentre dans aucune case.",
        long: true,
      },
    ],
  },
];
