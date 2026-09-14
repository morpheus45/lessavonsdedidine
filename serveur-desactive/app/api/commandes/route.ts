import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validerPanier, prochaineReference, ErreurPanier, type LigneDemandee } from '@/lib/boutique';
import { lireConfigPaiements } from '@/lib/paiements';

/**
 * Création d'une commande.
 *
 * Trois garde-fous, dans cet ordre :
 *
 *   1. Le panier est revalidé en base. Aucun montant n'est accepté depuis la
 *      requête — le client n'envoie que des identifiants et des quantités.
 *   2. Les coordonnées sont validées champ par champ avant tout écrit.
 *   3. Tout se fait dans une transaction : soit la commande, ses lignes, son
 *      événement et la décrémentation des lots passent ensemble, soit rien
 *      ne passe. Une commande sans décrément de stock vendrait deux fois le
 *      même pain.
 */

type Coordonnees = {
  email: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  telephone: string | null;
};

export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: 'Requête illisible.' }, { status: 400 });
  }

  const lignes = extraireLignes(corps);
  if (lignes === null || lignes.length === 0) {
    return NextResponse.json({ erreur: 'Panier vide ou invalide.' }, { status: 400 });
  }

  const validation = validerCoordonnees(corps);
  if ('erreur' in validation) {
    return NextResponse.json({ erreur: validation.erreur, champ: validation.champ }, { status: 400 });
  }
  const client = validation.valeur;

  try {
    const panier = await validerPanier(lignes);
    const reference = await prochaineReference();

    const commande = await prisma.$transaction(async (tx) => {
      const creee = await tx.commande.create({
        data: {
          reference,
          statut: 'en_attente_paiement',
          email: client.email,
          nom: client.nom,
          adresse: client.adresse,
          codePostal: client.codePostal,
          ville: client.ville,
          pays: client.pays,
          telephone: client.telephone,
          sousTotalCentimes: panier.sousTotalCentimes,
          livraisonCentimes: panier.livraisonCentimes,
          totalCentimes: panier.totalCentimes,
          lignes: {
            create: panier.lignes.map((l) => ({
              varianteId: l.varianteId,
              lotId: l.lotId,
              libelle: l.libelle,
              prixUnitaireCentimes: l.prixUnitaireCentimes,
              quantite: l.quantite,
              totalCentimes: l.totalCentimes,
              prenom: l.prenom,
              themeId: l.themeId,
            })),
          },
          evenements: {
            create: {
              statut: 'en_attente_paiement',
              auteur: 'client',
              detail: 'Commande créée depuis la boutique.',
            },
          },
        },
      });

      // Réserver le stock dans la même transaction que la commande.
      for (const ligne of panier.lignes) {
        if (!ligne.lotId) continue;
        const variante = await tx.variante.findUnique({
          where: { id: ligne.varianteId },
          select: { unites: true },
        });
        const aRetirer = ligne.quantite * (variante?.unites ?? 1);

        const maj = await tx.lot.updateMany({
          where: { id: ligne.lotId, quantiteRestante: { gte: aRetirer } },
          data: { quantiteRestante: { decrement: aRetirer } },
        });

        // updateMany renvoie 0 si la condition de stock n'est plus vraie :
        // quelqu'un a commandé le dernier pain entre la validation et ici.
        if (maj.count === 0) {
          throw new ErreurPanier(
            'Un des savons vient d’être épuisé pendant votre commande. Rien n’a été débité.',
          );
        }
      }

      return creee;
    });

    return NextResponse.json(
      {
        reference: commande.reference,
        totalCentimes: commande.totalCentimes,
        paiementConfigure: await paiementDisponible(),
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof ErreurPanier) {
      return NextResponse.json({ erreur: e.message }, { status: 409 });
    }
    console.error('Création de commande :', e);
    return NextResponse.json(
      { erreur: 'La commande n’a pas pu être enregistrée. Rien n’a été débité.' },
      { status: 500 },
    );
  }
}

function extraireLignes(corps: unknown): LigneDemandee[] | null {
  if (typeof corps !== 'object' || corps === null) return null;
  const brut = (corps as { lignes?: unknown }).lignes;
  if (!Array.isArray(brut)) return null;

  const lignes: LigneDemandee[] = [];
  for (const l of brut) {
    if (typeof l !== 'object' || l === null) return null;
    const { varianteId, quantite, prenom, themeSlug } = l as {
      varianteId?: unknown;
      quantite?: unknown;
      prenom?: unknown;
      themeSlug?: unknown;
    };
    if (typeof varianteId !== 'string' || !varianteId) return null;
    if (typeof quantite !== 'number' || !Number.isInteger(quantite)) return null;
    lignes.push({
      varianteId,
      quantite,
      // Bornés ici : la validation métier refusera de toute façon une
      // valeur hors limites, mais on ne laisse pas entrer une chaîne de
      // dix mille caractères jusque-là.
      prenom: typeof prenom === 'string' ? prenom.slice(0, 24) : undefined,
      themeSlug: typeof themeSlug === 'string' ? themeSlug.slice(0, 60) : undefined,
    });
  }
  return lignes;
}

type Resultat = { valeur: Coordonnees } | { erreur: string; champ: string };

function validerCoordonnees(corps: unknown): Resultat {
  const c = (typeof corps === 'object' && corps !== null ? corps : {}) as Record<string, unknown>;
  const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const email = texte(c.email);
  // Volontairement permissif : une expression trop stricte rejette des
  // adresses valides, et la vraie vérification est l'e-mail de confirmation.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    return { erreur: 'Adresse e-mail invalide.', champ: 'email' };
  }

  const nom = texte(c.nom);
  if (nom.length < 2 || nom.length > 120) {
    return { erreur: 'Indiquez votre nom complet.', champ: 'nom' };
  }

  const adresse = texte(c.adresse);
  if (adresse.length < 5 || adresse.length > 240) {
    return { erreur: 'Adresse de livraison incomplète.', champ: 'adresse' };
  }

  const codePostal = texte(c.codePostal);
  if (!/^\d{5}$/.test(codePostal)) {
    return { erreur: 'Le code postal doit comporter cinq chiffres.', champ: 'codePostal' };
  }

  const ville = texte(c.ville);
  if (ville.length < 2 || ville.length > 120) {
    return { erreur: 'Indiquez votre ville.', champ: 'ville' };
  }

  const telephone = texte(c.telephone);
  if (telephone && !/^[\d\s+().-]{6,25}$/.test(telephone)) {
    return { erreur: 'Numéro de téléphone invalide.', champ: 'telephone' };
  }

  return {
    valeur: {
      email,
      nom,
      adresse,
      codePostal,
      ville,
      pays: 'FR',
      telephone: telephone || null,
    },
  };
}

/** Un moyen de paiement en ligne est-il réellement utilisable ? */
async function paiementDisponible(): Promise<boolean> {
  const c = await lireConfigPaiements();
  return c.paypal.utilisable || c.cb.utilisable;
}
