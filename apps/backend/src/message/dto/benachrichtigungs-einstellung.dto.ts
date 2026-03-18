import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AktualisiereBenachrichtigungsEinstellungDto {
  @ApiPropertyOptional({ example: true, description: 'Push-Benachrichtigungen aktiv' })
  @IsOptional()
  @IsBoolean({ message: 'pushAktiv muss ein Wahrheitswert sein.' })
  pushAktiv?: boolean;

  @ApiPropertyOptional({ example: true, description: 'E-Mail-Benachrichtigungen aktiv' })
  @IsOptional()
  @IsBoolean({ message: 'emailAktiv muss ein Wahrheitswert sein.' })
  emailAktiv?: boolean;

  @ApiPropertyOptional({ example: 22, description: 'Stille Stunden Beginn (0-23 Uhr)' })
  @IsOptional()
  @IsInt({ message: 'stilleStundenVon muss eine ganze Zahl sein.' })
  @Min(0, { message: 'stilleStundenVon muss zwischen 0 und 23 liegen.' })
  @Max(23, { message: 'stilleStundenVon muss zwischen 0 und 23 liegen.' })
  stilleStundenVon?: number;

  @ApiPropertyOptional({ example: 7, description: 'Stille Stunden Ende (0-23 Uhr)' })
  @IsOptional()
  @IsInt({ message: 'stilleStundenBis muss eine ganze Zahl sein.' })
  @Min(0, { message: 'stilleStundenBis muss zwischen 0 und 23 liegen.' })
  @Max(23, { message: 'stilleStundenBis muss zwischen 0 und 23 liegen.' })
  stilleStundenBis?: number;

  @ApiPropertyOptional({ example: true, description: 'Notfall-Broadcasts ueberschreiben Stille Stunden' })
  @IsOptional()
  @IsBoolean({ message: 'notfallUeberschreiben muss ein Wahrheitswert sein.' })
  notfallUeberschreiben?: boolean;
}
