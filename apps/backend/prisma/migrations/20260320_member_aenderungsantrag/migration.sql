-- Neue Felder auf Member fuer Selbstverwaltung
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "notfallKontakt" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "notfallTelefon" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "iban" TEXT;

-- Enum fuer Aenderungsstatus
DO $$ BEGIN
  CREATE TYPE "AenderungsStatus" AS ENUM ('PENDING', 'GENEHMIGT', 'ABGELEHNT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabelle fuer Aenderungsantraege
CREATE TABLE IF NOT EXISTS "MemberAenderungsantrag" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "feld" TEXT NOT NULL,
  "alterWert" TEXT,
  "neuerWert" TEXT NOT NULL,
  "status" "AenderungsStatus" NOT NULL DEFAULT 'PENDING',
  "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "bearbeitetAm" TIMESTAMP(3),
  "bearbeitetVon" TEXT,

  CONSTRAINT "MemberAenderungsantrag_pkey" PRIMARY KEY ("id")
);

-- Indizes
CREATE INDEX IF NOT EXISTS "MemberAenderungsantrag_tenantId_idx" ON "MemberAenderungsantrag"("tenantId");
CREATE INDEX IF NOT EXISTS "MemberAenderungsantrag_memberId_idx" ON "MemberAenderungsantrag"("memberId");
CREATE INDEX IF NOT EXISTS "MemberAenderungsantrag_status_idx" ON "MemberAenderungsantrag"("status");

-- Foreign Key
ALTER TABLE "MemberAenderungsantrag"
  ADD CONSTRAINT "MemberAenderungsantrag_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
