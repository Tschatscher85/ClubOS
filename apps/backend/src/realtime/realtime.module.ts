import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

/**
 * Modul für Echtzeit-Kommunikation via Socket.io.
 * Exportiert RealtimeService, damit andere Module Events auslösen können.
 */
@Module({
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
