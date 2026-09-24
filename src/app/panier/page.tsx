import type { Metadata } from 'next';
import { lireProduits, lireThemes } from '@/lib/catalogue';
import { reglages } from '@/lib/reponses';
import type { Tarif } from '@/lib/panier-calcul';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { Panier } from './Panier';

export const metadata: Metadata = {
  title: 'Votre panier',
  robots: { index: false },
};

/**
 * Le panier.
 *
 * Les tarifs sont figés ici, à la construction, et passés au navigateur. Sur
 * un site statique il n'y a rien pour les relire ensuite — voir
 * l'avertissement en tête de `src/lib/panier-calcul.ts`.
 */
export default function PagePanier() {
  const tarifs: Tarif[] = lireProduits().flatMap((p) =>
    p.formules.map((f) => ({
      id: f.id,
      slug: p.slug,
      libelle: `${p.nom} — ${f.nom}`,
      prixCentimes: f.prixCentimes,
    })),
  );

  const nomsDesThemes = Object.fromEntries(lireThemes().map((t) => [t.slug, t.nom]));

  return (
    <>
      <EnTeteBoutique />
      <Panier
      tarifs={tarifs}
      nomsDesThemes={nomsDesThemes}
      reglages={{
        livraisonCentimes: reglages.livraisonCentimes,
        seuilLivraisonOfferteCentimes: reglages.seuilLivraisonOfferteCentimes,
      }}
      />
      <PiedBoutique />
    </>
  );
}
