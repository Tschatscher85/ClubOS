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
  {
    name: 'Jugendspieler',
    beschreibung: 'Jugendmitglied, wird von Eltern verwaltet bis zum eigenen Login',
    systemRolle: Role.MEMBER,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'TEAMS', 'TURNIERE', 'FAHRGEMEINSCHAFTEN'],
    farbe: '#f59e0b',
    sortierung: 8,
  },
];

async function main() {
  console.log('Seeding gestartet...');

  const passwortHash = await bcrypt.hash('Survive1985#', 12);

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
    where: { email: 'admin@vereinbase.de' },
    update: {},
    create: {
      email: 'admin@vereinbase.de',
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
    where: { email: 'vorstand@vereinbase.de' },
    update: {},
    create: {
      email: 'vorstand@vereinbase.de',
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
    where: { email: 'trainer@vereinbase.de' },
    update: {},
    create: {
      email: 'trainer@vereinbase.de',
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
    where: { email: 'spieler@vereinbase.de' },
    update: {},
    create: {
      email: 'spieler@vereinbase.de',
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
    where: { email: 'eltern@vereinbase.de' },
    update: {},
    create: {
      email: 'eltern@vereinbase.de',
      passwordHash: passwortHash,
      role: Role.PARENT,
      tenantId: tenant.id,
      vereinsRollen: ['Eltern'],
      berechtigungen: STANDARD_ROLLEN_VORLAGEN.find((r) => r.name === 'Eltern')!.berechtigungen,
    },
  });
  console.log(`Elternteil erstellt: ${eltern.email}`);

  // ==================== Member-Profile fuer alle User ====================

  // Admin (Vorstand) — Member-Profil
  let adminMember = await prisma.member.findFirst({
    where: { tenantId: tenant.id, userId: superadmin.id },
  });
  if (!adminMember) {
    adminMember = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: superadmin.id,
        memberNumber: 'M-0000',
        firstName: 'Thomas',
        lastName: 'Admin',
        email: 'admin@vereinbase.de',
        birthDate: new Date('1985-01-15'),
        status: 'ACTIVE',
        sport: ['FUSSBALL'],
      },
    });
    console.log(`Admin-Profil erstellt: ${adminMember.firstName} ${adminMember.lastName} (${adminMember.memberNumber})`);
  } else {
    console.log(`Admin-Profil existiert bereits: ${adminMember.firstName} ${adminMember.lastName}`);
  }

  // Vorstand — Member-Profil
  let vorstandMember = await prisma.member.findFirst({
    where: { tenantId: tenant.id, userId: vereinsAdmin.id },
  });
  if (!vorstandMember) {
    vorstandMember = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: vereinsAdmin.id,
        memberNumber: 'M-0003',
        firstName: 'Stefan',
        lastName: 'Vorstand',
        email: 'vorstand@vereinbase.de',
        birthDate: new Date('1978-09-10'),
        status: 'ACTIVE',
        sport: ['FUSSBALL'],
      },
    });
    console.log(`Vorstand-Profil erstellt: ${vorstandMember.firstName} ${vorstandMember.lastName} (${vorstandMember.memberNumber})`);
  } else {
    console.log(`Vorstand-Profil existiert bereits: ${vorstandMember.firstName} ${vorstandMember.lastName}`);
  }

  // Trainer — Member-Profil
  let trainerMember = await prisma.member.findFirst({
    where: { tenantId: tenant.id, userId: trainer.id },
  });
  if (!trainerMember) {
    trainerMember = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: trainer.id,
        memberNumber: 'M-0004',
        firstName: 'Juergen',
        lastName: 'Trainer',
        email: 'trainer@vereinbase.de',
        birthDate: new Date('1982-04-20'),
        status: 'ACTIVE',
        sport: ['FUSSBALL'],
      },
    });
    console.log(`Trainer-Profil erstellt: ${trainerMember.firstName} ${trainerMember.lastName} (${trainerMember.memberNumber})`);
  } else {
    console.log(`Trainer-Profil existiert bereits: ${trainerMember.firstName} ${trainerMember.lastName}`);
  }

  // Eltern — eigenes Member-Profil (zusaetzlich zur Familie-Verknuepfung)
  let elternMember = await prisma.member.findFirst({
    where: { tenantId: tenant.id, userId: eltern.id },
  });
  if (!elternMember) {
    elternMember = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: eltern.id,
        memberNumber: 'M-0005',
        firstName: 'Sandra',
        lastName: 'Mueller',
        email: 'eltern@vereinbase.de',
        birthDate: new Date('1986-11-03'),
        status: 'ACTIVE',
        sport: [],
      },
    });
    console.log(`Eltern-Profil erstellt: ${elternMember.firstName} ${elternMember.lastName} (${elternMember.memberNumber})`);
  } else {
    console.log(`Eltern-Profil existiert bereits: ${elternMember.firstName} ${elternMember.lastName}`);
  }

  // Kind-Profil (Mitglied) erstellen — verknuepft mit Eltern-Account
  let kindMember = await prisma.member.findFirst({
    where: { tenantId: tenant.id, memberNumber: 'M-0001' },
  });
  if (!kindMember) {
    kindMember = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        memberNumber: 'M-0001',
        firstName: 'Lukas',
        lastName: 'Mueller',
        email: 'lukas@example.com',
        birthDate: new Date('2014-06-15'),
        parentEmail: 'eltern@vereinbase.de',
        status: 'ACTIVE',
        sport: ['FUSSBALL'],
        fotoErlaubnis: true,
        fotoErlaubnisAm: new Date(),
        fahrgemeinschaftErlaubnis: true,
        fahrgemeinschaftErlaubnisAm: new Date(),
        notfallKontakt: 'Mama Mueller',
        notfallTelefon: '0170 1234567',
      },
    });
    console.log(`Kind-Profil erstellt: ${kindMember.firstName} ${kindMember.lastName} (${kindMember.memberNumber})`);
  } else {
    console.log(`Kind-Profil existiert bereits: ${kindMember.firstName} ${kindMember.lastName}`);
  }

  // Spieler-Mitglied (Erwachsener) mit User verknuepfen
  let spielerMember = await prisma.member.findFirst({
    where: { tenantId: tenant.id, userId: mitglied.id },
  });
  if (!spielerMember) {
    spielerMember = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: mitglied.id,
        memberNumber: 'M-0002',
        firstName: 'Max',
        lastName: 'Schmidt',
        email: 'spieler@vereinbase.de',
        birthDate: new Date('1995-03-22'),
        status: 'ACTIVE',
        sport: ['FUSSBALL'],
      },
    });
    console.log(`Spieler-Profil erstellt: ${spielerMember.firstName} ${spielerMember.lastName}`);
  } else {
    console.log(`Spieler-Profil existiert bereits: ${spielerMember.firstName} ${spielerMember.lastName}`);
  }

  // Familie erstellen und Kind + Eltern verknuepfen
  const existierendeFamilie = await prisma.familie.findFirst({
    where: { tenantId: tenant.id, name: 'Familie Mueller' },
  });
  if (!existierendeFamilie) {
    const familie = await prisma.familie.create({
      data: {
        tenantId: tenant.id,
        name: 'Familie Mueller',
        mitglieder: {
          create: [
            {
              memberId: kindMember.id,
              rolle: 'KIND',
            },
            {
              memberId: elternMember.id,
              rolle: 'MUTTER',
            },
          ],
        },
      },
    });
    console.log(`Familie erstellt: ${familie.name} (Kind: Lukas, Eltern: eltern@vereinbase.de)`);
  } else {
    console.log(`Familie existiert bereits: ${existierendeFamilie.name}`);
  }

  console.log('');
  console.log('Seeding abgeschlossen!');
  console.log('');
  console.log('Test-Zugangsdaten (Passwort: siehe .env):');
  console.log('  Superadmin:  admin@vereinbase.de');
  console.log('  Vorstand:    vorstand@vereinbase.de');
  console.log('  Trainer:     trainer@vereinbase.de');
  console.log('  Spieler:     spieler@vereinbase.de');
  console.log('  Elternteil:  eltern@vereinbase.de');
}

main()
  .catch((e) => {
    console.error('Seeding fehlgeschlagen:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
