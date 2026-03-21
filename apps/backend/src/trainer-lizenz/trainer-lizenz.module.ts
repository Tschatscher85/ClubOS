import { Module } from '@nestjs/common';
import { TrainerLizenzService } from './trainer-lizenz.service';
import { TrainerLizenzController } from './trainer-lizenz.controller';

@Module({
  controllers: [TrainerLizenzController],
  providers: [TrainerLizenzService],
  exports: [TrainerLizenzService],
})
export class TrainerLizenzModule {}
