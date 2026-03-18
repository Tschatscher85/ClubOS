import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Service-Wrapper für das WebSocket-Gateway.
 * Kann von anderen Services injiziert werden, um Echtzeit-Events auszulösen.
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * Sendet ein Spielstand-/Ergebnis-Update an alle Zuschauer eines Turniers.
   * @param publicUrl - Öffentliche URL des Turniers (Raum-Identifikator)
   * @param daten - Spieldaten (Ergebnis, Status etc.)
   */
  turnierUpdateSenden(publicUrl: string, daten: unknown): void {
    this.gateway.server
      .to(`turnier:${publicUrl}`)
      .emit('turnier:update', daten);
  }

  /**
   * Sendet eine aktualisierte Tabelle an alle Zuschauer eines Turniers.
   * @param publicUrl - Öffentliche URL des Turniers
   * @param tabelle - Aktuelle Tabellendaten
   */
  turnierTabelleSenden(publicUrl: string, tabelle: unknown): void {
    this.gateway.server
      .to(`turnier:${publicUrl}`)
      .emit('turnier:tabelle', tabelle);
  }

  /**
   * Sendet eine neue Nachricht an alle Mitglieder eines Teams.
   * @param teamId - ID des Teams
   * @param nachricht - Nachrichtenobjekt
   */
  nachrichtSenden(teamId: string, nachricht: unknown): void {
    this.gateway.server
      .to(`team:${teamId}`)
      .emit('nachricht:neu', nachricht);
  }

  /**
   * Sendet eine Benachrichtigung (z.B. Erinnerung) an einen bestimmten Benutzer.
   * @param userId - ID des Benutzers
   * @param daten - Benachrichtigungsdaten
   */
  benachrichtigungSenden(userId: string, daten: unknown): void {
    this.gateway.server
      .to(`user:${userId}`)
      .emit('erinnerung:neu', daten);
  }
}
