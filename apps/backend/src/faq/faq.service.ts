import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleFaqDto, AktualisiereFaqDto } from './dto/erstelle-faq.dto';
import Anthropic from '@anthropic-ai/sdk';

export interface AutomatischeAntwort {
  antwort: string;
  faqId?: string;
  kiGeneriert: boolean;
}

@Injectable()
export class FaqService {
  private client: Anthropic | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

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
   * 2. Falls nichts gefunden, wird Claude KI genutzt um eine Antwort zu generieren.
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
    if (!this.client) {
      throw new BadRequestException(
        'KI-FAQ ist nicht konfiguriert. ANTHROPIC_API_KEY fehlt.',
      );
    }

    // Kontext aus bestehenden FAQs aufbauen
    const faqKontext = faqs.length > 0
      ? faqs
          .map((faq) => `Frage: ${faq.question}\nAntwort: ${faq.answer}`)
          .join('\n\n')
      : 'Keine bestehenden FAQs vorhanden.';

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Du bist ein hilfreicher FAQ-Assistent fuer einen Sportverein. Beantworte die folgende Frage basierend auf den bestehenden FAQs als Kontext. Antworte freundlich, kurz und praezise auf Deutsch. Falls du keine passende Antwort findest, sage hoeflich, dass du die Frage leider nicht beantworten kannst und empfehle, den Trainer oder Vorstand direkt zu kontaktieren.

Bestehende FAQs:
${faqKontext}

Frage des Nutzers: ${frage}

Antworte direkt ohne Einfuehrung oder Erklaerung.`,
        },
      ],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (!textBlock) {
      throw new BadRequestException(
        'KI konnte keine Antwort generieren. Bitte versuchen Sie es erneut.',
      );
    }

    return {
      antwort: textBlock.text,
      kiGeneriert: true,
    };
  }
}
