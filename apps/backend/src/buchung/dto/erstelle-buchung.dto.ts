import { IsString, MinLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleBuchungDto {
  @ApiProperty({ example: 'ressource-id-123', description: 'ID der Ressource' })
  @IsString()
  ressourceId!: string;

  @ApiProperty({ example: 'Training U15', description: 'Titel der Buchung' })
  @IsString()
  @MinLength(2, { message: 'Titel muss mindestens 2 Zeichen lang sein.' })
  titel!: string;

  @ApiProperty({ example: '2026-03-20T14:00:00.000Z', description: 'Startzeit (ISO 8601)' })
  @IsDateString({}, { message: 'Start muss ein gueltiges Datum sein.' })
  start!: string;

  @ApiProperty({ example: '2026-03-20T16:00:00.000Z', description: 'Endzeit (ISO 8601)' })
  @IsDateString({}, { message: 'Ende muss ein gueltiges Datum sein.' })
  ende!: string;

  @ApiPropertyOptional({ example: 'Bitte Netz aufbauen', description: 'Optionale Notiz' })
  @IsOptional()
  @IsString()
  notiz?: string;
}
