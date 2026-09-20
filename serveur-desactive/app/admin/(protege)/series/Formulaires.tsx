'use client';

import { useActionState, useId } from 'react';
import { creerSerie, corrigerStock, type EtatFormulaire } from './actions';

const ETIQUETTE = 'mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe';
const CHAMP = 'min-h-[46px] w-full rounded-s border border-brume-2 bg-nuage px-3 py-2.5 text-[14px]';
const INITIAL: EtatFormulaire = {};

export type ProduitChoisissable = { id: string; nom: string; rang: number };

/** Aujourd'hui au format attendu par `<input type="date">`. */
function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormulaireSerie({ produits }: { produits: ProduitChoisissable[] }) {
  const [etat, action, enCours] = useActionState(creerSerie, INITIAL);

  if (produits.length === 0) {
    return (
      <section className="rounded-m border border-brume bg-neige p-6">
        <h2 className="mb-2 font-serif text-[24px]">Nouvelle série</h2>
        <p className="text-[13.5px] text-taupe">
          Aucun savon au catalogue pour l&rsquo;instant. Créez d&rsquo;abord le produit, la série
          de fabrication viendra ensuite.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-m border border-brume bg-neige p-6">
      <h2 className="mb-1 font-serif text-[24px]">Nouvelle série</h2>
      <p className="mb-6 max-w-[62ch] text-[13.5px] text-taupe">
        Une série regroupe tout ce qui sort d&rsquo;une même coulée : même base, même parfum,
        même jour. C&rsquo;est elle qui relie un savon vendu à sa fabrication, et sans elle un
        rappel serait impossible à tracer.
      </p>

      <form action={action}>
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="s-produit" className={ETIQUETTE}>
              Savon fabriqué
            </label>
            <select id="s-produit" name="produitId" required className={CHAMP}>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  N°{String(p.rang).padStart(2, '0')} — {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="s-reference" className={ETIQUETTE}>
              Référence
            </label>
            <input
              id="s-reference"
              name="reference"
              required
              maxLength={32}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="s-reference-aide"
              className={`${CHAMP} font-mono uppercase`}
            />
            <span id="s-reference-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              Celle imprimée sur l&rsquo;étiquette : année, mois, lettre de la coulée du mois.
              Par exemple 26-09-A.
            </span>
          </div>

          <div>
            <label htmlFor="s-quantite" className={ETIQUETTE}>
              Quantité produite
            </label>
            <input
              id="s-quantite"
              name="quantiteProduite"
              type="number"
              min={1}
              step={1}
              required
              inputMode="numeric"
              aria-describedby="s-quantite-aide"
              className={`${CHAMP} tabulaire font-mono`}
            />
            <span id="s-quantite-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              Nombre de savons sortis du moule. Le stock restant démarre à cette valeur.
            </span>
          </div>

          <div>
            <label htmlFor="s-coulee" className={ETIQUETTE}>
              Date de coulée
            </label>
            <input
              id="s-coulee"
              name="couleLe"
              type="date"
              required
              defaultValue={aujourdHui()}
              aria-describedby="s-coulee-aide"
              className={`${CHAMP} font-mono`}
            />
            <span id="s-coulee-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              La série est vendable le jour même : un fondre-et-verser durcit en trente à
              soixante minutes, il n&rsquo;y a pas de cure à attendre.
            </span>
          </div>

          <div>
            <label htmlFor="s-durable" className={ETIQUETTE}>
              Durabilité minimale
            </label>
            <input
              id="s-durable"
              name="durableJusquLe"
              type="date"
              required
              aria-describedby="s-durable-aide"
              className={`${CHAMP} font-mono`}
            />
            <span id="s-durable-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              La date « à utiliser de préférence avant », reprise de la fiche de la base
              employée.
            </span>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="s-notes" className={ETIQUETTE}>
              Notes de fabrication (facultatif)
            </label>
            <textarea
              id="s-notes"
              name="notes"
              rows={2}
              aria-describedby="s-notes-aide"
              className="w-full rounded-s border border-brume-2 bg-nuage px-3 py-2.5 text-[14px]"
            />
            <span id="s-notes-aide" className="mt-1.5 block text-[12.5px] text-taupe">
              Parfum, colorant, numéro de lot de la base fournisseur — tout ce qu&rsquo;il
              faudrait retrouver un an plus tard.
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={enCours}
          className="min-h-[46px] cursor-pointer rounded-s bg-grenat px-6 text-[14px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? 'Enregistrement…' : 'Enregistrer la série'}
        </button>

        <p aria-live="polite" className="mt-3 min-h-[22px] text-[13.5px]">
          {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
          {etat.succes && <span className="text-ok">{etat.succes}</span>}
        </p>
      </form>
    </section>
  );
}

export function CorrectionStock({
  lotId,
  reference,
  quantiteProduite,
  quantiteRestante,
}: {
  lotId: string;
  reference: string;
  quantiteProduite: number;
  quantiteRestante: number;
}) {
  const [etat, action, enCours] = useActionState(corrigerStock, INITIAL);
  // Plusieurs corrections coexistent sur la page : les identifiants doivent
  // rester uniques, sinon un `htmlFor` désigne l'étiquette d'une autre série.
  const prefixe = useId();

  return (
    <details className="mt-4 border-t border-brume pt-3">
      <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-[13px] text-taupe hover:text-grenat">
        Corriger le stock restant
      </summary>

      <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
        <input type="hidden" name="lotId" value={lotId} />

        {/* La largeur est portée par le conteneur : la poser sur le champ
            entrerait en conflit avec le `w-full` de CHAMP, et l'issue du
            conflit dépendrait de l'ordre de génération des utilitaires. */}
        <div className="w-28">
          <label htmlFor={`${prefixe}-quantite`} className={ETIQUETTE}>
            Restant
          </label>
          <input
            id={`${prefixe}-quantite`}
            name="quantiteRestante"
            type="number"
            min={0}
            max={quantiteProduite}
            step={1}
            required
            inputMode="numeric"
            defaultValue={quantiteRestante}
            aria-describedby={`${prefixe}-aide`}
            className={`${CHAMP} tabulaire font-mono`}
          />
        </div>

        <div className="min-w-[220px] flex-1">
          <label htmlFor={`${prefixe}-motif`} className={ETIQUETTE}>
            Motif de la correction
          </label>
          <input
            id={`${prefixe}-motif`}
            name="motif"
            required
            minLength={3}
            maxLength={120}
            autoComplete="off"
            className={CHAMP}
          />
        </div>

        <button
          type="submit"
          disabled={enCours}
          className="min-h-[46px] cursor-pointer rounded-s border border-foret px-5 text-[13.5px] font-semibold text-foret transition-colors hover:bg-foret hover:text-nuage disabled:opacity-60"
        >
          {enCours ? 'Correction…' : 'Corriger'}
        </button>

        <p id={`${prefixe}-aide`} className="w-full text-[12.5px] text-taupe">
          Sur {quantiteProduite} produits dans la série {reference}. Le motif est conservé,
          daté et signé, dans les notes de la série : un stock qui bouge sans explication est
          un stock invérifiable.
        </p>

        <p aria-live="polite" className="w-full min-h-[22px] text-[13px]">
          {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
          {etat.succes && <span className="text-ok">{etat.succes}</span>}
        </p>
      </form>
    </details>
  );
}
