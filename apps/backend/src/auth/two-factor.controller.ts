import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TwoFactorService } from './two-factor.service';
import { AuthService } from './auth.service';
import { TwoFactorBestaetigenDto } from './dto/two-factor-bestaetigen.dto';
import { TwoFactorVerifizierenDto } from './dto/two-factor-verifizieren.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('2-Faktor-Authentifizierung')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(
    private twoFactorService: TwoFactorService,
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Post('einrichten')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '2FA-Einrichtung starten (QR-Code + Backup-Codes erhalten)' })
  @ApiResponse({ status: 201, description: 'QR-Code und Backup-Codes generiert' })
  async einrichten(@AktuellerBenutzer('id') userId: string) {
    return this.twoFactorService.einrichten(userId);
  }

  @Post('bestaetigen')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ short: { ttl: 10000, limit: 5 } })
  @ApiOperation({ summary: '2FA-Einrichtung mit erstem TOTP-Code bestaetigen' })
  @ApiResponse({ status: 200, description: '2FA erfolgreich aktiviert' })
  @ApiResponse({ status: 400, description: 'Ungueltiger Code' })
  async bestaetigen(
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: TwoFactorBestaetigenDto,
  ) {
    return this.twoFactorService.bestaetigen(userId, dto.token);
  }

  @Post('verifizieren')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 10000, limit: 5 } })
  @ApiOperation({ summary: '2FA-Code waehrend des Logins verifizieren' })
  @ApiResponse({ status: 200, description: '2FA-Verifizierung erfolgreich, Tokens erhalten' })
  @ApiResponse({ status: 401, description: 'Ungueltiger Code oder tempToken' })
  async verifizieren(@Body() dto: TwoFactorVerifizierenDto) {
    // tempToken verifizieren
    let payload: { sub: string; step: string };
    try {
      payload = this.jwtService.verify(dto.tempToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException(
        'Temporaeres Token ist ungueltig oder abgelaufen. Bitte melden Sie sich erneut an.',
      );
    }

    if (payload.step !== '2fa') {
      throw new UnauthorizedException('Ungueltiges Token fuer 2FA-Verifizierung.');
    }

    const userId = payload.sub;

    // 2FA-Code verifizieren
    const istGueltig = await this.twoFactorService.verifizieren(userId, dto.code);
    if (!istGueltig) {
      throw new UnauthorizedException(
        'Ungueltiger 2FA-Code. Bitte versuchen Sie es erneut.',
      );
    }

    // Benutzer laden und echte Tokens generieren
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!benutzer) {
      throw new UnauthorizedException('Benutzer nicht gefunden.');
    }

    // Echte Tokens ueber AuthService generieren
    const tokens = await this.authService.generiereTokensFuerBenutzer(benutzer);

    return tokens;
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '2FA deaktivieren' })
  @ApiResponse({ status: 200, description: '2FA wurde deaktiviert' })
  async deaktivieren(@AktuellerBenutzer('id') userId: string) {
    return this.twoFactorService.deaktivieren(userId);
  }
}
