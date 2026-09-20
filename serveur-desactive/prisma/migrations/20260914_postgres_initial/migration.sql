-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Produit" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'savon',
    "rang" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "accroche" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inci" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variante" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "poidsGrammes" INTEGER NOT NULL,
    "prixCentimes" INTEGER NOT NULL,
    "unites" INTEGER NOT NULL DEFAULT 1,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "couleLe" TIMESTAMP(3) NOT NULL,
    "pretLe" TIMESTAMP(3) NOT NULL,
    "durableJusquLe" TIMESTAMP(3) NOT NULL,
    "quantiteProduite" INTEGER NOT NULL,
    "quantiteRestante" INTEGER NOT NULL,
    "notes" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente_paiement',
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'FR',
    "telephone" TEXT,
    "sousTotalCentimes" INTEGER NOT NULL,
    "livraisonCentimes" INTEGER NOT NULL,
    "totalCentimes" INTEGER NOT NULL,
    "moyenPaiement" TEXT,
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "creeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payeeLe" TIMESTAMP(3),
    "expedieeLe" TIMESTAMP(3),
    "modifieeLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeVitrine" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ThemeVitrine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlPetite" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "largeur" INTEGER NOT NULL,
    "hauteur" INTEGER NOT NULL,
    "octets" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produitId" TEXT,
    "themeId" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "lotId" TEXT,
    "prenom" TEXT,
    "themeId" TEXT,
    "libelle" TEXT NOT NULL,
    "prixUnitaireCentimes" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "totalCentimes" INTEGER NOT NULL,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "detail" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Administrateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniereConnexion" TIMESTAMP(3),

    CONSTRAINT "Administrateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "jeton" TEXT NOT NULL,
    "administrateurId" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglage" (
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "Produit_rang_key" ON "Produit"("rang");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_slug_key" ON "Produit"("slug");

-- CreateIndex
CREATE INDEX "Produit_actif_rang_idx" ON "Produit"("actif", "rang");

-- CreateIndex
CREATE INDEX "Variante_produitId_actif_idx" ON "Variante"("produitId", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_reference_key" ON "Lot"("reference");

-- CreateIndex
CREATE INDEX "Lot_produitId_pretLe_idx" ON "Lot"("produitId", "pretLe");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_reference_key" ON "Commande"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_paypalOrderId_key" ON "Commande"("paypalOrderId");

-- CreateIndex
CREATE INDEX "Commande_statut_creeeLe_idx" ON "Commande"("statut", "creeeLe");

-- CreateIndex
CREATE INDEX "Commande_creeeLe_idx" ON "Commande"("creeeLe");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeVitrine_slug_key" ON "ThemeVitrine"("slug");

-- CreateIndex
CREATE INDEX "ThemeVitrine_actif_ordre_idx" ON "ThemeVitrine"("actif", "ordre");

-- CreateIndex
CREATE INDEX "Photo_produitId_ordre_idx" ON "Photo"("produitId", "ordre");

-- CreateIndex
CREATE INDEX "Photo_themeId_ordre_idx" ON "Photo"("themeId", "ordre");

-- CreateIndex
CREATE INDEX "LigneCommande_commandeId_idx" ON "LigneCommande"("commandeId");

-- CreateIndex
CREATE INDEX "LigneCommande_lotId_idx" ON "LigneCommande"("lotId");

-- CreateIndex
CREATE INDEX "EvenementCommande_commandeId_creeLe_idx" ON "EvenementCommande"("commandeId", "creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "Administrateur_email_key" ON "Administrateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_jeton_key" ON "Session"("jeton");

-- CreateIndex
CREATE INDEX "Session_expireLe_idx" ON "Session"("expireLe");

-- AddForeignKey
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ThemeVitrine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ThemeVitrine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementCommande" ADD CONSTRAINT "EvenementCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_administrateurId_fkey" FOREIGN KEY ("administrateurId") REFERENCES "Administrateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

