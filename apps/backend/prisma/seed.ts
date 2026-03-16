import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

  // Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@clubos.de' },
    update: {},
    create: {
      email: 'admin@clubos.de',
      passwordHash: passwortHash,
      role: Role.SUPERADMIN,
      tenantId: tenant.id,
    },
  });
  console.log(`Superadmin erstellt: ${superadmin.email}`);

  // Vereins-Admin
  const vereinsAdmin = await prisma.user.upsert({
    where: { email: 'vorstand@fckunchen.de' },
    update: {},
    create: {
      email: 'vorstand@fckunchen.de',
      passwordHash: passwortHash,
      role: Role.ADMIN,
      tenantId: tenant.id,
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
    },
  });
  console.log(`Trainer erstellt: ${trainer.email}`);

  // Mitglied
  const mitglied = await prisma.user.upsert({
    where: { email: 'spieler@fckunchen.de' },
    update: {},
    create: {
      email: 'spieler@fckunchen.de',
      passwordHash: passwortHash,
      role: Role.MEMBER,
      tenantId: tenant.id,
    },
  });
  console.log(`Mitglied erstellt: ${mitglied.email}`);

  console.log('Seeding abgeschlossen!');
  console.log('');
  console.log('Test-Zugangsdaten (alle Passwort: ClubOS2024!):');
  console.log('  Superadmin: admin@clubos.de');
  console.log('  Admin:      vorstand@fckunchen.de');
  console.log('  Trainer:    trainer@fckunchen.de');
  console.log('  Mitglied:   spieler@fckunchen.de');
}

main()
  .catch((e) => {
    console.error('Seeding fehlgeschlagen:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
