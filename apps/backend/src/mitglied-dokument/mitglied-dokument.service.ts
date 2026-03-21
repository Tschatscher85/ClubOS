import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MitgliedDokumentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dokument einem Mitglied zuordnen (Upload)
   */
  async hochladen(
    tenantId: string,
    memberId: string,
    userId: string,
    dateiname: string,
    dateiGroesse: number,
    dateiTyp: string,
    name: string,
    kategorie?: string,
    beschreibung?: string,
    istFamilienantrag?: boolean,
  ) {
    // Mitglied pruefen
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    return this.prisma.mitgliedDokument.create({
      data: {
        tenantId,
        memberId,
        name,
        beschreibung: beschreibung || null,
        dateiUrl: `/uploads/mitglied-dokumente/${dateiname}`,
        dateiGroesse,
        dateiTyp,
        kategorie: (kategorie as any) || 'MITGLIEDSANTRAG',
        istFamilienantrag: istFamilienantrag ?? false,
        hochgeladenVon: userId,
      },
    });
  }

  /**
   * Dokumente eines Mitglieds laden — DSGVO-konform:
   * - ADMIN/SUPERADMIN/TRAINER: alle Dokumente sehen
   * - Mitglied selbst: eigene Dokumente sehen
   * - Familie: Familienantraege der Kinder/Partner sehen
   */
  async fuerMitgliedLaden(
    tenantId: string,
    memberId: string,
    userId: string,
    rolle: string,
  ) {
    const istAdmin = ['ADMIN', 'SUPERADMIN', 'TRAINER'].includes(rolle);

    if (!istAdmin) {
      // Pruefen ob User das Mitglied selbst ist
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profile: { select: { id: true } } },
      });

      const istEigenesProfil = user?.profile?.id === memberId;

      if (!istEigenesProfil) {
        // Pruefen ob es ein Familienmitglied ist (nur Familienantraege)
        const istFamilie = await this.istFamilienmitglied(tenantId, userId, memberId);
        if (istFamilie) {
          return this.prisma.mitgliedDokument.findMany({
            where: { tenantId, memberId, istFamilienantrag: true },
            orderBy: { erstelltAm: 'desc' },
          });
        }
        throw new ForbiddenException('Kein Zugriff auf Dokumente dieses Mitglieds.');
      }
    }

    return this.prisma.mitgliedDokument.findMany({
      where: { tenantId, memberId },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /**
   * Pruefen ob User ueber Familie mit dem Mitglied verknuepft ist
   */
  private async istFamilienmitglied(
    tenantId: string,
    userId: string,
    memberId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: {
          select: {
            familieMitgliedschaften: {
              select: { familieId: true },
            },
          },
        },
      },
    });

    if (!user?.profile?.familieMitgliedschaften?.length) return false;

    const familieIds = user.profile.familieMitgliedschaften.map((f) => f.familieId);

    // Pruefen ob das Ziel-Mitglied in einer der gleichen Familien ist
    const zielMitglied = await this.prisma.familieMitglied.findFirst({
      where: {
        familieId: { in: familieIds },
        memberId,
      },
    });

    return !!zielMitglied;
  }

  /**
   * Dokument loeschen (nur Admin oder Uploader)
   */
  async loeschen(tenantId: string, dokumentId: string, userId: string, rolle: string) {
    const dokument = await this.prisma.mitgliedDokument.findFirst({
      where: { id: dokumentId, tenantId },
    });

    if (!dokument) {
      throw new NotFoundException('Dokument nicht gefunden.');
    }

    const istAdmin = ['ADMIN', 'SUPERADMIN'].includes(rolle);
    if (dokument.hochgeladenVon !== userId && !istAdmin) {
      throw new ForbiddenException('Nur der Hochlader oder ein Admin kann dieses Dokument loeschen.');
    }

    await this.prisma.mitgliedDokument.delete({ where: { id: dokumentId } });
    return { nachricht: 'Dokument geloescht.' };
  }
}
