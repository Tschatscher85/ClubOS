-- CreateTable
CREATE TABLE "Umfrage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT,
    "frage" TEXT NOT NULL,
    "optionen" TEXT[],
    "endetAm" TIMESTAMP(3),
    "erstelltVon" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Umfrage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UmfrageAntwort" (
    "id" TEXT NOT NULL,
    "umfrageId" TEXT NOT NULL,
    "mitgliedId" TEXT,
    "mitgliedName" TEXT,
    "option" TEXT NOT NULL,
    "beantwortetAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UmfrageAntwort_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Umfrage_tenantId_idx" ON "Umfrage"("tenantId");

-- CreateIndex
CREATE INDEX "Umfrage_teamId_idx" ON "Umfrage"("teamId");

-- CreateIndex
CREATE INDEX "UmfrageAntwort_umfrageId_idx" ON "UmfrageAntwort"("umfrageId");

-- AddForeignKey
ALTER TABLE "Umfrage" ADD CONSTRAINT "Umfrage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UmfrageAntwort" ADD CONSTRAINT "UmfrageAntwort_umfrageId_fkey" FOREIGN KEY ("umfrageId") REFERENCES "Umfrage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
