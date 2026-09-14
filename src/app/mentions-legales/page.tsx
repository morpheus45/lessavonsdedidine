import type { Metadata } from 'next';
import { PageLegale, ATrou } from '@/components/PageLegale';

export const metadata: Metadata = {
  title: 'Mentions légales',
  robots: { index: false, follow: false },
};

export default function MentionsLegales() {
  return (
    <PageLegale titre="Mentions légales" miseAJour="14 septembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        <ATrou>Nom ou raison sociale</ATrou>, <ATrou>forme juridique — micro-entreprise, EI, EURL…</ATrou>
        <br />
        Siège : <ATrou>adresse complète</ATrou>
        <br />
        SIRET : <ATrou>14 chiffres</ATrou> — RCS : <ATrou>ville et numéro, si inscrite</ATrou>
        <br />
        <ATrou>Capital social, uniquement si société</ATrou>
        <br />
        TVA intracommunautaire : <ATrou>numéro, ou « non applicable — article 293 B du CGI » en franchise</ATrou>
      </p>

      <h2>Contact</h2>
      <p>
        Courriel : <ATrou>adresse e-mail</ATrou>
        <br />
        Téléphone : <ATrou>numéro</ATrou>
      </p>

      <h2>Directeur de la publication</h2>
      <p>
        <ATrou>Nom et prénom</ATrou>
      </p>

      <h2>Hébergement</h2>
      <p>
        <ATrou>Nom de l&rsquo;hébergeur</ATrou>
        <br />
        <ATrou>Adresse de l&rsquo;hébergeur</ATrou>
        <br />
        <ATrou>Téléphone de l&rsquo;hébergeur</ATrou>
      </p>
      <p className="remarque">
        À remplir une fois l&rsquo;hébergement choisi. La loi impose de nommer
        l&rsquo;hébergeur, pas seulement l&rsquo;éditeur.
      </p>

      <h2>Produits cosmétiques</h2>
      <p>
        Les savons proposés sont des produits cosmétiques au sens du règlement (CE)
        n°&nbsp;1223/2009.
      </p>
      <p>
        Personne responsable de la mise sur le marché : <ATrou>nom et adresse dans l&rsquo;Union européenne</ATrou>
      </p>
      <p>
        Les dossiers d&rsquo;information produit sont tenus à disposition des autorités de
        contrôle à l&rsquo;adresse suivante : <ATrou>adresse de conservation des dossiers</ATrou>
      </p>
      <p className="remarque">
        Cette désignation est obligatoire avant la première mise en vente, y compris pour un
        savon fabriqué à partir d&rsquo;une base achetée dès lors qu&rsquo;elle est modifiée
        (parfum, colorant, miel).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies et éléments graphiques de ce site sont la propriété de{' '}
        <ATrou>nom du titulaire</ATrou>. Toute reproduction sans autorisation écrite préalable
        est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Les informations recueillies lors d&rsquo;une commande — nom, adresse, courriel,
        téléphone — servent uniquement à traiter et livrer cette commande, ainsi qu&rsquo;à
        respecter les obligations comptables et de traçabilité cosmétique.
      </p>
      <p>
        Le prénom indiqué pour une vitrine personnalisée sert exclusivement à fabriquer
        l&rsquo;objet. Il n&rsquo;alimente aucun profil et n&rsquo;est utilisé à aucune autre
        fin.
      </p>
      <p>
        Conformément au RGPD, vous disposez d&rsquo;un droit d&rsquo;accès, de rectification,
        d&rsquo;effacement, de limitation, d&rsquo;opposition et de portabilité. Pour
        l&rsquo;exercer : <ATrou>adresse e-mail de contact</ATrou>. Vous pouvez également
        introduire une réclamation auprès de la CNIL.
      </p>
      <p>
        Durée de conservation : les données de commande sont conservées{' '}
        <ATrou>10 ans pour les pièces comptables — à confirmer</ATrou>.
      </p>

      <h2>Cookies</h2>
      <p>
        Ce site ne dépose aucun cookie publicitaire ni de mesure d&rsquo;audience. Seul un
        cookie technique est utilisé pour la connexion au back-office, et le contenu du
        panier est conservé dans le navigateur du visiteur, sans être transmis à un tiers.
      </p>
    </PageLegale>
  );
}
