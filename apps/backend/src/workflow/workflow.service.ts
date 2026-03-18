import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleWorkflowDto,
  AktualisiereWorkflowDto,
} from './dto/erstelle-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, userId: string, dto: ErstelleWorkflowDto) {
    // Pruefen ob alle Template-IDs existieren
    const vorlagen = await this.prisma.formTemplate.findMany({
      where: {
        id: { in: dto.templateIds },
        tenantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (vorlagen.length !== dto.templateIds.length) {
      throw new BadRequestException(
        'Eine oder mehrere Formularvorlagen wurden nicht gefunden oder sind inaktiv.',
      );
    }

    return this.prisma.workflow.create({
      data: {
        tenantId,
        name: dto.name,
        beschreibung: dto.beschreibung,
        templateIds: dto.templateIds,
        sportarten: dto.sportarten || [],
        emailBetreff: dto.emailBetreff,
        emailText: dto.emailText,
        erstelltVon: userId,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    // Template-Namen laden fuer die Anzeige
    const alleTemplateIds = [...new Set(workflows.flatMap((w) => w.templateIds))];
    const vorlagen = await this.prisma.formTemplate.findMany({
      where: { id: { in: alleTemplateIds } },
      select: { id: true, name: true, type: true },
    });

    const vorlagenMap = new Map(vorlagen.map((v) => [v.id, v]));

    return workflows.map((w) => ({
      ...w,
      vorlagen: w.templateIds
        .map((id) => vorlagenMap.get(id))
        .filter(Boolean),
    }));
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow nicht gefunden.');
    }

    // Template-Details laden
    const vorlagen = await this.prisma.formTemplate.findMany({
      where: { id: { in: workflow.templateIds } },
      select: { id: true, name: true, type: true, fields: true },
    });

    return {
      ...workflow,
      vorlagen,
    };
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereWorkflowDto,
  ) {
    await this.nachIdAbrufen(tenantId, id);

    // Falls templateIds geaendert werden, pruefen ob alle existieren
    if (dto.templateIds) {
      const vorlagen = await this.prisma.formTemplate.findMany({
        where: {
          id: { in: dto.templateIds },
          tenantId,
          isActive: true,
        },
        select: { id: true },
      });

      if (vorlagen.length !== dto.templateIds.length) {
        throw new BadRequestException(
          'Eine oder mehrere Formularvorlagen wurden nicht gefunden oder sind inaktiv.',
        );
      }
    }

    return this.prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.templateIds !== undefined && { templateIds: dto.templateIds }),
        ...(dto.sportarten !== undefined && { sportarten: dto.sportarten }),
        ...(dto.emailBetreff !== undefined && { emailBetreff: dto.emailBetreff }),
        ...(dto.emailText !== undefined && { emailText: dto.emailText }),
        ...(dto.istAktiv !== undefined && { istAktiv: dto.istAktiv }),
      },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.workflow.delete({ where: { id } });
  }
}
