import { IsString, MinLength, IsOptional, IsBoolean, IsEmail, IsNumber, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleSponsorDto {
  @ApiProperty({ example: 'Stadtwerke Uhingen', description: 'Name des Sponsors' })
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'URL des Sponsor-Logos' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://www.stadtwerke-uhingen.de', description: 'Webseite des Sponsors' })
  @IsOptional()
  @IsString()
  webseite?: string;

  @ApiPropertyOptional({ example: 'Hauptsponsor seit 2020', description: 'Beschreibung / Notizen' })
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiPropertyOptional({ example: 'Max Mustermann', description: 'Kontaktperson' })
  @IsOptional()
  @IsString()
  kontaktName?: string;

  @ApiPropertyOptional({ example: 'max@stadtwerke.de', description: 'E-Mail der Kontaktperson' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  kontaktEmail?: string;

  @ApiPropertyOptional({ example: 'sponsor@firma.de', description: 'Login-E-Mail fuer Sponsoren-Portal' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  loginEmail?: string;

  @ApiPropertyOptional({ example: 'Gold-Sponsor', description: 'Name des Sponsoring-Pakets' })
  @IsOptional()
  @IsString()
  paketName?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Sponsoring-Betrag in EUR' })
  @IsOptional()
  @IsNumber({}, { message: 'Betrag muss eine Zahl sein.' })
  betrag?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Vertragsbeginn' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  vertragStart?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Vertragsende' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  vertragEnde?: string;

  @ApiPropertyOptional({ example: ['Homepage', 'Trikots', 'Events'], description: 'Sichtbarkeits-Bereiche' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sichtbarkeit?: string[];
}

export class AktualisiereSponsorDto {
  @ApiPropertyOptional({ example: 'Stadtwerke Uhingen', description: 'Name des Sponsors' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'URL des Sponsor-Logos' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://www.stadtwerke-uhingen.de', description: 'Webseite des Sponsors' })
  @IsOptional()
  @IsString()
  webseite?: string;

  @ApiPropertyOptional({ example: 'Hauptsponsor seit 2020', description: 'Beschreibung / Notizen' })
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiPropertyOptional({ example: 'Max Mustermann', description: 'Kontaktperson' })
  @IsOptional()
  @IsString()
  kontaktName?: string;

  @ApiPropertyOptional({ example: 'max@stadtwerke.de', description: 'E-Mail der Kontaktperson' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  kontaktEmail?: string;

  @ApiPropertyOptional({ example: true, description: 'Ist der Sponsor aktiv?' })
  @IsOptional()
  @IsBoolean({ message: 'istAktiv muss ein Boolean sein.' })
  istAktiv?: boolean;

  @ApiPropertyOptional({ example: 'sponsor@firma.de', description: 'Login-E-Mail fuer Sponsoren-Portal' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  loginEmail?: string;

  @ApiPropertyOptional({ example: 'Gold-Sponsor', description: 'Name des Sponsoring-Pakets' })
  @IsOptional()
  @IsString()
  paketName?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Sponsoring-Betrag in EUR' })
  @IsOptional()
  @IsNumber({}, { message: 'Betrag muss eine Zahl sein.' })
  betrag?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Vertragsbeginn' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  vertragStart?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Vertragsende' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  vertragEnde?: string;

  @ApiPropertyOptional({ example: ['Homepage', 'Trikots', 'Events'], description: 'Sichtbarkeits-Bereiche' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sichtbarkeit?: string[];
}
