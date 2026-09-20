import { prisma } from '@/lib/prisma';
import { formaterDate } from '@/lib/argent';
import { FormulaireSerie, CorrectionStock } from './Formulaires';

export const dynamic = 'force-dynamic';

/** En dessous, il faut relancer une coulée avant la rupture. */
const SEUIL_STOCK_BAS = 10;

/** Au-delà, la date de durabilité n'est pas encore un sujet. */
const HORIZON_DURABILITE_JOURS = 60;

const JOUR_MS = 24 * 60 * 60 * 1000;

export default async function Series() {
  const [lots, savons] = await Promise.all([
    prisma.lot.findMany({
      orderBy: { couleLe: 'desc' },
      include: { produit: { select: { nom: true, rang: true } } },
    }),
    prisma.produit.findMany({
      where: { type: 'savon' },
      orderBy: { rang: 'asc' },
      select: { id: true, nom: true, rang: true },
    }),
  ]);

  // Minuit du jour courant : comparer à l'heure exacte ferait basculer
  // « dans 60 jours » d'une ligne à l'autre au fil de la journée.
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  const series = lots.map((lot) => {
    const jours = Math.ceil((lot.durableJusquLe.getTime() - aujourdHui.getTime()) / JOUR_MS);
    return {
      lot,
      jours,
      stockBas: lot.quantiteRestante <= SEUIL_STOCK_BAS,
      durabiliteProche: jours <= HORIZON_DURABILITE_JOURS,
    };
  });

  const enStock = series.reduce((somme, s) => somme + s.lot.quantiteRestante, 0);
  const aSurveiller = series.filter((s) => s.stockBas || s.durabiliteProche).length;

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[34px] tracking-[-0.025em]">Séries &amp; stock</h1>
          <p className="mt-1 max-w-[64ch] text-[14px] text-taupe">
            {series.length} série{series.length > 1 ? 's' : ''} · {enStock} savon
            {enStock > 1 ? 's' : ''} en stock
            {aSurveiller > 0 ? ` · ${aSurveiller} à surveiller` : ''}
          </p>
        </div>
        <a
          href="#nouvelle-serie"
          className="inline-flex min-h-[46px] items-center rounded-s bg-grenat px-5 text-[14px] font-semibold text-nuage transition-opacity hover:opacity-90"
        >
          Nouvelle série
        </a>
      </header>

      <p className="mb-8 max-w-[70ch] rounded-m border border-brume bg-neige px-5 py-4 text-[13.5px] text-taupe">
        Chaque savon vendu est rattaché à la série dont il sort. En cas de rappel, c&rsquo;est
        cette chaîne qui permet de dire quelle série est partie chez quel client — la boutique
        sert toujours la série qui périme en premier.
      </p>

      {series.length === 0 ? (
        <p className="mb-12 rounded-m border border-brume bg-neige p-8 text-taupe">
          Aucune série enregistrée. Tant qu&rsquo;un savon n&rsquo;a pas de série en stock, il
          reste affiché mais ne peut pas être commandé.
        </p>
      ) : (
        <ul className="mb-12 flex flex-col gap-4">
          {series.map(({ lot, jours, stockBas, durabiliteProche }) => (
            <li key={lot.id} className="rounded-m border border-brume bg-neige p-5">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-[220px] flex-1">
                  <p className="mb-1 flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[15px] font-medium tabulaire">
                      {lot.reference}
                    </span>
                    {stockBas && (
                      <span className="rounded-full bg-alerte-bg px-3 py-1 text-[12px] font-semibold text-alerte">
                        {lot.quantiteRestante === 0 ? 'Épuisée' : 'Stock bas'}
                      </span>
                    )}
                    {durabiliteProche && (
                      <span className="rounded-full bg-attente-bg px-3 py-1 text-[12px] font-semibold text-attente">
                        {jours <= 0 ? 'Date dépassée' : `Durabilité dans ${jours} j`}
                      </span>
                    )}
                  </p>

                  <p className="font-serif text-[22px]">
                    <span className="font-mono text-[13px] text-taupe">
                      N°{String(lot.produit.rang).padStart(2, '0')}
                    </span>{' '}
                    {lot.produit.nom}
                  </p>

                  <p className="mt-1 font-mono text-[12.5px] text-taupe">
                    Coulée le {formaterDate(lot.couleLe)} · à utiliser de préférence avant le{' '}
                    <span className={durabiliteProche ? 'text-attente' : undefined}>
                      {formaterDate(lot.durableJusquLe)}
                    </span>
                  </p>
                </div>

                <p className="text-right">
                  <span
                    className={`block font-mono text-[26px] tabulaire ${
                      stockBas ? 'text-alerte' : ''
                    }`}
                  >
                    {lot.quantiteRestante}
                  </span>
                  <span className="text-[12.5px] text-taupe">
                    restants sur {lot.quantiteProduite}
                  </span>
                </p>
              </div>

              {lot.notes && (
                <p className="mt-4 whitespace-pre-line border-l-2 border-brume-2 pl-4 font-mono text-[12px] text-taupe-f">
                  {lot.notes}
                </p>
              )}

              <CorrectionStock
                lotId={lot.id}
                reference={lot.reference}
                quantiteProduite={lot.quantiteProduite}
                quantiteRestante={lot.quantiteRestante}
              />
            </li>
          ))}
        </ul>
      )}

      <div id="nouvelle-serie" className="max-w-[820px] scroll-mt-6">
        <FormulaireSerie produits={savons} />
      </div>
    </>
  );
}
