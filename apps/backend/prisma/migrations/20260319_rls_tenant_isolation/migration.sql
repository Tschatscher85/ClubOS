-- Row-Level Security (RLS) fuer Tenant-Isolation
-- 4. Sicherheitsschicht neben JWT + TenantGuard + Service-Filter
-- Schuetzt auch bei Entwicklerfehlern (vergessenes WHERE tenantId)

-- Tabellen mit direktem tenantId-Feld
DO $$
DECLARE
  tbl TEXT;
  policy_name TEXT;
  tabellen TEXT[] := ARRAY[
    'User', 'RollenVorlage', 'Member', 'Beitragsklasse', 'Abteilung',
    'Team', 'CustomSportart', 'Event', 'Tournament', 'FormTemplate',
    'FormSubmission', 'Dokument', 'Message', 'FAQ', 'ElternFrage',
    'Fahrgemeinschaft', 'SchiedsrichterEinteilung', 'Rechnung', 'Beitrag',
    'Workflow', 'Halle', 'Sponsor', 'EmailPosteingang', 'EmailEntwurf',
    'Homepage', 'Einladung', 'PinboardItem', 'Spielbericht', 'Ressource',
    'Buchung', 'Trainingsplan', 'Entwicklungsbogen', 'Aufstellung', 'Verletzung'
  ];
BEGIN
  FOREACH tbl IN ARRAY tabellen LOOP
    policy_name := 'tenant_isolation_' || lower(tbl);

    -- RLS aktivieren
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- FORCE: RLS gilt auch fuer den Table-Owner
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    -- Alte Policies loeschen falls vorhanden
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'bypass_no_tenant_' || lower(tbl), tbl);

    -- Policy: Nur Zeilen mit passender tenantId sichtbar
    EXECUTE format(
      'CREATE POLICY %I ON %I
       USING ("tenantId" = current_setting(''app.current_tenant_id'', true))
       WITH CHECK ("tenantId" = current_setting(''app.current_tenant_id'', true))',
      policy_name, tbl
    );

    -- Bypass-Policy fuer Superadmin/Plattform-Operationen (wenn kein Tenant gesetzt)
    EXECUTE format(
      'CREATE POLICY %I ON %I
       USING (current_setting(''app.current_tenant_id'', true) IS NULL
              OR current_setting(''app.current_tenant_id'', true) = '''')',
      'bypass_no_tenant_' || lower(tbl), tbl
    );

    RAISE NOTICE 'RLS aktiviert fuer Tabelle: %', tbl;
  END LOOP;
END $$;

-- zahlungsFehlschlaege Feld hinzufuegen (falls nicht vorhanden)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "zahlungsFehlschlaege" INTEGER NOT NULL DEFAULT 0;
