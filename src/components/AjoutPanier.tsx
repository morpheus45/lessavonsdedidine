'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ajouter } from '@/lib/panier-client';
import { formaterPrix } from '@/lib/argent';

export type VarianteChoix = {
  id: string;
  nom: string;
  prixCentimes: number;
};

/**
 * Choix du format, quantité, ajout au panier.
 *
 * Le bouton n'est jamais désactivé : il passe par un état « Ajouté » puis
 * revient. Un bouton grisé ne dit pas ce qui se passe, et laisse le client
 * cliquer plusieurs fois sans retour.
 */
export function AjoutPanier({
  variantes,
  nomProduit,
  slug,
}: {
  variantes: VarianteChoix[];
  nomProduit: string;
  slug: string;
}) {
  const [choisie, setChoisie] = useState(variantes[0]?.id ?? '');
  const [quantite, setQuantite] = useState(1);
  const [ajoute, setAjoute] = useState(false);

  const variante = variantes.find((v) => v.id === choisie) ?? variantes[0];
  if (!variante) return null;

  function validerAjout() {
    if (!variante) return;
    ajouter({
      varianteId: variante.id,
      quantite,
      libelle: `${nomProduit} — ${variante.nom}`,
      prixCentimes: variante.prixCentimes,
      slug,
    });
    setAjoute(true);
    window.setTimeout(() => setAjoute(false), 2600);
  }

  return (
    <div>
      {variantes.length > 1 && (
        <>
          <p id="libelle-format" className="mb-3 font-mono text-[12px] uppercase tracking-[0.18em] text-taupe">
            Format
          </p>
          <div role="radiogroup" aria-labelledby="libelle-format" className="mb-8 flex flex-wrap gap-3">
            {variantes.map((v) => {
              const actif = v.id === choisie;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => setChoisie(v.id)}
                  className={`rounded-s border px-5 py-3 text-[14px] transition-colors ${
                    actif
                      ? 'border-encre bg-encre font-semibold text-nuage'
                      : 'border-brume-2 bg-neige text-graphite hover:border-taupe'
                  }`}
                >
                  {v.nom} — {formaterPrix(v.prixCentimes)}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mb-8 flex gap-4">
        <div className="flex items-center rounded-s border border-brume-2 bg-neige">
          <button
            type="button"
            onClick={() => setQuantite((q) => Math.max(1, q - 1))}
            aria-label="Diminuer la quantité"
            className="min-h-[48px] px-4 text-[18px] text-graphite hover:text-onyx"
          >
            −
          </button>
          <span
            aria-live="polite"
            aria-label={`Quantité : ${quantite}`}
            className="min-w-[52px] border-x border-brume px-3 text-center font-mono leading-[48px] tabulaire"
          >
            {quantite}
          </span>
          <button
            type="button"
            onClick={() => setQuantite((q) => Math.min(50, q + 1))}
            aria-label="Augmenter la quantité"
            className="min-h-[48px] px-4 text-[18px] text-graphite hover:text-onyx"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={validerAjout}
          className="min-h-[52px] flex-1 rounded-s bg-onyx px-6 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
        >
          {ajoute ? 'Ajouté au panier' : 'Ajouter au panier'}
        </button>
      </div>

      {/* Message d'état annoncé aux lecteurs d'écran, et visible pour tous. */}
      <p aria-live="polite" className="min-h-[24px] text-[14px]">
        {ajoute && (
          <span className="text-encre">
            {quantite} × {variante.nom} ajouté.{' '}
            <Link href="/panier" className="border-b border-onyx text-onyx">
              Voir le panier
            </Link>
          </span>
        )}
      </p>
    </div>
  );
}
