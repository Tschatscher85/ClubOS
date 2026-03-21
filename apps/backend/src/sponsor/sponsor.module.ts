import { Module } from '@nestjs/common';
import { SponsorService } from './sponsor.service';
import { SponsorController } from './sponsor.controller';
import { SponsorPortalController } from './sponsor-portal.controller';
import { SponsorPortalService } from './sponsor-portal.service';

@Module({
  controllers: [SponsorController, SponsorPortalController],
  providers: [SponsorService, SponsorPortalService],
  exports: [SponsorService, SponsorPortalService],
})
export class SponsorModule {}
