import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FormType, SubmissionStatus } from '@prisma/client';

// ==================== Template DTOs ====================

export class FormularFeldDto {
  @ApiProperty({ example: 'vorname', description: 'Technischer Feldname' })
  @IsString({ message: 'Feldname muss ein Text sein.' })
  @MinLength(1, { message: 'Feldname darf nicht leer sein.' })
  name!: string;

  @ApiProperty({ example: 'Vorname', description: 'Anzeige-Label' })
  @IsString({ message: 'Label muss ein Text sein.' })
  @MinLength(1, { message: 'Label darf nicht leer sein.' })
  label!: string;

  @ApiProperty({
    example: 'text',
    enum: ['text', 'email', 'date', 'select', 'checkbox', 'radio', 'signature'],
    description: 'Feldtyp',
  })
  @IsString({ message: 'Typ muss ein Text sein.' })
  typ!: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'radio' | 'signature';

  @ApiProperty({ example: true, description: 'Pflichtfeld?' })
  @IsBoolean({ message: 'Pflicht muss ein Boolean sein.' })
  pflicht!: boolean;

  @ApiPropertyOptional({
    example: ['maennlich', 'weiblich', 'divers'],
    description: 'Optionen fuer Select-/Radio-Felder',
  })
  @IsOptional()
  @IsArray({ message: 'Optionen muss ein Array sein.' })
  @IsString({ each: true, message: 'Jede Option muss ein Text sein.' })
  optionen?: string[];

  @ApiPropertyOptional({
    example: 'Vorname',
    description: 'Exakter Name des eingebetteten PDF-Formularfelds (fuer Overlay)',
  })
  @IsOptional()
  @IsString({ message: 'pdfFeldName muss ein Text sein.' })
  pdfFeldName?: string;
}

export class ErstelleTemplateDto {
  @ApiProperty({ example: 'Mitgliedsantrag 2026', description: 'Template-Name' })
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(1, { message: 'Name darf nicht leer sein.' })
  name!: string;

  @ApiProperty({ enum: FormType, example: FormType.MITGLIEDSANTRAG })
  @IsEnum(FormType, { message: 'Ungueltiger Formulartyp.' })
  typ!: FormType;

  @ApiProperty({
    type: [FormularFeldDto],
    description: 'Formularfelder als Array',
  })
  @IsArray({ message: 'Felder muss ein Array sein.' })
  @ValidateNested({ each: true })
  @Type(() => FormularFeldDto)
  felder!: FormularFeldDto[];
}

// ==================== Submission DTOs ====================

export class ErstelleSubmissionDto {
  @ApiProperty({ example: 'max@example.de', description: 'E-Mail des Antragstellers' })
  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse.' })
  email!: string;

  @ApiProperty({
    example: { vorname: 'Max', nachname: 'Mustermann' },
    description: 'Ausgefuellte Felder als JSON',
  })
  @IsObject({ message: 'Daten muss ein JSON-Objekt sein.' })
  daten!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Digitale Unterschrift als Data-URL' })
  @IsOptional()
  @IsString({ message: 'Signatur muss ein Text sein.' })
  signatureUrl?: string;

  @ApiPropertyOptional({ description: 'User-ID, falls angemeldet' })
  @IsOptional()
  @IsString({ message: 'EingereichtVon muss ein Text sein.' })
  eingereichtVon?: string;
}

// ==================== Status-Aenderung ====================

export class StatusAendernDto {
  @ApiProperty({ enum: SubmissionStatus, description: 'Neuer Status' })
  @IsEnum(SubmissionStatus, { message: 'Ungueltiger Status.' })
  status!: SubmissionStatus;

  @ApiPropertyOptional({ description: 'Interner Kommentar' })
  @IsOptional()
  @IsString({ message: 'Kommentar muss ein Text sein.' })
  kommentar?: string;
}
