'use client';

import { useActionState, useRef, useState } from 'react';
import { envoyerPhoto, supprimerPhoto, type EtatFormulaire } from './actions';

export type PhotoAffichee = {
  id: string;
  url: string;
  urlPetite: string;
  alt: string;
  largeur: number;
  hauteur: number;
  octets: number;
};

/**
 * Dépôt et gestion des photos d'un produit.
 *
 * Didine choisit une photo dans sa pellicule et écrit une phrase de
 * description. Tout le reste — rotation, réduction en 1200 et 600 px,
 * conversion en WebP — se fait à la réception, côté serveur.
 */
export function GestionPhotos({
  produitId,
  photos,
}: {
  produitId: string;
  photos: PhotoAffichee[];
}) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(envoyerPhoto, {});
  const [apercu, setApercu] = useState<string | null>(null);
  const [poids, setPoids] = useState<string | null>(null);
  const formulaire = useRef<HTMLFormElement>(null);

  return (
    <section className="rounded-m border border-brume bg-neige p-6">
      <h2 className="mb-1 font-serif text-[24px]">Photos</h2>
      <p className="mb-6 text-[13.5px] text-taupe">
        Envoyez la photo telle quelle, depuis votre téléphone. Elle est redressée, réduite en
        deux tailles et convertie automatiquement — vous n&rsquo;avez rien à préparer.
      </p>

      {photos.length > 0 && (
        <ul className="mb-7 grid gap-3 sm:grid-cols-2">
          {photos.map((p, i) => (
            <li key={p.id} className="flex gap-3 rounded-s border border-brume p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.urlPetite} alt="" className="h-24 w-24 shrink-0 rounded-s object-cover" />
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-taupe">
                  {i === 0 ? 'Photo principale' : `Photo ${i + 1}`} · {p.largeur}×{p.hauteur} ·{' '}
                  {Math.round(p.octets / 1024)} Ko
                </p>
                <p className="mb-2 line-clamp-3 text-[13px] text-taupe">{p.alt}</p>
                <form action={supprimerPhoto.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="cursor-pointer border-b border-brume-2 text-[12.5px] text-taupe hover:border-alerte hover:text-alerte"
                  >
                    Retirer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formulaire}
        action={(donnees) => {
          action(donnees);
          formulaire.current?.reset();
          setApercu(null);
          setPoids(null);
        }}
        className="border-t border-brume pt-6"
      >
        <input type="hidden" name="produitId" value={produitId} />

        <label
          htmlFor="fichier"
          className="mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe"
        >
          Choisir une photo
        </label>
        <input
          id="fichier"
          name="fichier"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setApercu(f ? URL.createObjectURL(f) : null);
            setPoids(f ? `${Math.round(f.size / 1024 / 102.4) / 10} Mo à l’envoi` : null);
          }}
          className="mb-4 block w-full cursor-pointer text-[14px] file:mr-4 file:cursor-pointer file:rounded-s file:border-0 file:bg-foret file:px-4 file:py-2.5 file:text-[13px] file:font-semibold file:text-nuage"
        />

        {apercu && (
          <div className="mb-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercu} alt="" className="h-20 w-20 rounded-s object-cover" />
            <p className="font-mono text-[12px] text-taupe">{poids}</p>
          </div>
        )}

        <label
          htmlFor="alt"
          className="mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe"
        >
          Description de la photo
        </label>
        <textarea
          id="alt"
          name="alt"
          required
          rows={2}
          placeholder="Coffret de quatre savons ovales au motif de brin d’olivier, sur papier de soie"
          aria-describedby="aide-alt"
          className="mb-2 w-full rounded-s border border-brume-2 bg-nuage px-3 py-2.5 text-[14px]"
        />
        <p id="aide-alt" className="mb-5 text-[12.5px] text-taupe">
          Dites ce qu&rsquo;on voit. C&rsquo;est lu à voix haute aux personnes aveugles, et
          c&rsquo;est aussi ce que Google lit pour référencer la photo.
        </p>

        <button
          type="submit"
          disabled={enCours}
          className="min-h-[46px] cursor-pointer rounded-s bg-grenat px-6 text-[14px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? 'Envoi et réduction…' : 'Ajouter la photo'}
        </button>

        <p aria-live="polite" className="mt-3 min-h-[22px] text-[13.5px]">
          {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
          {etat.succes && <span className="text-foret">{etat.succes}</span>}
        </p>
      </form>
    </section>
  );
}
