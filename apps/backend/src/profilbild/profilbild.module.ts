import { Module } from '@nestjs/common';
import { ProfilbildController } from './profilbild.controller';

@Module({
  controllers: [ProfilbildController],
})
export class ProfilbildModule {}
