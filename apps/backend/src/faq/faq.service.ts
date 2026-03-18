import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiService } from '../ki/ki.service';
import { ErstelleFaqDto, AktualisiereFaqDto } from './dto/erstelle-faq.dto';

export interface AutomatischeAntwort {
  antwort: string;
  faqId?: string;
  kiGeneriert: boolean;
}

/** Berechnet die Kosinus-Aehnlichkeit zwischen zwei Vektoren */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

@Injectable()
export class FaqService {
  constructor(
    private prisma: PrismaService,
    private kiService: KiService,
  ) {}

  /** Neue FAQ erstellen (mit Embedding-Berechnung) */
  async faqErstellen(tenantId: string, dto: ErstelleFaqDto) {
    let embedding: number[] | null = null;
    try {
      embedding = await this.kiService.embeddingGenerieren(tenantId, dto.frage);
    } catch {
      // Embedding-Generierung ist optional, Fehler werden ignoriert
    }

    return this.prisma.fAQ.create({
      data: {
        tenantId,
        question: dto.frage,
        answer: dto.antwort,
        teamId: dto.teamId || null,
        embedding: embedding || undefined,
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

  /** FAQ aktualisieren (mit Embedding-Neuberechnung bei Frage-Aenderung) */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereFaqDto) {
    const faq = await this.prisma.fAQ.findFirst({
      where: { id, tenantId },
    });

    if (!faq) {
      throw new NotFoundException('FAQ nicht gefunden.');
    }

    let embedding: number[] | undefined;
    if (dto.frage !== undefined) {
      try {
        embedding = await this.kiService.embeddingGenerieren(tenantId, dto.frage);
      } catch {
        // Embedding-Generierung ist optional
      }
    }

    return this.prisma.fAQ.update({
      where: { id },
      data: {
        ...(dto.frage !== undefined && { question: dto.frage }),
        ...(dto.antwort !== undefined && { answer: dto.antwort }),
        ...(dto.teamId !== undefined && { teamId: dto.teamId || null }),
        ...(embedding !== undefined && { embedding }),
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

  // ==================== Eltern-Fragen mit Embedding-Suche ====================

  /**
   * Elternteil stellt eine Frage.
   * 1. Berechnet Embedding fuer die Frage
   * 2. Vergleicht mit allen FAQ-Embeddings via Kosinus-Aehnlichkeit
   * 3. Bei Aehnlichkeit > 0.85: automatische Antwort
   * 4. Sonst: Frage wird als OFFEN gespeichert
   */
  async elternFrageStellen(
    tenantId: string,
    fragenderId: string,
    frage: string,
    teamId?: string,
  ) {
    // Embedding fuer die Frage berechnen
    let frageEmbedding: number[] | null = null;
    try {
      frageEmbedding = await this.kiService.embeddingGenerieren(tenantId, frage);
    } catch {
      // Fallback: ohne Embedding weiterarbeiten
    }

    // Alle FAQs mit Embeddings laden (vereinsweit + teamspezifisch)
    const faqs = await this.prisma.fAQ.findMany({
      where: {
        tenantId,
        OR: [
          { teamId: null },
          ...(teamId ? [{ teamId }] : []),
        ],
      },
    });

    // Embedding-basierte Similarity-Suche
    if (frageEmbedding) {
      let besteTreffer: { faq: typeof faqs[0]; aehnlichkeit: number } | null = null;

      for (const faq of faqs) {
        if (!faq.embedding) continue;
        const faqEmbedding = faq.embedding as number[];
        const aehnlichkeit = cosineSimilarity(frageEmbedding, faqEmbedding);

        if (!besteTreffer || aehnlichkeit > besteTreffer.aehnlichkeit) {
          besteTreffer = { faq, aehnlichkeit };
        }
      }

      // Schwellwert: 0.85 fuer automatische Antwort
      if (besteTreffer && besteTreffer.aehnlichkeit > 0.85) {
        // useCount erhoehen
        await this.prisma.fAQ.update({
          where: { id: besteTreffer.faq.id },
          data: { useCount: { increment: 1 } },
        });

        // ElternFrage als automatisch beantwortet speichern
        const elternFrage = await this.prisma.elternFrage.create({
          data: {
            tenantId,
            teamId: teamId || null,
            fragenderId,
            frage,
            antwort: besteTreffer.faq.answer,
            automatisch: true,
            status: 'AUTOMATISCH_BEANTWORTET',
            beantwortetAm: new Date(),
          },
        });

        return {
          id: elternFrage.id,
          antwort: besteTreffer.faq.answer,
          automatisch: true,
          status: 'AUTOMATISCH_BEANTWORTET',
          aehnlichkeit: Math.round(besteTreffer.aehnlichkeit * 100) / 100,
        };
      }
    }

    // Keine ausreichende Aehnlichkeit -> Frage als OFFEN speichern
    const elternFrage = await this.prisma.elternFrage.create({
      data: {
        tenantId,
        teamId: teamId || null,
        fragenderId,
        frage,
        status: 'OFFEN',
      },
    });

    return {
      id: elternFrage.id,
      antwort: null,
      automatisch: false,
      status: 'OFFEN',
      nachricht: 'Deine Frage wurde an den Trainer weitergeleitet. Du erhaeltst eine Antwort sobald moeglich.',
    };
  }

  /**
   * Offene Eltern-Fragen abrufen (fuer Trainer).
   */
  async offeneFragenAbrufen(tenantId: string, teamId?: string) {
    return this.prisma.elternFrage.findMany({
      where: {
        tenantId,
        status: 'OFFEN',
        ...(teamId ? { teamId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Trainer beantwortet eine offene Frage.
   * Optional: Antwort als neue FAQ mit Embedding hinzufuegen.
   */
  async frageBeantworten(
    tenantId: string,
    frageId: string,
    antwort: string,
    alsFaqHinzufuegen: boolean = false,
  ) {
    const elternFrage = await this.prisma.elternFrage.findFirst({
      where: { id: frageId, tenantId },
    });

    if (!elternFrage) {
      throw new NotFoundException('Frage nicht gefunden.');
    }

    if (elternFrage.status === 'BEANTWORTET') {
      throw new BadRequestException('Diese Frage wurde bereits beantwortet.');
    }

    // Frage als beantwortet markieren
    const aktualisiert = await this.prisma.elternFrage.update({
      where: { id: frageId },
      data: {
        antwort,
        status: 'BEANTWORTET',
        beantwortetAm: new Date(),
      },
    });

    // Optional: Als FAQ hinzufuegen mit Embedding
    let neueFaq = null;
    if (alsFaqHinzufuegen) {
      let embedding: number[] | null = null;
      try {
        embedding = await this.kiService.embeddingGenerieren(tenantId, elternFrage.frage);
      } catch {
        // Embedding-Generierung ist optional
      }

      neueFaq = await this.prisma.fAQ.create({
        data: {
          tenantId,
          teamId: elternFrage.teamId || null,
          question: elternFrage.frage,
          answer: antwort,
          embedding: embedding || undefined,
        },
      });
    }

    return {
      frage: aktualisiert,
      neueFaq,
      nachricht: alsFaqHinzufuegen
        ? 'Frage beantwortet und als FAQ hinzugefuegt.'
        : 'Frage beantwortet.',
    };
  }
}
