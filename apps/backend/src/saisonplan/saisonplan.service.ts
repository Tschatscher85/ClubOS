import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ErstelleSaisonplanDto {
  teamId: string;
  saison: string;
  startDatum: string;
  endDatum: string;
}

export interface AktualisiereSaisonplanDto {
  saison?: string;
  startDatum?: string;
  endDatum?: string;
}

export interface ErstellePhaseDto {
  name: string;
  startDatum: string;
  endDatum: string;
  schwerpunkt?: string;
  farbe?: string;
  notizen?: string;
  reihenfolge?: number;
}

export interface AktualisierePhaseDto {
  name?: string;
  startDatum?: string;
  endDatum?: string;
  schwerpunkt?: string;
  farbe?: string;
  notizen?: string;
  reihenfolge?: number;
}

@Injectable()
export class SaisonplanService {
  constructor(private prisma: PrismaService) {}

  async erstellen(
    tenantId: string,
    userId: string,
    dto: ErstelleSaisonplanDto,
  ) {
    // Sicherstellen, dass das Team zum Tenant gehoert
    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId, tenantId },
    });
    if (!team) {
      throw new NotFoundException('Team nicht gefunden');
    }

    return this.prisma.saisonplan.create({
      data: {
        tenantId,
        teamId: dto.teamId,
        saison: dto.saison,
        startDatum: new Date(dto.startDatum),
        endDatum: new Date(dto.endDatum),
        erstelltVon: userId,
      },
      include: { phasen: { orderBy: { reihenfolge: 'asc' } }, team: true },
    });
  }

  async fuerTeam(tenantId: string, teamId: string) {
    return this.prisma.saisonplan.findMany({
      where: { tenantId, teamId },
      include: { phasen: { orderBy: { reihenfolge: 'asc' } }, team: true },
      orderBy: { startDatum: 'desc' },
    });
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereSaisonplanDto,
  ) {
    const plan = await this.prisma.saisonplan.findFirst({
      where: { id, tenantId },
    });
    if (!plan) {
      throw new NotFoundException('Saisonplan nicht gefunden');
    }

    return this.prisma.saisonplan.update({
      where: { id },
      data: {
        ...(dto.saison !== undefined ? { saison: dto.saison } : {}),
        ...(dto.startDatum !== undefined
          ? { startDatum: new Date(dto.startDatum) }
          : {}),
        ...(dto.endDatum !== undefined
          ? { endDatum: new Date(dto.endDatum) }
          : {}),
      },
      include: { phasen: { orderBy: { reihenfolge: 'asc' } }, team: true },
    });
  }

  async loeschen(tenantId: string, id: string) {
    const plan = await this.prisma.saisonplan.findFirst({
      where: { id, tenantId },
    });
    if (!plan) {
      throw new NotFoundException('Saisonplan nicht gefunden');
    }

    return this.prisma.saisonplan.delete({ where: { id } });
  }

  // ==================== Phasen ====================

  async phaseHinzufuegen(
    tenantId: string,
    saisonplanId: string,
    dto: ErstellePhaseDto,
  ) {
    const plan = await this.prisma.saisonplan.findFirst({
      where: { id: saisonplanId, tenantId },
    });
    if (!plan) {
      throw new NotFoundException('Saisonplan nicht gefunden');
    }

    return this.prisma.saisonPhase.create({
      data: {
        saisonplanId,
        name: dto.name,
        startDatum: new Date(dto.startDatum),
        endDatum: new Date(dto.endDatum),
        schwerpunkt: dto.schwerpunkt || null,
        farbe: dto.farbe || null,
        notizen: dto.notizen || null,
        reihenfolge: dto.reihenfolge ?? 0,
      },
    });
  }

  async phaseAktualisieren(
    tenantId: string,
    phaseId: string,
    dto: AktualisierePhaseDto,
  ) {
    const phase = await this.prisma.saisonPhase.findFirst({
      where: { id: phaseId },
      include: { saisonplan: true },
    });
    if (!phase || phase.saisonplan.tenantId !== tenantId) {
      throw new NotFoundException('Phase nicht gefunden');
    }

    return this.prisma.saisonPhase.update({
      where: { id: phaseId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.startDatum !== undefined
          ? { startDatum: new Date(dto.startDatum) }
          : {}),
        ...(dto.endDatum !== undefined
          ? { endDatum: new Date(dto.endDatum) }
          : {}),
        ...(dto.schwerpunkt !== undefined
          ? { schwerpunkt: dto.schwerpunkt }
          : {}),
        ...(dto.farbe !== undefined ? { farbe: dto.farbe } : {}),
        ...(dto.notizen !== undefined ? { notizen: dto.notizen } : {}),
        ...(dto.reihenfolge !== undefined
          ? { reihenfolge: dto.reihenfolge }
          : {}),
      },
    });
  }

  async phaseLoeschen(tenantId: string, phaseId: string) {
    const phase = await this.prisma.saisonPhase.findFirst({
      where: { id: phaseId },
      include: { saisonplan: true },
    });
    if (!phase || phase.saisonplan.tenantId !== tenantId) {
      throw new NotFoundException('Phase nicht gefunden');
    }

    return this.prisma.saisonPhase.delete({ where: { id: phaseId } });
  }

  // ==================== Events automatisch erstellen ====================

  async eventsErstellen(tenantId: string, saisonplanId: string) {
    const plan = await this.prisma.saisonplan.findFirst({
      where: { id: saisonplanId, tenantId },
      include: { phasen: { orderBy: { reihenfolge: 'asc' } }, team: true },
    });
    if (!plan) {
      throw new NotFoundException('Saisonplan nicht gefunden');
    }

    const erstellteEvents: string[] = [];

    for (const phase of plan.phasen) {
      const start = new Date(phase.startDatum);
      const ende = new Date(phase.endDatum);

      // Woechentlich Events erstellen (jeden Dienstag und Donnerstag als Standard)
      const aktuell = new Date(start);
      while (aktuell <= ende) {
        const wochentag = aktuell.getDay();
        // Dienstag (2) und Donnerstag (4) als Trainingstage
        if (wochentag === 2 || wochentag === 4) {
          const eventDatum = new Date(aktuell);
          eventDatum.setHours(18, 0, 0, 0);
          const eventEnde = new Date(aktuell);
          eventEnde.setHours(19, 30, 0, 0);

          const event = await this.prisma.event.create({
            data: {
              title: `Training: ${phase.name}${phase.schwerpunkt ? ` (${phase.schwerpunkt})` : ''}`,
              type: 'TRAINING',
              date: eventDatum,
              endDate: eventEnde,
              location: 'Vereinsgelaende',
              teamId: plan.teamId,
              tenantId,
              notes: phase.notizen || undefined,
            },
          });
          erstellteEvents.push(event.id);
        }
        aktuell.setDate(aktuell.getDate() + 1);
      }
    }

    return {
      nachricht: `${erstellteEvents.length} Trainings-Events wurden erstellt`,
      anzahl: erstellteEvents.length,
      eventIds: erstellteEvents,
    };
  }
}
