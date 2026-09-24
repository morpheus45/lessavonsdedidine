'use client';

import { useEffect, useRef, useState } from 'react';
import type { Section } from '@/donnees/questions';

/**
 * Le questionnaire, sans connexion.
 *
 * Didine ouvre un lien, répond, clique. Rien n'est envoyé nulle part
 * automatiquement : ses réponses restent dans son navigateur jusqu'à ce
 * qu'elle décide de les copier.
 *
 * Pourquoi pas d'enregistrement en ligne : le site est statique, servi par
 * GitHub Pages. Il n'y a aucun serveur pour recevoir un formulaire. L'écran
 * de gestion, lui, sait écrire — mais seulement en s'identifiant auprès de
 * GitHub, ce qui n'a aucun sens pour répondre à des questions.
 */
const MEMOIRE = 'questions-didine';

export function Questionnaire({ sections }: { sections: Section[] }) {
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [charge, setCharge] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  const zoneTexte = useRef<HTMLTextAreaElement>(null);

  const questions = sections.flatMap((s) => s.questions.map((q) => ({ ...q, section: s })));
  const remplies = questions.filter((q) => (reponses[`${q.section.cle}.${q.cle}`] ?? '').trim());

  // Ses réponses sont retenues dans son navigateur : fermer l'onglet par
  // mégarde après vingt minutes de saisie ne doit pas tout perdre.
  useEffect(() => {
    try {
      const garde = localStorage.getItem(MEMOIRE);
      if (garde) setReponses(JSON.parse(garde) as Record<string, string>);
    } catch {
      // Navigation privée, ou stockage refusé : on repart d'un formulaire
      // vide plutôt que de bloquer.
    }
    setCharge(true);
  }, []);

  useEffect(() => {
    if (!charge) return;
    try {
      localStorage.setItem(MEMOIRE, JSON.stringify(reponses));
    } catch {
      // Sans importance : elle perdra la sauvegarde, pas sa saisie en cours.
    }
  }, [reponses, charge]);

  function ecrire(cle: string, valeur: string) {
    setReponses((precedent) => ({ ...precedent, [cle]: valeur }));
  }

  /** Les réponses mises au propre, prêtes à être collées n'importe où. */
  function texteComplet(): string {
    const lignes: string[] = ['RÉPONSES DE DIDINE', ''];
    for (const section of sections) {
      const faites = section.questions.filter((q) =>
        (reponses[`${section.cle}.${q.cle}`] ?? '').trim(),
      );
      if (faites.length === 0) continue;
      lignes.push(`— ${section.titre.toUpperCase()} —`, '');
      for (const q of faites) {
        lignes.push(q.label, reponses[`${section.cle}.${q.cle}`]!.trim(), '');
      }
    }
    lignes.push(`(${remplies.length} réponses sur ${questions.length})`);
    return lignes.join('\n');
  }

  async function copier() {
    const texte = texteComplet();
    try {
      await navigator.clipboard.writeText(texte);
      setCopie('Vos réponses sont copiées. Collez-les dans un message à Cédric.');
    } catch {
      // Le presse-papiers est refusé hors connexion sécurisée, et sur
      // certains navigateurs de téléphone. On montre le texte : elle le
      // sélectionne à la main, ce qui marche partout.
      if (zoneTexte.current) {
        zoneTexte.current.value = texte;
        zoneTexte.current.hidden = false;
        zoneTexte.current.select();
      }
      setCopie('Copie automatique refusée — le texte est sélectionné ci-dessous, copiez-le.');
    }
  }

  const etiquette = 'mb-2 block text-[15.5px] font-semibold';
  const champ =
    'w-full rounded-s border border-brume-2 bg-neige px-3.5 py-3 text-[15px] focus:border-encre focus:outline-none';

  return (
    <>
      <p
        aria-live="polite"
        className="sticky top-0 z-10 -mx-6 mb-10 border-b border-brume bg-nuage px-6 py-3 font-mono text-[13px] text-taupe"
      >
        {remplies.length} réponse{remplies.length > 1 ? 's' : ''} sur {questions.length}
        {remplies.length > 0 && ' · enregistrées dans ce navigateur'}
      </p>

      {sections.map((section) => (
        <section key={section.cle} className="mb-14">
          <h2 className="mb-2 font-serif text-[clamp(26px,3.6vw,36px)] tracking-[-0.025em]">
            {section.titre}
          </h2>
          {section.intro && (
            <p className="mb-8 max-w-[62ch] text-[15px] text-taupe">{section.intro}</p>
          )}

          <div className="space-y-8">
            {section.questions.map((q) => {
              const cle = `${section.cle}.${q.cle}`;
              const id = `q-${cle.replace('.', '-')}`;
              return (
                <div key={q.cle}>
                  <label htmlFor={id} className={etiquette}>
                    {q.label}
                    {q.bloque && (
                      <span className="ml-2 rounded-s bg-attente-bg px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-attente">
                        bloquant
                      </span>
                    )}
                  </label>
                  <p id={`${id}-aide`} className="mb-2 max-w-[62ch] text-[13.5px] text-taupe">
                    {q.aide}
                  </p>
                  {q.long ? (
                    <textarea
                      id={id}
                      rows={3}
                      aria-describedby={`${id}-aide`}
                      value={reponses[cle] ?? ''}
                      onChange={(e) => ecrire(cle, e.target.value)}
                      className={champ}
                    />
                  ) : (
                    <input
                      id={id}
                      type="text"
                      aria-describedby={`${id}-aide`}
                      value={reponses[cle] ?? ''}
                      onChange={(e) => ecrire(cle, e.target.value)}
                      className={`${champ} min-h-[48px]`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="rounded-l border border-brume bg-neige p-7">
        <h2 className="mb-2 font-serif text-[24px]">Envoyer vos réponses</h2>
        <p className="mb-6 max-w-[58ch] text-[14.5px] text-taupe">
          Rien n&rsquo;est parti tant que vous n&rsquo;avez pas cliqué. Le bouton recopie tout
          ce que vous avez écrit&nbsp;; vous n&rsquo;avez plus qu&rsquo;à le coller dans un
          message à Cédric — par SMS, WhatsApp ou courriel, comme vous voulez.
        </p>

        <button
          type="button"
          onClick={copier}
          disabled={remplies.length === 0}
          className="min-h-[52px] cursor-pointer rounded-s bg-onyx px-7 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Copier mes {remplies.length} réponse{remplies.length > 1 ? 's' : ''}
        </button>

        <p aria-live="polite" className="mt-3 min-h-[22px] text-[14px] text-encre">
          {copie}
        </p>

        <textarea
          ref={zoneTexte}
          hidden
          readOnly
          rows={10}
          aria-label="Vos réponses, à copier"
          className={`${champ} mt-3 font-mono text-[13px]`}
        />
      </div>
    </>
  );
}
