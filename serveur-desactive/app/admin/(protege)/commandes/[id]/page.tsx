import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BoutonImprimer } from './BoutonImprimer';
import { prisma } from '@/lib/prisma';
import { formaterPrix, formaterDate } from '@/lib/argent';
import { Statut } from '../../Statut';
import { ChangerStatut } from '../ChangerStatut';

export const dynamic = 'force-dynamic';

/** Doit rester identique à la table du fichier d'actions serveur. */
const TRANSITIONS: Record<string, string[]> = {
  en_attente_paiement: ['payee', 'annulee'],
  payee: ['preparee', 'remboursee', 'annulee'],
  preparee: ['expediee', 'remboursee'],
  expediee: ['livree', 'remboursement_demande'],
  livree: ['remboursement_demande'],
  remboursement_demande: ['remboursee'],
};

/** Le journal répond à « qui a fait quoi, quand » : l'heure en fait partie. */
const FORMAT_HORODATAGE = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

const NOMS_DE_PAYS = new Intl.DisplayNames(['fr'], { type: 'region' });

/** « FR » → « France ». Le code seul ne se recopie pas sur un colis. */
function nomDePays(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return NOMS_DE_PAYS.of(code) ?? code;
}

/**
 * Règles d'impression du bon de fabrication.
 *
 * Posées ici plutôt que dans la feuille globale : elles ne concernent que cet
 * écran, et les charger partout ferait porter à tout le site le risque d'un
 * `visibility: hidden` mal ciblé.
 *
 * On masque par `visibility` et non par `display` : la mise en page du bon
 * reste intacte, alors qu'escamoter ses ancêtres la reconstruirait. Le bloc
 * est ensuite ramené en haut de page, seul sur la feuille.
 */
const IMPRESSION = `
@media print {
  @page { margin: 14mm; }
  body { background: #fff; }
  body * { visibility: hidden !important; }
  .bon, .bon * { visibility: visible !important; }
  .bon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
  }
  .sans-impression { display: none !important; }
  .bon-ligne { break-inside: avoid; page-break-inside: avoid; }
  .bon-prenom { font-size: 40pt !important; line-height: 1.05 !important; }
  .bon-theme { font-size: 16pt !important; }
  .bon-titre { font-size: 20pt !important; }
  .bon-article { font-size: 14pt !important; }
}
`;

export default async function FicheCommande({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: {
      lignes: {
        include: { lot: true, theme: true, variante: { include: { produit: true } } },
      },
      evenements: { orderBy: { creeLe: 'desc' } },
    },
  });
  if (!commande) notFound();

  // Une vitrine se reconnaît à son produit ; le repli sur la personnalisation
  // couvre une variante dont le produit aurait changé de type depuis.
  const estVitrine = (l: (typeof commande.lignes)[number]) =>
    l.variante.produit.type === 'vitrine' || Boolean(l.prenom || l.theme);

  const vitrines = commande.lignes.filter(estVitrine);

  return (
    <>
      {/* CSS brut : passé en children, React échapperait les caractères. */}
      <style dangerouslySetInnerHTML={{ __html: IMPRESSION }} />

      <header className="mb-8">
        <Link
          href={`/admin/commandes#${commande.reference}`}
          className="mb-3 inline-block border-b border-brume-2 text-[13px] text-taupe hover:border-taupe"
        >
          ← Commandes
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 font-serif text-[34px] tracking-[-0.025em]">
              {commande.reference}
              <Statut statut={commande.statut} />
            </h1>
            <p className="mt-1 text-[14px] text-taupe">
              Passée le {formaterDate(commande.creeeLe)}
              {commande.payeeLe ? ` · payée le ${formaterDate(commande.payeeLe)}` : ''}
              {commande.expedieeLe ? ` · expédiée le ${formaterDate(commande.expedieeLe)}` : ''}
            </p>
          </div>
          <p className="font-mono text-[30px] tabulaire">{formaterPrix(commande.totalCentimes)}</p>
        </div>
      </header>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-m border border-brume bg-neige p-6">
          <h2 className="mb-1 font-serif text-[24px]">Livraison</h2>
          <p className="mb-5 text-[13.5px] text-taupe">
            À recopier tel quel sur le colis, ligne par ligne.
          </p>

          <address className="rounded-s border border-brume-2 bg-nuage p-5 font-mono text-[15.5px] not-italic leading-[1.9]">
            {commande.nom}
            <br />
            {commande.adresse}
            <br />
            <span className="tabulaire">{commande.codePostal}</span> {commande.ville}
            <br />
            {nomDePays(commande.pays)}
          </address>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13.5px]">
            <dt className="text-taupe">Courriel</dt>
            <dd className="break-all">
              <a
                href={`mailto:${commande.email}`}
                className="border-b border-brume-2 hover:border-grenat hover:text-grenat"
              >
                {commande.email}
              </a>
            </dd>
            <dt className="text-taupe">Téléphone</dt>
            <dd className="font-mono tabulaire">{commande.telephone ?? '—'}</dd>
          </dl>
        </section>

        <section className="rounded-m border border-brume bg-neige p-6">
          <h2 className="mb-5 font-serif text-[24px]">Montants</h2>

          <dl className="divide-y divide-brume border-y border-brume text-[14px]">
            <div className="flex justify-between py-2.5">
              <dt className="text-taupe">Sous-total</dt>
              <dd className="font-mono tabulaire">{formaterPrix(commande.sousTotalCentimes)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-taupe">Livraison</dt>
              <dd className="font-mono tabulaire">
                {commande.livraisonCentimes === 0
                  ? 'offerte'
                  : formaterPrix(commande.livraisonCentimes)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              {/* « Total » et non « total payé » : la fiche s'ouvre aussi sur
                  une commande en attente de paiement. */}
              <dt className="font-medium">Total</dt>
              <dd className="font-mono text-[17px] tabulaire">
                {formaterPrix(commande.totalCentimes)}
              </dd>
            </div>
          </dl>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
            <dt className="text-taupe">Moyen</dt>
            <dd>{commande.moyenPaiement ?? '—'}</dd>
            <dt className="text-taupe">Référence PayPal</dt>
            {/* Sert au rapprochement avec le relevé PayPal, et à retrouver une
                capture contestée. */}
            <dd className="break-all font-mono text-[12px]">{commande.paypalCaptureId ?? '—'}</dd>
          </dl>
        </section>
      </div>

      <section className="mb-6 rounded-m border border-brume bg-neige p-6">
        <h2 className="mb-5 font-serif text-[24px]">
          {commande.lignes.length} article{commande.lignes.length > 1 ? 's' : ''}
        </h2>

        {/* Le tableau ne se replie pas sous 375 px ; le conteneur évite qu'il
            pousse toute la page en débordement horizontal. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-brume text-left font-mono text-[11px] uppercase tracking-[0.14em] text-taupe">
                <th scope="col" className="pb-2 font-normal">
                  Article
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Qté
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Prix unitaire
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brume">
              {commande.lignes.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="py-3 pr-4">
                    {l.libelle}

                    {/* Prénom et thème sont ce qui se fabrique : ils passent
                        devant le libellé commercial, pas derrière. */}
                    {(l.prenom || l.theme) && (
                      <span className="mt-2 block border-l-2 border-grenat pl-3">
                        {l.prenom && (
                          <span className="block font-serif text-[26px] leading-tight text-grenat">
                            {l.prenom}
                          </span>
                        )}
                        {l.theme && (
                          <span className="block font-mono text-[12.5px] uppercase tracking-[0.14em] text-taupe-f">
                            Thème {l.theme.nom}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Traçabilité : en cas de rappel, c'est la ligne qui dit
                        quelle série est partie chez quel client. */}
                    {l.lot && (
                      <span className="mt-2 block font-mono text-[12px] text-taupe">
                        Série {l.lot.reference} · coulée le {formaterDate(l.lot.couleLe)} · à
                        utiliser de préférence avant le {formaterDate(l.lot.durableJusquLe)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono tabulaire">{l.quantite}</td>
                  <td className="py-3 text-right font-mono tabulaire">
                    {formaterPrix(l.prixUnitaireCentimes)}
                  </td>
                  <td className="py-3 text-right font-mono tabulaire">
                    {formaterPrix(l.totalCentimes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* `items-start` : le journal peut faire dix fois la hauteur du bloc de
          statut, et un cadre étiré laisserait une colonne de vide sous lui. */}
      <div className="mb-10 grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-m border border-brume bg-neige p-6">
          <h2 className="mb-1 font-serif text-[24px]">Statut</h2>
          <p className="mb-5 max-w-[52ch] text-[13.5px] text-taupe">
            Une commande ne s&rsquo;efface pas : c&rsquo;est une pièce comptable conservée dix ans.
            Une commande qui ne se fera pas s&rsquo;annule ou se rembourse, et la trace reste.
          </p>
          <ChangerStatut commandeId={commande.id} transitions={TRANSITIONS[commande.statut] ?? []} />
        </section>

        <section className="rounded-m border border-brume bg-neige p-6">
          <h2 className="mb-1 font-serif text-[24px]">Journal</h2>
          <p className="mb-5 text-[13.5px] text-taupe">
            Du plus récent au plus ancien. Quand une cliente conteste, c&rsquo;est la seule réponse
            possible.
          </p>

          {commande.evenements.length === 0 ? (
            <p className="text-[13.5px] text-taupe">Aucun événement enregistré.</p>
          ) : (
            <ol className="divide-y divide-brume border-y border-brume">
              {commande.evenements.map((e) => (
                <li key={e.id} className="py-3">
                  <p className="flex flex-wrap items-center gap-2.5">
                    <Statut statut={e.statut} />
                    <span className="font-mono text-[12.5px] tabulaire text-taupe">
                      {FORMAT_HORODATAGE.format(e.creeLe)}
                    </span>
                  </p>
                  <p className="mt-1 text-[13px] text-taupe-f">
                    <span className="font-mono">{e.auteur}</span>
                    {e.detail ? ` — ${e.detail}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-[24px]">Bon de fabrication</h2>
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-mono text-[12.5px] text-taupe">
              Seul ce cadre part sur la feuille.
            </p>
            <BoutonImprimer />
          </div>
        </div>

        {/*
          Ce qui se pose sur l'établi. Grand, sans fond, sans couleur : lisible
          de loin, à côté des outils.

          Le prénom sert à fabriquer l'objet, et à rien d'autre : il n'alimente
          aucun profil, aucune relance, aucune statistique.
        */}
        <div className="bon rounded-m border border-brume bg-white p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-graphite pb-4">
            <div>
              <p className="bon-titre font-serif text-[28px] leading-none">
                Bon de fabrication {commande.reference}
              </p>
              <p className="mt-1.5 font-mono text-[13px] tabulaire">
                Commande du {formaterDate(commande.creeeLe)} · {commande.nom}
              </p>
            </div>
            <p className="font-mono text-[13px]">
              {vitrines.length > 0
                ? `${vitrines.length} vitrine${vitrines.length > 1 ? 's' : ''} à monter`
                : 'Préparation d’expédition'}
            </p>
          </div>

          <ul className="flex flex-col gap-7">
            {commande.lignes.map((l) => (
              <li key={l.id} className="bon-ligne flex gap-4">
                {/* Case à cocher au crayon, une fois l'article fait. */}
                <span
                  aria-hidden="true"
                  className="mt-1 block h-7 w-7 shrink-0 border-2 border-graphite"
                />
                <div className="min-w-0 flex-1">
                  <p className="bon-article font-mono text-[16px] tabulaire">
                    {l.quantite} × {l.libelle}
                  </p>

                  {l.prenom && (
                    <p className="bon-prenom mt-2 font-serif text-[52px] leading-[1.05] tracking-[-0.03em]">
                      {l.prenom}
                    </p>
                  )}
                  {l.theme && (
                    <p className="bon-theme mt-1 font-mono text-[17px] uppercase tracking-[0.12em]">
                      Thème {l.theme.nom}
                    </p>
                  )}
                  {l.theme?.description && (
                    <p className="mt-1 max-w-[60ch] text-[14px]">{l.theme.description}</p>
                  )}
                  {l.lot && (
                    <p className="mt-2 font-mono text-[13px]">Série {l.lot.reference}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t-2 border-graphite pt-4">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em]">Expédier à</p>
            <address className="mt-2 font-mono text-[15px] not-italic leading-[1.8]">
              {commande.nom}
              <br />
              {commande.adresse}
              <br />
              <span className="tabulaire">{commande.codePostal}</span> {commande.ville}
              <br />
              {nomDePays(commande.pays)}
            </address>
          </div>
        </div>
      </section>
    </>
  );
}
