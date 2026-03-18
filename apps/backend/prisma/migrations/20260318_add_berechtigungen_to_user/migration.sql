-- Berechtigungen und Benutzerverwaltung: Neue Spalten zur User-Tabelle
ALTER TABLE "User" ADD COLUMN "berechtigungen" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "istAktiv" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "letzterLogin" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "eingeladenVon" TEXT;
ALTER TABLE "User" ADD COLUMN "notizen" TEXT;
