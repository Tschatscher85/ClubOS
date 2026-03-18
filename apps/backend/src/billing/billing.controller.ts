import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Abonnement & Billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RollenGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stripe Checkout-Session erstellen (nur Admin)' })
  async checkout(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: CheckoutDto,
  ) {
    return this.billingService.erstelleCheckoutSession(tenantId, dto.plan);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RollenGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktuellen Billing-Status abrufen (nur Admin)' })
  async status(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.billingService.abrufenStatus(tenantId);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard, RollenGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stripe Customer Portal oeffnen (nur Admin)' })
  async portal(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.billingService.erstellePortalSession(tenantId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe-Webhook (kein Auth, Raw Body erforderlich)' })
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return { fehler: 'Keine Stripe-Signatur vorhanden.' };
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      return { fehler: 'Kein Raw Body vorhanden. rawBody muss aktiviert sein.' };
    }

    return this.billingService.handleWebhook(rawBody, signature);
  }
}
