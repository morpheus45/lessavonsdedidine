# La boutique, de bout en bout chez GitHub

Le site est en ligne : **https://morpheus45.github.io/lessavonsdedidine/**

Tout vit chez GitHub — le code, le contenu, les photos, la construction et la
publication. Aucun autre compte, aucun service tiers, rien à payer.

---

## Ce que Didine peut faire seule

Elle va sur **https://morpheus45.github.io/lessavonsdedidine/admin/** et elle
peut :

- **créer un produit ou un coffret** : nom, accroche, descriptif, composition ;
- **lui donner des formats**, chacun avec son prix ;
- **déposer des photos** depuis son téléphone. Elles sont redressées, réduites
  en deux tailles et converties automatiquement. Elle n'a rien à préparer ;
- **créer et photographier des thèmes** de vitrines ;
- **mettre en vente ou retirer** un produit d'un seul interrupteur.

Chaque modification enregistrée devient un commit dans le dépôt, et le site se
republie tout seul en une minute environ.

### Sa connexion — le jeton, à fabriquer par vous

Didine n'a **pas de compte GitHub à créer**. Vous fabriquez un jeton sur votre
propre compte et vous le lui transmettez ; elle le colle une fois dans le CMS.

> Pourquoi pas un compte à son nom : un collaborateur sur un dépôt appartenant
> à un autre compte personnel **ne peut pas** utiliser de jeton *fine-grained*
> — GitHub ne lui propose tout simplement pas le dépôt dans la liste. Il lui
> faudrait un jeton *classique*, qui donne accès à bien plus que ce dépôt.
> Passer par votre jeton, étroitement limité, est plus sûr que l'inverse.

1. **github.com** → votre photo → **Settings** → tout en bas à gauche,
   **Developer settings**.
2. **Personal access tokens → Fine-grained tokens → Generate new token**.
3. **Token name** : `catalogue-didine`.
4. **Expiration** : **1 an**. Pas « No expiration » — un jeton immortel qui
   fuit ne s'arrête jamais. Notez la date dans votre agenda : le jour venu, le
   CMS cessera de fonctionner sans explication.
5. **Repository access** : **Only select repositories** → `lessavonsdedidine`.
6. **Permissions → Repository permissions → Contents** : **Read and write**.
   **Rien d'autre.** Pas Actions, pas Administration, pas Secrets. Ce jeton ne
   doit pouvoir que modifier des fichiers de contenu.
7. **Generate token**, copiez la chaîne (elle commence par `github_pat_`).
   Elle ne sera plus jamais affichée.

Transmettez-la-lui par un canal où elle ne traînera pas : un message que vous
effacez ensuite, ou un gestionnaire de mots de passe. **Ne la mettez jamais
dans le dépôt** — et ne me l'envoyez pas non plus, je n'en ai pas besoin et je
ne manipule pas d'identifiants.

### Si le jeton fuit, ou si Didine arrête

**Settings → Developer settings → Fine-grained tokens** → `catalogue-didine` →
**Revoke**. C'est immédiat. Vous en refabriquez un et vous le lui donnez.

Ce qu'un jeton volé permettrait, au pire : modifier le contenu de la boutique,
qui se republierait. Rien de plus — pas de suppression du dépôt, pas d'accès à
vos autres projets, pas de secrets. Et l'historique GitHub garde tout, donc
tout est réversible.

## Le paiement

Il manque l'identifiant client PayPal. Sans lui, la page de commande propose
de contacter Didine au lieu d'afficher un bouton mort — c'est volontaire.

1. **https://developer.paypal.com** → se connecter avec le compte
   **professionnel** de Didine → **Apps & Credentials** → *Create App*.
2. Relever le **Client ID** (pas le secret : il ne sert à rien ici, et il n'y
   a aucun endroit sûr où le mettre sur un site statique).
3. Dans le dépôt : **Settings → Secrets and variables → Actions → Variables →
   New repository variable**, nom `PAYPAL_CLIENT_ID`.
4. Relancer la publication (**Actions → Publier la boutique → Run workflow**).

Commencer en **Sandbox** pour faire un achat de bout en bout, puis refaire
l'opération avec l'application de production.

---

## ⚠️ Les deux choses que Didine doit savoir

Ce sont les conséquences directes de l'hébergement sur GitHub Pages, qui ne
sait servir que des fichiers. Elles ne sont pas négociables tant que le site
reste ici.

### 1. Vérifier le montant reçu avant d'expédier

Sans serveur, le montant envoyé à PayPal est calculé par le navigateur de
l'acheteur — qui peut donc le modifier.

**Avant chaque expédition, comparer le montant du courriel PayPal au contenu
de la commande.** Si ça ne correspond pas, ne pas expédier et contacter
l'acheteur. En pratique cela demande un acheteur malveillant et compétent, mais
le geste doit devenir un réflexe.

### 2. Le courriel PayPal est la seule trace

Aucune commande n'est enregistrée nulle part. Le courriel PayPal contient le
prénom et le thème de chaque vitrine — c'est fait exprès. **S'il se perd, la
commande est perdue.**

Conseil : créer un dossier « Commandes » dans sa messagerie et y ranger chaque
courriel PayPal en arrivant.

> Ces deux limites disparaissent le jour où le site tourne sur un hébergeur qui
> exécute du code. Le code correspondant existe, il a été vérifié, et il dort
> dans `serveur-desactive/` avec la marche à suivre.

---

## Travailler sur le site

```bash
npm install
npm run dev        # http://localhost:3000/lessavonsdedidine/
```

Le préfixe `/lessavonsdedidine` est appliqué aussi en développement,
volontairement : un chemin qui ne casse qu'en production est un chemin qu'on
découvre trop tard.

```bash
npm run photos     # réduit les photos de contenu/photos/ sans construire
npm run build      # réduit les photos puis exporte le site dans out/
```

---

## Ce qui reste à obtenir de Didine

- la **liste INCI réelle**, recopiée de l'étiquette de sa base de savon — la
  réglementation cosmétique l'impose, et le champ contient aujourd'hui un
  texte d'attente ;
- une photo **sans autocollants** pour le thème « chambre d'enfant » : la
  seule disponible en porte deux, ajoutés dans une messagerie ;
- le nombre d'objets et les dimensions par formule de vitrine (inventés) ;
- le délai de fabrication d'une vitrine ;
- les **31 mentions à trous** des CGV et des mentions légales — identité,
  adresse, numéro SIRET, assurance, médiateur de la consommation. Ce dernier
  est une obligation légale pour un commerce en ligne ;
- sa relecture du **rangement des parfums par famille**, sur `/parfums/` :
  c'est nous qui l'avons écrit, elle seule sent ses savons.
