/**
 * Pastille de statut de commande.
 *
 * Dans un fichier à part : Next.js n'autorise qu'un export par défaut depuis
 * un `page.tsx`, et exporter un composant à côté casse la vérification de
 * types de l'App Router.
 *
 * La couleur ne porte jamais seule l'information — chaque pastille contient
 * aussi son libellé. Un daltonien lit le mot, pas la teinte.
 */
const LIBELLES: Record<string, { texte: string; classe: string }> = {
  en_attente_paiement: { texte: 'En attente', classe: 'bg-attente-bg text-attente' },
  payee: { texte: 'Payée', classe: 'bg-ok-bg text-ok' },
  preparee: { texte: 'Préparée', classe: 'bg-route-bg text-route' },
  expediee: { texte: 'Expédiée', classe: 'bg-route-bg text-route' },
  livree: { texte: 'Livrée', classe: 'bg-ok-bg text-ok' },
  remboursement_demande: { texte: 'Remb. demandé', classe: 'bg-attente-bg text-attente' },
  remboursee: { texte: 'Remboursée', classe: 'bg-alerte-bg text-alerte' },
  annulee: { texte: 'Annulée', classe: 'bg-alerte-bg text-alerte' },
};

export function Statut({ statut }: { statut: string }) {
  const s = LIBELLES[statut] ?? { texte: statut, classe: 'bg-brume text-taupe' };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[12px] font-semibold ${s.classe}`}>
      {s.texte}
    </span>
  );
}
