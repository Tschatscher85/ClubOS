import {
  Controller,
  Post,
  Delete,
  Body,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { DevChatService, BildInfo } from './dev-chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { Role } from '@prisma/client';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Bild-DTO */
class BildDto {
  @IsString()
  typ!: string;

  @IsString()
  daten!: string;
}

/** Nachricht-DTO */
class DevChatNachrichtDto {
  @IsString()
  nachricht!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BildDto)
  bilder?: BildDto[];
}

@SkipThrottle()
@Controller('dev-chat')
@UseGuards(JwtAuthGuard, RollenGuard)
@Rollen(Role.SUPERADMIN)
export class DevChatController {
  private readonly logger = new Logger(DevChatController.name);

  constructor(private readonly devChatService: DevChatService) {}

  /**
   * Nachricht senden und SSE-Stream zurueckbekommen.
   * Events: text, werkzeug_start, werkzeug_ergebnis, fertig, fehler
   */
  @Post('nachricht')
  async nachricht(
    @Body() dto: DevChatNachrichtDto,
    @AktuellerBenutzer('id') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    // SSE-Headers setzen
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Fuer nginx
    res.flushHeaders();

    // AbortController fuer Client-Disconnect
    const abortController = new AbortController();
    res.on('close', () => abortController.abort());

    try {
      const bilder: BildInfo[] | undefined = dto.bilder?.map((b) => ({
        typ: b.typ,
        daten: b.daten,
      }));

      for await (const event of this.devChatService.verarbeiteNachricht(
        userId,
        dto.nachricht,
        bilder,
        abortController.signal,
      )) {
        if (abortController.signal.aborted) break;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err: unknown) {
      const fehlerText =
        err instanceof Error ? err.message : 'Unbekannter Fehler';
      this.logger.error(`Dev-Chat Controller Fehler: ${fehlerText}`);
      res.write(
        `data: ${JSON.stringify({ typ: 'fehler', daten: fehlerText })}\n\n`,
      );
    }

    res.end();
  }

  /** Chat-Verlauf loeschen */
  @Delete('verlauf')
  verlaufLoeschen(
    @AktuellerBenutzer('id') userId: string,
  ): { erfolg: boolean } {
    this.devChatService.verlaufLoeschen(userId);
    return { erfolg: true };
  }
}
