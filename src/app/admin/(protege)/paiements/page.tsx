import { lireConfigPaiements } from '@/lib/paiements';
import { FormulairePaiements } from './FormulairePaiements';

export const dynamic = 'force-dynamic';

export default async function Paiements() {
  const config = await lireConfigPaiements();

  const actifs = [
    config.paypal.utilisable && 'PayPal',
    config.cb.utilisable && 'carte bancaire',
  ].filter(Boolean) as string[];

  return (
    <>
      <header className="mb-8">
        <h1 className="mb-2 font-serif text-[34px] tracking-[-0.025em]">Paiements</h1>
        <p className="max-w-[62ch] text-[14.5px] text-taupe">
          Reliez votre compte PayPal pour encaisser les commandes. Tant qu&rsquo;aucun moyen
          de paiement n&rsquo;est utilisable, la boutique enregistre les commandes et réserve
          le stock, mais indique au client que le règlement se fera autrement.
        </p>
      </header>

      {/* État réel, pas l'intention : une case cochée sans clé valide ne
          suffit pas à encaisser. */}
      <div
        className={`mb-8 rounded-m border px-5 py-4 ${
          actifs.length > 0
            ? 'border-ok-bg bg-ok-bg text-ok'
            : 'border-attente-bg bg-attente-bg text-attente'
        }`}
      >
        <p className="text-[14.5px] font-semibold">
          {actifs.length > 0
            ? `Encaissement actif : ${actifs.join(' et ')}.`
            : 'Aucun moyen de paiement n’est actif aujourd’hui.'}
        </p>
        {config.paypal.blocage && (
          <p className="mt-1.5 text-[13.5px]">{config.paypal.blocage}</p>
        )}
      </div>

      <FormulairePaiements config={config} />
    </>
  );
}
