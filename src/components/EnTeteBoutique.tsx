import Link from 'next/link';
import { Sceau } from './Sceau';
import { JetonPanier } from './JetonPanier';

/**
 * Quatre entrées maximum, aucun menu déroulant — c'est le choix qui
 * distingue le site de la référence, qui en empile six.
 *
 * Aucun lien ne pointe vers une page qui n'existe pas : un site réel ne
 * peut pas avoir de navigation décorative.
 */
const ENTREES = [
  { href: '/savons', libelle: 'Les savons' },
  { href: '/atelier', libelle: "L'atelier" },
] as const;

export function EnTeteBoutique({ actif }: { actif?: string }) {
  return (
    <header className="border-b border-brume">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="flex items-center gap-3" aria-label="Les Savons de Didine, accueil">
          <Sceau variante="reduit" taille={40} />
          <span className="font-serif text-[23px] leading-none tracking-[-0.02em] text-graphite">
            Les Savons de Didine
            <span className="mt-[5px] block font-mono text-[8.5px] tracking-[0.2em] text-taupe">
              SAPONIFIÉ À FROID
            </span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="flex gap-6 text-[14.5px]">
          {ENTREES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              aria-current={actif === e.href ? 'page' : undefined}
              className={
                actif === e.href
                  ? 'font-semibold text-graphite'
                  : 'text-taupe transition-colors hover:text-graphite'
              }
            >
              {e.libelle}
            </Link>
          ))}
        </nav>

        <JetonPanier />
      </div>
    </header>
  );
}

export function PiedBoutique() {
  return (
    <footer className="mt-40 border-t border-brume">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Sceau variante="reduit" taille={44} />
          <p className="mt-4 text-[14px] text-taupe">
            Savons saponifiés à froid, en petites séries.
            <br />
            Six semaines de cure, surgras à 8 %.
          </p>
        </div>

        <nav aria-label="Boutique">
          <h2 className="eyebrow mb-3">Boutique</h2>
          <ul className="space-y-2 text-[14px]">
            <li>
              <Link href="/savons" className="text-taupe hover:text-graphite">
                Les savons
              </Link>
            </li>
            <li>
              <Link href="/panier" className="text-taupe hover:text-graphite">
                Panier
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="La maison">
          <h2 className="eyebrow mb-3">La maison</h2>
          <ul className="space-y-2 text-[14px]">
            <li>
              <Link href="/atelier" className="text-taupe hover:text-graphite">
                L&rsquo;atelier
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="text-taupe hover:text-graphite">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="text-taupe hover:text-graphite">
                Conditions de vente
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow mb-3">Livraison</h2>
          <p className="text-[14px] text-taupe">
            Expédié sous 48 h.
            <br />
            Offerte dès 39 €.
            <br />
            Retour 14 jours, emballage non ouvert.
          </p>
        </div>
      </div>

      <div className="border-t border-brume">
        <p className="mx-auto max-w-[1240px] px-6 py-6 font-mono text-[12px] text-taupe">
          Les Savons de Didine · Produits cosmétiques artisanaux · Saponification à froid
        </p>
      </div>
    </footer>
  );
}
