import { IsString, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleFahrgemeinschaftDto {
  @ApiPropertyOptional({ description: 'Optionale Verknuepfung mit einer Veranstaltung' })
  @IsOptional()
  @IsString({ message: 'Event-ID muss ein Text sein.' })
  eventId?: string;

  @ApiProperty({ example: 'Hauptbahnhof Stuttgart', description: 'Abfahrtsort' })
  @IsString({ message: 'Startort muss ein Text sein.' })
  startort!: string;

  @ApiProperty({ example: 'Sporthalle Goeppingen', description: 'Zielort' })
  @IsString({ message: 'Zielort muss ein Text sein.' })
  zielort!: string;

  @ApiProperty({ example: '2026-04-01T09:00:00.000Z', description: 'Abfahrtszeit (ISO Datetime)' })
  @IsDateString({}, { message: 'Abfahrt muss ein gueltiges Datum sein.' })
  abfahrt!: string;

  @ApiProperty({ example: 3, description: 'Verfuegbare Plaetze (1-9)' })
  @IsInt({ message: 'Plaetze muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Mindestens 1 Platz erforderlich.' })
  @Max(9, { message: 'Maximal 9 Plaetze moeglich.' })
  plaetze!: number;

  @ApiPropertyOptional({ example: 'Treffpunkt am Parkplatz P2', description: 'Optionaler Kommentar' })
  @IsOptional()
  @IsString({ message: 'Kommentar muss ein Text sein.' })
  kommentar?: string;
}
