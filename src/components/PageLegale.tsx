import type { ReactNode } from 'react';
import { EnTeteBoutique, PiedBoutique } from './EnTeteBoutique';

/**
 * Coquille commune aux pages légales.
 *
 * Les champs que Didine doit remplir sont marqués visuellement plutôt que
 * laissés en texte gris : une mention légale incomplète qui *ressemble* à une
 * mention complète est pire que rien — on oublie de la finir.
 */
export function ATrou({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-s bg-attente-bg px-1.5 py-0.5 font-mono text-[13px] text-attente">
      {children}
    </mark>
  );
}

export function PageLegale({
  titre,
  miseAJour,
  children,
}: {
  titre: string;
  miseAJour: string;
  children: ReactNode;
}) {
  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[760px] px-6 py-20">
        <h1 className="mb-3 font-serif text-[clamp(36px,6vw,58px)] tracking-[-0.03em]">{titre}</h1>
        <p className="mb-10 font-mono text-[12.5px] text-taupe">
          Dernière mise à jour : {miseAJour}
        </p>

        <div
          className="rounded-m border border-attente-bg bg-attente-bg px-5 py-4"
          role="note"
        >
          <p className="mb-1.5 text-[14.5px] font-semibold text-attente">
            Document incomplet — à finaliser avant toute vente
          </p>
          <p className="text-[13.5px] text-attente">
            Les passages <span className="rounded-s bg-white/60 px-1.5 font-mono">surlignés</span>{' '}
            doivent être remplis par Didine. Tant qu&rsquo;ils le sont, ce texte n&rsquo;a aucune
            valeur juridique. Il donne la structure et les mentions obligatoires, mais il ne
            remplace pas la relecture d&rsquo;un professionnel.
          </p>
        </div>

        <div className="legal mt-10">{children}</div>
      </main>

      <PiedBoutique />
    </>
  );
}
