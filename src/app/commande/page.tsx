import type { Metadata } from 'next';
import { lireProduits, lireThemes } from '@/lib/catalogue';
import { reglages } from '@/lib/reponses';
import type { Tarif } from '@/lib/panier-calcul';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { Commande } from './Commande';

export const metadata: Metadata = {
  title: 'Commander',
  robots: { index: false },
};

/**
 * Page de commande.
 *
 * L'identifiant PayPal est PUBLIC — il figure dans l'adresse du script chargé
 * par la page, il n'y a rien à cacher. La clé secrète, elle, ne peut pas être
 * utilisée ici : sur un site statique il n'existe aucun endroit pour la
 * garder. C'est pourquoi l'encaissement n'est pas vérifié côté boutique.
 */
export default function PageCommande() {
  const tarifs: Tarif[] = lireProduits().flatMap((p) =>
    p.formules.map((f) => ({
      id: f.id,
      slug: p.slug,
      libelle: `${p.nom} — ${f.nom}`,
      prixCentimes: f.prixCentimes,
    })),
  );

  return (
    <>
      <EnTeteBoutique />
      <Commande
      tarifs={tarifs}
      nomsDesThemes={Object.fromEntries(lireThemes().map((t) => [t.slug, t.nom]))}
      reglages={{
        livraisonCentimes: reglages.livraisonCentimes,
        seuilLivraisonOfferteCentimes: reglages.seuilLivraisonOfferteCentimes,
      }}
      clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''}
      />
      <PiedBoutique />
    </>
  );
}
