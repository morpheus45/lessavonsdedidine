'use client';

/**
 * Bouton d'impression du bon de fabrication.
 *
 * Écrire « Ctrl + P » à l'écran n'est pas une commande : c'est une consigne
 * qu'il faut connaître, retenir et traduire sur Mac. Didine n'a pas à savoir
 * ça pour imprimer sa feuille de travail.
 *
 * Le raccourci continue de fonctionner, et le bouton disparaît de la feuille
 * imprimée — la règle `@media print` de la fiche le masque avec le reste.
 */
export function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-[44px] cursor-pointer rounded-s border border-foret px-5 text-[13.5px] font-semibold text-foret transition-colors hover:bg-foret hover:text-nuage"
    >
      Imprimer le bon
    </button>
  );
}
