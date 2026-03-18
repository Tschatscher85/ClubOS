import { Module } from '@nestjs/common';
import { RollenVorlageService } from './rollen-vorlage.service';
import { RollenVorlageController } from './rollen-vorlage.controller';

@Module({
  controllers: [RollenVorlageController],
  providers: [RollenVorlageService],
  exports: [RollenVorlageService],
})
export class RollenVorlageModule {}
