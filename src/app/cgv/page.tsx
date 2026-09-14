import type { Metadata } from 'next';
import { PageLegale, ATrou } from '@/components/PageLegale';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  robots: { index: false, follow: false },
};

export default function CGV() {
  return (
    <PageLegale titre="Conditions générales de vente" miseAJour="14 septembre 2026">
      <h2>1. Vendeur</h2>
      <p>
        <ATrou>Nom ou raison sociale</ATrou>, <ATrou>adresse</ATrou>, SIRET{' '}
        <ATrou>14 chiffres</ATrou>. Courriel : <ATrou>adresse e-mail</ATrou>.
      </p>

      <h2>2. Produits</h2>
      <p>
        <strong>Savons parfumés.</strong> Fabriqués à partir d&rsquo;une base de savon au
        beurre de karité biologique sans SLS, fondue, parfumée et colorée avec des arômes et
        colorants naturels, parfois enrichie de miel, puis coulée en moule de silicone. La
        composition complète figure sur l&rsquo;étiquette de chaque sachet.
      </p>
      <p>
        <strong>Vitrines personnalisées.</strong> Objets de décoration montés à la commande à
        partir du thème, du prénom et des petits objets choisis par le client. Ce sont des
        biens confectionnés selon les spécifications du consommateur (voir l&rsquo;article 7).
      </p>
      <p>
        Chaque article étant fabriqué à la main, de légères variations de teinte, de relief et
        de poids sont normales et ne constituent pas un défaut.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison. Le
        montant total dû est affiché avant validation de la commande.
      </p>
      <p>
        <ATrou>Mention TVA : « TVA non applicable, article 293 B du CGI » en franchise, sinon le taux appliqué</ATrou>
      </p>

      <h2>4. Commande</h2>
      <p>
        La commande est validée lorsque le client accepte les présentes conditions et clique
        sur « Commander et payer ». Un récapitulatif lui est présenté avant cette étape, et un
        courriel de confirmation lui est adressé ensuite.
      </p>
      <p>
        Le vendeur se réserve le droit de refuser une commande en cas de litige antérieur, de
        commande anormale, ou d&rsquo;indisponibilité.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s&rsquo;effectue par PayPal ou par carte bancaire via PayPal. Aucune donnée
        de carte ne transite par le site ni n&rsquo;y est conservée.
      </p>
      <p>
        Les articles sont réservés dès la commande, mais celle-ci n&rsquo;est préparée
        qu&rsquo;après encaissement effectif.
      </p>

      <h2>6. Livraison</h2>
      <p>
        Livraison en <ATrou>France métropolitaine — préciser si d&rsquo;autres zones</ATrou>.
      </p>
      <p>
        <strong>Savons :</strong> expédition sous <ATrou>48 heures — à confirmer</ATrou> après
        encaissement.
        <br />
        <strong>Vitrines :</strong> fabriquées à la commande, comptez{' '}
        <ATrou>environ une semaine — à confirmer</ATrou> avant expédition.
      </p>
      <p>
        Frais de port : <ATrou>4,90 € — à confirmer</ATrou>, offerts à partir de{' '}
        <ATrou>39 € — à confirmer</ATrou> d&rsquo;achat.
      </p>
      <p>
        En cas de retard, le client peut annuler la commande dans les conditions prévues à
        l&rsquo;article L.216-6 du code de la consommation.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Le client dispose de <strong>quatorze jours</strong> à compter de la réception pour
        exercer son droit de rétractation, sans avoir à se justifier. Les frais de retour sont
        à sa charge.
      </p>
      <p>
        <strong>Deux exceptions prévues par la loi s&rsquo;appliquent :</strong>
      </p>
      <ul>
        <li>
          Les savons descellés après livraison ne peuvent pas être repris pour des raisons
          d&rsquo;hygiène (article L.221-28 5° du code de la consommation).
        </li>
        <li>
          Les vitrines, confectionnées selon les spécifications du client et nettement
          personnalisées par un prénom, ne sont pas soumises au droit de rétractation
          (article L.221-28 3°).
        </li>
      </ul>
      <p>
        Pour se rétracter, le client informe le vendeur par une déclaration dénuée
        d&rsquo;ambiguïté à <ATrou>adresse e-mail</ATrou>. Un formulaire type est disponible
        sur demande. Le remboursement intervient au plus tard quatorze jours après récupération
        du bien.
      </p>

      <h2>8. Garanties légales</h2>
      <p>
        Indépendamment de toute garantie commerciale, le vendeur reste tenu de la garantie
        légale de conformité (articles L.217-3 et suivants du code de la consommation,{' '}
        <strong>deux ans</strong> à compter de la délivrance) et de la garantie des vices
        cachés (articles 1641 et suivants du code civil).
      </p>

      <h2>9. Réclamations et médiation</h2>
      <p>
        Toute réclamation peut être adressée à <ATrou>adresse e-mail</ATrou>.
      </p>
      <p>
        Conformément à l&rsquo;article L.612-1 du code de la consommation, le client peut
        recourir gratuitement à un médiateur de la consommation :{' '}
        <ATrou>nom, adresse et site du médiateur — adhésion obligatoire</ATrou>
      </p>
      <p className="remarque">
        L&rsquo;adhésion à un dispositif de médiation est une obligation légale pour tout
        professionnel vendant à des consommateurs, même occasionnellement. Elle doit être
        souscrite avant l&rsquo;ouverture de la boutique.
      </p>
      <p>
        Une plateforme européenne de règlement en ligne des litiges est également accessible.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans les{' '}
        <a href="/mentions-legales">mentions légales</a>.
      </p>

      <h2>11. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une
        solution amiable sera recherchée avant toute action judiciaire.
      </p>
    </PageLegale>
  );
}
