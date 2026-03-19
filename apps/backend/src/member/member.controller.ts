import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { MemberService } from './member.service';
import {
  ErstelleMitgliedDto,
  AktualisiereMitgliedDto,
  VerknuepfeMitgliedDto,
  StatusAendernDto,
  BatchFreigebenDto,
  BeitragSetzenDto,
  NachweisStatusAendernDto,
} from './dto/erstelle-mitglied.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Mitglieder')
@Controller('mitglieder')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neues Mitglied anlegen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleMitgliedDto,
  ) {
    return this.memberService.erstellen(tenantId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Mitglieder des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.memberService.alleAbrufen(tenantId);
  }

  @Get('suchen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglieder suchen' })
  @ApiQuery({ name: 'q', required: true, description: 'Suchbegriff (Vor-/Nachname/E-Mail)' })
  @ApiQuery({ name: 'status', required: false, description: 'Mitgliedsstatus filtern' })
  @ApiQuery({ name: 'sportart', required: false, description: 'Sportart filtern' })
  async suchen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('q') suchbegriff: string,
    @Query('status') status?: string,
    @Query('sportart') sportart?: string,
  ) {
    return this.memberService.suchen(tenantId, suchbegriff, status, sportart);
  }

  @Post('batch-freigeben')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mehrere Mitglieder gleichzeitig freigeben (mit Auto-Login)' })
  async batchFreigeben(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: BatchFreigebenDto,
  ) {
    return this.memberService.batchFreigeben(tenantId, dto.ids);
  }

  // ==================== Beitrag & Ermaessigung ====================

  @Get('ermaessigungen-uebersicht')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Uebersicht aller Mitglieder mit aktiver Ermaessigung' })
  async ermaessigungUebersicht(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.memberService.ermaessigungUebersicht(tenantId);
  }

  @Post('nachweis-erinnerungen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Nachweis-Erinnerungen an alle Mitglieder mit ausstehendem Nachweis senden' })
  async nachweisErinnerungenSenden(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.memberService.nachweisErinnerungenSenden(tenantId);
  }

  // ==================== CSV Import/Export ====================

  @Post('importieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglieder aus CSV-Datei importieren' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('datei'))
  async csvImportieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
        ],
        fileIsRequired: true,
      }),
    )
    datei: Express.Multer.File,
  ) {
    if (!datei.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException(
        'Nur CSV-Dateien werden unterstuetzt. Bitte laden Sie eine .csv-Datei hoch.',
      );
    }

    const csvInhalt = datei.buffer.toString('utf-8');

    return this.memberService.csvImportieren(tenantId, csvInhalt);
  }

  @Get('exportieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Alle Mitglieder als CSV exportieren' })
  async csvExportieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const csvInhalt = await this.memberService.csvExportieren(tenantId);

    const dateiname = `mitglieder-export-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dateiname}"`,
    );
    res.send(csvInhalt);
  }

  // ==================== Eltern-Portal ====================

  @Get('meine-kinder')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Eigene Kinder abrufen (Eltern-Portal)' })
  async meineKinder(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.memberService.meineKinder(tenantId, elternEmail);
  }

  @Get('meine-kinder/teams')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Teams der eigenen Kinder abrufen (Eltern-Portal)' })
  async meineKinderTeams(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.memberService.meineKinderTeams(tenantId, elternEmail);
  }

  @Get('meine-kinder/abteilungen')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Abteilungen der eigenen Kinder abrufen (Eltern-Portal)' })
  async meineKinderAbteilungen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.memberService.meineKinderAbteilungen(tenantId, elternEmail);
  }

  @Get('statistik')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglieder-Statistik abrufen' })
  async statistik(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.memberService.statistik(tenantId);
  }

  // ==================== DSGVO-Export (Art. 15 Auskunftsrecht + Art. 20 Datenportabilitaet) ====================

  @Get(':id/dsgvo-export')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER, Role.PARENT)
  @ApiOperation({
    summary: 'DSGVO-Datenexport fuer ein Mitglied (Art. 15 + Art. 20)',
    description:
      'Exportiert alle personenbezogenen Daten eines Mitglieds als JSON. ' +
      'Nur ADMIN/SUPERADMIN oder das Mitglied selbst darf die eigenen Daten exportieren.',
  })
  async dsgvoExport(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') aktuellerUserId: string,
    @AktuellerBenutzer('rolle') rolle: Role,
    @Param('id') mitgliedId: string,
    @Res() res: Response,
  ) {
    // Berechtigungspruefung: ADMIN/SUPERADMIN duerfen alle exportieren,
    // alle anderen nur ihre eigenen Daten
    if (rolle !== Role.SUPERADMIN && rolle !== Role.ADMIN) {
      // Pruefen ob das Mitglied dem aktuellen Benutzer gehoert
      const mitglied = await this.memberService.nachIdAbrufen(tenantId, mitgliedId);
      if (mitglied.userId !== aktuellerUserId) {
        throw new ForbiddenException(
          'Sie duerfen nur Ihre eigenen personenbezogenen Daten exportieren.',
        );
      }
    }

    const daten = await this.memberService.dsgvoExport(tenantId, mitgliedId);

    const dateiname = `dsgvo-export-${daten.stammdaten.vorname}-${daten.stammdaten.nachname}-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dateiname}"`,
    );
    res.send(JSON.stringify(daten, null, 2));
  }

  // ==================== Login-Verwaltung ====================

  @Post(':id/login-erstellen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Login fuer Mitglied erstellen (User-Account anlegen)' })
  async loginErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.loginErstellen(tenantId, id);
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereMitgliedDto,
  ) {
    return this.memberService.aktualisieren(tenantId, id, dto);
  }

  @Put(':id/status')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitgliedsstatus aendern (bei ACTIVE wird Login erstellt)' })
  async statusAendern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: StatusAendernDto,
  ) {
    return this.memberService.statusAendern(tenantId, id, dto.status);
  }

  @Put(':id/verknuepfen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglied mit Benutzer verknuepfen' })
  async mitBenutzerVerknuepfen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: VerknuepfeMitgliedDto,
  ) {
    return this.memberService.mitBenutzerVerknuepfen(tenantId, id, dto.userId);
  }

  // ==================== Nachweis & Beitrag (pro Mitglied) ====================

  @Post(':id/nachweis')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Nachweis-Dokument fuer Ermaessigung hochladen' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('datei', {
      storage: diskStorage({
        destination: './uploads/nachweise',
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async nachweisHochladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    datei: Express.Multer.File,
  ) {
    if (!datei) {
      throw new BadRequestException('Keine Datei hochgeladen.');
    }

    const erlaubteEndungen = ['.pdf', '.jpg', '.jpeg', '.png'];
    const endung = extname(datei.originalname).toLowerCase();
    if (!erlaubteEndungen.includes(endung)) {
      throw new BadRequestException(
        'Nur PDF, JPG und PNG Dateien werden unterstuetzt.',
      );
    }

    const dokUrl = `/uploads/nachweise/${datei.filename}`;
    return this.memberService.nachweisHochladen(tenantId, id, dokUrl);
  }

  @Put(':id/nachweis-status')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Nachweis-Status aendern (genehmigen/ablehnen)' })
  async nachweisStatusAendern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: NachweisStatusAendernDto,
  ) {
    return this.memberService.nachweisStatusAendern(tenantId, id, dto.status);
  }

  @Put(':id/beitrag')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Beitrag und Ermaessigung fuer Mitglied setzen' })
  async beitragSetzen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: BeitragSetzenDto,
  ) {
    return this.memberService.beitragSetzen(tenantId, id, dto);
  }

  // ==================== Team-Zuordnung ====================

  @Get(':id/teams')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Team-Zuordnungen eines Mitglieds abrufen' })
  async teamsAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.teamsAbrufen(tenantId, id);
  }

  @Put(':id/teams')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Team-Zuordnungen eines Mitglieds setzen (sync)' })
  async teamsSetzen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: { teamIds: string[] },
  ) {
    return this.memberService.teamsSetzen(tenantId, id, body.teamIds);
  }

  // ==================== Formular-Einreichungen ====================

  @Get(':id/formulare')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Formular-Einreichungen eines Mitglieds abrufen' })
  async formulareAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.formulareAbrufen(tenantId, id);
  }

  @Delete(':id/verknuepfen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Verknuepfung zwischen Mitglied und Benutzer aufheben' })
  async verknuepfungAufheben(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.verknuepfungAufheben(tenantId, id);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglied loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.memberService.loeschen(tenantId, id);
    return { nachricht: 'Mitglied erfolgreich geloescht.' };
  }
}
