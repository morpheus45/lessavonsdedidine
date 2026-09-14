'use client';

import { useState } from 'react';
import { Photo } from './Photo';
import { fichePhoto } from '@/donnees/photos';

/**
 * Galerie d'une fiche produit : une grande photo, des vignettes en dessous.
 *
 * La première photo est rendue côté serveur et reste visible sans JavaScript ;
 * les vignettes ne font que changer laquelle est en grand. Sans JavaScript on
 * garde donc une page correcte avec une seule photo, plutôt qu'un cadre vide.
 */
export function Galerie({ photos, nom }: { photos: string[]; nom: string }) {
  const [choisie, setChoisie] = useState(0);
  const grande = photos[choisie] ?? photos[0];

  if (!grande) return null;

  return (
    <div className="lg:sticky lg:top-8">
      <div className="overflow-hidden rounded-m border border-brume bg-neige">
        <Photo
          chemin={grande}
          tailles="(min-width: 1024px) 46vw, 100vw"
          prioritaire
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      {photos.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3" aria-label={`Photos de ${nom}`}>
          {photos.map((p, i) => {
            const active = i === choisie;
            return (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => setChoisie(i)}
                  aria-pressed={active}
                  className={`block w-full cursor-pointer overflow-hidden rounded-s border-2 transition-colors ${
                    active ? 'border-foret' : 'border-transparent hover:border-brume-2'
                  }`}
                >
                  <Photo
                    chemin={p}
                    tailles="120px"
                    className="aspect-square w-full object-cover"
                    // Le bouton porte déjà la description : la répéter ferait
                    // lire deux fois la même phrase à un lecteur d'écran.
                    alt=""
                  />
                  <span className="sr-only">
                    {fichePhoto(p)?.alt ?? `Photo ${i + 1}`}
                    {active ? ' — affichée' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
