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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosteingangService } from './posteingang.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('E-Mail Posteingang')
@Controller('posteingang')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PosteingangController {
  constructor(private service: PosteingangService) {}

  @Get()
  @ApiOperation({ summary: 'E-Mails im Posteingang abrufen' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Query('ordner') ordner?: string,
    @Query('seite') seite?: string,
  ) {
    return this.service.abrufen(
      tenantId,
      userId,
      ordner || 'POSTEINGANG',
      parseInt(seite || '1', 10),
    );
  }

  @Get('ungelesen')
  @ApiOperation({ summary: 'Anzahl ungelesener E-Mails' })
  async ungelesen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.service.ungeleseneZaehlen(tenantId, userId);
  }

  @Get('entwuerfe')
  @ApiOperation({ summary: 'Entwuerfe abrufen' })
  async entwuerfe(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.service.entwuerfeAbrufen(tenantId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'E-Mail lesen (markiert als gelesen)' })
  async lesen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.lesen(tenantId, id);
  }

  @Post('senden')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'E-Mail senden' })
  async senden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() daten: { an: string[]; betreff: string; inhalt: string },
  ) {
    return this.service.senden(tenantId, userId, daten);
  }

  @Post('entwurf')
  @ApiOperation({ summary: 'Entwurf speichern' })
  async entwurfSpeichern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() daten: { id?: string; an?: string[]; betreff?: string; inhalt?: string },
  ) {
    return this.service.entwurfSpeichern(tenantId, userId, daten);
  }

  @Put(':id/wichtig')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'E-Mail als wichtig markieren/entmarkieren' })
  async wichtig(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.wichtigToggle(tenantId, id);
  }

  @Put(':id/verschieben')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'E-Mail in Ordner verschieben' })
  async verschieben(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() daten: { ordner: string },
  ) {
    return this.service.verschieben(tenantId, id, daten.ordner);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'E-Mail loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.loeschen(tenantId, id);
  }
}
