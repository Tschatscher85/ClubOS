import { IsString, IsEmail, IsOptional, IsArray, IsDateString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleEinladungDto {
  @ApiProperty({ example: 'Max', description: 'Vorname des Eingeladenen' })
  @IsString({ message: 'Vorname muss ein Text sein.' })
  @MinLength(1, { message: 'Vorname darf nicht leer sein.' })
  vorname!: string;

  @ApiProperty({ example: 'Mustermann', description: 'Nachname des Eingeladenen' })
  @IsString({ message: 'Nachname muss ein Text sein.' })
  @MinLength(1, { message: 'Nachname darf nicht leer sein.' })
  nachname!: string;

  @ApiProperty({ example: 'max@example.de', description: 'E-Mail-Adresse des Eingeladenen' })
  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse.' })
  email!: string;

  @ApiPropertyOptional({
    example: ['templateId1', 'templateId2'],
    description: 'IDs der Formularvorlagen (Antrag, EWE, Datenschutz)',
  })
  @IsOptional()
  @IsArray({ message: 'templateIds muss ein Array sein.' })
  @IsString({ each: true, message: 'Jede Template-ID muss ein Text sein.' })
  templateIds?: string[];

  @ApiPropertyOptional({
    example: ['FUSSBALL', 'HANDBALL'],
    description: 'Sportarten fuer die Anmeldung',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional({ example: '2015-03-20', description: 'Geburtsdatum' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  geburtsdatum?: string;

  @ApiPropertyOptional({ description: 'Workflow-ID (Paket das verwendet wird)' })
  @IsOptional()
  @IsString()
  workflowId?: string;
}
