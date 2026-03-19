import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TenantService } from './tenant.service';
import { ErstelleTenantDto, AktualisiereTenantDto } from './dto/erstelle-tenant.dto';
import { AktualisiereKiEinstellungenDto } from './dto/ki-einstellungen.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';

const logoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const uniqueName = randomBytes(16).toString('hex') + extname(file.originalname);
    cb(null, uniqueName);
  },
});

const ERLAUBTE_TYPEN = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

@ApiTags('Vereine')
@Controller('vereine')
@UseGuards(JwtAuthGuard, RollenGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Neuen Verein erstellen (nur Superadmin)' })
  async erstellen(@Body() dto: ErstelleTenantDto) {
    return this.tenantService.erstellen(dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Alle Vereine abrufen (nur Superadmin)' })
  async alleAbrufen() {
    return this.tenantService.alleAbrufen();
  }

  // ==================== Vereinsdaten / Rechtliches ====================

  @Get('vereinsdaten')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Vereinsdaten (Impressum, Versicherungen, Finanzen) abrufen' })
  async vereinsdatenAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.tenantService.vereinsdatenAbrufen(tenantId);
  }

  @Put('vereinsdaten')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Vereinsdaten aktualisieren' })
  async vereinsdatenAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() daten: Record<string, unknown>,
  ) {
    return this.tenantService.vereinsdatenAktualisieren(tenantId, daten);
  }

  // ==================== KI-Einstellungen ====================

  @Get('ki-einstellungen')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'KI-Einstellungen des Vereins abrufen (API-Key maskiert)' })
  async kiEinstellungenAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.tenantService.kiEinstellungenAbrufen(tenantId);
  }

  @Put('ki-einstellungen')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'KI-Einstellungen des Vereins aktualisieren' })
  async kiEinstellungenAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: AktualisiereKiEinstellungenDto,
  ) {
    return this.tenantService.kiEinstellungenAktualisieren(tenantId, dto);
  }

  // ==================== SMTP-Einstellungen (Vereins-Mailserver) ====================

  @Get('smtp')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Vereins-SMTP-Einstellungen abrufen' })
  async smtpAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.tenantService.smtpAbrufen(tenantId);
  }

  @Put('smtp')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Vereins-SMTP-Einstellungen speichern' })
  async smtpSpeichern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body()
    daten: {
      smtpHost: string;
      smtpPort?: number;
      smtpUser: string;
      smtpPass?: string;
      smtpAbsenderEmail: string;
      smtpAbsenderName?: string;
    },
  ) {
    return this.tenantService.smtpSpeichern(tenantId, daten);
  }

  // ==================== Datei-Uploads ====================

  @Post('satzung')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(
    FileInterceptor('datei', {
      storage: logoStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Nur PDF-Dateien erlaubt.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Satzung hochladen (PDF, max 10MB)' })
  async satzungHochladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Bitte eine PDF-Datei hochladen.');
    }
    return this.tenantService.vereinsdatenAktualisieren(tenantId, {
      satzungUrl: `/uploads/${file.filename}`,
      satzungDatum: new Date(),
    });
  }

  @Post('gemeinnuetzigkeit')
  @Rollen(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(
    FileInterceptor('datei', {
      storage: logoStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Nur PDF-Dateien erlaubt.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Freistellungsbescheid hochladen (PDF, max 10MB)' })
  async gemeinnuetzigkeitHochladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Bitte eine PDF-Datei hochladen.');
    }
    return this.tenantService.vereinsdatenAktualisieren(tenantId, {
      gemeinnuetzigUrl: `/uploads/${file.filename}`,
    });
  }

  // ==================== Parametrisierte Routen (muessen NACH statischen kommen) ====================

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Verein nach ID abrufen' })
  async nachIdAbrufen(@Param('id') id: string) {
    return this.tenantService.nachIdAbrufen(id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Verein aktualisieren' })
  async aktualisieren(
    @Param('id') id: string,
    @Body() dto: AktualisiereTenantDto,
  ) {
    return this.tenantService.aktualisieren(id, dto);
  }

  @Post(':id/logo')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ERLAUBTE_TYPEN.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Nur PNG, JPG, SVG und WebP erlaubt.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Vereinslogo hochladen (PNG, JPG, SVG, WebP, max 2MB)' })
  async logoHochladen(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Bitte eine Datei hochladen.');
    }
    const logoUrl = `/uploads/${file.filename}`;
    return this.tenantService.logoAktualisieren(id, logoUrl);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Verein loeschen (nur Superadmin)' })
  async loeschen(@Param('id') id: string) {
    return this.tenantService.loeschen(id);
  }

  // ==================== Altersklassen ====================

  @Get('altersklassen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER, Role.PARENT)
  @ApiOperation({ summary: 'Konfigurierte Altersklassen abrufen' })
  async altersklassenAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.tenantService.altersklassenAbrufen(tenantId);
  }

  @Put('altersklassen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Altersklassen konfigurieren' })
  async altersklassenSetzen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() body: { altersklassen: string[] },
  ) {
    return this.tenantService.altersklassenSetzen(tenantId, body.altersklassen);
  }
}
