import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiService } from '../ki/ki.service';
import { ErstelleFaqDto, AktualisiereFaqDto } from './dto/erstelle-faq.dto';

export interface AutomatischeAntwort {
  antwort: string;
  faqId?: string;
  kiGeneriert: boolean;
}

@Injectable()
export class FaqService {
  constructor(
    private prisma: PrismaService,
    private kiService: KiService,
  ) {}

  /** Neue FAQ erstellen */
  async faqErstellen(tenantId: string, dto: ErstelleFaqDto) {
    return this.prisma.fAQ.create({
      data: {
        tenantId,
        question: dto.frage,
        answer: dto.antwort,
        teamId: dto.teamId || null,
      },
    });
  }

  /** Alle FAQs eines Vereins abrufen (optional nach Team filtern) */
  async alleAbrufen(tenantId: string, teamId?: string) {
    return this.prisma.fAQ.findMany({
      where: {
        tenantId,
        ...(teamId ? { teamId } : {}),
      },
      orderBy: { useCount: 'desc' },
    });
  }

  /** FAQ aktualisieren */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereFaqDto) {
    const faq = await this.prisma.fAQ.findFirst({
      where: { id, tenantId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ nicht gefunden.');
    }

    return this.prisma.fAQ.update({
      where: { id },
      data: {
        ...(dto.frage !== undefined && { question: dto.frage }),
        ...(dto.antwort !== undefined && { answer: dto.antwort }),
        ...(dto.teamId !== undefined && { teamId: dto.teamId || null }),
      },
    });
  }

  /** FAQ loeschen */
  async loeschen(tenantId: string, id: string) {
    const faq = await this.prisma.fAQ.findFirst({
      where: { id, tenantId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ nicht gefunden.');
    }

    return this.prisma.fAQ.delete({ where: { id } });
  }

  /**
   * Automatisch auf eine Frage antworten.
   * 1. Sucht zuerst in bestehenden FAQs nach einer passenden Antwort.
   * 2. Falls nichts gefunden, wird KI genutzt um eine Antwort zu generieren.
   */
  async automatischAntworten(
    tenantId: string,
    frage: string,
    teamId?: string,
  ): Promise<AutomatischeAntwort> {
    // Alle relevanten FAQs laden (vereinsweit + teamspezifisch)
    const faqs = await this.prisma.fAQ.findMany({
      where: {
        tenantId,
        OR: [
          { teamId: null },
          ...(teamId ? [{ teamId }] : []),
        ],
      },
    });

    // Einfache Textsuche: Pruefen ob die Frage zu einer bestehenden FAQ passt
    const frageNormalisiert = frage.toLowerCase().trim();
    const treffer = faqs.find((faq) => {
      const faqFrage = faq.question.toLowerCase().trim();
      // Exakte oder aehnliche Uebereinstimmung
      return (
        faqFrage === frageNormalisiert ||
        frageNormalisiert.includes(faqFrage) ||
        faqFrage.includes(frageNormalisiert)
      );
    });

    if (treffer) {
      // useCount erhoehen
      await this.prisma.fAQ.update({
        where: { id: treffer.id },
        data: { useCount: { increment: 1 } },
      });

      return {
        antwort: treffer.answer,
        faqId: treffer.id,
        kiGeneriert: false,
      };
    }

    // Keine passende FAQ gefunden -> KI-Antwort generieren
    const faqKontext = faqs.length > 0
      ? faqs
          .map((faq) => `Frage: ${faq.question}\nAntwort: ${faq.answer}`)
          .join('\n\n')
      : 'Keine bestehenden FAQs vorhanden.';

    const systemPrompt = `Du bist ein hilfreicher FAQ-Assistent fuer einen Sportverein. Beantworte die folgende Frage basierend auf den bestehenden FAQs als Kontext. Antworte freundlich, kurz und praezise auf Deutsch. Falls du keine passende Antwort findest, sage hoeflich, dass du die Frage leider nicht beantworten kannst und empfehle, den Trainer oder Vorstand direkt zu kontaktieren.`;

    const userPrompt = `Bestehende FAQs:
${faqKontext}

Frage des Nutzers: ${frage}

Antworte direkt ohne Einfuehrung oder Erklaerung.`;

    const antwort = await this.kiService.textGenerieren(tenantId, systemPrompt, userPrompt);

    return {
      antwort: antwort.text,
      kiGeneriert: true,
    };
  }
}
