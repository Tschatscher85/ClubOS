import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket-Gateway für Echtzeit-Kommunikation.
 * Namespace: /live
 *
 * Räume:
 *  - turnier:<publicUrl>  → Turnier-Live-Updates
 *  - team:<teamId>        → Team-Nachrichten
 *  - user:<userId>        → Persönliche Benachrichtigungen
 */
@WebSocketGateway({
  namespace: '/live',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  /** Wird bei jeder neuen Verbindung aufgerufen */
  handleConnection(client: Socket): void {
    this.logger.log(`Client verbunden: ${client.id}`);
  }

  /** Wird beim Trennen einer Verbindung aufgerufen */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client getrennt: ${client.id}`);
  }

  // ─── Turnier-Events ───────────────────────────────────────────────

  /** Client tritt einem Turnier-Raum bei (über publicUrl) */
  @SubscribeMessage('turnier:join')
  handleTurnierJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() publicUrl: string,
  ): void {
    const raum = `turnier:${publicUrl}`;
    client.join(raum);
    this.logger.log(`Client ${client.id} → Raum ${raum} beigetreten`);
  }

  /** Client verlässt einen Turnier-Raum */
  @SubscribeMessage('turnier:leave')
  handleTurnierLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() publicUrl: string,
  ): void {
    const raum = `turnier:${publicUrl}`;
    client.leave(raum);
    this.logger.log(`Client ${client.id} → Raum ${raum} verlassen`);
  }

  // ─── Nachrichten-Events ───────────────────────────────────────────

  /** Client tritt einem Team-Nachrichten-Raum bei */
  @SubscribeMessage('nachricht:team')
  handleNachrichtTeam(
    @ConnectedSocket() client: Socket,
    @MessageBody() teamId: string,
  ): void {
    const raum = `team:${teamId}`;
    client.join(raum);
    this.logger.log(`Client ${client.id} → Team-Raum ${raum} beigetreten`);
  }

  /** Client verlässt einen Team-Nachrichten-Raum */
  @SubscribeMessage('nachricht:leave')
  handleNachrichtLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() teamId: string,
  ): void {
    const raum = `team:${teamId}`;
    client.leave(raum);
    this.logger.log(`Client ${client.id} → Team-Raum ${raum} verlassen`);
  }
}
