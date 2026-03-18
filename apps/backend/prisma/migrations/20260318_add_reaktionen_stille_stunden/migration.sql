-- Nachricht-Reaktionen (Ja/Nein/Vielleicht/Gesehen)
-- ===================================================

-- ReaktionTyp Enum
CREATE TYPE "ReaktionTyp" AS ENUM ('GESEHEN', 'JA', 'NEIN', 'VIELLEICHT');

-- isEmergency Feld zur Message-Tabelle hinzufuegen
ALTER TABLE "Message" ADD COLUMN "isEmergency" BOOLEAN NOT NULL DEFAULT false;

-- MessageReaction Tabelle
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaktion" "ReaktionTyp" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- Unique: Ein Benutzer kann pro Nachricht nur eine Reaktion haben
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

-- Index fuer schnelle Abfragen nach Nachricht
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- Foreign Key: Reaktion → Nachricht (Cascade Delete)
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Benachrichtigungs-Einstellungen (Stille Stunden, Push, E-Mail)
-- ================================================================

CREATE TABLE "BenachrichtigungsEinstellung" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushAktiv" BOOLEAN NOT NULL DEFAULT true,
    "emailAktiv" BOOLEAN NOT NULL DEFAULT true,
    "stilleStundenVon" INTEGER NOT NULL DEFAULT 22,
    "stilleStundenBis" INTEGER NOT NULL DEFAULT 7,
    "notfallUeberschreiben" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenachrichtigungsEinstellung_pkey" PRIMARY KEY ("id")
);

-- Unique: Ein Benutzer hat nur eine Einstellung
CREATE UNIQUE INDEX "BenachrichtigungsEinstellung_userId_key" ON "BenachrichtigungsEinstellung"("userId");

-- Index fuer schnelle Abfragen
CREATE INDEX "BenachrichtigungsEinstellung_userId_idx" ON "BenachrichtigungsEinstellung"("userId");
