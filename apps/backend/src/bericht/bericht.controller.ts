import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { BerichtService } from './bericht.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Berichte')
@Controller('berichte')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class BerichtController {
  constructor(private berichtService: BerichtService) {}

  @Get('jahresbericht')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Foerdermittel-Jahresbericht als PDF generieren' })
  async jahresbericht(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('jahr') jahrStr: string,
    @Res() res: Response,
  ) {
    const jahr = parseInt(jahrStr, 10) || new Date().getFullYear();
    const pdfBuffer = await this.berichtService.jahresberichtErstellen(
      tenantId,
      jahr,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Jahresbericht_${jahr}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
