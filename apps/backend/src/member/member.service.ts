import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleMitgliedDto,
  AktualisiereMitgliedDto,
} from './dto/erstelle-mitglied.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleMitgliedDto) {
    // Mitgliedsnummer generieren
    const anzahl = await this.prisma.member.count({ where: { tenantId } });
    const mitgliedsnummer = `M-${String(anzahl + 1).padStart(4, '0')}`;

    return this.prisma.member.create({
      data: {
        tenantId,
        memberNumber: mitgliedsnummer,
        firstName: dto.vorname,
        lastName: dto.nachname,
        birthDate: dto.geburtsdatum ? new Date(dto.geburtsdatum) : null,
        phone: dto.telefon,
        address: dto.adresse,
        sport: dto.sportarten || [],
        parentEmail: dto.elternEmail,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.member.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id, tenantId },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    return mitglied;
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereMitgliedDto,
  ) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.vorname !== undefined && { firstName: dto.vorname }),
        ...(dto.nachname !== undefined && { lastName: dto.nachname }),
        ...(dto.geburtsdatum !== undefined && {
          birthDate: dto.geburtsdatum ? new Date(dto.geburtsdatum) : null,
        }),
        ...(dto.telefon !== undefined && { phone: dto.telefon }),
        ...(dto.adresse !== undefined && { address: dto.adresse }),
        ...(dto.sportarten !== undefined && { sport: dto.sportarten }),
        ...(dto.elternEmail !== undefined && { parentEmail: dto.elternEmail }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.member.delete({
      where: { id },
    });
  }

  async statistik(tenantId: string) {
    const [gesamt, aktiv, ausstehend] = await Promise.all([
      this.prisma.member.count({ where: { tenantId } }),
      this.prisma.member.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.member.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);

    return { gesamt, aktiv, ausstehend };
  }
}
