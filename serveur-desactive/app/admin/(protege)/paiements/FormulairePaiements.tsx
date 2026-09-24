'use client';

import { useActionState } from 'react';
import { enregistrerPaiementsAction, type EtatPaiements } from '../../actions';
import type { ConfigPaiements } from '@/lib/paiements';

const INITIAL: EtatPaiements = {};

export function FormulairePaiements({ config }: { config: ConfigPaiements }) {
  const [etat, action, enCours] = useActionState(enregistrerPaiementsAction, INITIAL);

  return (
    <form action={action} className="max-w-[680px]">
      {/* ── PayPal ─────────────────────────────────────────────── */}
      <section className="mb-6 rounded-m border border-brume bg-white p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mb-1 text-[18px] font-semibold">PayPal</h2>
            <p className="text-[13.5px] text-taupe">
              Le client paie avec son compte PayPal. C&rsquo;est le chemin le plus court : pas
              de saisie de carte.
            </p>
          </div>
          <Bascule nom="paypalActif" defautCoche={config.paypal.active} libelle="Activer PayPal" />
        </div>

        <fieldset className="mb-5">
          <legend className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-taupe">
            Environnement
          </legend>
          <div className="flex flex-wrap gap-4">
            {(['sandbox', 'production'] as const).map((env) => (
              <label key={env} className="flex cursor-pointer items-center gap-2 text-[14px]">
                <input
                  type="radio"
                  name="environnement"
                  value={env}
                  defaultChecked={config.paypal.environnement === env}
                  className="h-4 w-4 accent-[#12100F]"
                />
                {env === 'sandbox' ? 'Bac à sable (tests)' : 'Production (argent réel)'}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-taupe">
            Les identifiants du bac à sable et ceux de production sont différents : changer
            d&rsquo;environnement suppose de recoller les deux champs ci-dessous.
          </p>
        </fieldset>

        <Champ
          nom="clientId"
          libelle="Identifiant client (Client ID)"
          aide={
            config.paypal.clientIdApercu
              ? `Actuellement : ${config.paypal.clientIdApercu}`
              : 'Depuis votre compte PayPal Developer, section « Apps & Credentials ».'
          }
        />

        <Champ
          nom="secret"
          type="password"
          libelle="Clé secrète (Secret)"
          aide={
            config.paypal.secretRenseigne
              ? 'Une clé est déjà enregistrée. Laissez vide pour la conserver.'
              : 'Elle est chiffrée avant d’être enregistrée et n’est jamais réaffichée.'
          }
        />

        <Champ
          nom="webhookId"
          libelle="Identifiant de webhook (facultatif)"
          aide={
            config.paypal.webhookRenseigne
              ? 'Enregistré.'
              : 'Sans lui, la boutique ne sera pas prévenue automatiquement des remboursements et litiges.'
          }
        />
      </section>

      {/* ── Carte bancaire ─────────────────────────────────────── */}
      <section className="mb-6 rounded-m border border-brume bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mb-1 text-[18px] font-semibold">Carte bancaire</h2>
            <p className="max-w-[46ch] text-[13.5px] text-taupe">
              Les champs de carte sont hébergés par PayPal : le client paie par carte sans
              avoir de compte PayPal, et aucune donnée de carte ne passe par la boutique.
              Aucun contrat séparé à signer.
            </p>
          </div>
          <Bascule nom="cbActif" defautCoche={config.cb.active} libelle="Activer la carte" />
        </div>

        {config.cb.blocage && (
          <p className="mt-4 rounded-s border border-attente-bg bg-attente-bg px-4 py-3 text-[13.5px] text-attente">
            {config.cb.blocage}
          </p>
        )}
      </section>

      {/* ── Wero ───────────────────────────────────────────────── */}
      <section className="mb-6 rounded-m border border-brume bg-neige p-6 opacity-90">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-[18px] font-semibold text-taupe">Wero</h2>
          <span className="rounded-full bg-brume px-3 py-1 font-mono text-[12px] text-taupe-f">
            PAS ENCORE DISPONIBLE
          </span>
        </div>
        <p className="max-w-[58ch] text-[13.5px] text-taupe">{config.wero.blocage}</p>
        <p className="mt-3 max-w-[58ch] text-[13.5px] text-taupe">
          Le code de la boutique est déjà organisé pour accueillir un troisième moyen de
          paiement : le jour où votre prestataire propose Wero, il n&rsquo;y aura qu&rsquo;à
          brancher, sans refaire le tunnel de commande.
        </p>
      </section>

      {etat.erreur && (
        <p
          role="alert"
          className="mb-4 rounded-s border border-alerte-bg bg-alerte-bg px-5 py-4 text-[14px] text-alerte"
        >
          {etat.erreur}
        </p>
      )}
      {etat.succes && (
        <p
          aria-live="polite"
          className="mb-4 rounded-s border border-ok-bg bg-ok-bg px-5 py-4 text-[14px] text-ok"
        >
          {etat.succes}
        </p>
      )}

      <button
        type="submit"
        className="min-h-[50px] cursor-pointer rounded-s bg-grenat px-8 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
      >
        {enCours ? 'Enregistrement et test…' : 'Enregistrer et tester la connexion'}
      </button>

      <p className="mt-3 text-[12.5px] text-taupe">
        L&rsquo;enregistrement déclenche un appel réel à PayPal pour vérifier les
        identifiants. Aucun paiement n&rsquo;est effectué.
      </p>
    </form>
  );
}

function Champ({
  nom,
  libelle,
  aide,
  type = 'text',
}: {
  nom: string;
  libelle: string;
  aide: string;
  type?: string;
}) {
  return (
    <p className="mb-5">
      <label htmlFor={nom} className="mb-2 block text-[13.5px] font-medium">
        {libelle}
      </label>
      <input
        id={nom}
        name={nom}
        type={type}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={`${nom}-aide`}
        className="min-h-[48px] w-full rounded-s border border-brume-2 bg-neige px-4 font-mono text-[14px]"
      />
      <span id={`${nom}-aide`} className="mt-1.5 block text-[12.5px] text-taupe">
        {aide}
      </span>
    </p>
  );
}

function Bascule({
  nom,
  defautCoche,
  libelle,
}: {
  nom: string;
  defautCoche: boolean;
  libelle: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 whitespace-nowrap text-[14px]">
      <input type="checkbox" name={nom} defaultChecked={defautCoche} className="h-5 w-5 accent-[#12100F]" />
      {libelle}
    </label>
  );
}
