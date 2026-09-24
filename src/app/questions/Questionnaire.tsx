'use client';

import { useEffect, useRef, useState } from 'react';
import type { Question } from '@/donnees/questions';

/**
 * La conversation avec Didine.
 *
 * Une question à la fois, et la réponse décide de la suivante : dire non aux
 * vitrines évite les quatre questions qui suivaient. Une liste de vingt-cinq
 * champs se referme sans être remplie ; une question qui tient sur une ligne
 * reçoit une réponse.
 *
 * Tout reste dans son navigateur jusqu'à ce qu'elle clique. Il n'y a de toute
 * façon aucun serveur pour recevoir un formulaire : le site est statique.
 */
const MEMOIRE = 'conversation-didine';

type Etat = { reponses: Record<string, string>; file: string[]; position: number };

export function Questionnaire({
  questions,
  depart,
}: {
  questions: Question[];
  depart: string[];
}) {
  const parCle = new Map(questions.map((q) => [q.cle, q]));

  const [etat, setEtat] = useState<Etat>({ reponses: {}, file: [...depart], position: 0 });
  const [charge, setCharge] = useState(false);
  const [brouillon, setBrouillon] = useState('');
  const [copie, setCopie] = useState<string | null>(null);
  const zoneTexte = useRef<HTMLTextAreaElement>(null);
  const champ = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    try {
      const garde = localStorage.getItem(MEMOIRE);
      if (garde) setEtat(JSON.parse(garde) as Etat);
    } catch {
      // Navigation privée ou stockage refusé : on repart de zéro plutôt que
      // de bloquer.
    }
    setCharge(true);
  }, []);

  useEffect(() => {
    if (!charge) return;
    try {
      localStorage.setItem(MEMOIRE, JSON.stringify(etat));
    } catch {
      // Sans importance : elle perdra la reprise, pas sa saisie en cours.
    }
  }, [etat, charge]);

  const courante = parCle.get(etat.file[etat.position] ?? '');
  const fini = charge && !courante;

  /** Enregistre une réponse et déplie ce qu'elle ouvre. */
  function repondre(valeur: string, suites: string[] = []) {
    if (!courante) return;

    setEtat((p) => {
      const file = [...p.file];
      // Les suites s'insèrent JUSTE APRÈS la question courante : la
      // conversation reste locale au sujet au lieu de renvoyer la réponse
      // à la fin, où elle aurait perdu son contexte.
      const aInserer = [...(courante.suite ?? []), ...suites].filter(
        (c) => !file.includes(c) && parCle.has(c),
      );
      file.splice(p.position + 1, 0, ...aInserer);

      return {
        reponses: { ...p.reponses, [courante.cle]: valeur },
        file,
        position: p.position + 1,
      };
    });
    setBrouillon('');
  }

  function revenir() {
    setEtat((p) => ({ ...p, position: Math.max(0, p.position - 1) }));
    setBrouillon('');
  }

  function recommencer() {
    setEtat({ reponses: {}, file: [...depart], position: 0 });
    setBrouillon('');
    setCopie(null);
  }

  /** Les réponses mises au propre, prêtes à coller dans un message. */
  function texteComplet(): string {
    const lignes = ['RÉPONSES DE DIDINE', ''];
    for (const cle of etat.file) {
      const q = parCle.get(cle);
      const r = etat.reponses[cle];
      if (!q || !r) continue;
      const lu = q.type === 'choix' ? (q.choix?.find((c) => c.valeur === r)?.libelle ?? r) : r;
      lignes.push(q.texte, `→ ${lu}`, '');
    }
    return lignes.join('\n');
  }

  async function copier() {
    const texte = texteComplet();
    try {
      await navigator.clipboard.writeText(texte);
      setCopie('C’est copié. Colle-le dans un message à Cédric.');
    } catch {
      // Presse-papiers refusé — fréquent sur les navigateurs de téléphone.
      // On affiche le texte sélectionné : ça marche partout.
      if (zoneTexte.current) {
        zoneTexte.current.value = texte;
        zoneTexte.current.hidden = false;
        zoneTexte.current.select();
      }
      setCopie('La copie automatique a été refusée — le texte est sélectionné ci-dessous.');
    }
  }

  const repondues = etat.file.filter((c) => etat.reponses[c]).length;
  const CHAMP =
    'w-full rounded-s border border-brume-2 bg-neige px-4 py-3 text-[16px] focus:border-encre focus:outline-none';

  if (!charge) {
    return <p className="text-taupe">Chargement…</p>;
  }

  return (
    <>
      {/* ── Ce qui est déjà répondu ───────────────────────────────── */}
      {repondues > 0 && (
        <ol className="mb-10 space-y-3 border-l-2 border-brume pl-5">
          {etat.file.slice(0, etat.position).map((cle) => {
            const q = parCle.get(cle);
            const r = etat.reponses[cle];
            if (!q || !r) return null;
            const lu = q.type === 'choix' ? (q.choix?.find((c) => c.valeur === r)?.libelle ?? r) : r;
            return (
              <li key={cle}>
                <p className="text-[13.5px] text-taupe">{q.texte}</p>
                <p className="text-[15.5px] font-medium">
                  {q.type === 'photo' && lu === 'oui' ? 'Je t’envoie ça' : lu}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* ── La question du moment ─────────────────────────────────── */}
      {courante && (
        <div aria-live="polite">
          <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.18em] text-taupe">
            Question {etat.position + 1}
            {courante.bloque && (
              <span className="ml-3 rounded-s bg-attente-bg px-2 py-0.5 text-[11px] text-attente">
                celle-ci bloque la boutique
              </span>
            )}
          </p>

          <h2 className="mb-3 max-w-[24ch] font-serif text-[clamp(26px,4.2vw,40px)] leading-[1.12] tracking-[-0.025em]">
            {courante.texte}
          </h2>

          {courante.aide && (
            <p id="aide" className="mb-7 max-w-[58ch] text-[15px] leading-relaxed text-taupe">
              {courante.aide}
            </p>
          )}

          {courante.type === 'choix' && (
            <div className="flex flex-wrap gap-3">
              {courante.choix?.map((c) => (
                <button
                  key={c.valeur}
                  type="button"
                  onClick={() => repondre(c.valeur, c.suite)}
                  className="min-h-[52px] cursor-pointer rounded-s border border-encre bg-neige px-6 text-[15.5px] font-medium transition-colors hover:bg-encre hover:text-nuage"
                >
                  {c.libelle}
                </button>
              ))}
            </div>
          )}

          {courante.type === 'photo' && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => repondre('oui')}
                className="min-h-[52px] cursor-pointer rounded-s bg-encre px-6 text-[15.5px] font-semibold text-nuage transition-opacity hover:opacity-90"
              >
                D’accord, je t’envoie ça
              </button>
              <button
                type="button"
                onClick={() => repondre('non')}
                className="min-h-[52px] cursor-pointer rounded-s border border-brume-2 px-6 text-[15.5px] text-taupe transition-colors hover:border-taupe"
              >
                Je ne peux pas
              </button>
            </div>
          )}

          {(courante.type === 'court' || courante.type === 'long') && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                repondre(brouillon.trim());
              }}
            >
              {courante.type === 'long' ? (
                <textarea
                  ref={champ as React.RefObject<HTMLTextAreaElement>}
                  rows={4}
                  value={brouillon}
                  onChange={(e) => setBrouillon(e.target.value)}
                  aria-label={courante.texte}
                  aria-describedby={courante.aide ? 'aide' : undefined}
                  className={CHAMP}
                />
              ) : (
                <input
                  ref={champ as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={brouillon}
                  onChange={(e) => setBrouillon(e.target.value)}
                  aria-label={courante.texte}
                  aria-describedby={courante.aide ? 'aide' : undefined}
                  className={`${CHAMP} min-h-[52px]`}
                />
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="min-h-[52px] cursor-pointer rounded-s bg-encre px-7 text-[15.5px] font-semibold text-nuage transition-opacity hover:opacity-90"
                >
                  {brouillon.trim() ? 'Suivant' : 'Je ne sais pas, passer'}
                </button>
                <p className="text-[13px] text-taupe">
                  Laisse vide si tu n’es pas sûre — un blanc vaut mieux qu’une info fausse.
                </p>
              </div>
            </form>
          )}

          {etat.position > 0 && (
            <button
              type="button"
              onClick={revenir}
              className="mt-8 cursor-pointer border-b border-brume-2 text-[13.5px] text-taupe hover:border-taupe hover:text-graphite"
            >
              ← Revenir à la question d’avant
            </button>
          )}
        </div>
      )}

      {/* ── La fin ────────────────────────────────────────────────── */}
      {fini && (
        <div className="rounded-l border border-encre bg-neige p-8">
          <h2 className="mb-3 font-serif text-[30px]">
            {repondues > 0 ? 'Voilà, c’est tout !' : 'Tu n’as rien répondu'}
          </h2>
          <p className="mb-7 max-w-[54ch] text-[15.5px] text-taupe">
            {repondues > 0
              ? 'Clique pour recopier tes réponses, puis colle-les dans un message à Cédric — SMS, WhatsApp, comme tu veux. N’oublie pas les photos si tu as dit oui.'
              : 'Tu peux revenir quand tu veux, rien n’est perdu.'}
          </p>

          <div className="flex flex-wrap gap-4">
            {repondues > 0 && (
              <button
                type="button"
                onClick={copier}
                className="min-h-[52px] cursor-pointer rounded-s bg-encre px-7 text-[15.5px] font-semibold text-nuage transition-opacity hover:opacity-90"
              >
                Copier mes {repondues} réponses
              </button>
            )}
            <button
              type="button"
              onClick={recommencer}
              className="min-h-[52px] cursor-pointer rounded-s border border-brume-2 px-6 text-[15px] text-taupe transition-colors hover:border-taupe"
            >
              Tout recommencer
            </button>
          </div>

          <p aria-live="polite" className="mt-4 min-h-[22px] text-[14px] text-encre">
            {copie}
          </p>

          <textarea
            ref={zoneTexte}
            hidden
            readOnly
            rows={12}
            aria-label="Tes réponses, à copier"
            className={`${CHAMP} mt-3 font-mono text-[13px]`}
          />
        </div>
      )}
    </>
  );
}
