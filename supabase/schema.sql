-- Base de la boutique « Les Savons de Didine ».
--
-- Le site est statique, servi par GitHub Pages : il n'y a pas de serveur à
-- nous. C'est donc POSTGRES LUI-MÊME qui fait la police, par ses règles de
-- sécurité au niveau des lignes (RLS). Chaque politique ci-dessous est un
-- garde-fou qui s'applique même si quelqu'un écrit ses propres requêtes
-- depuis la console du navigateur — ce qui est toujours possible.
--
-- Règle de lecture : tout est INTERDIT par défaut. Rien n'est lisible ni
-- modifiable tant qu'une politique ne l'autorise explicitement.
--
-- Les montants sont des ENTIERS EN CENTIMES. Jamais de flottant pour de
-- l'argent : 0.1 + 0.2 ne fait pas 0.3, et une commande finit fausse.

-- ─────────────────────────────────────────────────────────────────────
-- QUI EST QUI
-- ─────────────────────────────────────────────────────────────────────

create type role_utilisateur as enum ('client', 'admin', 'superadmin');

-- Un profil par compte. Créé automatiquement à l'inscription (voir le
-- déclencheur plus bas) pour qu'aucun compte ne puisse exister sans rôle.
create table profils (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  nom text,
  role role_utilisateur not null default 'client',
  cree_le timestamptz not null default now()
);

alter table profils enable row level security;

-- Le rôle est lu très souvent dans les politiques. `security definer` lui
-- permet de lire la table sans repasser par RLS — sans quoi on tournerait en
-- rond, la politique ayant besoin du rôle pour décider du rôle.
create or replace function role_courant()
returns role_utilisateur
language sql
stable
security definer
set search_path = public
as $$
  select role from profils where id = auth.uid();
$$;

create or replace function est_equipe()
returns boolean
language sql
stable
as $$
  select role_courant() in ('admin', 'superadmin');
$$;

-- Chacun voit son profil ; l'équipe les voit tous.
create policy "lire son profil" on profils
  for select using (id = auth.uid() or est_equipe());

-- On peut changer son nom, PAS son rôle : sans cette seconde condition,
-- n'importe quel client se promeut superadmin en une requête.
create policy "modifier son profil" on profils
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = role_courant());

-- Seul le superadmin distribue les rôles.
create policy "le superadmin gère les rôles" on profils
  for update using (role_courant() = 'superadmin');

-- Tout nouveau compte devient client. Devenir admin est une décision, pas
-- un effet de bord de l'inscription.
create or replace function creer_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profils (id, email, nom)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'nom', '')
  );
  return new;
end;
$$;

create trigger sur_inscription
  after insert on auth.users
  for each row execute function creer_profil();

-- ─────────────────────────────────────────────────────────────────────
-- CATALOGUE
-- ─────────────────────────────────────────────────────────────────────

create table produits (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type text not null default 'savon' check (type in ('savon', 'vitrine')),
  rang int not null default 10,
  nom text not null,
  accroche text not null default '',
  description text not null default '',
  -- Liste INCI. Obligatoire pour un cosmétique : c'est la réglementation,
  -- pas une préférence. Vide pour une vitrine, qui est un objet de déco.
  inci text not null default '',
  actif boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create table formules (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references produits on delete cascade,
  nom text not null,
  prix_centimes int not null check (prix_centimes > 0),
  unites int not null default 1 check (unites >= 1),
  poids_grammes int not null default 0 check (poids_grammes >= 0),
  actif boolean not null default true
);

create table themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  description text not null default '',
  ordre int not null default 10,
  actif boolean not null default true
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references produits on delete cascade,
  theme_id uuid references themes on delete cascade,
  chemin text not null,
  -- Une photo sans description est invisible pour un lecteur d'écran.
  alt text not null,
  largeur int not null default 0,
  hauteur int not null default 0,
  ordre int not null default 0,
  -- Une photo appartient à un produit OU à un thème, jamais aux deux ni à
  -- rien : une photo orpheline ne s'affiche nulle part et ne se retrouve pas.
  constraint photo_rattachee check (
    (produit_id is not null and theme_id is null)
    or (produit_id is null and theme_id is not null)
  )
);

alter table produits enable row level security;
alter table formules enable row level security;
alter table themes   enable row level security;
alter table photos   enable row level security;

-- La boutique est publique : tout le monde lit ce qui est en vente, même
-- sans compte. Les brouillons restent à l'équipe.
create policy "lire le catalogue publié" on produits
  for select using (actif or est_equipe());
create policy "lire les formules" on formules
  for select using (
    actif and exists (select 1 from produits p where p.id = produit_id and (p.actif or est_equipe()))
    or est_equipe()
  );
create policy "lire les thèmes" on themes
  for select using (actif or est_equipe());
create policy "lire les photos" on photos
  for select using (true);

-- Seule l'équipe écrit le catalogue.
create policy "l'équipe gère les produits" on produits for all using (est_equipe()) with check (est_equipe());
create policy "l'équipe gère les formules" on formules for all using (est_equipe()) with check (est_equipe());
create policy "l'équipe gère les thèmes"   on themes   for all using (est_equipe()) with check (est_equipe());
create policy "l'équipe gère les photos"   on photos   for all using (est_equipe()) with check (est_equipe());

-- ─────────────────────────────────────────────────────────────────────
-- COMMANDES
--
-- Une commande payée est une pièce comptable, conservée dix ans. Elle ne
-- se supprime jamais : aucune politique de DELETE n'existe, pour personne.
-- ─────────────────────────────────────────────────────────────────────

create table commandes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  -- Nul pour une commande passée sans compte : on n'oblige personne à
  -- s'inscrire pour acheter.
  client_id uuid references auth.users on delete set null,
  statut text not null default 'en_attente_paiement' check (statut in (
    'en_attente_paiement', 'payee', 'preparee', 'expediee', 'livree',
    'echouee', 'remboursee', 'annulee'
  )),

  email text not null,
  nom text not null,
  adresse text not null,
  code_postal text not null,
  ville text not null,
  pays text not null default 'FR',
  telephone text,

  sous_total_centimes int not null check (sous_total_centimes >= 0),
  livraison_centimes  int not null check (livraison_centimes >= 0),
  total_centimes      int not null check (total_centimes >= 0),

  paypal_order_id text unique,
  paypal_capture_id text,
  -- Montant réellement encaissé, relevé par la fonction de capture. Comparé
  -- au total attendu : un écart est soit une manipulation, soit un bogue, et
  -- dans les deux cas il ne faut pas expédier en silence.
  encaisse_centimes int,

  creee_le    timestamptz not null default now(),
  payee_le    timestamptz,
  expediee_le timestamptz
);

create table lignes_commande (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes on delete cascade,
  formule_id uuid references formules on delete set null,
  -- Copies figées au moment de la commande : changer un tarif ne doit pas
  -- réécrire l'historique comptable.
  libelle text not null,
  prix_unitaire_centimes int not null,
  quantite int not null check (quantite >= 1),
  total_centimes int not null,
  -- Personnalisation d'une vitrine. Le prénom sert à fabriquer l'objet et à
  -- rien d'autre : il ne doit alimenter aucun profil client.
  prenom text,
  theme_id uuid references themes on delete set null
);

alter table commandes       enable row level security;
alter table lignes_commande enable row level security;

-- Une cliente voit les siennes, l'équipe voit tout.
create policy "voir ses commandes" on commandes
  for select using (client_id = auth.uid() or est_equipe());
create policy "voir ses lignes" on lignes_commande
  for select using (
    exists (select 1 from commandes c where c.id = commande_id
            and (c.client_id = auth.uid() or est_equipe()))
  );

-- Créer une commande est ouvert à tous, y compris sans compte. Mais elle
-- naît FORCÉMENT en attente de paiement : sans ce `with check`, n'importe
-- qui insérerait une commande déjà marquée « payée » et se ferait expédier
-- des savons sans rien régler.
create policy "passer une commande" on commandes
  for insert with check (
    statut = 'en_attente_paiement'
    and paypal_capture_id is null
    and encaisse_centimes is null
    and (client_id is null or client_id = auth.uid())
  );
create policy "poser ses lignes" on lignes_commande
  for insert with check (
    exists (select 1 from commandes c where c.id = commande_id
            and c.statut = 'en_attente_paiement')
  );

-- Passer une commande à « payée » est réservé au serveur : la fonction de
-- capture PayPal s'exécute avec la clé de service, qui contourne RLS. Aucune
-- politique d'UPDATE n'est donnée au public — c'est délibéré.
create policy "l'équipe suit les commandes" on commandes
  for update using (est_equipe()) with check (est_equipe());

create index on commandes (client_id, creee_le desc);
create index on commandes (statut, creee_le desc);
create index on lignes_commande (commande_id);
create index on produits (actif, rang);
create index on photos (produit_id, ordre);
create index on photos (theme_id, ordre);
