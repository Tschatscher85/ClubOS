-- Neue Felder zur Halle-Tabelle hinzufuegen
ALTER TABLE "Halle" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Halle" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "Halle" ADD COLUMN IF NOT EXISTS "mapsUrl" TEXT;
ALTER TABLE "Halle" ADD COLUMN IF NOT EXISTS "parkplatzInfo" TEXT;
ALTER TABLE "Halle" ADD COLUMN IF NOT EXISTS "zugangscode" TEXT;

-- PinboardItem-Tabelle erstellen
CREATE TABLE IF NOT EXISTS "PinboardItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'info',
    "istAngepinnt" BOOLEAN NOT NULL DEFAULT false,
    "erstelltVon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinboardItem_pkey" PRIMARY KEY ("id")
);

-- Indizes fuer PinboardItem
CREATE INDEX IF NOT EXISTS "PinboardItem_teamId_idx" ON "PinboardItem"("teamId");
CREATE INDEX IF NOT EXISTS "PinboardItem_tenantId_idx" ON "PinboardItem"("tenantId");

-- Fremdschluessel fuer PinboardItem
ALTER TABLE "PinboardItem" DROP CONSTRAINT IF EXISTS "PinboardItem_tenantId_fkey";
ALTER TABLE "PinboardItem" ADD CONSTRAINT "PinboardItem_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PinboardItem" DROP CONSTRAINT IF EXISTS "PinboardItem_teamId_fkey";
ALTER TABLE "PinboardItem" ADD CONSTRAINT "PinboardItem_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
