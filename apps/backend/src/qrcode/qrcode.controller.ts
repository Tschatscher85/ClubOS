import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { QrcodeService } from './qrcode.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('QR-Codes')
@Controller('qrcode')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class QrcodeController {
  constructor(
    private readonly qrcodeService: QrcodeService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('mitglied/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'QR-Code fuer Mitgliedsausweis generieren' })
  async mitgliedQrCode(
    @Param('id') mitgliedId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: mitgliedId, tenantId },
      include: { tenant: true },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    const qrCode = await this.qrcodeService.mitgliedsausweisGenerieren(
      mitglied.id,
      mitglied.memberNumber,
      mitglied.tenant.name,
    );

    // QR-Code im Mitglied-Datensatz speichern
    await this.prisma.member.update({
      where: { id: mitglied.id },
      data: { qrCode },
    });

    return { qrCode };
  }

  @Get('turnier/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'QR-Code fuer Turnier-URL generieren' })
  async turnierQrCode(
    @Param('id') turnierId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    const turnier = await this.prisma.tournament.findFirst({
      where: { id: turnierId, tenantId },
    });

    if (!turnier) {
      throw new NotFoundException('Turnier nicht gefunden.');
    }

    const qrCode = await this.qrcodeService.turnierQrGenerieren(
      turnier.publicUrl,
    );

    // QR-Code im Turnier-Datensatz speichern
    await this.prisma.tournament.update({
      where: { id: turnier.id },
      data: { qrCode },
    });

    return { qrCode };
  }
}
