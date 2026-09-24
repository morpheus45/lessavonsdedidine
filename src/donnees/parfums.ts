/**
 * Les parfums de Didine, rangés par famille olfactive.
 *
 * Source : sa réponse du 24 septembre 2026. Elle en a cité dix-huit. La liste
 * précédente venait de ses toutes premières photos et n'en partageait que
 * quatre avec celle-ci : sept parfums annoncés en boutique n'étaient pas les
 * siens, et quatorze des siens manquaient.
 *
 * Trois d'entre eux portent un nom de maison de parfum — Black Opium, Angel,
 * Dior J'adore. Didine les fabrique AVEC le parfum d'origine, acheté : ce
 * n'est donc pas une contrefaçon, et ils sont publiés tels qu'elle les nomme.
 *
 * Le RANGEMENT par famille est de nous, pas d'elle, ainsi que les
 * descriptions d'odeur. Elles ne disent QUE l'odeur : aucune ne prétend quoi
 * que ce soit sur un bienfait, un soin ou une peau. Un savon n'est pas un
 * médicament, et ce projet a déjà publié des affirmations fausses.
 */

export type Parfum = {
  slug: string;
  nom: string;
  /** Une phrase sur l'odeur, et rien d'autre. */
  odeur: string;
};

export type Famille = {
  slug: string;
  nom: string;
  /** Couleur pleine, pour l'anneau extérieur. Texte sombre dessus. */
  couleur: string;
  /** Même teinte très éclaircie, pour le pétale. Texte sombre dessus. */
  teinte: string;
  parfums: Parfum[];
};

export const FAMILLES: Famille[] = [
  {
    slug: 'fruite',
    nom: 'Fruité',
    couleur: '#e8a0ab',
    teinte: '#fbe9ec',
    parfums: [
      { slug: 'fraise', nom: 'Fraise', odeur: 'Fruit mûr et sucré, sans acidité.' },
      { slug: 'raisin', nom: 'Raisin', odeur: 'Sucré et un peu confit, comme le jus plus que le fruit frais.' },
      { slug: 'melon', nom: 'Melon', odeur: 'Doux et aqueux, léger. Le plus discret des fruits.' },
      { slug: 'banane', nom: 'Banane', odeur: 'Ronde et lactée, franchement enfantine.' },
      { slug: 'kiwi', nom: 'Kiwi', odeur: 'Vert et acidulé, avec une pointe qui réveille.' },
    ],
  },
  {
    slug: 'gourmand',
    nom: 'Gourmand',
    couleur: '#d4af37',
    teinte: '#f7eed2',
    parfums: [
      { slug: 'bonbon', nom: 'Bonbon', odeur: 'Sucre pur, sans détour. Celui que les enfants choisissent.' },
      { slug: 'bubble-gum', nom: 'Bubble Gum', odeur: 'Fraise-banane, franchement régressif.' },
      { slug: 'pain-d-epices', nom: "Pain d'épices", odeur: 'Miel, cannelle et anis, chaud et enveloppant. Un parfum d’hiver.' },
      { slug: 'pomme-cannelle', nom: 'Pomme cannelle', odeur: 'La pomme cuite adoucit la cannelle et la tire vers le dessert.' },
    ],
  },
  {
    slug: 'floral',
    nom: 'Floral',
    couleur: '#d9a8c4',
    teinte: '#f6e7f0',
    parfums: [
      { slug: 'lavande', nom: 'Lavande', odeur: 'Sèche et propre, un peu camphrée. La plus reconnaissable.' },
      { slug: 'magnolia', nom: 'Magnolia', odeur: 'Fleur blanche crémeuse, avec un fond citronné.' },
      { slug: 'tulipe', nom: 'Tulipe', odeur: 'Verte et légère, à peine fleurie. Discrète.' },
      { slug: 'fleurs-de-printemps', nom: 'Fleurs de printemps', odeur: 'Un bouquet plutôt qu’une fleur : frais, vert, léger.' },
    ],
  },
  {
    slug: 'torrefie',
    nom: 'Torréfié',
    couleur: '#b5763f',
    teinte: '#f2e4d7',
    parfums: [
      { slug: 'cafe', nom: 'Café', odeur: 'Grain torréfié, chaud, avec l’amertume qui va avec. Tient bien sur les mains.' },
    ],
  },
  {
    slug: 'poudre',
    nom: 'Poudré',
    couleur: '#c3b7a6',
    teinte: '#f1ece5',
    parfums: [
      { slug: 'musc', nom: 'Musc', odeur: 'Doux et enveloppant, presque une odeur de linge propre.' },
    ],
  },
  {
    slug: 'parfumerie',
    nom: 'Parfumerie',
    couleur: '#a8a2b8',
    teinte: '#eceaf1',
    parfums: [
      {
        slug: 'black-opium',
        nom: 'Black Opium',
        odeur: 'Café et vanille sur fond de fleur blanche. Le plus habillé de la série.',
      },
      {
        slug: 'angel',
        nom: 'Angel',
        odeur: 'Patchouli et caramel, franc et reconnaissable entre mille.',
      },
      {
        slug: 'dior-j-adore',
        nom: "Dior J'adore",
        odeur: 'Bouquet de fleurs blanches, lumineux et enveloppant.',
      },
    ],
  },
];

/**
 * ⚠️  À SURVEILLER — les allergènes, pas les marques.
 *
 * Les trois parfums de parfumerie sont faits avec le flacon d'origine, donc
 * pas de contrefaçon. Mais un parfum fini apporte ses propres allergènes, et
 * la réglementation cosmétique impose de déclarer les vingt-six allergènes
 * listés dès qu'ils dépassent un seuil dans le produit fini.
 *
 * Didine ne peut pas les connaître : la composition d'un parfum commercial
 * n'est pas publiée au détail. La question lui est posée dans le
 * questionnaire ; en attendant, la fiche produit ne prétend rien sur la
 * composition de ces trois-là.
 */

export const TOUS_LES_PARFUMS: Parfum[] = FAMILLES.flatMap((f) => f.parfums);

export function familleDuParfum(slug: string): Famille | undefined {
  return FAMILLES.find((f) => f.parfums.some((p) => p.slug === slug));
}
