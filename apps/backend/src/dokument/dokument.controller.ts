import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { Role, DokumentKategorie } from '@prisma/client';
import { DokumentService } from './dokument.service';
import { ErstelleDokumentDto } from './dto/erstelle-dokument.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { BerechtigungenGuard } from '../common/guards/berechtigungen.guard';
import { Berechtigungen } from '../common/decorators/berechtigungen.decorator';

@ApiTags('Dokumente')
@Controller('dokumente')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard, BerechtigungenGuard)
@Berechtigungen('DOKUMENTE')
@ApiBearerAuth()
export class DokumentController {
  constructor(private dokumentService: DokumentService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Dokument hochladen' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('datei', {
      storage: diskStorage({
        destination: './uploads/dokumente',
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  async hochladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    datei: Express.Multer.File,
    @Body() dto: ErstelleDokumentDto,
  ) {
    if (!datei) {
      throw new BadRequestException('Keine Datei hochgeladen.');
    }
    return this.dokumentService.hochladen(tenantId, userId, datei, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Dokumente abrufen' })
  @ApiQuery({ name: 'kategorie', required: false, enum: DokumentKategorie })
  @ApiQuery({ name: 'ordner', required: false, description: 'Nach Ordner filtern' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('kategorie') kategorie?: DokumentKategorie,
    @Query('ordner') ordner?: string,
  ) {
    return this.dokumentService.alleAbrufen(tenantId, kategorie, ordner);
  }

  @Get('ordner')
  @ApiOperation({ summary: 'Alle Ordner abrufen' })
  async ordnerAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.dokumentService.ordnerAbrufen(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dokument nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.dokumentService.nachIdAbrufen(tenantId, id);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Dokument loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.dokumentService.loeschen(tenantId, id);
    return { nachricht: 'Dokument erfolgreich geloescht.' };
  }
}
