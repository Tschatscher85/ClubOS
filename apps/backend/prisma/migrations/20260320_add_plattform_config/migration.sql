-- Plattform-Konfiguration (Singleton fuer Superadmin KI-Keys)
CREATE TABLE IF NOT EXISTS "PlattformConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "anthropicApiKey" TEXT,
    "openaiApiKey" TEXT,
    "standardProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "standardModell" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlattformConfig_pkey" PRIMARY KEY ("id")
);

-- Singleton-Eintrag erstellen
INSERT INTO "PlattformConfig" ("id", "standardProvider", "updatedAt")
VALUES ('singleton', 'anthropic', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
