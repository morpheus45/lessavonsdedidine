/**
 * Les questions encore ouvertes, au 24 septembre 2026.
 *
 * Didine a répondu à 28 des 39 premières. Celles-là ont disparu d'ici : une
 * liste qui redemande ce qu'on sait déjà décourage, et c'est comme ça qu'on
 * n'obtient plus rien. Ses réponses sont appliquées sur le site et rangées
 * dans `prive/`, jamais dans le dépôt.
 *
 * Restent trois sortes de questions : celles qu'elle n'a pas encore vues,
 * celles dont la réponse en appelait une autre, et celles que ses réponses
 * ont fait naître.
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
    cle: 'suites',
    titre: 'Vos réponses ont soulevé ça',
    intro:
      "Merci — j'ai tout appliqué. Le site est passé à l'or, au noir et au rose pâle, il porte votre nom, et vos dix-huit parfums ont remplacé les onze que j'avais. Ces quelques points restent en suspens.",
    questions: [
      {
        cle: 'orthographeNom',
        label: "Le nom s'écrit comment, exactement ?",
        aide: "Vous avez écrit « Les douceurs&Didine ». Je l'ai repris tel quel, mais je veux être sûr : avec ou sans espaces autour du « & » ? Une majuscule à « Douceurs » ? C'est écrit partout sur le site, autant le figer une bonne fois.",
        bloque: true,
      },
      {
        cle: 'inciVraie',
        label: 'La liste INCI, la vraie',
        aide: "Ce que vous m'avez envoyé est la description commerciale de votre base, pas sa liste INCI. La liste ressemble à ceci : « Aqua, Glycerin, Sorbitol, Sodium Laureth Sulfate, Butyrospermum Parkii Butter… » — une suite de noms latins, en petits caractères au dos du paquet. C'est elle que la loi impose d'afficher.",
        long: true,
        bloque: true,
      },
      {
        cle: 'allergenes',
        label: 'Les allergènes de vos parfums de parfumerie',
        aide: "Black Opium, Angel et Dior J'adore sont faits avec le vrai flacon — donc aucun souci de contrefaçon. Mais un parfum apporte ses propres allergènes, que la loi oblige à déclarer. Trouvez-vous leur liste sur le flacon ou sa boîte ? Si non, dites-le : on cherchera autrement.",
        long: true,
      },
      {
        cle: 'parfumsRetires',
        label: 'Sept parfums ont disparu de votre liste',
        aide: "Le site annonçait vanille, coco-vanille, olive, miel, menthe, caramel et citron — ils ne sont pas dans les dix-huit que vous m'avez donnés. Vous ne les faites plus, ou vous les avez juste oubliés ? Je les ai retirés en attendant.",
        long: true,
      },
      {
        cle: 'famillesRelecture',
        label: 'Le nouveau rangement des parfums',
        aide: "J'ai refait la roue avec vos dix-huit, en six familles : fruité, gourmand, floral, torréfié, poudré, parfumerie. Allez la voir sur la page « Les parfums ». Qu'est-ce qui est mal rangé ?",
        long: true,
      },
      {
        cle: 'rosePale',
        label: 'Le rose pâle, vous le voyez où ?',
        aide: "Je l'ai mis en fond très clair, avec le noir pour le texte et l'or pour les détails. C'est bien ce que vous imaginiez, ou vous le voyiez ailleurs — sur les boutons, en aplats, plus soutenu ?",
        long: true,
      },
      {
        cle: 'logoEcriture',
        label: 'Le logo : la lettre ou le nom entier ?',
        aide: "Vous décrivez « l'écriture en or : les douceurs&Didine ». J'ai fait un rond or sur fond noir avec un D et deux savons roses, parce que le nom entier devient illisible en tout petit — dans un onglet de navigateur il fait quelques millimètres. Le D vous va, ou vous tenez au nom complet ?",
        long: true,
      },
    ],
  },
  {
    cle: 'vitrines',
    titre: 'Les vitrines',
    intro:
      "C'est la partie du site dont je suis le moins sûr. Votre réponse sur les thèmes parlait de moules à savon — je crois que ma question était mal posée.",
    questions: [
      {
        cle: 'encore',
        label: 'Faites-vous toujours des vitrines ?',
        aide: "Le site en vend trois tailles, à 45, 65 et 90 €, avec quatre thèmes. Si vous n'en faites plus, ou plus beaucoup, dites-le : je les retire plutôt que de vendre ce que vous ne voulez pas fabriquer.",
        long: true,
        bloque: true,
      },
      {
        cle: 'themes',
        label: "Un thème hors liste, c'est possible ?",
        aide: "Je reformule. Une cliente veut une vitrine sur un thème que vous n'avez jamais fait — la mer, la montagne, un métier. Vous acceptez ? Le site l'affirme aujourd'hui, sans que ce soit confirmé.",
        long: true,
      },
      {
        cle: 'delai',
        label: 'Combien de temps pour en monter une ?',
        aide: "Sans réponse, le site n'annonce AUCUN délai — j'avais écrit « environ une semaine » et je l'ai retiré. Une cliente qui commande sans savoir quand elle recevra finit par écrire pour demander.",
        bloque: true,
      },
      {
        cle: 'tailles',
        label: 'Ce qui distingue les trois tailles',
        aide: "J'ai inventé « quelques objets », « scène complète », « scène détaillée », et je n'ai aucune dimension. Qu'est-ce qui change vraiment entre 45 € et 90 € ?",
        long: true,
      },
      {
        cle: 'prix',
        label: 'Les prix sont-ils toujours bons ?',
        aide: "45, 65 et 90 € pour les vitrines ; 20 € les 5 savons et 40 € les 10. Ces chiffres viennent de vos premiers messages, en septembre. Toujours d'actualité ?",
        long: true,
        bloque: true,
      },
    ],
  },
  {
    cle: 'photos',
    titre: 'Les photos',
    intro:
      "Je n'ai toujours que vos neuf premières photos, toutes de produits finis. Ce sont elles qui vendent, bien plus que mes phrases — et le site en manque. Envoyez-les par message, telles qu'elles sortent du téléphone.",
    questions: [
      {
        cle: 'travail',
        label: 'Des photos de votre travail',
        aide: "Vos mains pendant une coulée, le plan de travail, les moules en silicone, des savons qui prennent, une vitrine en cours de montage. C'est ce qui manque le plus : le site montre des résultats, jamais le geste. Vous avez dit non pour une photo de vous — celles-là n'en sont pas.",
        long: true,
        bloque: true,
      },
      {
        cle: 'chambreEnfant',
        label: "La vitrine « chambre d'enfant »",
        aide: "La seule photo que j'ai porte deux autocollants collés dans la messagerie : impossible de la mettre en boutique. C'est le seul thème sans image, il se vend donc à l'aveugle.",
        bloque: true,
      },
      {
        cle: 'emballage',
        label: 'Vos emballages',
        aide: "Le sachet, l'étiquette, le colis prêt à partir. Une cliente qui offre un savon veut voir ce qu'elle va offrir — et vos autocollants « fait main avec amour » méritent mieux qu'une mention dans un coin du site.",
        long: true,
      },
    ],
  },
  {
    cle: 'ajouts',
    titre: 'Ce que vous voulez vendre',
    intro:
      "Le site ne propose que deux choses : des savons parfumés et des vitrines. Vous n'avez pas répondu à cette partie — c'est peut-être celle qui rapporte le plus.",
    questions: [
      {
        cle: 'coffrets',
        label: 'Des coffrets ?',
        aide: "Vos photos montrent des coffrets de quatre savons ovales sur du papier de soie. Ils ne sont vendus nulle part sur le site. Voulez-vous en proposer, avec quoi dedans, à quel prix ?",
        long: true,
      },
      {
        cle: 'nouveaux',
        label: "D'autres savons ?",
        aide: "D'autres formes, d'autres tailles, des lots différents. Décrivez simplement, avec un prix si vous l'avez en tête.",
        long: true,
      },
      {
        cle: 'autresObjets',
        label: 'Autre chose que des savons ?',
        aide: 'Bougies, décorations, cadeaux. Les vitrines prouvent déjà que vous ne faites pas que du savon.',
        long: true,
      },
      {
        cle: 'occasions',
        label: 'Noël, fête des mères, naissances ?',
        aide: "Si vous vendez plus à certaines périodes, le site peut les préparer à l'avance plutôt que dans l'urgence. Noël, c'est dans trois mois.",
        long: true,
      },
      {
        cle: 'refus',
        label: 'Ce que vous ne voulez PAS faire',
        aide: "Un parfum, un thème, un type de commande. Aussi utile que le reste : ça évite de promettre en votre nom quelque chose que vous refuserez.",
        long: true,
      },
    ],
  },
  {
    cle: 'vous',
    titre: 'Vous',
    intro:
      "Deux de vos réponses étaient trop courtes pour faire une phrase sur le site — « les deux », aux deux questions. Je ne brode pas : je préfère reposer autrement.",
    questions: [
      {
        cle: 'vitrinesOuSavons',
        label: "Qu'est-ce que vous aimez dans les vitrines que vous n'avez pas dans les savons ?",
        aide: "Vous avez répondu « les deux », et je comprends. Mais ce sont deux gestes différents : l'un se coule, l'autre se monte objet par objet. Qu'est-ce qui vous plaît dans chacun ?",
        long: true,
      },
      {
        cle: 'demandeFrequente',
        label: "Le parfum et le thème qu'on vous demande le plus",
        aide: "Là aussi vous avez dit « les deux ». Je cherche UN parfum et UN thème précis : ceux que vous refaites tout le temps. Ce sont eux qu'il faut mettre en avant.",
        long: true,
      },
      {
        cle: 'instagram',
        label: 'Votre Instagram',
        aide: 'Pour un lien depuis le site. Laissez vide si vous préférez ne pas en mettre.',
      },
    ],
  },
  {
    cle: 'divers',
    titre: 'Le reste',
    intro: '',
    questions: [
      {
        cle: 'siteRevu',
        label: "Le site, maintenant qu'il est or et noir",
        aide: "Allez le revoir. Est-ce que ça s'approche de ce que vous aviez en tête ? Et si ce n'est pas encore ça, dites où : une page, une couleur, une taille de texte.",
        long: true,
      },
      {
        cle: 'autre',
        label: 'Autre chose à me dire',
        aide: 'Une erreur que vous avez vue, une idée, une question.',
        long: true,
      },
    ],
  },
];
