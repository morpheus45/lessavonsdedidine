'use client';

import { useActionState, useRef, useState } from 'react';
import {
  creerTheme,
  enregistrerTheme,
  envoyerPhotoTheme,
  retirerPhotoTheme,
  supprimerTheme,
  type EtatFormulaire,
} from './actions';

const ETIQUETTE = 'mb-2 block font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe';
const CHAMP = 'w-full rounded-s border border-brume-2 bg-nuage px-3 py-2.5 text-[14px]';
const BOUTON_PRINCIPAL =
  'min-h-[46px] cursor-pointer rounded-s bg-grenat px-6 text-[14px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:opacity-60';

export type ThemeFormulaire = {
  id: string;
  nom: string;
  description: string;
  actif: boolean;
};

/**
 * Création et modification d'un thème.
 *
 * Le même formulaire sert aux deux : ce sont les mêmes champs, et la seule
 * différence tient à l'action appelée. Tous les identifiants de champ sont
 * suffixés, parce que la page affiche un formulaire par thème — deux `id`
 * identiques casseraient le lien entre l'étiquette et le champ, donc le
 * lecteur d'écran.
 */
export function FormulaireTheme({ theme }: { theme?: ThemeFormulaire }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    theme ? enregistrerTheme : creerTheme,
    {},
  );
  const cle = theme?.id ?? 'nouveau';

  return (
    <form action={action}>
      {theme && <input type="hidden" name="themeId" value={theme.id} />}

      <div className="mb-5">
        <label htmlFor={`nom-${cle}`} className={ETIQUETTE}>
          Nom du thème
        </label>
        <input
          id={`nom-${cle}`}
          name="nom"
          required
          defaultValue={theme?.nom}
          placeholder="Chambre d’enfant"
          className={CHAMP}
        />
        {theme && (
          <p className="mt-1.5 text-[12.5px] text-taupe">
            L&rsquo;adresse du thème ne change pas avec son nom : elle est déjà inscrite dans les
            paniers en cours et dans les commandes passées.
          </p>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor={`description-${cle}`} className={ETIQUETTE}>
          Ce qu&rsquo;on voit dans la scène
        </label>
        <textarea
          id={`description-${cle}`}
          name="description"
          required
          rows={3}
          defaultValue={theme?.description}
          placeholder="Un petit lit, une commode, un tapis rond et une veilleuse allumée"
          aria-describedby={`aide-description-${cle}`}
          className={CHAMP}
        />
        <p id={`aide-description-${cle}`} className="mt-1.5 text-[12.5px] text-taupe">
          Une phrase, sous le nom du thème. C&rsquo;est ce que lit la cliente avant de choisir.
        </p>
      </div>

      <label
        htmlFor={`actif-${cle}`}
        className="mb-5 flex min-h-[44px] cursor-pointer items-center gap-3 text-[14px]"
      >
        <input
          id={`actif-${cle}`}
          name="actif"
          type="checkbox"
          defaultChecked={theme?.actif ?? true}
          className="h-5 w-5 cursor-pointer accent-foret"
        />
        Proposé aux clientes
      </label>

      <button type="submit" disabled={enCours} className={BOUTON_PRINCIPAL}>
        {enCours ? 'Enregistrement…' : theme ? 'Enregistrer' : 'Créer le thème'}
      </button>

      <p aria-live="polite" className="mt-3 min-h-[22px] text-[13.5px]">
        {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
        {etat.succes && <span className="text-foret">{etat.succes}</span>}
      </p>
    </form>
  );
}

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
 * Dépôt et gestion des photos d'un thème.
 *
 * Didine choisit une photo dans sa pellicule et écrit une phrase de
 * description. Tout le reste — rotation, réduction en 1200 et 600 px,
 * conversion en WebP — se fait à la réception, côté serveur.
 */
export function GestionPhotosTheme({
  themeId,
  photos,
}: {
  themeId: string;
  photos: PhotoAffichee[];
}) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(envoyerPhotoTheme, {});
  const [apercu, setApercu] = useState<string | null>(null);
  const [poids, setPoids] = useState<string | null>(null);
  const formulaire = useRef<HTMLFormElement>(null);

  return (
    <div>
      <h3 className="mb-1 font-serif text-[22px]">Photos du thème</h3>
      <p className="mb-6 text-[13.5px] text-taupe">
        Envoyez la photo telle quelle, depuis votre téléphone. Elle est redressée, réduite en deux
        tailles et convertie automatiquement — vous n&rsquo;avez rien à préparer.
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
                <p className="mb-1 line-clamp-3 text-[13px] text-taupe">{p.alt}</p>
                <form action={retirerPhotoTheme.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="min-h-[44px] cursor-pointer text-[12.5px] text-taupe underline underline-offset-4 hover:text-alerte"
                  >
                    Retirer cette photo
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
        <input type="hidden" name="themeId" value={themeId} />

        <label htmlFor={`fichier-${themeId}`} className={ETIQUETTE}>
          Choisir une photo
        </label>
        <input
          id={`fichier-${themeId}`}
          name="fichier"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setApercu(f ? URL.createObjectURL(f) : null);
            setPoids(f ? `${Math.round(f.size / 1024 / 102.4) / 10} Mo à l’envoi` : null);
          }}
          className="mb-4 block w-full cursor-pointer text-[14px] file:mr-4 file:min-h-[44px] file:cursor-pointer file:rounded-s file:border-0 file:bg-foret file:px-4 file:text-[13px] file:font-semibold file:text-nuage"
        />

        {apercu && (
          <div className="mb-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercu} alt="" className="h-20 w-20 rounded-s object-cover" />
            <p className="font-mono text-[12px] text-taupe">{poids}</p>
          </div>
        )}

        <label htmlFor={`alt-${themeId}`} className={ETIQUETTE}>
          Description de la photo
        </label>
        <textarea
          id={`alt-${themeId}`}
          name="alt"
          required
          rows={2}
          placeholder="Vitrine sur le thème chambre d’enfant : petit lit, commode et veilleuse allumée"
          aria-describedby={`aide-alt-${themeId}`}
          className={`${CHAMP} mb-2`}
        />
        <p id={`aide-alt-${themeId}`} className="mb-5 text-[12.5px] text-taupe">
          Dites ce qu&rsquo;on voit. C&rsquo;est lu à voix haute aux personnes aveugles, et
          c&rsquo;est aussi ce que Google lit pour référencer la photo.
        </p>

        <button type="submit" disabled={enCours} className={BOUTON_PRINCIPAL}>
          {enCours ? 'Envoi et réduction…' : 'Ajouter la photo'}
        </button>

        <p aria-live="polite" className="mt-3 min-h-[22px] text-[13.5px]">
          {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
          {etat.succes && <span className="text-foret">{etat.succes}</span>}
        </p>
      </form>
    </div>
  );
}

/**
 * Suppression définitive d'un thème.
 *
 * Deux cas, et l'interface dit lequel s'applique plutôt que de présenter un
 * bouton qui échouerait. La confirmation passe par un dépliant : une
 * suppression ne doit pas tenir en un seul clic, et ça évite une boîte de
 * dialogue du navigateur.
 */
export function SupprimerTheme({
  themeId,
  citations,
}: {
  themeId: string;
  citations: number;
}) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(supprimerTheme, {});

  if (citations > 0) {
    return (
      <p className="rounded-s border border-brume-2 bg-nuage p-4 text-[13px] text-taupe-f">
        Ce thème figure sur {citations} ligne{citations > 1 ? 's' : ''} de commande. Une commande
        est une pièce comptable conservée dix ans : le thème ne peut plus être supprimé. Décochez
        « Proposé aux clientes » pour qu&rsquo;il disparaisse de la boutique.
      </p>
    );
  }

  return (
    <details className="rounded-s border border-brume-2 bg-nuage p-4">
      {/* Pas de `display: flex` sur un summary : le navigateur retire alors
          son triangle, et le dépliant ne se voit plus. La hauteur de touche
          vient du remplissage. */}
      <summary className="min-h-[44px] cursor-pointer py-2.5 text-[13px] text-taupe">
        Supprimer définitivement ce thème
      </summary>

      <p className="mb-3 mt-2 text-[13px] text-taupe-f">
        Aucune commande ne cite ce thème : il peut partir, avec ses photos. C&rsquo;est
        irréversible.
      </p>

      <form action={action}>
        <input type="hidden" name="themeId" value={themeId} />
        <button
          type="submit"
          disabled={enCours}
          className="min-h-[44px] cursor-pointer rounded-s border border-alerte bg-alerte-bg px-5 text-[13px] font-semibold text-alerte transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? 'Suppression…' : 'Oui, supprimer ce thème'}
        </button>
      </form>

      <p aria-live="polite" className="mt-3 min-h-[22px] text-[13px]">
        {etat.erreur && <span className="text-alerte">{etat.erreur}</span>}
        {etat.succes && <span className="text-foret">{etat.succes}</span>}
      </p>
    </details>
  );
}
