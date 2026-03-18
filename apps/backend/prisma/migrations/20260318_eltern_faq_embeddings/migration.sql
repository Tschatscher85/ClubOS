-- AlterTable: FAQ um embedding-Feld erweitern
ALTER TABLE "FAQ" ADD COLUMN "embedding" JSONB;

-- CreateEnum: FrageStatus
CREATE TYPE "FrageStatus" AS ENUM ('OFFEN', 'AUTOMATISCH_BEANTWORTET', 'BEANTWORTET');

-- CreateTable: ElternFrage
CREATE TABLE "ElternFrage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT,
    "fragenderId" TEXT NOT NULL,
    "frage" TEXT NOT NULL,
    "antwort" TEXT,
    "automatisch" BOOLEAN NOT NULL DEFAULT false,
    "status" "FrageStatus" NOT NULL DEFAULT 'OFFEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beantwortetAm" TIMESTAMP(3),

    CONSTRAINT "ElternFrage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElternFrage_tenantId_idx" ON "ElternFrage"("tenantId");
CREATE INDEX "ElternFrage_teamId_idx" ON "ElternFrage"("teamId");
CREATE INDEX "ElternFrage_status_idx" ON "ElternFrage"("status");
