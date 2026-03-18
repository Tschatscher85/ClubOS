import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Standard-Rollenvorlagen fuer jeden Verein
const STANDARD_ROLLEN_VORLAGEN = [
  {
    name: 'Vorstand',
    beschreibung: 'Vereinsvorstand mit vollen Verwaltungsrechten',
    systemRolle: Role.ADMIN,
    berechtigungen: [
      'MITGLIEDER', 'TEAMS', 'KALENDER', 'TURNIERE', 'NACHRICHTEN',
      'BUCHHALTUNG', 'FORMULARE', 'DOKUMENTE', 'EINSTELLUNGEN',
      'FAHRGEMEINSCHAFTEN', 'HALLENBELEGUNG', 'SCHIEDSRICHTER',
      'SPONSOREN', 'WORKFLOWS', 'HOMEPAGE',
    ],
    farbe: '#1a56db',
    sortierung: 1,
  },
  {
    name: 'Trainer',
    beschreibung: 'Trainer mit Zugriff auf Teams, Kalender und Formulare',
    systemRolle: Role.TRAINER,
    berechtigungen: [
      'MITGLIEDER', 'TEAMS', 'KALENDER', 'TURNIERE', 'NACHRICHTEN',
      'FORMULARE', 'HALLENBELEGUNG', 'SCHIEDSRICHTER', 'FAHRGEMEINSCHAFTEN',
    ],
    farbe: '#16a34a',
    sortierung: 2,
  },
  {
    name: 'Kassenprufer',
    beschreibung: 'Zugriff auf Buchhaltung und Finanzdokumente',
    systemRolle: Role.ADMIN,
    berechtigungen: ['BUCHHALTUNG', 'DOKUMENTE'],
    farbe: '#ea580c',
    sortierung: 3,
  },
  {
    name: 'Innendienst',
    beschreibung: 'Verwaltungsaufgaben wie Mitglieder, Dokumente und Formulare',
    systemRolle: Role.TRAINER,
    berechtigungen: [
      'MITGLIEDER', 'FORMULARE', 'DOKUMENTE', 'NACHRICHTEN', 'KALENDER',
    ],
    farbe: '#7c3aed',
    sortierung: 4,
  },
  {
    name: 'Ehrenamt',
    beschreibung: 'Ehrenamtliche Helfer mit eingeschraenktem Zugriff',
    systemRolle: Role.MEMBER,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'DOKUMENTE', 'FAHRGEMEINSCHAFTEN'],
    farbe: '#0891b2',
    sortierung: 5,
  },
  {
    name: 'Spieler',
    beschreibung: 'Vereinsmitglied / Spieler',
    systemRolle: Role.MEMBER,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'TEAMS', 'TURNIERE', 'FAHRGEMEINSCHAFTEN'],
    farbe: '#64748b',
    sortierung: 6,
  },
  {
    name: 'Eltern',
    beschreibung: 'Elternteil eines Jugendmitglieds',
    systemRolle: Role.PARENT,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'TEAMS'],
    farbe: '#db2777',
    sortierung: 7,
  },
];

async function main() {
  console.log('Seeding gestartet...');

  const passwortHash = await bcrypt.hash('ClubOS2024!', 12);

  // Test-Tenant erstellen
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'fckunchen' },
    update: {},
    create: {
      name: 'FC Kunchen 1920 e.V.',
      slug: 'fckunchen',
      primaryColor: '#1a56db',
    },
  });

  console.log(`Verein erstellt: ${tenant.name} (${tenant.id})`);

  // Standard-Rollenvorlagen erstellen
  for (const vorlage of STANDARD_ROLLEN_VORLAGEN) {
    await prisma.rollenVorlage.upsert({
      where: {
        tenantId_name: { tenantId: tenant.id, name: vorlage.name },
      },
      update: {
        berechtigungen: vorlage.berechtigungen,
        systemRolle: vorlage.systemRolle,
        beschreibung: vorlage.beschreibung,
      },
      create: {
        tenantId: tenant.id,
        ...vorlage,
        istStandard: true,
      },
    });
  }
  console.log(`${STANDARD_ROLLEN_VORLAGEN.length} Rollenvorlagen erstellt`);

  // Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@clubos.de' },
    update: {},
    create: {
      email: 'admin@clubos.de',
      passwordHash: passwortHash,
      role: Role.SUPERADMIN,
      tenantId: tenant.id,
      vereinsRollen: [],
      berechtigungen: [
        'MITGLIEDER', 'TEAMS', 'KALENDER', 'TURNIERE', 'NACHRICHTEN',
        'BUCHHALTUNG', 'FORMULARE', 'DOKUMENTE', 'EINSTELLUNGEN',
        'FAHRGEMEINSCHAFTEN', 'HALLENBELEGUNG', 'SCHIEDSRICHTER',
        'SPONSOREN', 'WORKFLOWS', 'HOMEPAGE',
      ],
    },
  });
  console.log(`Superadmin erstellt: ${superadmin.email}`);

  // Vereins-Admin (Vorstand)
  const vereinsAdmin = await prisma.user.upsert({
    where: { email: 'vorstand@fckunchen.de' },
    update: {},
    create: {
      email: 'vorstand@fckunchen.de',
      passwordHash: passwortHash,
      role: Role.ADMIN,
      tenantId: tenant.id,
      vereinsRollen: ['Vorstand'],
      berechtigungen: STANDARD_ROLLEN_VORLAGEN.find((r) => r.name === 'Vorstand')!.berechtigungen,
    },
  });
  console.log(`Admin erstellt: ${vereinsAdmin.email}`);

  // Trainer
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@fckunchen.de' },
    update: {},
    create: {
      email: 'trainer@fckunchen.de',
      passwordHash: passwortHash,
      role: Role.TRAINER,
      tenantId: tenant.id,
      vereinsRollen: ['Trainer'],
      berechtigungen: STANDARD_ROLLEN_VORLAGEN.find((r) => r.name === 'Trainer')!.berechtigungen,
    },
  });
  console.log(`Trainer erstellt: ${trainer.email}`);

  // Mitglied (Spieler)
  const mitglied = await prisma.user.upsert({
    where: { email: 'spieler@fckunchen.de' },
    update: {},
    create: {
      email: 'spieler@fckunchen.de',
      passwordHash: passwortHash,
      role: Role.MEMBER,
      tenantId: tenant.id,
      vereinsRollen: ['Spieler'],
      berechtigungen: STANDARD_ROLLEN_VORLAGEN.find((r) => r.name === 'Spieler')!.berechtigungen,
    },
  });
  console.log(`Mitglied erstellt: ${mitglied.email}`);

  // Elternteil
  const eltern = await prisma.user.upsert({
    where: { email: 'eltern@fckunchen.de' },
    update: {},
    create: {
      email: 'eltern@fckunchen.de',
      passwordHash: passwortHash,
      role: Role.PARENT,
      tenantId: tenant.id,
      vereinsRollen: ['Eltern'],
      berechtigungen: STANDARD_ROLLEN_VORLAGEN.find((r) => r.name === 'Eltern')!.berechtigungen,
    },
  });
  console.log(`Elternteil erstellt: ${eltern.email}`);

  console.log('');
  console.log('Seeding abgeschlossen!');
  console.log('');
  console.log('Test-Zugangsdaten (alle Passwort: ClubOS2024!):');
  console.log('  Superadmin:  admin@clubos.de');
  console.log('  Vorstand:    vorstand@fckunchen.de');
  console.log('  Trainer:     trainer@fckunchen.de');
  console.log('  Spieler:     spieler@fckunchen.de');
  console.log('  Elternteil:  eltern@fckunchen.de');
}

main()
  .catch((e) => {
    console.error('Seeding fehlgeschlagen:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
