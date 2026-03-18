import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleWorkflowDto {
  @ApiProperty({ example: 'Neues Mitglied Fussball', description: 'Name des Workflows' })
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(1, { message: 'Name darf nicht leer sein.' })
  name!: string;

  @ApiPropertyOptional({ example: 'Alle Unterlagen fuer neue Fussball-Mitglieder' })
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiProperty({
    example: ['templateId1', 'templateId2'],
    description: 'IDs der Formularvorlagen die gesendet werden',
  })
  @IsArray({ message: 'templateIds muss ein Array sein.' })
  @ArrayMinSize(1, { message: 'Mindestens eine Formularvorlage erforderlich.' })
  @IsString({ each: true })
  templateIds!: string[];

  @ApiPropertyOptional({
    example: ['FUSSBALL'],
    description: 'Vorbelegte Sportarten',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional({ example: 'Willkommen beim FC Musterstadt!' })
  @IsOptional()
  @IsString()
  emailBetreff?: string;

  @ApiPropertyOptional({ example: 'Bitte fuellen Sie die folgenden Unterlagen aus...' })
  @IsOptional()
  @IsString()
  emailText?: string;
}

export class AktualisiereWorkflowDto {
  @ApiPropertyOptional({ example: 'Neues Mitglied Fussball' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiPropertyOptional({ example: ['templateId1', 'templateId2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateIds?: string[];

  @ApiPropertyOptional({ example: ['FUSSBALL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailBetreff?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailText?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  istAktiv?: boolean;
}
