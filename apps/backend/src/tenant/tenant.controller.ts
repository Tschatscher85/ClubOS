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
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
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

  @Delete(':id')
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Verein loeschen (nur Superadmin)' })
  async loeschen(@Param('id') id: string) {
    return this.tenantService.loeschen(id);
  }
}
