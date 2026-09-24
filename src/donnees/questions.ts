/**
 * La conversation avec Didine.
 *
 * Une question à la fois, et la réponse décide de la suivante. Une liste de
 * vingt-cinq champs se referme sans être remplie ; une question qui tient sur
 * une ligne reçoit une réponse.
 *
 * Trois règles d'écriture :
 *
 *   1. ON LA TUTOIE. C'est la boutique de quelqu'un, pas un formulaire
 *      administratif.
 *   2. On ne demande QUE ce qu'elle seule peut savoir. Tout ce qui se trouve
 *      ailleurs — une liste INCI type, les allergènes d'un parfum du
 *      commerce — se cherche, et au pire se fait confirmer par une photo.
 *   3. Une photo vaut mieux qu'une transcription. Recopier une liste INCI au
 *      dos d'un paquet prend vingt minutes et se trompe ; la photographier
 *      prend dix secondes et ne se trompe pas.
 */

export type Choix = {
  valeur: string;
  libelle: string;
  /** Questions ouvertes par ce choix, et par lui seul. */
  suite?: string[];
};

export type Question = {
  cle: string;
  texte: string;
  aide?: string;
  /**
   * `choix` : des boutons. `court` : une ligne. `long` : plusieurs lignes.
   * `photo` : on lui demande d'envoyer une image par message, il n'y a rien
   * à saisir — juste à confirmer qu'elle le fera.
   */
  type: 'choix' | 'court' | 'long' | 'photo';
  choix?: Choix[];
  /** Questions ouvertes quelle que soit la réponse. */
  suite?: string[];
  /** Sans ça, le site affirme du faux ou reste incommandable. */
  bloque?: boolean;
};

/** L'ordre dans lequel on commence. Le reste se déplie au fil des réponses. */
export const DEPART = [
  'nom',
  'vitrines',
  'prixSavons',
  'etiquette',
  'photosTravail',
  'coffrets',
  'siteRevu',
] as const;

export const QUESTIONS: Question[] = [
  // ── Le nom ─────────────────────────────────────────────────────────
  {
    cle: 'nom',
    texte: 'Ton nom s’écrit comment, exactement ?',
    aide: 'Tu m’as écrit « Les douceurs&Didine ». Je l’ai mis partout sur le site — autant le figer une bonne fois.',
    type: 'choix',
    bloque: true,
    choix: [
      { valeur: 'colle', libelle: 'Les douceurs&Didine' },
      { valeur: 'espaces', libelle: 'Les Douceurs & Didine' },
      { valeur: 'de', libelle: 'Les Douceurs de Didine' },
      { valeur: 'autre', libelle: 'Autre chose', suite: ['nomAutre'] },
    ],
  },
  {
    cle: 'nomAutre',
    texte: 'Écris-le comme tu le veux.',
    type: 'court',
  },

  // ── Les vitrines ───────────────────────────────────────────────────
  {
    cle: 'vitrines',
    texte: 'Tu fais encore des vitrines ?',
    aide: 'Le site en vend trois tailles, à 45, 65 et 90 €. Je préfère les retirer que vendre ce que tu ne veux plus faire.',
    type: 'choix',
    bloque: true,
    choix: [
      { valeur: 'oui', libelle: 'Oui, régulièrement', suite: ['vitrineDelai', 'vitrineTailles', 'vitrineThemes', 'vitrinePrix'] },
      { valeur: 'parfois', libelle: 'De temps en temps', suite: ['vitrineDelai', 'vitrineTailles', 'vitrineThemes', 'vitrinePrix'] },
      { valeur: 'non', libelle: 'Non, plus vraiment', suite: ['vitrineRetirer'] },
    ],
  },
  {
    cle: 'vitrineRetirer',
    texte: 'Je les retire du site ?',
    aide: 'On peut aussi les garder en disant « sur demande », sans prix affiché.',
    type: 'choix',
    choix: [
      { valeur: 'retire', libelle: 'Oui, retire-les' },
      { valeur: 'demande', libelle: 'Garde-les, mais « sur demande »' },
      { valeur: 'garde', libelle: 'Laisse comme c’est' },
    ],
  },
  {
    cle: 'vitrineDelai',
    texte: 'Il te faut combien de temps pour en monter une ?',
    aide: 'J’avais écrit « environ une semaine » sans le savoir, et je l’ai retiré. Le site n’annonce donc aucun délai pour l’instant.',
    type: 'court',
    bloque: true,
  },
  {
    cle: 'vitrineTailles',
    texte: 'Qu’est-ce qui change entre la petite à 45 € et la grande à 90 € ?',
    aide: 'J’ai inventé « quelques objets », « scène complète », « scène détaillée ». Dis-le avec tes mots : le nombre d’objets, la taille du cadre, le temps que ça prend.',
    type: 'long',
  },
  {
    cle: 'vitrineThemes',
    texte: 'Une cliente veut un thème que tu n’as jamais fait — la mer, la montagne, un métier. Tu acceptes ?',
    aide: 'Le site l’affirme aujourd’hui. Ta réponse d’avant parlait de moules à savon, je crois que ma question était mal posée.',
    type: 'choix',
    choix: [
      { valeur: 'oui', libelle: 'Oui, je peux essayer' },
      { valeur: 'selon', libelle: 'Ça dépend', suite: ['vitrineThemesQuoi'] },
      { valeur: 'non', libelle: 'Non, seulement mes thèmes' },
    ],
  },
  {
    cle: 'vitrineThemesQuoi',
    texte: 'Ça dépend de quoi ?',
    type: 'long',
  },
  {
    cle: 'vitrinePrix',
    texte: '45, 65 et 90 € — c’est toujours ça ?',
    type: 'choix',
    bloque: true,
    choix: [
      { valeur: 'oui', libelle: 'Oui' },
      { valeur: 'non', libelle: 'Non, ça a changé', suite: ['vitrinePrixNouveaux'] },
    ],
  },
  {
    cle: 'vitrinePrixNouveaux',
    texte: 'C’est combien maintenant ?',
    aide: 'Les trois tailles.',
    type: 'court',
  },

  // ── Les savons ─────────────────────────────────────────────────────
  {
    cle: 'prixSavons',
    texte: '20 € les 5 savons et 40 € les 10 — toujours d’actualité ?',
    type: 'choix',
    bloque: true,
    choix: [
      { valeur: 'oui', libelle: 'Oui' },
      { valeur: 'non', libelle: 'Non, ça a changé', suite: ['prixSavonsNouveaux'] },
    ],
  },
  {
    cle: 'prixSavonsNouveaux',
    texte: 'C’est combien ?',
    type: 'court',
  },

  // ── Les photos ─────────────────────────────────────────────────────
  {
    cle: 'etiquette',
    texte: 'Tu peux me photographier l’étiquette de ta base de savon ?',
    aide: 'Le dos du paquet, là où il y a la longue liste de noms en latin. C’est ce que la loi oblige à afficher, et c’est la seule chose qui manque vraiment pour que la fiche des savons soit complète. Pas besoin de recopier : la photo suffit.',
    type: 'photo',
    bloque: true,
    suite: ['etiquetteParfums'],
  },
  {
    cle: 'etiquetteParfums',
    texte: 'Et les boîtes de Black Opium, Angel et Dior J’adore ?',
    aide: 'Il y a au dos une petite liste d’ingrédients. Comme tu parfumes avec le vrai flacon, ces ingrédients finissent dans tes savons, et la loi demande de les mentionner. Une photo de chaque boîte et je m’occupe du reste.',
    type: 'photo',
  },
  {
    cle: 'photosTravail',
    texte: 'Tu peux me prendre quelques photos pendant que tu travailles ?',
    aide: 'Tes mains pendant une coulée, le plan de travail, les moules, des savons qui prennent, une vitrine en cours de montage. Le site ne montre que des résultats, jamais le geste — et c’est le geste qui fait la différence avec un savon de supermarché. Tu m’as dit non pour une photo de toi : celles-là n’en sont pas.',
    type: 'photo',
    bloque: true,
    suite: ['photoChambre'],
  },
  {
    cle: 'photoChambre',
    texte: 'Et la vitrine « chambre d’enfant », tu peux la refaire en photo ?',
    aide: 'Celle que j’ai porte deux autocollants collés dans la messagerie, je ne peux pas la mettre en boutique. C’est le seul thème sans image : il se vend à l’aveugle.',
    type: 'photo',
    bloque: true,
  },

  // ── Ce qu'elle veut vendre ─────────────────────────────────────────
  {
    cle: 'coffrets',
    texte: 'Tu veux vendre des coffrets ?',
    aide: 'Tes photos montrent des coffrets de quatre savons sur du papier de soie. Ils ne sont vendus nulle part sur le site.',
    type: 'choix',
    choix: [
      { valeur: 'oui', libelle: 'Oui', suite: ['coffretsContenu', 'coffretsPrix'] },
      { valeur: 'peutetre', libelle: 'Pourquoi pas', suite: ['coffretsContenu'] },
      { valeur: 'non', libelle: 'Non', suite: ['autreChose'] },
    ],
  },
  {
    cle: 'coffretsContenu',
    texte: 'Il y aurait quoi dedans ?',
    aide: 'Combien de savons, lesquels, dans quel emballage.',
    type: 'long',
  },
  {
    cle: 'coffretsPrix',
    texte: 'À quel prix ?',
    type: 'court',
    suite: ['autreChose'],
  },
  {
    cle: 'autreChose',
    texte: 'Tu fabriques autre chose que des savons et des vitrines ?',
    aide: 'Bougies, décorations, cadeaux. Le site peut les accueillir.',
    type: 'long',
    suite: ['noel'],
  },
  {
    cle: 'noel',
    texte: 'Tu vends plus à certaines périodes ?',
    aide: 'Noël, fête des mères, naissances. Si oui, on peut préparer ça à l’avance plutôt que dans l’urgence. Noël, c’est dans trois mois.',
    type: 'long',
  },

  // ── Le site ────────────────────────────────────────────────────────
  {
    cle: 'siteRevu',
    texte: 'Le site, maintenant qu’il est or et noir — ça s’approche ?',
    aide: 'J’ai tout changé : les couleurs, le nom, le logo, et tes dix-huit parfums ont remplacé les onze que j’avais inventés.',
    type: 'choix',
    choix: [
      { valeur: 'oui', libelle: 'Oui, c’est ça', suite: ['demandeFrequente'] },
      { valeur: 'presque', libelle: 'Presque', suite: ['siteQuoi', 'demandeFrequente'] },
      { valeur: 'non', libelle: 'Pas vraiment', suite: ['siteQuoi', 'demandeFrequente'] },
    ],
  },
  {
    cle: 'siteQuoi',
    texte: 'Qu’est-ce qui ne va pas ?',
    aide: 'Une page, une couleur, une photo, une phrase. Même « je ne sais pas dire pourquoi » m’aide : je chercherai.',
    type: 'long',
  },
  {
    cle: 'demandeFrequente',
    texte: 'Quel parfum on te demande le plus ?',
    aide: 'Un seul. C’est celui qu’il faut mettre en avant. Tu m’avais répondu « les deux », mais là je cherche un nom précis.',
    type: 'court',
    suite: ['themeFrequent'],
  },
  {
    cle: 'themeFrequent',
    texte: 'Et quel thème de vitrine ?',
    type: 'court',
    suite: ['instagram'],
  },
  {
    cle: 'instagram',
    texte: 'Tu as un Instagram à mettre sur le site ?',
    aide: 'Laisse vide si tu préfères pas.',
    type: 'court',
    suite: ['fin'],
  },
  {
    cle: 'fin',
    texte: 'Autre chose à me dire ?',
    aide: 'Une erreur que tu as vue, une idée, une question.',
    type: 'long',
  },
];

export function questionParCle(cle: string): Question | undefined {
  return QUESTIONS.find((q) => q.cle === cle);
}
