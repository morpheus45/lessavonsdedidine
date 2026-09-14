'use client';

import { useActionState } from 'react';
import { seConnecter, type EtatConnexion } from '../actions';
import { Sceau } from '@/components/Sceau';

const INITIAL: EtatConnexion = {};

export default function Connexion() {
  const [etat, action, enCours] = useActionState(seConnecter, INITIAL);

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <Sceau variante="reduit" taille={56} />
          <h1 className="font-serif text-[34px] tracking-[-0.03em]">Administration</h1>
          <p className="text-[14.5px] text-taupe">Les Savons de Didine</p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <p>
            <label htmlFor="email" className="mb-2 block text-[13.5px] font-medium">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="min-h-[48px] w-full rounded-s border border-brume-2 bg-neige px-4 text-[15px]"
            />
          </p>

          <p>
            <label htmlFor="motDePasse" className="mb-2 block text-[13.5px] font-medium">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-[48px] w-full rounded-s border border-brume-2 bg-neige px-4 text-[15px]"
            />
          </p>

          {etat.erreur && (
            <p
              role="alert"
              className="rounded-s border border-alerte-bg bg-alerte-bg px-4 py-3 text-[14px] text-alerte"
            >
              {etat.erreur}
            </p>
          )}

          {/* Jamais désactivé : un bouton grisé ne dit pas ce qui se passe.
              Il change de libellé, ce qui informe sans bloquer. */}
          <button
            type="submit"
            className="min-h-[50px] cursor-pointer rounded-s bg-grenat text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90"
          >
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}
