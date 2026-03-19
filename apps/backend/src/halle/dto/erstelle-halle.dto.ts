import { IsString, MinLength, IsOptional, IsInt, Min, IsIn, IsNumber } from 'class-validator';
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

  @ApiPropertyOptional({ example: 48.7116, description: 'Breitengrad (Latitude)' })
  @IsOptional()
  @IsNumber({}, { message: 'Breitengrad muss eine Zahl sein.' })
  lat?: number;

  @ApiPropertyOptional({ example: 9.6245, description: 'Laengengrad (Longitude)' })
  @IsOptional()
  @IsNumber({}, { message: 'Laengengrad muss eine Zahl sein.' })
  lng?: number;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=48.7116,9.6245', description: 'Google Maps URL' })
  @IsOptional()
  @IsString()
  mapsUrl?: string;

  @ApiPropertyOptional({ example: 'Parkplaetze hinter der Halle, Einfahrt ueber Schulstrasse', description: 'Parkplatz-Informationen' })
  @IsOptional()
  @IsString()
  parkplatzInfo?: string;

  @ApiPropertyOptional({ example: '4711#', description: 'Zugangscode fuer die Halle' })
  @IsOptional()
  @IsString()
  zugangscode?: string;
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

  @ApiPropertyOptional({ example: 48.7116, description: 'Breitengrad (Latitude)' })
  @IsOptional()
  @IsNumber({}, { message: 'Breitengrad muss eine Zahl sein.' })
  lat?: number;

  @ApiPropertyOptional({ example: 9.6245, description: 'Laengengrad (Longitude)' })
  @IsOptional()
  @IsNumber({}, { message: 'Laengengrad muss eine Zahl sein.' })
  lng?: number;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=48.7116,9.6245', description: 'Google Maps URL' })
  @IsOptional()
  @IsString()
  mapsUrl?: string;

  @ApiPropertyOptional({ example: 'Parkplaetze hinter der Halle, Einfahrt ueber Schulstrasse', description: 'Parkplatz-Informationen' })
  @IsOptional()
  @IsString()
  parkplatzInfo?: string;

  @ApiPropertyOptional({ example: '4711#', description: 'Zugangscode fuer die Halle' })
  @IsOptional()
  @IsString()
  zugangscode?: string;
}

const WOCHENTAGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'] as const;

export class AktualisiereBelegungDto {
  @ApiPropertyOptional({ example: 'team-id-123', description: 'ID der Mannschaft' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ example: 'DI', description: 'Wochentag (MO, DI, MI, DO, FR, SA, SO)' })
  @IsOptional()
  @IsString()
  @IsIn(WOCHENTAGE, { message: 'Wochentag muss MO, DI, MI, DO, FR, SA oder SO sein.' })
  wochentag?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'Startzeit (HH:MM)' })
  @IsOptional()
  @IsString()
  von?: string;

  @ApiPropertyOptional({ example: '20:00', description: 'Endzeit (HH:MM)' })
  @IsOptional()
  @IsString()
  bis?: string;

  @ApiPropertyOptional({ example: 'Nur Halle A', description: 'Optionale Notiz' })
  @IsOptional()
  @IsString()
  notiz?: string;

  @ApiPropertyOptional({ example: 'halle-id-456', description: 'Neue Halle' })
  @IsOptional()
  @IsString()
  halleId?: string;
}

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
