import {
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType, AttendanceStatus } from '@prisma/client';

export class ErstelleEventDto {
  @ApiProperty({ example: 'Training Dienstag', description: 'Titel' })
  @IsString()
  @MinLength(1, { message: 'Titel darf nicht leer sein.' })
  titel!: string;

  @ApiProperty({ enum: EventType, example: EventType.TRAINING })
  @IsEnum(EventType, { message: 'Ungueltiger Veranstaltungstyp.' })
  typ!: EventType;

  @ApiProperty({ example: '2026-03-20T18:00:00.000Z', description: 'Startdatum/zeit' })
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  datum!: string;

  @ApiPropertyOptional({ example: '2026-03-20T19:30:00.000Z', description: 'Enddatum/zeit' })
  @IsOptional()
  @IsDateString()
  endDatum?: string;

  @ApiProperty({ example: 'Sportplatz am Bach', description: 'Ort' })
  @IsString()
  @MinLength(1, { message: 'Ort darf nicht leer sein.' })
  ort!: string;

  @ApiPropertyOptional({ example: 'Jahnhalle' })
  @IsOptional()
  @IsString()
  hallenName?: string;

  @ApiPropertyOptional({ example: 'Jahnstr. 5, 73037 Goeppingen' })
  @IsOptional()
  @IsString()
  hallenAdresse?: string;

  @ApiProperty({ description: 'Team-ID' })
  @IsString()
  teamId!: string;

  @ApiPropertyOptional({ description: 'Untergrund (Halle, Rasen, Kunstrasen etc.)' })
  @IsOptional()
  @IsString()
  untergrund?: string;

  @ApiPropertyOptional({ description: 'Notizen' })
  @IsOptional()
  @IsString()
  notizen?: string;

  @ApiPropertyOptional({
    description: 'Wiederholungsregel: DAILY, WEEKLY, BIWEEKLY oder MONTHLY',
    example: 'WEEKLY',
  })
  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'], { message: 'Wiederholung muss DAILY, WEEKLY, BIWEEKLY oder MONTHLY sein.' })
  wiederholung?: string;

  @ApiPropertyOptional({
    description: 'Enddatum der Wiederholung (ISO-String)',
    example: '2026-06-30T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Enddatum fuer die Wiederholung angeben.' })
  wiederholungEnde?: string;

  @ApiPropertyOptional({
    description: 'Wochentage fuer Wiederholung',
    example: ['DI', 'DO'],
  })
  @IsOptional()
  @IsArray({ message: 'Wiederholungstage muss ein Array sein.' })
  @IsString({ each: true })
  wiederholungTage?: string[];
}

// ==================== Schnell-Anmeldung DTO ====================

export class SchnellAnmeldungDto {
  @ApiProperty({ description: 'Schnell-Anmeldung Token' })
  @IsString()
  token!: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.YES })
  @IsEnum(AttendanceStatus, { message: 'Ungueltiger Status (YES, NO, MAYBE).' })
  status!: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Grund bei Absage' })
  @IsOptional()
  @IsString()
  grund?: string;
}

export class AktualisiereEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titel?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  typ?: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  datum?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDatum?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hallenName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hallenAdresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notizen?: string;
}
