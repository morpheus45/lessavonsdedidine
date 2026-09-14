'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ajouter } from '@/lib/panier-client';
import { formaterPrix } from '@/lib/argent';

export type FormuleVitrine = {
  id: string;
  nom: string;
  prixCentimes: number;
};

export type ThemeChoix = {
  slug: string;
  nom: string;
  description: string;
};

/**
 * Composition d'une vitrine : formule, thème, prénom.
 *
 * Les trois sont obligatoires — une vitrine sans prénom ni thème n'est pas
 * fabricable, et le serveur refusera la commande de toute façon. Autant le
 * dire ici, au moment du choix, plutôt qu'à la validation du panier.
 */
export function ConfigurateurVitrine({
  formules,
  themes,
}: {
  formules: FormuleVitrine[];
  themes: ThemeChoix[];
}) {
  const [formuleId, setFormuleId] = useState(formules[0]?.id ?? '');
  const [themeSlug, setThemeSlug] = useState('');
  const [prenom, setPrenom] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [ajoute, setAjoute] = useState(false);

  const formule = formules.find((f) => f.id === formuleId) ?? formules[0];
  const theme = themes.find((t) => t.slug === themeSlug);
  const prenomNet = prenom.trim();

  function validerAjout() {
    setErreur(null);

    if (!formule) return;
    if (!theme) {
      setErreur('Choisissez un thème pour votre vitrine.');
      return;
    }
    if (prenomNet.length < 1) {
      setErreur('Indiquez le prénom à poser sur la vitrine.');
      return;
    }
    if (prenomNet.length > 24) {
      setErreur('Le prénom ne peut pas dépasser 24 caractères.');
      return;
    }

    ajouter({
      varianteId: formule.id,
      quantite: 1,
      libelle: `Vitrine ${formule.nom} — ${theme.nom}`,
      prixCentimes: formule.prixCentimes,
      slug: 'vitrine-personnalisee',
      prenom: prenomNet,
      themeSlug: theme.slug,
    });

    setAjoute(true);
    window.setTimeout(() => setAjoute(false), 3000);
  }

  return (
    <div>
      {/* ── Formule ─────────────────────────────────────────────── */}
      <p id="lbl-formule" className="mb-3 font-mono text-[12px] uppercase tracking-[0.18em] text-taupe">
        Format
      </p>
      <div role="radiogroup" aria-labelledby="lbl-formule" className="mb-8 flex flex-wrap gap-3">
        {formules.map((f) => {
          const actif = f.id === formuleId;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => setFormuleId(f.id)}
              className={`min-h-[48px] cursor-pointer rounded-s border px-5 py-3 text-[14px] transition-colors ${
                actif
                  ? 'border-foret bg-foret font-semibold text-nuage'
                  : 'border-brume-2 bg-neige text-graphite hover:border-taupe'
              }`}
            >
              {f.nom} — {formaterPrix(f.prixCentimes)}
            </button>
          );
        })}
      </div>

      {/* ── Thème ───────────────────────────────────────────────── */}
      <p id="lbl-theme" className="mb-3 font-mono text-[12px] uppercase tracking-[0.18em] text-taupe">
        Thème
      </p>
      <div role="radiogroup" aria-labelledby="lbl-theme" className="mb-8 grid gap-3 sm:grid-cols-2">
        {themes.map((t) => {
          const actif = t.slug === themeSlug;
          return (
            <button
              key={t.slug}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => setThemeSlug(t.slug)}
              className={`cursor-pointer rounded-m border p-4 text-left transition-colors ${
                actif ? 'border-foret bg-neige' : 'border-brume-2 bg-neige hover:border-taupe'
              }`}
            >
              <span
                className={`mb-1 block text-[15px] font-semibold ${actif ? 'text-foret' : 'text-graphite'}`}
              >
                {t.nom}
              </span>
              <span className="block text-[13px] text-taupe">{t.description}</span>
            </button>
          );
        })}
      </div>

      {/* ── Prénom ──────────────────────────────────────────────── */}
      <label htmlFor="prenom" className="mb-3 block font-mono text-[12px] uppercase tracking-[0.18em] text-taupe">
        Prénom à poser sur la vitrine
      </label>
      <input
        id="prenom"
        type="text"
        value={prenom}
        maxLength={24}
        onChange={(e) => setPrenom(e.target.value)}
        placeholder="Josiane"
        aria-describedby="aide-prenom"
        className="mb-2 min-h-[48px] w-full rounded-s border border-brume-2 bg-neige px-4 text-[15px]"
      />
      <p id="aide-prenom" className="mb-8 font-mono text-[12px] text-taupe">
        {prenomNet.length}/24 caractères · lettres découpées et collées sur le cadre
      </p>

      {/* ── Récapitulatif ───────────────────────────────────────── */}
      <div className="mb-6 border-y border-brume py-4">
        <p className="flex items-baseline justify-between gap-4">
          <span className="text-[14.5px] text-taupe">
            {formule?.nom ?? '—'}
            {theme ? ` · ${theme.nom}` : ''}
            {prenomNet ? ` · « ${prenomNet} »` : ''}
          </span>
          <span className="font-mono text-[24px] tabulaire">
            {formule ? formaterPrix(formule.prixCentimes) : '—'}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={validerAjout}
        className="min-h-[52px] w-full cursor-pointer rounded-s bg-grenat px-6 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
      >
        {ajoute ? 'Ajouté au panier' : 'Ajouter au panier'}
      </button>

      <p aria-live="polite" className="mt-3 min-h-[24px] text-[14px]">
        {erreur && <span className="text-alerte">{erreur}</span>}
        {ajoute && !erreur && (
          <span className="text-foret">
            Vitrine ajoutée.{' '}
            <Link href="/panier" className="border-b border-grenat text-grenat">
              Voir le panier
            </Link>
          </span>
        )}
      </p>

      <p className="mt-6 text-[13px] text-taupe">
        Chaque vitrine est montée à la commande. Comptez environ une semaine de fabrication
        avant expédition.
      </p>
    </div>
  );
}
