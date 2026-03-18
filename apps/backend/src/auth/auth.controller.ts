import {
  Controller,
  Post,
  Put,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistrierenDto } from './dto/registrieren.dto';
import { AnmeldenDto } from './dto/anmelden.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PasswortAendernDto } from './dto/passwort-aendern.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Authentifizierung')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registrieren')
  @ApiOperation({ summary: 'Neuen Verein und Admin-Benutzer registrieren' })
  @ApiResponse({ status: 201, description: 'Verein erfolgreich registriert' })
  @ApiResponse({ status: 409, description: 'E-Mail oder Slug bereits vergeben' })
  async registrieren(@Body() dto: RegistrierenDto) {
    return this.authService.registrieren(dto);
  }

  @Post('anmelden')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Benutzer anmelden' })
  @ApiResponse({ status: 200, description: 'Erfolgreich angemeldet' })
  @ApiResponse({ status: 401, description: 'Falsche Anmeldedaten' })
  async anmelden(@Body() dto: AnmeldenDto) {
    return this.authService.anmelden(dto);
  }

  @Post('token-aktualisieren')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access-Token mit Refresh-Token erneuern' })
  @ApiResponse({ status: 200, description: 'Token erfolgreich aktualisiert' })
  @ApiResponse({ status: 401, description: 'Ungueltiger Refresh-Token' })
  async tokenAktualisieren(
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.tokenAktualisieren(userId, dto.refreshToken);
  }

  @Post('abmelden')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Benutzer abmelden (Token invalidieren)' })
  @ApiResponse({ status: 200, description: 'Erfolgreich abgemeldet' })
  async abmelden(@AktuellerBenutzer('id') userId: string) {
    await this.authService.abmelden(userId);
    return { nachricht: 'Erfolgreich abgemeldet.' };
  }

  @Get('profil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil des angemeldeten Benutzers abrufen' })
  @ApiResponse({ status: 200, description: 'Benutzerprofil' })
  async profil(@AktuellerBenutzer('id') userId: string) {
    return this.authService.profil(userId);
  }

  @Put('passwort')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Passwort aendern' })
  @ApiResponse({ status: 200, description: 'Passwort erfolgreich geaendert' })
  @ApiResponse({ status: 401, description: 'Aktuelles Passwort ist falsch' })
  async passwortAendern(
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: PasswortAendernDto,
  ) {
    return this.authService.passwortAendern(
      userId,
      dto.altesPasswort,
      dto.neuesPasswort,
    );
  }
}
