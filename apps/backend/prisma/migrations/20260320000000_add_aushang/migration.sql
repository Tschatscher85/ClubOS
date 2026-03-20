-- CreateEnum
CREATE TYPE "AushangKategorie" AS ENUM ('INFO', 'WICHTIG', 'TRAINING', 'AUSFALL');

-- CreateTable
CREATE TABLE "Aushang" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT,
    "titel" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "kategorie" "AushangKategorie" NOT NULL,
    "bildUrl" TEXT,
    "ablaufDatum" TIMESTAMP(3),
    "erstelltVon" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aushang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aushang_tenantId_idx" ON "Aushang"("tenantId");

-- CreateIndex
CREATE INDEX "Aushang_teamId_idx" ON "Aushang"("teamId");

-- AddForeignKey
ALTER TABLE "Aushang" ADD CONSTRAINT "Aushang_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aushang" ADD CONSTRAINT "Aushang_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
