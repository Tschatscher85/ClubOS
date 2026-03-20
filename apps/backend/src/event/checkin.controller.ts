import { Controller, Post, Param, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventService } from './event.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Oeffentlicher Controller fuer QR-Code Check-In.
 * Kein Auth-Guard — Zugriff ueber Check-In Token gesichert.
 * Ermittelt das Mitglied anhand des Bearer-Tokens des eingeloggten Users.
 */
@ApiTags('QR-Code Check-In')
@Controller('veranstaltungen')
export class CheckinController {
  constructor(
    private eventService: EventService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Post('checkin/:token')
  @ApiOperation({
    summary: 'QR-Code Check-In durchfuehren (oeffentlich, Token-basiert)',
  })
  async checkin(
    @Param('token') token: string,
    @Headers('authorization') authHeader?: string,
    @Body() body?: { memberId?: string },
  ) {
    let memberId = body?.memberId;

    // Falls kein memberId im Body: versuche aus dem Bearer-Token zu ermitteln
    if (!memberId && authHeader?.startsWith('Bearer ')) {
      try {
        const userToken = authHeader.slice(7);
        const payload = this.jwtService.verify(userToken, {
          secret: this.configService.get<string>('jwt.secret'),
        });

        if (payload.sub && payload.tenantId) {
          const member = await this.prisma.member.findFirst({
            where: { userId: payload.sub, tenantId: payload.tenantId },
            select: { id: true },
          });
          if (member) {
            memberId = member.id;
          }
        }
      } catch {
        // Ungültiger Auth-Token — ignorieren, memberId bleibt leer
      }
    }

    return this.eventService.checkinVerarbeiten(token, memberId);
  }
}
