import { formaterPrix } from '@/lib/argent';
import { FormulaireReglages } from './Formulaire';
import { lireReglagesBoutique, LONGUEUR_MAX_MESSAGE } from './reglages-boutique';

export const dynamic = 'force-dynamic';

export default async function Reglages() {
  const reglages = await lireReglagesBoutique();

  const tuiles = [
    { lbl: 'Frais de port', val: formaterPrix(reglages.livraisonCentimes) },
    { lbl: 'Livraison offerte dès', val: formaterPrix(reglages.seuilLivraisonOfferteCentimes) },
    { lbl: 'Fabrication d’une vitrine', val: `${reglages.delaiFabricationVitrineJours} jours` },
    { lbl: 'Bandeau d’accueil', val: reglages.messageAccueil ? 'Affiché' : 'Masqué' },
  ];

  return (
    <>
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-[34px] tracking-[-0.025em]">Réglages</h1>
        <p className="max-w-[64ch] text-[14.5px] text-taupe">
          Les quelques valeurs qui changent au fil des saisons — un tarif de port, un seuil, un
          délai, un mot d&rsquo;accueil. Elles vivent en base pour se modifier ici, sans toucher
          au code.
        </p>
      </header>

      <ul className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tuiles.map((t) => (
          <li key={t.lbl} className="rounded-m border border-brume bg-neige px-5 py-4">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-taupe">
              {t.lbl}
            </p>
            <p className="mt-1 font-mono text-[22px] tabulaire">{t.val}</p>
          </li>
        ))}
      </ul>

      <FormulaireReglages reglages={reglages} longueurMaxMessage={LONGUEUR_MAX_MESSAGE} />
    </>
  );
}
