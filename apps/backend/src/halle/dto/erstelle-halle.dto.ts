import { IsString, MinLength, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleHalleDto {
  @ApiProperty({ example: 'Sporthalle am Stadion', description: 'Name der Halle' })
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiPropertyOptional({ example: 'Hauptstr. 10, 73066 Uhingen', description: 'Adresse der Halle' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: 200, description: 'Kapazitaet (Personen)' })
  @IsOptional()
  @IsInt({ message: 'Kapazitaet muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Kapazitaet muss mindestens 1 sein.' })
  kapazitaet?: number;
}

export class AktualisiereHalleDto {
  @ApiPropertyOptional({ example: 'Sporthalle am Stadion', description: 'Name der Halle' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name?: string;

  @ApiPropertyOptional({ example: 'Hauptstr. 10, 73066 Uhingen', description: 'Adresse der Halle' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: 200, description: 'Kapazitaet (Personen)' })
  @IsOptional()
  @IsInt({ message: 'Kapazitaet muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Kapazitaet muss mindestens 1 sein.' })
  kapazitaet?: number;
}

const WOCHENTAGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'] as const;

export class ErstelleBelegungDto {
  @ApiProperty({ example: 'team-id-123', description: 'ID der Mannschaft' })
  @IsString()
  teamId!: string;

  @ApiProperty({ example: 'DI', description: 'Wochentag (MO, DI, MI, DO, FR, SA, SO)' })
  @IsString()
  @IsIn(WOCHENTAGE, { message: 'Wochentag muss MO, DI, MI, DO, FR, SA oder SO sein.' })
  wochentag!: string;

  @ApiProperty({ example: '18:00', description: 'Startzeit (HH:MM)' })
  @IsString()
  von!: string;

  @ApiProperty({ example: '20:00', description: 'Endzeit (HH:MM)' })
  @IsString()
  bis!: string;

  @ApiPropertyOptional({ example: 'Nur Halle A', description: 'Optionale Notiz' })
  @IsOptional()
  @IsString()
  notiz?: string;
}
