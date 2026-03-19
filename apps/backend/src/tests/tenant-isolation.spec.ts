/**
 * Tenant-Isolations-Tests
 *
 * Stellt sicher, dass Row-Level Security (RLS) korrekt funktioniert:
 * - Tenant A sieht NIE Daten von Tenant B
 * - Tenant B sieht NIE Daten von Tenant A
 * - Ohne Tenant-Kontext (Superadmin) sind ALLE Daten sichtbar
 *
 * Voraussetzung: RLS-Migration wurde ausgefuehrt (20260319_rls_tenant_isolation)
 * Ausfuehren: npm run test:isolation
 */

import { PrismaClient, Role, Sport, EventType } from '@prisma/client';

// --- Hilfsfunktion: mitTenant (identisch zu PrismaService.mitTenant) ---
async function mitTenant<T>(
  prisma: PrismaClient,
  tenantId: string,
  fn: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // SET LOCAL gilt nur innerhalb dieser Transaktion
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}'`,
    );
    return fn(tx as unknown as PrismaClient);
  });
}

// --- Globale Variablen fuer Testdaten ---
let prisma: PrismaClient;

// Eindeutiges Praefix um Konflikte mit bestehenden Daten zu vermeiden
const TEST_PREFIX = `__rls_test_${Date.now()}__`;

// Tenant-IDs (werden in beforeAll gesetzt)
let tenantA_id: string;
let tenantB_id: string;

// Erstellte Entitaeten-IDs (fuer Aufraeum-Referenz)
let userA_id: string;
let userB_id: string;
let memberA_id: string;
let memberB_id: string;
let abteilungA_id: string;
let abteilungB_id: string;
let teamA_id: string;
let teamB_id: string;
let eventA_id: string;
let eventB_id: string;

// --- Setup & Teardown ---

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();

  // Tenant A erstellen (Verein A)
  const tenantA = await prisma.tenant.create({
    data: {
      name: `${TEST_PREFIX}Verein_A`,
      slug: `${TEST_PREFIX}verein-a`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    },
  });
  tenantA_id = tenantA.id;

  // Tenant B erstellen (Verein B)
  const tenantB = await prisma.tenant.create({
    data: {
      name: `${TEST_PREFIX}Verein_B`,
      slug: `${TEST_PREFIX}verein-b`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    },
  });
  tenantB_id = tenantB.id;

  // --- Testdaten fuer Tenant A ---
  const userA = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}trainer-a@verein-a.de`,
      role: Role.TRAINER,
      tenantId: tenantA_id,
      passwordHash: 'nicht-relevant-fuer-test',
    },
  });
  userA_id = userA.id;

  const memberA = await prisma.member.create({
    data: {
      tenantId: tenantA_id,
      memberNumber: `${TEST_PREFIX}M-A-001`,
      firstName: 'Max',
      lastName: 'Mustermann',
      sport: ['FUSSBALL'],
    },
  });
  memberA_id = memberA.id;

  const abteilungA = await prisma.abteilung.create({
    data: {
      tenantId: tenantA_id,
      name: `${TEST_PREFIX}Fussball A`,
      sport: Sport.FUSSBALL,
    },
  });
  abteilungA_id = abteilungA.id;

  const teamA = await prisma.team.create({
    data: {
      name: `${TEST_PREFIX}U12 Verein A`,
      sport: Sport.FUSSBALL,
      ageGroup: 'U12',
      trainerId: userA_id,
      tenantId: tenantA_id,
      abteilungId: abteilungA_id,
    },
  });
  teamA_id = teamA.id;

  const eventA = await prisma.event.create({
    data: {
      title: `${TEST_PREFIX}Training Verein A`,
      type: EventType.TRAINING,
      date: new Date('2026-06-01T18:00:00Z'),
      location: 'Sportplatz A',
      teamId: teamA_id,
      tenantId: tenantA_id,
    },
  });
  eventA_id = eventA.id;

  // --- Testdaten fuer Tenant B ---
  const userB = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}trainer-b@verein-b.de`,
      role: Role.TRAINER,
      tenantId: tenantB_id,
      passwordHash: 'nicht-relevant-fuer-test',
    },
  });
  userB_id = userB.id;

  const memberB = await prisma.member.create({
    data: {
      tenantId: tenantB_id,
      memberNumber: `${TEST_PREFIX}M-B-001`,
      firstName: 'Erika',
      lastName: 'Musterfrau',
      sport: ['HANDBALL'],
    },
  });
  memberB_id = memberB.id;

  const abteilungB = await prisma.abteilung.create({
    data: {
      tenantId: tenantB_id,
      name: `${TEST_PREFIX}Handball B`,
      sport: Sport.HANDBALL,
    },
  });
  abteilungB_id = abteilungB.id;

  const teamB = await prisma.team.create({
    data: {
      name: `${TEST_PREFIX}Damen Verein B`,
      sport: Sport.HANDBALL,
      ageGroup: 'Senioren',
      trainerId: userB_id,
      tenantId: tenantB_id,
      abteilungId: abteilungB_id,
    },
  });
  teamB_id = teamB.id;

  const eventB = await prisma.event.create({
    data: {
      title: `${TEST_PREFIX}Spiel Verein B`,
      type: EventType.MATCH,
      date: new Date('2026-06-02T15:00:00Z'),
      location: 'Sporthalle B',
      teamId: teamB_id,
      tenantId: tenantB_id,
    },
  });
  eventB_id = eventB.id;
});

afterAll(async () => {
  if (!prisma) return;

  // Hilfsfunktion: nur definierte IDs sammeln
  const definiert = (...ids: (string | undefined)[]): string[] =>
    ids.filter((id): id is string => id !== undefined);

  try {
    // Testdaten aufraumen (Reihenfolge beachten wegen Foreign Keys)
    // Events zuerst (referenzieren Teams)
    await prisma.event.deleteMany({
      where: { id: { in: definiert(eventA_id, eventB_id) } },
    });

    // Teams loeschen
    await prisma.team.deleteMany({
      where: { id: { in: definiert(teamA_id, teamB_id) } },
    });

    // Abteilungen loeschen
    await prisma.abteilung.deleteMany({
      where: { id: { in: definiert(abteilungA_id, abteilungB_id) } },
    });

    // Members loeschen
    await prisma.member.deleteMany({
      where: { id: { in: definiert(memberA_id, memberB_id) } },
    });

    // Users loeschen
    await prisma.user.deleteMany({
      where: { id: { in: definiert(userA_id, userB_id) } },
    });

    // Tenants loeschen (Cascade loescht abhaengige Daten auch)
    await prisma.tenant.deleteMany({
      where: { id: { in: definiert(tenantA_id, tenantB_id) } },
    });
  } catch (err) {
    console.error('Fehler beim Aufraumen der Testdaten:', err);
  }

  await prisma.$disconnect();
});

// ==================== TESTS ====================

describe('Tenant-Isolation (RLS)', () => {

  // --- Users ---

  describe('User-Tabelle', () => {
    it('Tenant A sieht nur eigene Users', async () => {
      const users = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.user.findMany({ where: { id: { in: [userA_id, userB_id] } } }),
      );

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(userA_id);
      expect(users[0].tenantId).toBe(tenantA_id);
    });

    it('Tenant B sieht nur eigene Users', async () => {
      const users = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.user.findMany({ where: { id: { in: [userA_id, userB_id] } } }),
      );

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(userB_id);
      expect(users[0].tenantId).toBe(tenantB_id);
    });

    it('Tenant A kann User von Tenant B nicht per ID laden', async () => {
      const user = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.user.findUnique({ where: { id: userB_id } }),
      );

      expect(user).toBeNull();
    });

    it('Ohne Tenant-Kontext (Superadmin) sieht alle Users', async () => {
      const users = await prisma.user.findMany({
        where: { id: { in: [userA_id, userB_id] } },
      });

      expect(users).toHaveLength(2);
      const ids = users.map((u) => u.id).sort();
      expect(ids).toEqual([userA_id, userB_id].sort());
    });
  });

  // --- Members ---

  describe('Member-Tabelle', () => {
    it('Tenant A sieht nur eigene Members', async () => {
      const members = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.member.findMany({ where: { id: { in: [memberA_id, memberB_id] } } }),
      );

      expect(members).toHaveLength(1);
      expect(members[0].id).toBe(memberA_id);
      expect(members[0].firstName).toBe('Max');
    });

    it('Tenant B sieht nur eigene Members', async () => {
      const members = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.member.findMany({ where: { id: { in: [memberA_id, memberB_id] } } }),
      );

      expect(members).toHaveLength(1);
      expect(members[0].id).toBe(memberB_id);
      expect(members[0].firstName).toBe('Erika');
    });

    it('Tenant B kann Member von Tenant A nicht per ID laden', async () => {
      const member = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.member.findUnique({ where: { id: memberA_id } }),
      );

      expect(member).toBeNull();
    });

    it('Ohne Tenant-Kontext (Superadmin) sieht alle Members', async () => {
      const members = await prisma.member.findMany({
        where: { id: { in: [memberA_id, memberB_id] } },
      });

      expect(members).toHaveLength(2);
    });
  });

  // --- Teams ---

  describe('Team-Tabelle', () => {
    it('Tenant A sieht nur eigene Teams', async () => {
      const teams = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.team.findMany({ where: { id: { in: [teamA_id, teamB_id] } } }),
      );

      expect(teams).toHaveLength(1);
      expect(teams[0].id).toBe(teamA_id);
      expect(teams[0].name).toContain('Verein A');
    });

    it('Tenant B sieht nur eigene Teams', async () => {
      const teams = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.team.findMany({ where: { id: { in: [teamA_id, teamB_id] } } }),
      );

      expect(teams).toHaveLength(1);
      expect(teams[0].id).toBe(teamB_id);
      expect(teams[0].name).toContain('Verein B');
    });

    it('Tenant A kann Team von Tenant B nicht per ID laden', async () => {
      const team = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.team.findUnique({ where: { id: teamB_id } }),
      );

      expect(team).toBeNull();
    });

    it('Ohne Tenant-Kontext (Superadmin) sieht alle Teams', async () => {
      const teams = await prisma.team.findMany({
        where: { id: { in: [teamA_id, teamB_id] } },
      });

      expect(teams).toHaveLength(2);
    });
  });

  // --- Events ---

  describe('Event-Tabelle', () => {
    it('Tenant A sieht nur eigene Events', async () => {
      const events = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.event.findMany({ where: { id: { in: [eventA_id, eventB_id] } } }),
      );

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(eventA_id);
      expect(events[0].title).toContain('Verein A');
    });

    it('Tenant B sieht nur eigene Events', async () => {
      const events = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.event.findMany({ where: { id: { in: [eventA_id, eventB_id] } } }),
      );

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(eventB_id);
      expect(events[0].title).toContain('Verein B');
    });

    it('Tenant B kann Event von Tenant A nicht per ID laden', async () => {
      const event = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.event.findUnique({ where: { id: eventA_id } }),
      );

      expect(event).toBeNull();
    });

    it('Ohne Tenant-Kontext (Superadmin) sieht alle Events', async () => {
      const events = await prisma.event.findMany({
        where: { id: { in: [eventA_id, eventB_id] } },
      });

      expect(events).toHaveLength(2);
    });
  });

  // --- Abteilungen ---

  describe('Abteilung-Tabelle', () => {
    it('Tenant A sieht nur eigene Abteilungen', async () => {
      const abteilungen = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.abteilung.findMany({
          where: { id: { in: [abteilungA_id, abteilungB_id] } },
        }),
      );

      expect(abteilungen).toHaveLength(1);
      expect(abteilungen[0].id).toBe(abteilungA_id);
    });

    it('Tenant B sieht nur eigene Abteilungen', async () => {
      const abteilungen = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.abteilung.findMany({
          where: { id: { in: [abteilungA_id, abteilungB_id] } },
        }),
      );

      expect(abteilungen).toHaveLength(1);
      expect(abteilungen[0].id).toBe(abteilungB_id);
    });

    it('Ohne Tenant-Kontext (Superadmin) sieht alle Abteilungen', async () => {
      const abteilungen = await prisma.abteilung.findMany({
        where: { id: { in: [abteilungA_id, abteilungB_id] } },
      });

      expect(abteilungen).toHaveLength(2);
    });
  });

  // --- Cross-Tenant Schreibschutz ---

  describe('Cross-Tenant Schreibschutz', () => {
    it('Tenant A kann keinen User fuer Tenant B erstellen (RLS WITH CHECK)', async () => {
      // Versuch, innerhalb des Tenant-A-Kontexts einen User mit tenantId B zu erstellen
      // RLS WITH CHECK sollte das blockieren
      await expect(
        mitTenant(prisma, tenantA_id, (tx) =>
          tx.user.create({
            data: {
              email: `${TEST_PREFIX}hacker@evil.de`,
              role: Role.MEMBER,
              tenantId: tenantB_id, // Fremder Tenant!
              passwordHash: 'versuch',
            },
          }),
        ),
      ).rejects.toThrow();
    });

    it('Tenant A kann kein Member fuer Tenant B erstellen', async () => {
      await expect(
        mitTenant(prisma, tenantA_id, (tx) =>
          tx.member.create({
            data: {
              tenantId: tenantB_id, // Fremder Tenant!
              memberNumber: `${TEST_PREFIX}HACKER`,
              firstName: 'Hacker',
              lastName: 'Test',
              sport: ['FUSSBALL'],
            },
          }),
        ),
      ).rejects.toThrow();
    });

    it('Tenant B kann kein Event fuer Tenant A erstellen', async () => {
      await expect(
        mitTenant(prisma, tenantB_id, (tx) =>
          tx.event.create({
            data: {
              title: `${TEST_PREFIX}Hacker Event`,
              type: EventType.TRAINING,
              date: new Date(),
              location: 'Nirgendwo',
              teamId: teamA_id, // Team gehoert zu Tenant A!
              tenantId: tenantA_id, // Fremder Tenant!
            },
          }),
        ),
      ).rejects.toThrow();
    });
  });

  // --- Cross-Tenant Update-Schutz ---

  describe('Cross-Tenant Update-Schutz', () => {
    it('Tenant A kann Member von Tenant B nicht aktualisieren', async () => {
      // updateMany gibt {count: 0} zurueck wenn RLS die Zeile nicht findet
      const result = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.member.updateMany({
          where: { id: memberB_id },
          data: { firstName: 'GEHACKT' },
        }),
      );

      expect(result.count).toBe(0);

      // Sicherstellen, dass der originale Name unveraendert ist
      const originalMember = await prisma.member.findUnique({
        where: { id: memberB_id },
      });
      expect(originalMember?.firstName).toBe('Erika');
    });

    it('Tenant B kann Event von Tenant A nicht loeschen', async () => {
      const result = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.event.deleteMany({ where: { id: eventA_id } }),
      );

      expect(result.count).toBe(0);

      // Sicherstellen, dass das Event noch existiert
      const originalEvent = await prisma.event.findUnique({
        where: { id: eventA_id },
      });
      expect(originalEvent).not.toBeNull();
    });
  });

  // --- Zaehler-Tests (keine Testdaten-Leaks) ---

  describe('Zaehler-Konsistenz', () => {
    it('Tenant A zaehlt nur eigene Entitaeten', async () => {
      const [userCount, memberCount, teamCount, eventCount] = await mitTenant(
        prisma,
        tenantA_id,
        async (tx) => {
          return Promise.all([
            tx.user.count(),
            tx.member.count(),
            tx.team.count(),
            tx.event.count(),
          ]);
        },
      );

      // Mindestens unsere Testdaten (koennte mehr sein wenn andere Tests laufen)
      expect(userCount).toBeGreaterThanOrEqual(1);
      expect(memberCount).toBeGreaterThanOrEqual(1);
      expect(teamCount).toBeGreaterThanOrEqual(1);
      expect(eventCount).toBeGreaterThanOrEqual(1);
    });

    it('Gesamtzahl ohne Tenant-Kontext ist groesser als einzelner Tenant', async () => {
      const countA = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.user.count(),
      );
      const countB = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.user.count(),
      );
      const countGesamt = await prisma.user.count();

      // Superadmin sieht mindestens die Summe beider Tenants
      expect(countGesamt).toBeGreaterThanOrEqual(countA + countB);
    });
  });

  // --- findMany ohne WHERE: RLS filtert trotzdem ---

  describe('RLS filtert auch ohne explizites WHERE', () => {
    it('Tenant A: findMany() ohne Filter gibt nur eigene Daten zurueck', async () => {
      const members = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.member.findMany(),
      );

      // Alle zurueckgegebenen Members gehoeren zu Tenant A
      for (const member of members) {
        expect(member.tenantId).toBe(tenantA_id);
      }
    });

    it('Tenant B: findMany() ohne Filter gibt nur eigene Daten zurueck', async () => {
      const events = await mitTenant(prisma, tenantB_id, (tx) =>
        tx.event.findMany(),
      );

      // Alle zurueckgegebenen Events gehoeren zu Tenant B
      for (const event of events) {
        expect(event.tenantId).toBe(tenantB_id);
      }
    });

    it('Tenant A: Teams findMany() enthaelt kein Team von Tenant B', async () => {
      const teams = await mitTenant(prisma, tenantA_id, (tx) =>
        tx.team.findMany(),
      );

      const teamIds = teams.map((t) => t.id);
      expect(teamIds).not.toContain(teamB_id);
      expect(teamIds).toContain(teamA_id);
    });
  });
});
