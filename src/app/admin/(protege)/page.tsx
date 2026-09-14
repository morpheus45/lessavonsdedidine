import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formaterPrix, formaterDate } from '@/lib/argent';
import { Statut } from './Statut';

export const dynamic = 'force-dynamic';

/** Statuts qui comptent comme du chiffre d'affaires encaissé. */
const ENCAISSES = ['payee', 'preparee', 'expediee', 'livree'];

export default async function TableauDeBord() {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  // Agrégation en base, pas en JavaScript après avoir tout chargé : la
  // différence est invisible sur cinquante commandes, décisive sur dix mille.
  const [duMois, aTraiter, dernieres, series] = await Promise.all([
    prisma.commande.aggregate({
      where: { statut: { in: ENCAISSES }, creeeLe: { gte: debutMois } },
      _sum: { totalCentimes: true },
      _count: true,
    }),
    prisma.commande.findMany({
      where: { statut: { in: ['payee', 'preparee'] } },
      orderBy: { creeeLe: 'asc' },
      take: 8,
      include: { lignes: true },
    }),
    prisma.commande.findMany({
      orderBy: { creeeLe: 'desc' },
      take: 8,
    }),
    prisma.lot.findMany({
      orderBy: { quantiteRestante: 'asc' },
      take: 5,
      include: { produit: true },
    }),
  ]);

  const ca = duMois._sum.totalCentimes ?? 0;
  const nb = duMois._count;
  // Le panier moyen doit se recouper avec les deux autres tuiles : s'il ne
  // tombe pas juste, c'est un bug, pas un arrondi.
  const panierMoyen = nb > 0 ? Math.round(ca / nb) : 0;

  const tuiles = [
    { lbl: "Chiffre d'affaires du mois", val: formaterPrix(ca) },
    { lbl: 'Commandes encaissées', val: String(nb) },
    { lbl: 'Panier moyen', val: nb > 0 ? formaterPrix(panierMoyen) : '—' },
    { lbl: 'À préparer ou expédier', val: String(aTraiter.length) },
  ];

  return (
    <>
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-serif text-[34px] tracking-[-0.025em]">Tableau de bord</h1>
        <p className="font-mono text-[12.5px] text-taupe">
          Depuis le {formaterDate(debutMois)}
        </p>
      </header>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tuiles.map((t) => (
          <div key={t.lbl} className="rounded-m border border-brume bg-white p-5">
            <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-taupe">
              {t.lbl}
            </p>
            <p className="font-mono text-[28px] leading-none tabulaire">{t.val}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-m border border-brume bg-white p-5">
          <h2 className="mb-5 text-[16px] font-semibold">À traiter en priorité</h2>

          {aTraiter.length === 0 ? (
            <p className="text-[14px] text-taupe">
              Rien en attente. Toutes les commandes payées sont expédiées.
            </p>
          ) : (
            <ul className="divide-y divide-brume">
              {aTraiter.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-[14px]">
                    <Link
                      href={`/admin/commandes#${c.reference}`}
                      className="font-mono text-grenat hover:underline"
                    >
                      {c.reference}
                    </Link>
                    <span className="ml-3 text-taupe">{c.nom}</span>
                    <span className="ml-3 font-mono text-[12.5px] text-taupe">
                      {c.lignes.length} article{c.lignes.length > 1 ? 's' : ''}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Statut statut={c.statut} />
                    <span className="font-mono text-[14px] tabulaire">
                      {formaterPrix(c.totalCentimes)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-m border border-brume bg-white p-5">
          <h2 className="mb-5 text-[16px] font-semibold">Séries et stock</h2>

          {series.length === 0 ? (
            <p className="text-[14px] text-taupe">Aucune série enregistrée.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {series.map((l) => {
                const part = l.quantiteProduite
                  ? Math.round((l.quantiteRestante / l.quantiteProduite) * 100)
                  : 0;
                const bas = l.quantiteRestante <= 10;
                return (
                  <li key={l.id}>
                    <p className="mb-1.5 flex justify-between gap-3 text-[13.5px]">
                      <span>
                        <span className="font-mono">{l.reference}</span>
                        <span className="ml-2 text-taupe">{l.produit.nom}</span>
                      </span>
                      <span
                        className={`font-mono tabulaire ${bas ? 'font-semibold text-alerte' : 'text-taupe'}`}
                      >
                        {l.quantiteRestante} / {l.quantiteProduite}
                      </span>
                    </p>
                    <span className="block h-1 overflow-hidden rounded-full bg-brume">
                      <span
                        className={`block h-full rounded-full ${bas ? 'bg-alerte' : 'bg-foret'}`}
                        style={{ width: `${part}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-m border border-brume bg-white p-5">
        <h2 className="mb-5 text-[16px] font-semibold">Dernières commandes</h2>
        {dernieres.length === 0 ? (
          <p className="text-[14px] text-taupe">Aucune commande pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-brume text-left font-mono text-[12px] uppercase tracking-[0.13em] text-taupe">
                  <th scope="col" className="pb-3 pr-4 font-normal">Référence</th>
                  <th scope="col" className="pb-3 pr-4 font-normal">Client</th>
                  <th scope="col" className="pb-3 pr-4 font-normal">Date</th>
                  <th scope="col" className="pb-3 pr-4 font-normal">Statut</th>
                  <th scope="col" className="pb-3 text-right font-normal">Montant</th>
                </tr>
              </thead>
              <tbody>
                {dernieres.map((c) => (
                  <tr key={c.id} className="border-b border-brume last:border-0">
                    <td className="py-3 pr-4 font-mono">{c.reference}</td>
                    <td className="py-3 pr-4">{c.nom}</td>
                    <td className="py-3 pr-4 font-mono tabulaire">{formaterDate(c.creeeLe)}</td>
                    <td className="py-3 pr-4"><Statut statut={c.statut} /></td>
                    <td className="py-3 text-right font-mono tabulaire">
                      {formaterPrix(c.totalCentimes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
