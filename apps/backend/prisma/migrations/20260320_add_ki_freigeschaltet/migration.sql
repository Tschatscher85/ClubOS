-- AlterTable: KI-Freischaltung pro Verein (Superadmin)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "kiFreigeschaltet" BOOLEAN NOT NULL DEFAULT false;
