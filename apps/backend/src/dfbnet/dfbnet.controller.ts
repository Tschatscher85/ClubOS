import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { DfbnetService } from './dfbnet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('DFBnet')
@Controller('dfbnet')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class DfbnetController {
  constructor(private dfbnetService: DfbnetService) {}

  @Post('importieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'DFBnet CSV-Datei importieren' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('datei'))
  async importieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
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

    // CSV-Inhalt als UTF-8 lesen
    const csvInhalt = datei.buffer.toString('utf-8');

    return this.dfbnetService.csvImportieren(tenantId, csvInhalt);
  }

  @Get('exportieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglieder als DFBnet CSV exportieren' })
  async exportieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const csvInhalt = await this.dfbnetService.csvExportieren(tenantId);

    const dateiname = `dfbnet-export-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dateiname}"`,
    );
    res.send(csvInhalt);
  }
}
