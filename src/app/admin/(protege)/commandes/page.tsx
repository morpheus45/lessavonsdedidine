import { prisma } from '@/lib/prisma';
import { formaterPrix, formaterDate } from '@/lib/argent';
import { Statut } from '../Statut';
import { ChangerStatut } from './ChangerStatut';

export const dynamic = 'force-dynamic';

/** Doit rester identique à la table du fichier d'actions serveur. */
const TRANSITIONS: Record<string, string[]> = {
  en_attente_paiement: ['payee', 'annulee'],
  payee: ['preparee', 'remboursee', 'annulee'],
  preparee: ['expediee', 'remboursee'],
  expediee: ['livree', 'remboursement_demande'],
  livree: ['remboursement_demande'],
  remboursement_demande: ['remboursee'],
};

export default async function Commandes() {
  const commandes = await prisma.commande.findMany({
    orderBy: { creeeLe: 'desc' },
    take: 60,
    include: {
      lignes: { include: { lot: true, theme: true } },
      evenements: { orderBy: { creeLe: 'desc' }, take: 4 },
    },
  });

  return (
    <>
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-[34px] tracking-[-0.025em]">Commandes</h1>
        <p className="text-[14.5px] text-taupe">
          {commandes.length} commande{commandes.length > 1 ? 's' : ''} — de la plus récente à la
          plus ancienne.
        </p>
      </header>

      {commandes.length === 0 ? (
        <p className="rounded-m border border-brume bg-white p-8 text-taupe">
          Aucune commande pour le moment.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {commandes.map((c) => (
            <li
              key={c.id}
              id={c.reference}
              className="rounded-m border border-brume bg-white p-5 scroll-mt-6"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-1 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[15px] font-medium">{c.reference}</span>
                    <Statut statut={c.statut} />
                  </p>
                  <p className="text-[13.5px] text-taupe">
                    {c.nom} · {c.email}
                    {c.telephone ? ` · ${c.telephone}` : ''}
                  </p>
                  <p className="font-mono text-[12.5px] text-taupe">
                    {formaterDate(c.creeeLe)} · {c.adresse}, {c.codePostal} {c.ville}
                  </p>
                </div>
                <p className="font-mono text-[20px] tabulaire">{formaterPrix(c.totalCentimes)}</p>
              </div>

              <ul className="mb-4 divide-y divide-brume border-y border-brume">
                {c.lignes.map((l) => (
                  <li key={l.id} className="flex flex-wrap justify-between gap-3 py-2.5 text-[13.5px]">
                    <span>
                      {l.libelle}
                      <span className="text-taupe"> × {l.quantite}</span>
                      {/* Personnalisation : c'est ce que Didine doit lire pour
                          fabriquer l'objet. Sans ça, la commande est inutile. */}
                      {(l.prenom || l.theme) && (
                        <span className="mt-1 block font-mono text-[12px] text-grenat">
                          {l.theme ? `Thème ${l.theme.nom}` : null}
                          {l.theme && l.prenom ? ' · ' : null}
                          {l.prenom ? `Prénom « ${l.prenom} »` : null}
                        </span>
                      )}
                      {l.lot && (
                        <span className="mt-1 block font-mono text-[12px] text-taupe">
                          Série {l.lot.reference}
                        </span>
                      )}
                    </span>
                    <span className="font-mono tabulaire">{formaterPrix(l.totalCentimes)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-start justify-between gap-6">
                <ChangerStatut commandeId={c.id} transitions={TRANSITIONS[c.statut] ?? []} />

                {/* Journal : quand un client conteste, c'est la seule réponse. */}
                <details className="min-w-[240px]">
                  <summary className="cursor-pointer font-mono text-[12.5px] text-taupe">
                    Historique ({c.evenements.length})
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {c.evenements.map((e) => (
                      <li key={e.id} className="font-mono text-[12px] text-taupe">
                        {formaterDate(e.creeLe)} · {e.statut} · {e.auteur}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
