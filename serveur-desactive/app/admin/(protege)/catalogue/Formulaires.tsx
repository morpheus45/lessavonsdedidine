'use client';

import { useActionState } from 'react';
import { formaterPrix } from '@/lib/argent';
import {
  enregistrerProduit,
  enregistrerVariante,
  retirerVariante,
  type EtatFormulaire,
} from './actions';

const ETIQUETTE = 'mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe';
const CHAMP = 'w-full rounded-s border border-brume-2 bg-nuage px-3 py-2.5 text-[14px]';

export type ProduitFormulaire = {
  id: string;
  nom: string;
  type: string;
  accroche: string;
  description: string;
  inci: string;
};

export function FormulaireProduit({ produit }: { produit?: ProduitFormulaire }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(enregistrerProduit, {});

  return (
    <form action={action} className="rounded-m border border-brume bg-neige p-6">
      <h2 className="mb-6 font-serif text-[24px]">{produit ? 'Fiche' : 'Nouveau produit'}</h2>
      {produit && <input type="hidden" name="id" value={produit.id} />}

      <div className="mb-5">
        <label htmlFor="nom" className={ETIQUETTE}>
          Nom
        </label>
        <input id="nom" name="nom" required defaultValue={produit?.nom} className={CHAMP} />
      </div>

      <div className="mb-5">
        <label htmlFor="type" className={ETIQUETTE}>
          Type
        </label>
        <select id="type" name="type" defaultValue={produit?.type ?? 'savon'} className={CHAMP}>
          <option value="savon">Savon ou coffret de savons</option>
          <option value="vitrine">Vitrine personnalisée</option>
        </select>
        <p className="mt-1.5 text-[12.5px] text-taupe">
          Une vitrine demande un prénom et un thème au client avant d&rsquo;être commandable.
        </p>
      </div>

      <div className="mb-5">
        <label htmlFor="accroche" className={ETIQUETTE}>
          Accroche
        </label>
        <input
          id="accroche"
          name="accroche"
          required
          defaultValue={produit?.accroche}
          placeholder="11 parfums au choix, coulés à la main"
          className={CHAMP}
        />
        <p className="mt-1.5 text-[12.5px] text-taupe">La phrase affichée sous le nom.</p>
      </div>

      <div className="mb-5">
        <label htmlFor="description" className={ETIQUETTE}>
          Descriptif
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={produit?.description}
          className={CHAMP}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="inci" className={ETIQUETTE}>
          Composition (INCI)
        </label>
        <textarea
          id="inci"
          name="inci"
          rows={3}
          defaultValue={produit?.inci}
          placeholder="Recopiez la liste de l’étiquette du fournisseur, dans le même ordre"
          className={CHAMP}
        />
        <p className="mt-1.5 text-[12.5px] text-taupe">
          Obligatoire pour un savon : la réglementation cosmétique impose d&rsquo;afficher la
          composition. À laisser vide pour une vitrine, qui est un objet de décoration.
        </p>
      </div>

      <button
        type="submit"
        disabled={enCours}
        className="min-h-[46px] cursor-pointer rounded-s bg-grenat px-6 text-[14px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {enCours ? 'Enregistrement…' : produit ? 'Enregistrer' : 'Créer le produit'}
      </button>

      <p aria-live="polite" className="mt-3 min-h-[22px] text-[13.5px]">
        {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
        {etat.succes && <span className="text-foret">{etat.succes}</span>}
      </p>
    </form>
  );
}

export type VarianteAffichee = {
  id: string;
  nom: string;
  prixCentimes: number;
  unites: number;
  poidsGrammes: number;
};

export function GestionVariantes({
  produitId,
  variantes,
}: {
  produitId: string;
  variantes: VarianteAffichee[];
}) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(enregistrerVariante, {});

  return (
    <section className="rounded-m border border-brume bg-neige p-6">
      <h2 className="mb-1 font-serif text-[24px]">Formats et prix</h2>
      <p className="mb-6 text-[13.5px] text-taupe">
        Un produit peut se vendre en plusieurs formats — « Lot de 5 », « Grande »… Le prix le
        plus bas s&rsquo;affiche en boutique comme « à partir de ».
      </p>

      {variantes.length > 0 && (
        <ul className="mb-7 divide-y divide-brume border-y border-brume">
          {variantes.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 py-3">
              <span className="flex-1 text-[14.5px] font-medium">{v.nom}</span>
              <span className="font-mono text-[15px] tabulaire">{formaterPrix(v.prixCentimes)}</span>
              <span className="font-mono text-[12px] text-taupe">
                {v.unites} u.{v.poidsGrammes > 0 ? ` · ${v.poidsGrammes} g` : ''}
              </span>
              <form action={retirerVariante.bind(null, v.id, produitId)}>
                <button
                  type="submit"
                  className="cursor-pointer border-b border-brume-2 text-[12.5px] text-taupe hover:border-alerte hover:text-alerte"
                >
                  Retirer
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={action}>
        <input type="hidden" name="produitId" value={produitId} />
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label htmlFor="v-nom" className={ETIQUETTE}>
              Format
            </label>
            <input id="v-nom" name="nom" required placeholder="Lot de 5" className={CHAMP} />
          </div>
          <div>
            <label htmlFor="v-prix" className={ETIQUETTE}>
              Prix €
            </label>
            <input
              id="v-prix"
              name="prix"
              required
              inputMode="decimal"
              placeholder="20"
              className={`${CHAMP} sm:w-24`}
            />
          </div>
          <div>
            <label htmlFor="v-unites" className={ETIQUETTE}>
              Unités
            </label>
            <input
              id="v-unites"
              name="unites"
              type="number"
              min={1}
              defaultValue={1}
              className={`${CHAMP} sm:w-24`}
            />
          </div>
          <div>
            <label htmlFor="v-poids" className={ETIQUETTE}>
              Poids g
            </label>
            <input
              id="v-poids"
              name="poids"
              type="number"
              min={0}
              defaultValue={0}
              className={`${CHAMP} sm:w-24`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={enCours}
          className="min-h-[46px] cursor-pointer rounded-s border border-foret px-6 text-[14px] font-semibold text-foret transition-colors hover:bg-foret hover:text-nuage disabled:opacity-60"
        >
          {enCours ? 'Enregistrement…' : 'Ajouter ce format'}
        </button>

        <p aria-live="polite" className="mt-3 min-h-[22px] text-[13.5px]">
          {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
          {etat.succes && <span className="text-foret">{etat.succes}</span>}
        </p>
      </form>
    </section>
  );
}
