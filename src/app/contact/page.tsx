import type { Metadata } from 'next';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { lireThemes } from '@/lib/catalogue';
import { reponses } from '@/lib/reponses';
import { Formulaire } from './Formulaire';

// Les thèmes de vitrine viennent de la base : celui que Didine ajoute
// aujourd'hui doit apparaître ici sans redéploiement.
export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Écrire à Didine : une commande en cours, un thème de vitrine sur mesure, une question sur les savons.',
};

export default function PageContact() {
  const themes = lireThemes();
  const emailContact = reponses.vous.email;

  return (
    <>
      <EnTeteBoutique actif="/contact" />

      <main id="contenu" className="mx-auto max-w-[1240px] px-6 py-24">
        <header className="mb-16 max-w-[60ch]">
          <p className="eyebrow mb-6">Écrire</p>
          <h1 className="mb-6 font-serif text-[clamp(38px,6vw,68px)] tracking-[-0.03em]">
            Une question, une idée de vitrine
          </h1>
          <p className="text-[17.5px] text-taupe">
            Les vitrines sont montées à la commande&nbsp;: thème, prénom, couleur du cadre. Dites
            ce que vous avez en tête, même si ça ne figure nulle part sur ce site.
          </p>
        </header>

        <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
          <div>
            {/* Prévenir AVANT la saisie, pas après : personne ne doit écrire
                vingt lignes pour découvrir ensuite qu'elles ne partent pas. */}
            <div className="mb-10 rounded-m border border-attente-bg bg-attente-bg p-5">
              <p className="mb-1 text-[15px] font-semibold text-attente">
                L&rsquo;envoi depuis le site n&rsquo;est pas encore en service.
              </p>
              <p className="text-[14px] text-attente">
                Ce formulaire vérifie votre message et vous le rend à copier, avec l&rsquo;adresse
                de Didine. Rien n&rsquo;est expédié automatiquement pour le moment.
              </p>
            </div>

            <Formulaire email={emailContact} />
          </div>

          <aside className="space-y-10">
            <section className="rounded-l border border-brume bg-neige p-7">
              <h2 className="mb-3 font-serif text-[22px]">Écrire directement</h2>
              <p className="mb-4 text-[14.5px] text-taupe">
                C&rsquo;est aujourd&rsquo;hui le moyen le plus sûr d&rsquo;être lue.
              </p>
              {emailContact ? (
                <a
                  href={`mailto:${emailContact}`}
                  className="block rounded-m border border-brume bg-nuage p-4 text-[16px] font-semibold text-foret underline decoration-brume-2 underline-offset-4 hover:decoration-foret"
                >
                  {emailContact}
                </a>
              ) : (
                <div className="rounded-m border border-attente-bg bg-attente-bg p-4">
                  <p className="text-[15px] text-attente">
                    L’adresse n’est pas encore renseignée. Didine la pose depuis sa gestion,
                    écran « À compléter ».
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-l border border-brume bg-neige p-7">
              <h2 className="mb-3 font-serif text-[22px]">Les vitrines, sur mesure</h2>
              <p className="mb-5 text-[14.5px] text-taupe">
                Chaque vitrine part d&rsquo;un cadre vide&nbsp;: le fond est choisi, les petits
                objets disposés un par un, le prénom collé en lettres sur le dessus. Les thèmes
                déjà réalisés&nbsp;:
              </p>
              {themes.length > 0 && (
                <ul className="mb-5 flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <li
                      key={theme.slug}
                      className="rounded-full border border-brume-2 bg-nuage px-3.5 py-1.5 text-[13.5px]"
                    >
                      {theme.nom}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[14.5px] text-taupe">
                Un thème qui ne figure pas dans cette liste&nbsp;? Demandez-le dans votre
                message&nbsp;: c&rsquo;est justement ce qu&rsquo;on sait faire.
              </p>
            </section>

            <section className="rounded-l border border-brume bg-neige p-7">
              <h2 className="mb-3 font-serif text-[22px]">Une commande en cours</h2>
              <p className="mb-5 text-[14.5px] text-taupe">
                Son état est consultable tout de suite, avec votre référence et votre adresse
                électronique.
              </p>
              <Link
                href="/suivi"
                className="inline-flex min-h-[44px] items-center rounded-s border border-graphite px-5 text-[14.5px] font-semibold transition-colors hover:bg-brume"
              >
                Suivre ma commande
              </Link>
            </section>
          </aside>
        </div>
      </main>

      <PiedBoutique />
    </>
  );
}
