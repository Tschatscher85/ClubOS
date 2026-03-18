import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KiService } from '../ki/ki.service';
import { ErstelleTrainingsplanDto } from './dto/erstelle-trainingsplan.dto';

@Injectable()
export class TrainingsplanService {
  private readonly logger = new Logger(TrainingsplanService.name);

  constructor(
    private prisma: PrismaService,
    private kiService: KiService,
  ) {}

  /** Trainingsplan per KI generieren und speichern */
  async erstellen(
    tenantId: string,
    teamId: string,
    dto: ErstelleTrainingsplanDto,
  ) {
    // Team laden fuer Sportart und Altersgruppe
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    const sportart = team.sport.charAt(0) + team.sport.slice(1).toLowerCase();
    const altersgruppe = team.ageGroup;

    // KI-Prompt erstellen
    const systemPrompt = `Du bist ein erfahrener ${sportart}-Trainer fuer ${altersgruppe}. Antworte ausschliesslich mit validem JSON.`;

    const userPrompt = `Erstelle einen Trainingsplan mit ${dto.anzahlEinheiten} Einheiten.
Niveau: ${dto.niveau}
Schwerpunkt: ${dto.fokus}
Dauer pro Einheit: ${dto.dauerMinuten} Minuten
${dto.besonderheiten ? `Besonderheiten: ${dto.besonderheiten}` : ''}

Antworte als JSON-Array (ohne Markdown-Codeblock, nur reines JSON):
[{
  "nummer": 1,
  "titel": "Einheit 1: ...",
  "erwaermung": { "dauer": 15, "beschreibung": "..." },
  "hauptteil": [{ "name": "Uebungsname", "dauer": 20, "beschreibung": "...", "material": ["Huetchen","Baelle"] }],
  "abschluss": { "dauer": 10, "beschreibung": "..." },
  "tipps": ["Tipp 1", "Tipp 2"]
}]`;

    let inhalt: unknown;
    let titel = `Trainingsplan: ${dto.fokus}`;

    try {
      const kiAntwort = await this.kiService.textGenerieren(
        tenantId,
        systemPrompt,
        userPrompt,
      );

      // JSON aus KI-Antwort parsen (evtl. Markdown-Codeblock entfernen)
      let jsonText = kiAntwort.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
      }

      try {
        inhalt = JSON.parse(jsonText);
        // Titel aus erster Einheit ableiten wenn moeglich
        if (Array.isArray(inhalt) && inhalt.length > 0 && inhalt[0].titel) {
          titel = `${dto.fokus} (${dto.anzahlEinheiten} Einheiten, ${dto.niveau})`;
        }
      } catch {
        // JSON-Parsing fehlgeschlagen — Rohtext speichern
        this.logger.warn('KI-Antwort konnte nicht als JSON geparst werden. Speichere als Rohtext.');
        inhalt = { rohtext: kiAntwort.text };
      }
    } catch (error) {
      this.logger.warn(
        `KI-Generierung fehlgeschlagen fuer Team ${teamId}: ${(error as Error).message}`,
      );
      throw error;
    }

    // Trainingsplan speichern
    const parameter = {
      fokus: dto.fokus,
      anzahlEinheiten: dto.anzahlEinheiten,
      dauerMinuten: dto.dauerMinuten,
      niveau: dto.niveau,
      besonderheiten: dto.besonderheiten || null,
      sportart,
      altersgruppe,
    };

    return this.prisma.trainingsplan.create({
      data: {
        teamId,
        tenantId,
        titel,
        parameter: parameter as unknown as Prisma.InputJsonValue,
        inhalt: inhalt as Prisma.InputJsonValue,
      },
      include: { team: true },
    });
  }

  /** Alle Trainingsplaene eines Teams laden */
  async alleVonTeam(tenantId: string, teamId: string) {
    return this.prisma.trainingsplan.findMany({
      where: { tenantId, teamId },
      include: { team: true },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /** Einzelnen Trainingsplan laden */
  async abrufen(tenantId: string, id: string) {
    const plan = await this.prisma.trainingsplan.findFirst({
      where: { id, tenantId },
      include: { team: true },
    });

    if (!plan) {
      throw new NotFoundException('Trainingsplan nicht gefunden.');
    }

    return plan;
  }

  /** Trainingsplan loeschen */
  async loeschen(tenantId: string, id: string) {
    const plan = await this.prisma.trainingsplan.findFirst({
      where: { id, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Trainingsplan nicht gefunden.');
    }

    await this.prisma.trainingsplan.delete({ where: { id } });

    return { geloescht: true };
  }
}
