import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';

/**
 * Oeffentlicher Controller fuer Vereins-Branding — kein Auth-Guard.
 * Wird vom Frontend genutzt, um Logo, Farbe und Name vor dem Login zu laden.
 */
@ApiTags('Vereine (Oeffentlich)')
@Controller('vereine')
export class TenantBrandingController {
  constructor(private tenantService: TenantService) {}

  @Get('branding/:slug')
  @ApiOperation({
    summary: 'Oeffentliches Branding eines Vereins abrufen (kein Auth noetig)',
  })
  async brandingAbrufen(@Param('slug') slug: string) {
    return this.tenantService.brandingAbrufen(slug);
  }
}
