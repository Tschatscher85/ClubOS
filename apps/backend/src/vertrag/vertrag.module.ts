import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VertragAdminController, VertragPublicController } from './vertrag.controller';
import { VertragService } from './vertrag.service';

@Module({
  imports: [ConfigModule],
  controllers: [VertragAdminController, VertragPublicController],
  providers: [VertragService],
})
export class VertragModule {}
