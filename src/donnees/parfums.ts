/**
 * Les onze parfums, rangés par famille olfactive.
 *
 * Les PARFUMS eux-mêmes viennent de Didine : ce sont ceux qu'elle achète et
 * qu'on voit étiquetés sur ses photos. Le RANGEMENT par famille, lui, est de
 * nous — c'est une aide au choix, pas une classification de parfumeur.
 *
 * ⚠️  À FAIRE VALIDER PAR DIDINE : le regroupement et les descriptions
 *     d'odeur ci-dessous. Elle sent ses savons, pas nous.
 *
 * Les descriptions ne disent QUE l'odeur. Aucune ne prétend quoi que ce soit
 * sur la fabrication, la composition ou un quelconque bienfait : un savon
 * n'est pas un médicament, et ce projet a déjà publié par erreur des
 * affirmations fausses sur sa fabrication.
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
  /** Couleur pleine, pour l'anneau extérieur. Texte clair dessus. */
  couleur: string;
  /** Même teinte très éclaircie, pour le pétale. Texte sombre dessus. */
  teinte: string;
  parfums: Parfum[];
};

export const FAMILLES: Famille[] = [
  {
    slug: 'gourmand',
    nom: 'Gourmand',
    couleur: '#c8a455',
    teinte: '#f2e8d2',
    parfums: [
      { slug: 'vanille', nom: 'Vanille', odeur: 'Ronde et sucrée, un peu lactée. La plus consensuelle des onze.' },
      { slug: 'caramel', nom: 'Caramel', odeur: 'Sucre chauffé, beurré, avec ce fond légèrement brûlé qui l’empêche d’être écœurant.' },
      { slug: 'miel', nom: 'Miel', odeur: 'Doux et cireux, un peu floral. Moins sucré qu’on ne l’attend.' },
      { slug: 'coco-vanille', nom: 'Coco-vanille', odeur: 'La coco arrondit la vanille et la tire vers le monoï.' },
      { slug: 'bubble-gum', nom: 'Bubble gum', odeur: 'Franchement enfantin, fraise-banane. C’est celui que les enfants choisissent.' },
    ],
  },
  {
    slug: 'torrefie',
    nom: 'Torréfié',
    couleur: '#6f4526',
    teinte: '#e8dbd0',
    parfums: [
      { slug: 'cafe', nom: 'Café', odeur: 'Grain torréfié, chaud, avec l’amertume qui va avec. Tient bien sur les mains.' },
    ],
  },
  {
    slug: 'oriental',
    nom: 'Oriental',
    couleur: '#5a4668',
    teinte: '#e6dfec',
    parfums: [
      { slug: 'black-opium', nom: 'Black Opium', odeur: 'Café et vanille sur fond de fleur blanche. Le plus habillé de la série.' },
    ],
  },
  {
    slug: 'fruite',
    nom: 'Fruité',
    couleur: '#8a2b28',
    teinte: '#f3ddda',
    parfums: [
      { slug: 'fraise', nom: 'Fraise', odeur: 'Fruit mûr, sucré, sans acidité.' },
      { slug: 'citron', nom: 'Citron', odeur: 'Zeste vif et net. C’est le plus réveillant du lot.' },
    ],
  },
  {
    slug: 'frais',
    nom: 'Frais',
    couleur: '#2f6b5a',
    teinte: '#dceae4',
    parfums: [
      { slug: 'menthe', nom: 'Menthe', odeur: 'Piquante et froide, elle laisse une sensation de frais sur la peau.' },
    ],
  },
  {
    slug: 'vegetal',
    nom: 'Végétal',
    couleur: '#17503c',
    teinte: '#dae6de',
    parfums: [
      { slug: 'olive', nom: 'Olive', odeur: 'Verte et discrète, presque savonneuse au sens propre. La plus sobre.' },
    ],
  },
];

export const TOUS_LES_PARFUMS: Parfum[] = FAMILLES.flatMap((f) => f.parfums);

export function familleDuParfum(slug: string): Famille | undefined {
  return FAMILLES.find((f) => f.parfums.some((p) => p.slug === slug));
}
