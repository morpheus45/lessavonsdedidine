/**
 * Les questions posées à Didine, en un seul endroit.
 *
 * Trois choses en sortent : la page publique /questions/, le formulaire de sa
 * gestion, et le relevé que je consulte. Deux listes qui divergent, c'est une
 * question qu'on croit posée et qui ne l'est pas.
 *
 * Règle d'écriture : chaque question dit POURQUOI elle est posée, et ce que
 * le site affirme aujourd'hui à sa place. Une question sans contexte reçoit
 * une réponse en trois mots, qui ne débloque rien.
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
        label: 'Sous combien de temps expédiez-vous un savon ?',
        aide: "Le site affirmait « expédié sous 48 h » sur toutes ses pages. Je l'ai inventé et je l'ai retiré. Exemple : « 3 à 4 jours ».",
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
        aide: "Le site le répète partout : « faits main », « à la demande ». Je l'ai déduit, pas vérifié.",
        long: true,
      },
    ],
  },
  {
    cle: 'visuel',
    titre: "L'allure du site",
    intro:
      "Tout ce que vous voyez — couleurs, logo, écriture — vient de moi. Rien n'a été validé par vous, et tout peut changer. Répondez sans vous soucier du travail que ça me demande.",
    questions: [
      {
        cle: 'ressemblance',
        label: 'Le site vous ressemble-t-il ?',
        aide: "La question qui compte le plus. Vos savons sont colorés et gais — bubble gum, fleurs, vitrines d'enfant — et le site que j'ai fait est sobre, vert foncé, presque sérieux. C'est peut-être moi que ça ressemble, pas vous. Dites-le franchement.",
        long: true,
      },
      {
        cle: 'ambiance',
        label: 'Quand vous imaginez votre boutique, vous la voyez comment ?',
        aide: "Sobre et élégante ? Colorée et joyeuse ? Naturelle, brute, campagne ? Chic et précieuse ? Ou tout autre chose. Pas besoin de vocabulaire de métier, vos mots suffisent.",
        long: true,
      },
      {
        cle: 'couleurs',
        label: 'Les couleurs actuelles',
        aide: 'Vert forêt, crème, rouge grenat, un peu de doré. Trop sombre ? Trop sérieux ? Une couleur que vous ne voulez pas voir, une que vous aimeriez ?',
        long: true,
      },
      {
        cle: 'exemples',
        label: "Des boutiques ou des sites dont l'allure vous plaît",
        aide: "Même un seul. Un nom, une adresse, ou juste « la boutique de savons à côté du marché ». C'est ce qui m'aide le plus : voir ce qui vous plaît vaut mieux que deviner.",
        long: true,
      },
      {
        cle: 'logo',
        label: 'Le logo — le rond vert avec le D',
        aide: "Je l'ai dessiné faute de mieux. Avez-vous déjà un logo, un dessin, une enseigne ? Même fait à la main, même imparfait : ce sera toujours plus vous que ce que j'invente.",
        long: true,
      },
      {
        cle: 'nom',
        label: 'Le nom de la boutique est-il le bon ?',
        aide: "Le site s'appelle « Les Savons de Didine ». Mais vous faites aussi des vitrines, qui ne sont pas des savons. Est-ce le nom que vous voulez garder ?",
        long: true,
      },
      {
        cle: 'gene',
        label: 'Ce qui vous gêne quand vous regardez le site',
        aide: "Une page, une photo, une phrase, une couleur. Même « je ne sais pas dire pourquoi, mais ça ne me plaît pas » est une réponse utile — je trouverai quoi.",
        long: true,
      },
    ],
  },
  {
    cle: 'photos',
    titre: 'Les photos',
    intro:
      "Je n'ai que les neuf photos que vous aviez envoyées. Le site en manque, et ce sont elles qui vendent — bien plus que mes phrases. Envoyez-les par message, telles qu'elles sortent du téléphone : elles sont redressées et allégées automatiquement.",
    questions: [
      {
        cle: 'aEnvoyer',
        label: 'Quelles photos pouvez-vous faire ?',
        aide: "Ce qui manque le plus : vos mains en train de travailler, votre plan de travail, les moules, une coulée en cours, des savons en train de sécher, une vitrine en cours de montage, vos emballages. Dites ce que vous pouvez faire, je vous dirai lesquelles servent le plus.",
        long: true,
        bloque: true,
      },
      {
        cle: 'chambreEnfant',
        label: "La vitrine « chambre d'enfant »",
        aide: "La seule photo que j'ai porte deux autocollants ajoutés dans la messagerie : je ne peux pas la mettre en boutique. C'est le seul thème sans image, il se vend donc à l'aveugle.",
        bloque: true,
      },
      {
        cle: 'vousMeme',
        label: 'Accepteriez-vous une photo de vous ?',
        aide: "Même de dos, même seulement vos mains. Une boutique artisanale sans visage reste anonyme, et c'est ce qui la distingue d'un site de revente. Mais c'est votre décision, et « non » est une réponse complète.",
        long: true,
      },
    ],
  },
  {
    cle: 'activite',
    titre: 'Votre façon de travailler',
    intro:
      "Ce que je sais vient de quelques messages. Tout le reste, je l'ai deviné — et deviner, sur un site de vente, finit toujours par produire des phrases fausses.",
    questions: [
      {
        cle: 'ou',
        label: 'Où fabriquez-vous ?',
        aide: "Une pièce chez vous, un atelier, un coin de cuisine ? Sans décrire ce que vous ne voulez pas montrer : c'est pour raconter juste, pas pour donner votre adresse.",
        long: true,
      },
      {
        cle: 'quantite',
        label: 'Combien de savons faites-vous à la fois ?',
        aide: 'Une coulée vous donne combien de savons ? Et vous en faites combien par semaine, à peu près ?',
        long: true,
      },
      {
        cle: 'fournisseur',
        label: 'Où achetez-vous votre base et vos moules ?',
        aide: "Pas pour le publier — pour ne pas écrire de bêtise sur la provenance. Si vous préférez ne pas le dire, laissez vide.",
        long: true,
      },
      {
        cle: 'vendre',
        label: 'Où vendez-vous aujourd’hui ?',
        aide: 'Marchés, bouche-à-oreille, Instagram, une boutique ? Ça change ce que le site doit mettre en avant.',
        long: true,
      },
      {
        cle: 'clientes',
        label: 'Qui vous achète ?',
        aide: "Des voisines, des collègues, des gens qui offrent ? Des habituées ou des passages ? Le site s'adresse aujourd'hui à une cliente que j'ai inventée.",
        long: true,
      },
    ],
  },
  {
    cle: 'ajouts',
    titre: 'Ce que vous voulez vendre',
    intro:
      "Le site ne propose que deux choses : des savons parfumés et des vitrines. S'il vous en manque, il peut les accueillir.",
    questions: [
      {
        cle: 'nouveaux',
        label: 'Des produits à ajouter ?',
        aide: "Des savons que vous faites déjà et qui ne sont pas en ligne, d'autres formats, d'autres tailles. Décrivez-les simplement, avec un prix si vous l'avez en tête.",
        long: true,
      },
      {
        cle: 'coffrets',
        label: 'Des coffrets ou des assortiments ?',
        aide: "J'ai vu des coffrets de quatre savons sur vos photos, mais ils ne sont vendus nulle part sur le site. Voulez-vous en proposer ? À quel prix, avec quoi dedans ?",
        long: true,
      },
      {
        cle: 'autresObjets',
        label: 'Autre chose que des savons ?',
        aide: "Bougies, décorations, cadeaux, autre chose que vous fabriquez ou aimeriez fabriquer. Les vitrines montrent déjà que vous ne faites pas que du savon.",
        long: true,
      },
      {
        cle: 'occasions',
        label: 'Des ventes liées à des occasions ?',
        aide: "Noël, fête des mères, naissances, mariages ? Si oui, le site peut les préparer à l'avance plutôt que dans l'urgence.",
        long: true,
      },
      {
        cle: 'refus',
        label: 'Ce que vous ne voulez PAS faire',
        aide: "Un thème, un parfum, un type de commande. Aussi utile que le reste : ça évite de promettre en votre nom quelque chose que vous refuserez.",
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
        label: 'Votre adresse électronique, pour recevoir les messages',
        aide: "Elle ne sera PAS affichée sur le site : les clientes écrivent par un formulaire, et le message vous arrive par courriel. Votre adresse reste invisible, donc à l'abri des robots à spam.",
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
        aide: 'Une erreur que vous avez vue, une idée, une question. Tout ce qui ne rentre dans aucune case.',
        long: true,
      },
    ],
  },
];
