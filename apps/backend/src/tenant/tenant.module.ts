import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantBrandingController } from './tenant-branding.controller';

@Module({
  controllers: [TenantController, TenantBrandingController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
