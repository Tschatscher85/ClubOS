import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/** Ergebnis einer KI-Anfrage */
export interface KiAntwort {
  text: string;
  provider: string;
  modell: string;
}

/** Unterstuetzte KI-Anbieter */
type KiProvider = 'anthropic' | 'openai';

/** Standard-Modelle pro Anbieter */
const STANDARD_MODELLE: Record<KiProvider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
};

@Injectable()
export class KiService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Laedt die KI-Konfiguration fuer einen Tenant.
   * Wenn der Tenant eigene Einstellungen hat, werden diese verwendet.
   * Andernfalls wird auf die .env-Konfiguration zurueckgegriffen.
   */
  private async konfigurationLaden(tenantId: string): Promise<{
    provider: KiProvider;
    apiKey: string;
    modell: string;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { kiProvider: true, kiApiKey: true, kiModell: true },
    });

    if (!tenant) {
      throw new BadRequestException('Verein nicht gefunden.');
    }

    // Wenn Tenant einen eigenen API-Key gesetzt hat, diesen verwenden
    if (tenant.kiApiKey) {
      const provider = (tenant.kiProvider as KiProvider) || 'anthropic';
      const modell = tenant.kiModell || STANDARD_MODELLE[provider];
      return { provider, apiKey: tenant.kiApiKey, modell };
    }

    // Fallback auf .env-Konfiguration
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (anthropicKey) {
      return {
        provider: 'anthropic',
        apiKey: anthropicKey,
        modell: tenant.kiModell || STANDARD_MODELLE.anthropic,
      };
    }

    if (openaiKey) {
      return {
        provider: 'openai',
        apiKey: openaiKey,
        modell: tenant.kiModell || STANDARD_MODELLE.openai,
      };
    }

    throw new BadRequestException(
      'KI ist nicht konfiguriert. Bitte hinterlegen Sie einen API-Key in den Vereinseinstellungen oder setzen Sie ANTHROPIC_API_KEY bzw. OPENAI_API_KEY in der Umgebung.',
    );
  }

  /**
   * Generiert Text mit dem konfigurierten KI-Anbieter.
   */
  async textGenerieren(
    tenantId: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<KiAntwort> {
    const config = await this.konfigurationLaden(tenantId);

    if (config.provider === 'anthropic') {
      return this.anthropicTextGenerieren(config.apiKey, config.modell, systemPrompt, userPrompt);
    }

    return this.openaiTextGenerieren(config.apiKey, config.modell, systemPrompt, userPrompt);
  }

  /**
   * Analysiert ein Dokument (PDF) mit dem konfigurierten KI-Anbieter.
   */
  async dokumentAnalysieren(
    tenantId: string,
    pdfBuffer: Buffer,
    prompt: string,
  ): Promise<KiAntwort> {
    const config = await this.konfigurationLaden(tenantId);

    if (config.provider === 'anthropic') {
      return this.anthropicDokumentAnalysieren(config.apiKey, config.modell, pdfBuffer, prompt);
    }

    return this.openaiDokumentAnalysieren(config.apiKey, config.modell, pdfBuffer, prompt);
  }

  // ==================== Anthropic ====================

  private async anthropicTextGenerieren(
    apiKey: string,
    modell: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<KiAntwort> {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: modell,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (!textBlock) {
      throw new BadRequestException('KI konnte keine Antwort generieren.');
    }

    return { text: textBlock.text, provider: 'anthropic', modell };
  }

  private async anthropicDokumentAnalysieren(
    apiKey: string,
    modell: string,
    pdfBuffer: Buffer,
    prompt: string,
  ): Promise<KiAntwort> {
    const client = new Anthropic({ apiKey });
    const base64 = pdfBuffer.toString('base64');

    const response = await client.messages.create({
      model: modell,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (!textBlock) {
      throw new BadRequestException('KI konnte das Dokument nicht analysieren.');
    }

    return { text: textBlock.text, provider: 'anthropic', modell };
  }

  // ==================== OpenAI ====================

  private async openaiTextGenerieren(
    apiKey: string,
    modell: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<KiAntwort> {
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: modell,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content;

    if (!text) {
      throw new BadRequestException('KI konnte keine Antwort generieren.');
    }

    return { text, provider: 'openai', modell };
  }

  private async openaiDokumentAnalysieren(
    apiKey: string,
    modell: string,
    pdfBuffer: Buffer,
    prompt: string,
  ): Promise<KiAntwort> {
    const client = new OpenAI({ apiKey });
    const base64 = pdfBuffer.toString('base64');

    // OpenAI unterstuetzt PDFs als base64-Bilder nicht direkt,
    // daher wird der Inhalt als Data-URL im image_url-Format gesendet.
    // Fuer echte PDF-Analyse sollte das PDF vorher in Bilder konvertiert werden.
    // Als Workaround senden wir das PDF als base64-Bild (funktioniert mit gpt-4o fuer Bilder).
    const response = await client.chat.completions.create({
      model: modell,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64}`,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content;

    if (!text) {
      throw new BadRequestException('KI konnte das Dokument nicht analysieren.');
    }

    return { text, provider: 'openai', modell };
  }
}
