'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnTeteBoutique, PiedBoutique } from '@/components/EnTeteBoutique';
import { formaterPrix } from '@/lib/argent';
import { lirePanier, viderPanier, type ArticlePanier } from '@/lib/panier-client';

type PanierServeur = {
  lignes: { varianteId: string; libelle: string; quantite: number; totalCentimes: number }[];
  sousTotalCentimes: number;
  livraisonCentimes: number;
  totalCentimes: number;
};

const CHAMPS = [
  { nom: 'nom', libelle: 'Nom complet', type: 'text', autoComplete: 'name' },
  { nom: 'email', libelle: 'Adresse e-mail', type: 'email', autoComplete: 'email' },
  { nom: 'adresse', libelle: 'Adresse', type: 'text', autoComplete: 'street-address' },
  { nom: 'codePostal', libelle: 'Code postal', type: 'text', autoComplete: 'postal-code' },
  { nom: 'ville', libelle: 'Ville', type: 'text', autoComplete: 'address-level2' },
  { nom: 'telephone', libelle: 'Téléphone (facultatif)', type: 'tel', autoComplete: 'tel' },
] as const;

export default function PageCommande() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticlePanier[]>([]);
  const [panier, setPanier] = useState<PanierServeur | null>(null);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [cgv, setCgv] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [champFautif, setChampFautif] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const liste = lirePanier();
    setArticles(liste);
    if (liste.length === 0) {
      setChargement(false);
      return;
    }
    try {
      const reponse = await fetch('/api/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignes: liste.map((a) => ({
            varianteId: a.varianteId,
            quantite: a.quantite,
            prenom: a.prenom,
            themeSlug: a.themeSlug,
          })),
        }),
      });
      const donnees = await reponse.json();
      if (reponse.ok) setPanier(donnees as PanierServeur);
      else setErreur(donnees.erreur ?? 'Le panier n’a pas pu être vérifié.');
    } catch {
      setErreur('Impossible de joindre la boutique.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    setErreur(null);
    setChampFautif(null);

    if (!cgv) {
      setErreur('Vous devez accepter les conditions générales de vente pour commander.');
      setChampFautif('cgv');
      return;
    }

    setEnvoi(true);
    try {
      const reponse = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...valeurs,
          lignes: articles.map((a) => ({
            varianteId: a.varianteId,
            quantite: a.quantite,
            prenom: a.prenom,
            themeSlug: a.themeSlug,
          })),
        }),
      });
      const donnees = await reponse.json();

      if (!reponse.ok) {
        setErreur(donnees.erreur ?? 'La commande n’a pas pu être enregistrée.');
        setChampFautif(donnees.champ ?? null);
        // Le panier a pu changer (stock épuisé) : on le revalide pour que
        // l'écran dise la vérité plutôt que de garder un total périmé.
        void charger();
        return;
      }

      viderPanier();
      router.push(`/commande/${donnees.reference}`);
    } catch {
      setErreur('La commande n’a pas pu être envoyée. Rien n’a été débité.');
    } finally {
      setEnvoi(false);
    }
  }

  if (!chargement && articles.length === 0) {
    return (
      <>
        <EnTeteBoutique />
        <main id="contenu" className="mx-auto max-w-[1000px] px-6 py-24">
          <h1 className="mb-6 font-serif text-[48px] tracking-[-0.03em]">Commande</h1>
          <p className="mb-8 text-taupe">Votre panier est vide.</p>
          <Link href="/savons" className="rounded-s bg-grenat px-7 py-3.5 text-[15px] font-semibold text-nuage">
            Voir les savons
          </Link>
        </main>
        <PiedBoutique />
      </>
    );
  }

  return (
    <>
      <EnTeteBoutique />

      <main id="contenu" className="mx-auto max-w-[1100px] px-6 py-20">
        <h1 className="mb-12 font-serif text-[clamp(38px,6vw,64px)] tracking-[-0.03em]">Commande</h1>

        <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
          <form onSubmit={envoyer} noValidate>
            <h2 className="mb-6 font-serif text-[28px]">Livraison</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {CHAMPS.map((champ) => (
                <p
                  key={champ.nom}
                  className={champ.nom === 'adresse' || champ.nom === 'nom' ? 'sm:col-span-2' : ''}
                >
                  <label htmlFor={champ.nom} className="mb-2 block text-[13.5px] font-medium">
                    {champ.libelle}
                  </label>
                  <input
                    id={champ.nom}
                    name={champ.nom}
                    type={champ.type}
                    autoComplete={champ.autoComplete}
                    value={valeurs[champ.nom] ?? ''}
                    onChange={(e) => setValeurs((v) => ({ ...v, [champ.nom]: e.target.value }))}
                    aria-invalid={champFautif === champ.nom || undefined}
                    className={`min-h-[48px] w-full rounded-s border bg-neige px-4 text-[15px] ${
                      champFautif === champ.nom ? 'border-alerte' : 'border-brume-2'
                    }`}
                  />
                </p>
              ))}
            </div>

            {/* Case non pré-cochée : la loi l'exige, un consentement
                pré-coché n'est pas un consentement. */}
            <p className="mt-8 flex items-start gap-3">
              <input
                id="cgv"
                type="checkbox"
                checked={cgv}
                onChange={(e) => setCgv(e.target.checked)}
                aria-invalid={champFautif === 'cgv' || undefined}
                className="mt-1 h-5 w-5 accent-[#8A2B28]"
              />
              <label htmlFor="cgv" className="text-[14px] text-taupe">
                J&rsquo;ai lu et j&rsquo;accepte les{' '}
                <Link href="/cgv" className="border-b border-grenat text-grenat">
                  conditions générales de vente
                </Link>
                .
              </label>
            </p>

            {erreur && (
              <p
                role="alert"
                className="mt-6 rounded-s border border-alerte-bg bg-alerte-bg px-5 py-4 text-[14.5px] text-alerte"
              >
                {erreur}
              </p>
            )}

            {/* Mention de paiement explicite sur le bouton : obligation
                française pour la vente à distance. */}
            <button
              type="submit"
              className="mt-8 min-h-[54px] w-full rounded-s bg-grenat px-6 text-[15px] font-semibold text-nuage transition-opacity hover:opacity-90 sm:w-auto sm:px-12"
            >
              {envoi ? 'Enregistrement…' : 'Commander et payer'}
            </button>

            <p className="mt-4 text-[12.5px] text-taupe">
              Droit de rétractation de 14 jours, sauf cosmétique descellé pour raisons
              d&rsquo;hygiène.
            </p>
          </form>

          <aside className="h-fit rounded-l border border-brume bg-neige p-7">
            <h2 className="mb-6 font-serif text-[26px]">Votre commande</h2>

            {panier ? (
              <>
                <ul className="mb-6 space-y-3 border-b border-brume pb-6 text-[14px]">
                  {panier.lignes.map((l) => (
                    <li key={l.varianteId} className="flex justify-between gap-4">
                      <span>
                        {l.libelle}
                        <span className="text-taupe"> × {l.quantite}</span>
                      </span>
                      <span className="font-mono whitespace-nowrap tabulaire">
                        {formaterPrix(l.totalCentimes)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-3 text-[14.5px]">
                  <div className="flex justify-between">
                    <dt>Sous-total</dt>
                    <dd className="font-mono tabulaire">{formaterPrix(panier.sousTotalCentimes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Livraison</dt>
                    <dd className="font-mono tabulaire">
                      {panier.livraisonCentimes === 0 ? (
                        <span className="font-semibold text-foret">Offerte</span>
                      ) : (
                        formaterPrix(panier.livraisonCentimes)
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-brume-2 pt-4 text-[19px] font-bold">
                    <dt>À régler</dt>
                    <dd className="font-mono tabulaire">{formaterPrix(panier.totalCentimes)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-[14px] text-taupe">Vérification du panier…</p>
            )}
          </aside>
        </div>
      </main>

      <PiedBoutique />
    </>
  );
}
