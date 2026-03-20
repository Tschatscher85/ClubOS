-- Wartelisten-Management
ALTER TABLE "Team" ADD COLUMN "maxKader" INTEGER;

CREATE TYPE "WartelistenStatus" AS ENUM ('WARTEND', 'EINGELADEN', 'BESTAETIGT', 'ABGELAUFEN');

CREATE TABLE "Warteliste" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "mitgliedId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "angemeldetAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "benachrichtigtAm" TIMESTAMP(3),
  "bestaetigtBis" TIMESTAMP(3),
  "status" "WartelistenStatus" NOT NULL DEFAULT 'WARTEND',
  CONSTRAINT "Warteliste_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Warteliste" ADD CONSTRAINT "Warteliste_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warteliste" ADD CONSTRAINT "Warteliste_mitgliedId_fkey" FOREIGN KEY ("mitgliedId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Warteliste_teamId_mitgliedId_key" ON "Warteliste"("teamId", "mitgliedId");
CREATE INDEX "Warteliste_teamId_idx" ON "Warteliste"("teamId");
CREATE INDEX "Warteliste_tenantId_idx" ON "Warteliste"("tenantId");
