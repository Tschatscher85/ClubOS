import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PushService } from './push.service';
import { WebPushAbonnierenDto } from './dto/web-push-abonnieren.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Push-Benachrichtigungen')
@Controller('push')
export class PushController {
  constructor(private pushService: PushService) {}

  @Post('web/abonnieren')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Web-Push-Subscription registrieren' })
  async webAbonnieren(
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: WebPushAbonnierenDto,
  ) {
    await this.pushService.abonnieren(
      userId,
      dto.endpoint,
      dto.keys.p256dh,
      dto.keys.auth,
    );
    return { nachricht: 'Web-Push-Benachrichtigungen aktiviert.' };
  }

  @Delete('web/abmelden')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Web-Push-Subscription entfernen' })
  async webAbmelden(
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: { endpoint: string },
  ) {
    const ergebnis = await this.pushService.abmelden(userId, dto.endpoint);
    return {
      nachricht: 'Web-Push-Benachrichtigungen deaktiviert.',
      geloescht: ergebnis.geloescht,
    };
  }
}
