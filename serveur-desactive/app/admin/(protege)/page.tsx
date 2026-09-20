import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formaterPrix, formaterDate } from '@/lib/argent';
import { apercuCatalogue, chargerStatistiques } from '@/lib/statistiques';
import { CourbeChiffreAffaires } from '@/components/graphiques/CourbeChiffreAffaires';
import { BarresHorizontales } from '@/components/graphiques/BarresHorizontales';
import { Anneau } from '@/components/graphiques/Anneau';
import { Statut } from './Statut';

export const dynamic = 'force-dynamic';

/**
 * Mois courant et mois précédent, nommés d'après le calendrier PARISIEN.
 *
 * Le serveur peut tourner en UTC (c'est le cas chez l'hébergeur) : le
 * 1er septembre à 01 h du matin à Paris, il est encore le 31 août pour lui.
 * On lit donc la date telle que la voit Didine, pas telle que la voit la
 * machine. `fr-CA` est utilisé pour sa seule qualité ici : il formate en
 * AAAA-MM-JJ, découpable sans ambiguïté.
 */
function moisParisien() {
  const [annee, mois] = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number);

  const a = annee ?? new Date().getUTCFullYear();
  const m = mois ?? 1;
  return {
    debut: new Date(Date.UTC(a, m - 1, 1, 12)),
    nomPrecedent: new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(a, m - 2, 1, 12)),
    ),
  };
}

export default async function TableauDeBord() {
  const { debut: debutMois, nomPrecedent } = moisParisien();

  // Agrégation en base, pas en JavaScript après avoir tout chargé : la
  // différence est invisible sur cinquante commandes, décisive sur dix mille.
  const [stats, aTraiter, dernieres, series] = await Promise.all([
    chargerStatistiques(),
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

  // Quatre requêtes de plus, mais seulement le jour où il n'y a rien à
  // montrer : hors état vide, elles ne serviraient à rien.
  const apercu = stats.aucuneVente ? await apercuCatalogue() : null;

  const mois = stats.moisCourant;
  const ecart = stats.ecartMensuelPourcent;
  const moyenneParJour = Math.round(stats.fenetre.centimes / stats.fenetreJours);

  const tuiles: { lbl: string; val: string; note: React.ReactNode }[] = [
    {
      lbl: "Chiffre d'affaires du mois",
      val: stats.aucuneVente ? '—' : formaterPrix(mois.centimes),
      note:
        ecart === null ? (
          <span className="text-taupe">Aucune vente en {nomPrecedent}</span>
        ) : (
          <span className={ecart >= 0 ? 'text-ok' : 'text-alerte'}>
            {ecart >= 0 ? '+' : '−'}
            {Math.abs(ecart).toLocaleString('fr-FR')} % par rapport à {nomPrecedent} (
            {formaterPrix(stats.moisPrecedent.centimes)})
          </span>
        ),
    },
    {
      lbl: 'Commandes encaissées',
      val: stats.aucuneVente ? '—' : String(mois.commandes),
      note: <span className="text-taupe">Payées, préparées, expédiées ou livrées</span>,
    },
    {
      lbl: 'Panier moyen',
      val: mois.commandes > 0 ? formaterPrix(mois.panierMoyenCentimes) : '—',
      note: (
        <span className="text-taupe">
          {mois.commandes > 0
            ? `${formaterPrix(mois.centimes)} ÷ ${mois.commandes} commande${mois.commandes > 1 ? 's' : ''}`
            : 'Calculé dès la première commande du mois'}
        </span>
      ),
    },
    {
      lbl: 'À préparer ou expédier',
      val: String(aTraiter.length),
      note: (
        <span className="text-taupe">
          {aTraiter.length > 0 ? 'Commandes payées en attente' : 'Rien en attente'}
        </span>
      ),
    },
  ];

  return (
    <>
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-serif text-[34px] tracking-[-0.025em]">Tableau de bord</h1>
        <p className="font-mono text-[12.5px] text-taupe">Mois en cours — depuis le {formaterDate(debutMois)}</p>
      </header>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tuiles.map((t) => (
          <div key={t.lbl} className="rounded-m border border-brume bg-white p-5">
            <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-taupe">
              {t.lbl}
            </p>
            <p className="mb-2 font-mono text-[28px] leading-none tabulaire">{t.val}</p>
            <p className="text-[12.5px] leading-snug">{t.note}</p>
          </div>
        ))}
      </div>

      {stats.aucuneVente ? (
        <StatistiquesEnAttente
          apercu={apercu}
          fenetreJours={stats.fenetreJours}
          commandesNonEncaissees={stats.commandesNonEncaissees}
        />
      ) : (
        <>
          <section className="mb-4 rounded-m border border-brume bg-white p-5">
            <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="text-[16px] font-semibold">
                Chiffre d&apos;affaires sur {stats.fenetreJours} jours
              </h2>
              <p className="font-mono text-[12.5px] text-taupe tabulaire">
                {formaterPrix(stats.fenetre.centimes)} · {stats.fenetre.commandes} commande
                {stats.fenetre.commandes > 1 ? 's' : ''} · {formaterPrix(moyenneParJour)} par jour en
                moyenne
              </p>
            </header>

            {/* La légende est en texte, pas seulement en couleur : deux traits
                de teintes différentes ne se distinguent pas en niveaux de gris,
                ni pour une personne daltonienne. */}
            <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-taupe">
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-[2px] w-6 rounded-full bg-foret opacity-45" />
                Jour par jour
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-[3px] w-6 rounded-full bg-or" />
                Moyenne glissante sur 7 jours
              </li>
            </ul>

            <CourbeChiffreAffaires points={stats.parJour} />
          </section>

          <div className="mb-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-m border border-brume bg-white p-5">
              <header className="mb-5">
                <h2 className="text-[16px] font-semibold">Ce qui se vend</h2>
                <p className="mt-1 text-[12.5px] text-taupe">
                  Sur {stats.fenetreJours} jours, hors frais de livraison — d&apos;où le total
                  légèrement inférieur au chiffre d&apos;affaires.
                </p>
              </header>

              {stats.parProduit.length === 0 ? (
                <p className="text-[14px] text-taupe">
                  Aucune vente sur les {stats.fenetreJours} derniers jours.
                </p>
              ) : (
                <div className="flex flex-col gap-7">
                  <div>
                    <h3 className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-taupe">
                      Par produit
                    </h3>
                    <BarresHorizontales
                      identifiant="barres-produit"
                      titre={`Chiffre d'affaires par produit sur ${stats.fenetreJours} jours`}
                      donnees={stats.parProduit.map((p) => ({
                        cle: p.cle,
                        libelle: p.libelle,
                        detail: `${p.quantite} vendu${p.quantite > 1 ? 's' : ''}`,
                        valeur: p.centimes,
                        valeurAffichee: formaterPrix(p.centimes),
                      }))}
                    />
                  </div>

                  <div>
                    <h3 className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-taupe">
                      Par format
                    </h3>
                    <BarresHorizontales
                      identifiant="barres-format"
                      teinte="var(--color-foret-2)"
                      titre={`Chiffre d'affaires par format sur ${stats.fenetreJours} jours`}
                      donnees={stats.parFormat.map((f) => ({
                        cle: f.cle,
                        libelle: f.libelle,
                        detail: f.detail,
                        valeur: f.centimes,
                        valeurAffichee: formaterPrix(f.centimes),
                      }))}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-m border border-brume bg-white p-5">
              <header className="mb-5">
                <h2 className="text-[16px] font-semibold">Vitrines ou savons</h2>
                <p className="mt-1 text-[12.5px] text-taupe">
                  Lequel des deux métiers vous fait vivre, sur {stats.fenetreJours} jours.
                </p>
              </header>

              {stats.parMetier.length === 0 ? (
                <p className="text-[14px] text-taupe">
                  Aucune vente sur les {stats.fenetreJours} derniers jours.
                </p>
              ) : (
                <Anneau
                  identifiant="anneau-metier"
                  titre={`Répartition du chiffre d'affaires entre vitrines et savons sur ${stats.fenetreJours} jours`}
                  segments={stats.parMetier.map((m) => ({
                    cle: m.cle,
                    libelle: m.libelle,
                    centimes: m.centimes,
                    detail: `${m.quantite} pièce${m.quantite > 1 ? 's' : ''}`,
                  }))}
                />
              )}
            </section>
          </div>

          {stats.parTheme.length > 0 && (
            <section className="mb-4 rounded-m border border-brume bg-white p-5">
              <header className="mb-5">
                <h2 className="text-[16px] font-semibold">Thèmes de vitrines les plus demandés</h2>
                <p className="mt-1 text-[12.5px] text-taupe">
                  En nombre de vitrines commandées sur {stats.fenetreJours} jours.
                </p>
              </header>
              {/* Bridé en largeur : le texte d'un SVG grandit avec lui, et une
                  barre étirée sur 1 100 px afficherait des étiquettes de 24 px. */}
              <div className="max-w-[680px]">
                <BarresHorizontales
                  identifiant="barres-theme"
                  teinte="var(--color-grenat)"
                  enTeteValeur="Vitrines commandées"
                  titre={`Thèmes de vitrines les plus demandés sur ${stats.fenetreJours} jours`}
                  donnees={stats.parTheme.map((t) => ({
                    cle: t.cle,
                    libelle: t.libelle,
                    detail: formaterPrix(t.centimes),
                    valeur: t.quantite,
                    valeurAffichee: `${t.quantite} vitrine${t.quantite > 1 ? 's' : ''}`,
                  }))}
                />
              </div>
            </section>
          )}
        </>
      )}

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

/**
 * L'état vide, traité comme un état à part entière.
 *
 * Avant la première vente, des axes vides et des « 0 € » alignés donnent
 * l'impression d'un logiciel cassé. On dit plutôt ce qui s'affichera ici,
 * d'où viendront les chiffres, et on montre les quelques données qui, elles,
 * sont déjà vraies. Aucune donnée de démonstration : un faux graphique
 * apprendrait à se méfier des vrais.
 */
function StatistiquesEnAttente({
  apercu,
  fenetreJours,
  commandesNonEncaissees,
}: {
  apercu: Awaited<ReturnType<typeof apercuCatalogue>> | null;
  fenetreJours: number;
  commandesNonEncaissees: number;
}) {
  const aVenir = [
    `Une courbe du chiffre d'affaires jour par jour, sur ${fenetreJours} jours glissants.`,
    'La comparaison avec le mois précédent, en euros et en pourcentage.',
    'La répartition des ventes par produit puis par format.',
    'La part des vitrines et celle des savons, pour voir lequel des deux métiers vous fait vivre.',
    'Les thèmes de vitrines les plus demandés.',
  ];

  return (
    <section className="mb-4 rounded-m border border-brume bg-white p-6 lg:p-8">
      <p className="eyebrow mb-3">En attente de la première vente</p>
      <h2 className="mb-4 font-serif text-[27px]">Les statistiques s&apos;afficheront ici</h2>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="max-w-[62ch] text-[15px] leading-relaxed text-taupe">
            Rien n&apos;est saisi à la main. Dès qu&apos;une commande est encaissée, elle alimente
            ces chiffres toute seule : le montant vient de la commande elle-même, le détail des
            lignes qu&apos;elle contient. Les commandes en attente de paiement, échouées ou
            annulées n&apos;y entrent jamais — ce ne sont pas des recettes.
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {aVenir.map((ligne) => (
              <li key={ligne} className="flex gap-3 text-[14px]">
                <span aria-hidden="true" className="mt-2 h-1 w-3 shrink-0 rounded-full bg-or" />
                <span>{ligne}</span>
              </li>
            ))}
          </ul>

          {commandesNonEncaissees > 0 && (
            <p className="mt-5 rounded-m bg-attente-bg px-4 py-3 text-[13.5px] text-attente">
              {commandesNonEncaissees} commande{commandesNonEncaissees > 1 ? 's' : ''} existe
              {commandesNonEncaissees > 1 ? 'nt' : ''} déjà sans être encaissée
              {commandesNonEncaissees > 1 ? 's' : ''}. Elle{commandesNonEncaissees > 1 ? 's' : ''}{' '}
              apparaîtra{commandesNonEncaissees > 1 ? 'ont' : ''} dans ces chiffres au paiement.
            </p>
          )}
        </div>

        {apercu && (
          <div className="rounded-m border border-brume bg-nuage p-5">
            <h3 className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-taupe">
              Ce qui est déjà prêt
            </h3>
            <dl className="flex flex-col gap-3 text-[14px]">
              {[
                { t: 'Produits en ligne', v: apercu.produits },
                { t: 'Formats à la vente', v: apercu.formats },
                { t: 'Thèmes de vitrines', v: apercu.themes },
                { t: 'Séries de fabrication', v: apercu.series },
                { t: 'Savons en stock', v: apercu.unitesEnStock },
              ].map((e) => (
                <div key={e.t} className="flex items-baseline justify-between gap-3">
                  <dt className="text-taupe">{e.t}</dt>
                  <dd className="font-mono text-[15px] tabulaire">{e.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
