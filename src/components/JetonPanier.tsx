'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { lirePanier, nombreArticles, surChangement } from '@/lib/panier-client';

/**
 * Compteur du panier.
 *
 * Rendu d'abord sans nombre : le serveur ne connaît pas le contenu du
 * localStorage, et afficher « 0 » puis le vrai chiffre produirait un
 * clignotement à chaque chargement de page.
 */
export function JetonPanier() {
  const [nombre, setNombre] = useState<number | null>(null);

  useEffect(() => {
    const rafraichir = () => setNombre(nombreArticles(lirePanier()));
    rafraichir();
    return surChangement(rafraichir);
  }, []);

  return (
    <Link
      href="/panier"
      className="rounded-s bg-foret px-4 py-2 text-[12.5px] font-semibold text-nuage transition-opacity hover:opacity-90"
    >
      Panier{nombre !== null && nombre > 0 ? ` · ${nombre}` : ''}
    </Link>
  );
}
