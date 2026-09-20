import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Suivi d'une commande par la cliente.
 *
 * Deux règles tiennent cette route, et elles expliquent toute sa forme :
 *
 *   1. La référence seule ne suffit JAMAIS. Les références sont
 *      séquentielles — LD-0412 se devine depuis LD-0411 — et une commande
 *      contient une adresse postale. Il faut la référence ET l'adresse
 *      électronique qui a servi à commander.
 *
 *   2. Une référence inconnue et une adresse fausse donnent exactement la
 *      même réponse. Distinguer les deux transformerait la route en
 *      annuaire : on saurait, essai après essai, quelles références
 *      existent.
 *
 * La réponse est réduite à ce qui sert au suivi. L'adresse postale, le
 * téléphone, les identifiants PayPal et le journal des événements ne
 * sortent pas d'ici, même quand le couple référence + adresse est bon :
 * ils ne répondent pas à la question « où en est ma commande ».
 */

const MESSAGE_INTROUVABLE =
  'Aucune commande ne correspond à cette référence et à cette adresse électronique.';

// ── Freinage des essais en rafale ────────────────────────────────────
// Exiger l'adresse électronique suffit à empêcher la lecture d'une
// commande, mais pas à empêcher quelqu'un d'essayer dix mille couples à la
// suite. Ce compteur est volontairement modeste : il vit en mémoire du
// processus, donc il se remet à zéro à chaque redémarrage et ne se partage
// pas entre instances. C'est un ralentisseur, pas une serrure — la serrure,
// c'est la règle 1.
const FENETRE_MS = 60_000;
const ESSAIS_PAR_FENETRE = 12;
const tentatives = new Map<string, number[]>();

function tropDeTentatives(cle: string): boolean {
  const maintenant = Date.now();
  const recentes = (tentatives.get(cle) ?? []).filter((t) => maintenant - t < FENETRE_MS);
  recentes.push(maintenant);
  tentatives.set(cle, recentes);

  // Sans purge, la carte grossit indéfiniment sur un serveur de longue durée.
  if (tentatives.size > 500) {
    for (const [autre, dates] of tentatives) {
      if (dates.every((t) => maintenant - t >= FENETRE_MS)) tentatives.delete(autre);
    }
  }

  return recentes.length > ESSAIS_PAR_FENETRE;
}

function cleAppelant(requete: Request): string {
  const transmise = requete.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return transmise || requete.headers.get('x-real-ip') || 'inconnu';
}

/**
 * Accepte ce qu'une cliente recopie réellement : « LD-0412 », « ld0412 »,
 * « LD 0412 », ou les quatre chiffres seuls.
 *
 * Aucune forme n'est refusée ici. Rejeter tout ce qui ne ressemble pas à
 * « LD-0000 » reviendrait à graver le format des références dans une route
 * publique : le jour où une commande en porte un autre, elle deviendrait
 * introuvable sans que personne comprenne pourquoi. Une référence inconnue
 * ressort de toute façon avec le même message.
 */
function normaliserReference(brut: string): string {
  const propre = brut.trim().toUpperCase().replace(/\s+/g, '').slice(0, 40);
  if (/^\d{1,4}$/.test(propre)) return `LD-${propre.padStart(4, '0')}`;
  if (/^LD\d{4,}$/.test(propre)) return propre.replace(/^LD/, 'LD-');
  return propre;
}

export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: 'Requête illisible.' }, { status: 400 });
  }

  if (tropDeTentatives(cleAppelant(requete))) {
    return NextResponse.json(
      { erreur: 'Trop d’essais de suite. Réessayez dans une minute.' },
      { status: 429 },
    );
  }

  const champs = (typeof corps === 'object' && corps !== null ? corps : {}) as Record<
    string,
    unknown
  >;
  const reference = normaliserReference(
    typeof champs.reference === 'string' ? champs.reference : '',
  );
  const email = (typeof champs.email === 'string' ? champs.email : '').trim().toLowerCase();

  // Une saisie vide ou mal formée sort par la même porte qu'une référence
  // inconnue : le navigateur a déjà signalé les champs obligatoires, et un
  // message plus précis ici servirait surtout à tâtonner.
  if (!reference || !email || email.length > 200) {
    return NextResponse.json({ erreur: MESSAGE_INTROUVABLE }, { status: 404 });
  }

  let commande;
  try {
    commande = await prisma.commande.findUnique({
      where: { reference },
      select: {
        reference: true,
        statut: true,
        // Lue pour être comparée, jamais renvoyée : la cliente connaît déjà
        // son adresse, et la confirmer servirait à en tester d'autres.
        email: true,
        creeeLe: true,
        payeeLe: true,
        expedieeLe: true,
        totalCentimes: true,
        lignes: {
          select: { libelle: true, quantite: true },
          orderBy: { libelle: 'asc' },
        },
      },
    });
  } catch (e) {
    console.error('Suivi de commande :', e);
    return NextResponse.json(
      { erreur: 'Le suivi est momentanément indisponible. Réessayez dans un instant.' },
      { status: 500 },
    );
  }

  if (!commande || commande.email.trim().toLowerCase() !== email) {
    return NextResponse.json({ erreur: MESSAGE_INTROUVABLE }, { status: 404 });
  }

  return NextResponse.json({
    reference: commande.reference,
    statut: commande.statut,
    creeeLe: commande.creeeLe.toISOString(),
    // Les deux dates de la frise que la cliente peut vérifier elle-même sur
    // son relevé et sur son colis.
    payeeLe: commande.payeeLe?.toISOString() ?? null,
    expedieeLe: commande.expedieeLe?.toISOString() ?? null,
    lignes: commande.lignes.map((l) => ({ libelle: l.libelle, quantite: l.quantite })),
    totalCentimes: commande.totalCentimes,
  });
}
