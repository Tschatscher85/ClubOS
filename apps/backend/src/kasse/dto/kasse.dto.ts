import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StrafeErstellenDto {
  @ApiProperty({ example: 'clxyz123', description: 'Mitglied-ID' })
  @IsString()
  memberId!: string;

  @ApiProperty({ example: 5.0, description: 'Betrag der Strafe in Euro' })
  @IsNumber({}, { message: 'Betrag muss eine Zahl sein.' })
  @Min(0.01, { message: 'Betrag muss mindestens 0,01 Euro sein.' })
  betrag!: number;

  @ApiProperty({ example: 'Zu spaet zum Training', description: 'Grund der Strafe' })
  @IsString()
  @MinLength(2, { message: 'Grund muss mindestens 2 Zeichen lang sein.' })
  grund!: string;

  @ApiPropertyOptional({ example: 'clxyz456', description: 'Strafkatalog-Eintrag-ID' })
  @IsOptional()
  @IsString()
  katalogId?: string;
}

export class EinzahlungErstellenDto {
  @ApiProperty({ example: 'clxyz123', description: 'Mitglied-ID' })
  @IsString()
  memberId!: string;

  @ApiProperty({ example: 10.0, description: 'Betrag der Einzahlung in Euro' })
  @IsNumber({}, { message: 'Betrag muss eine Zahl sein.' })
  @Min(0.01, { message: 'Betrag muss mindestens 0,01 Euro sein.' })
  betrag!: number;

  @ApiProperty({ example: 'Strafenzahlung Mai', description: 'Grund der Einzahlung' })
  @IsString()
  @MinLength(2, { message: 'Grund muss mindestens 2 Zeichen lang sein.' })
  grund!: string;
}

export class AusgabeErstellenDto {
  @ApiProperty({ example: 'clxyz123', description: 'Mitglied-ID (wer hat bezahlt)' })
  @IsString()
  memberId!: string;

  @ApiProperty({ example: 25.0, description: 'Betrag der Ausgabe in Euro' })
  @IsNumber({}, { message: 'Betrag muss eine Zahl sein.' })
  @Min(0.01, { message: 'Betrag muss mindestens 0,01 Euro sein.' })
  betrag!: number;

  @ApiProperty({ example: 'Getraenke fuer Mannschaftsabend', description: 'Grund der Ausgabe' })
  @IsString()
  @MinLength(2, { message: 'Grund muss mindestens 2 Zeichen lang sein.' })
  grund!: string;
}

export class StrafkatalogErstellenDto {
  @ApiProperty({ example: 'Zu spaet zum Training', description: 'Name des Strafkatalog-Eintrags' })
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiProperty({ example: 5.0, description: 'Betrag in Euro' })
  @IsNumber({}, { message: 'Betrag muss eine Zahl sein.' })
  @Min(0.01, { message: 'Betrag muss mindestens 0,01 Euro sein.' })
  betrag!: number;
}
