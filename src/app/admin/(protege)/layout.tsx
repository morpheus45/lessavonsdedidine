import Link from 'next/link';
import { redirect } from 'next/navigation';
import { administrateurCourant } from '@/lib/auth';
import { seDeconnecter } from '../actions';
import { Sceau } from '@/components/Sceau';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Coquille protégée du backoffice.
 *
 * La page de connexion vit HORS de ce groupe de routes : si elle était
 * dedans, la vérification ci-dessous la redirigerait vers elle-même.
 *
 * Cette garde ne dispense pas les actions serveur de vérifier la session de
 * leur côté — une action est appelable directement, sans passer par cette
 * mise en page.
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const admin = await administrateurCourant();
  if (!admin) redirect('/admin/connexion');

  const [aTraiter, sousSeuil] = await Promise.all([
    prisma.commande.count({ where: { statut: { in: ['payee', 'preparee'] } } }),
    prisma.lot.count({ where: { quantiteRestante: { lte: 10 } } }),
  ]);

  const entrees = [
    { href: '/admin', libelle: 'Tableau de bord' },
    { href: '/admin/commandes', libelle: 'Commandes', pastille: aTraiter },
    { href: '/admin/catalogue', libelle: 'Catalogue' },
    { href: '/admin/series', libelle: 'Séries & stock', pastille: sousSeuil },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[236px_1fr]">
      <aside className="bg-foret px-5 py-6 text-foret-3">
        <div className="mb-10 flex items-center gap-3">
          <Sceau variante="reduit" taille={36} encre="#F2F0EB" />
          <p className="font-serif text-[19px] leading-tight text-nuage">
            Les Savons
            <br />
            de Didine
            <span className="mt-1.5 block font-mono text-[9px] tracking-[0.2em] text-foret-3">
              ADMINISTRATION
            </span>
          </p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {entrees.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="flex items-center justify-between rounded-s px-3 py-2.5 text-[14px] text-foret-3 transition-colors hover:bg-foret-2 hover:text-nuage"
            >
              {e.libelle}
              {e.pastille ? (
                <span className="rounded-full bg-grenat-2 px-2 font-mono text-[12px] font-medium text-foret">
                  {e.pastille}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="mt-10 border-t border-foret-2 pt-5">
          <p className="mb-3 font-mono text-[12px] text-foret-3">{admin.email}</p>
          <form action={seDeconnecter}>
            <button
              type="submit"
              className="cursor-pointer border-b border-foret-3 pb-0.5 text-[13.5px] text-nuage transition-opacity hover:opacity-80"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="bg-nuage p-6 lg:p-8">{children}</main>
    </div>
  );
}
