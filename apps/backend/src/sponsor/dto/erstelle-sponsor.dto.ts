import { IsString, MinLength, IsOptional, IsBoolean, IsEmail, IsUrl } from 'class-validator';
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
}
