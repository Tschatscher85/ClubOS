import { IsString, IsEmail, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO fuer die oeffentliche Einreichung eines Mitgliedsantrags
 * mit Formulardaten und Signatur.
 */
export class OeffentlicheEinreichungDto {
  @ApiProperty({
    example: 'max@example.de',
    description: 'E-Mail des Antragstellers',
  })
  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse.' })
  email!: string;

  @ApiProperty({
    description: 'Formulardaten als JSON-Objekt, gruppiert nach Template-ID',
    example: {
      templateId1: { vorname: 'Max', nachname: 'Mustermann' },
    },
  })
  @IsObject({ message: 'Formulardaten muss ein JSON-Objekt sein.' })
  formulardaten!: Record<string, Record<string, unknown>>;

  @ApiProperty({
    description: 'Unterschriften als JSON-Objekt, gruppiert nach Template-ID (base64 Data-URLs)',
    example: {
      templateId1: 'data:image/png;base64,...',
    },
  })
  @IsObject({ message: 'Unterschriften muss ein JSON-Objekt sein.' })
  unterschriften!: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Sportarten fuer die Anmeldung',
    example: ['FUSSBALL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];
}
