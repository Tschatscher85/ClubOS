import { IsString, IsNumber, IsOptional, Min, Max, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleTrainingsplanDto {
  @ApiProperty({ example: 'Passspiel und Pressing', description: 'Schwerpunkt/Thema des Trainingsplans' })
  @IsString({ message: 'Fokus muss ein Text sein.' })
  @MinLength(3, { message: 'Fokus muss mindestens 3 Zeichen lang sein.' })
  fokus!: string;

  @ApiProperty({ example: 4, description: 'Anzahl der Trainingseinheiten (1-12)' })
  @IsNumber({}, { message: 'Anzahl Einheiten muss eine Zahl sein.' })
  @Min(1, { message: 'Mindestens 1 Einheit.' })
  @Max(12, { message: 'Maximal 12 Einheiten.' })
  anzahlEinheiten!: number;

  @ApiProperty({ example: 90, description: 'Dauer pro Einheit in Minuten (60/75/90/120)' })
  @IsNumber({}, { message: 'Dauer muss eine Zahl sein.' })
  @IsIn([60, 75, 90, 120], { message: 'Dauer muss 60, 75, 90 oder 120 Minuten betragen.' })
  dauerMinuten!: number;

  @ApiProperty({ example: 'Mittel', description: 'Leistungsniveau: Anfaenger / Mittel / Fortgeschritten' })
  @IsString({ message: 'Niveau muss ein Text sein.' })
  @IsIn(['Anfaenger', 'Mittel', 'Fortgeschritten'], { message: 'Niveau muss Anfaenger, Mittel oder Fortgeschritten sein.' })
  niveau!: string;

  @ApiPropertyOptional({ example: 'Nur 10 Spieler verfuegbar', description: 'Optionale Besonderheiten' })
  @IsOptional()
  @IsString({ message: 'Besonderheiten muss ein Text sein.' })
  besonderheiten?: string;
}
