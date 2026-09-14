'use client';

import { useActionState } from 'react';
import { changerStatut, type EtatStatut } from '../../actions';

const INITIAL: EtatStatut = {};

/** Libellés des statuts vers lesquels on peut basculer. */
const LIBELLES: Record<string, string> = {
  payee: 'Marquer payée',
  preparee: 'Marquer préparée',
  expediee: 'Marquer expédiée',
  livree: 'Marquer livrée',
  remboursement_demande: 'Remboursement demandé',
  remboursee: 'Marquer remboursée',
  annulee: 'Annuler',
};

export function ChangerStatut({
  commandeId,
  transitions,
}: {
  commandeId: string;
  transitions: string[];
}) {
  const [etat, action, enCours] = useActionState(changerStatut, INITIAL);

  if (transitions.length === 0) {
    return <p className="font-mono text-[12.5px] text-taupe">Aucune action possible</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <form key={t} action={action}>
            <input type="hidden" name="commandeId" value={commandeId} />
            <input type="hidden" name="statut" value={t} />
            <button
              type="submit"
              className={`cursor-pointer rounded-s border px-3 py-1.5 text-[12.5px] transition-colors ${
                t === 'annulee' || t === 'remboursee'
                  ? 'border-alerte-bg bg-alerte-bg text-alerte hover:border-alerte'
                  : 'border-brume-2 bg-neige text-graphite hover:border-foret'
              }`}
            >
              {enCours ? '…' : (LIBELLES[t] ?? t)}
            </button>
          </form>
        ))}
      </div>

      {/* aria-live : le retour doit être annoncé, pas seulement affiché. */}
      <p aria-live="polite" className="mt-2 text-[12.5px]">
        {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
        {etat.succes && <span className="text-ok">{etat.succes}</span>}
      </p>
    </div>
  );
}
