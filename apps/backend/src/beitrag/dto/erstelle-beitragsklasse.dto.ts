import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';

export class ErstelleBeitragsklasseDto {
  @ApiProperty({ description: 'Name der Beitragsklasse, z.B. "Jugend Fussball"' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Beschreibung der Beitragsklasse' })
  @IsString()
  @IsOptional()
  beschreibung?: string;

  @ApiProperty({ description: 'Betrag in Euro' })
  @IsNumber()
  @Min(0)
  betrag!: number;

  @ApiProperty({
    description: 'Zahlungsintervall',
    enum: ['MONATLICH', 'QUARTALSWEISE', 'HALBJAEHRLICH', 'JAEHRLICH'],
    default: 'MONATLICH',
  })
  @IsString()
  @IsNotEmpty()
  intervall!: string;

  @ApiPropertyOptional({ description: 'Sportarten fuer die diese Klasse gilt' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sportarten?: string[];

  @ApiPropertyOptional({ description: 'Mindestalter (null = kein Minimum)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  altersVon?: number;

  @ApiPropertyOptional({ description: 'Hoechstalter (null = kein Maximum)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  altersBis?: number;

  @ApiPropertyOptional({ description: 'Ist die Klasse aktiv?' })
  @IsBoolean()
  @IsOptional()
  istAktiv?: boolean;

  @ApiPropertyOptional({ description: 'Sortierungsreihenfolge' })
  @IsInt()
  @IsOptional()
  sortierung?: number;
}

export class AktualisiereBeitragsklasseDto {
  @ApiPropertyOptional({ description: 'Name der Beitragsklasse' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Beschreibung der Beitragsklasse' })
  @IsString()
  @IsOptional()
  beschreibung?: string;

  @ApiPropertyOptional({ description: 'Betrag in Euro' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  betrag?: number;

  @ApiPropertyOptional({
    description: 'Zahlungsintervall',
    enum: ['MONATLICH', 'QUARTALSWEISE', 'HALBJAEHRLICH', 'JAEHRLICH'],
  })
  @IsString()
  @IsOptional()
  intervall?: string;

  @ApiPropertyOptional({ description: 'Sportarten fuer die diese Klasse gilt' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sportarten?: string[];

  @ApiPropertyOptional({ description: 'Mindestalter' })
  @IsInt()
  @IsOptional()
  altersVon?: number | null;

  @ApiPropertyOptional({ description: 'Hoechstalter' })
  @IsInt()
  @IsOptional()
  altersBis?: number | null;

  @ApiPropertyOptional({ description: 'Ist die Klasse aktiv?' })
  @IsBoolean()
  @IsOptional()
  istAktiv?: boolean;

  @ApiPropertyOptional({ description: 'Sortierungsreihenfolge' })
  @IsInt()
  @IsOptional()
  sortierung?: number;
}

export class ZuweiseBeitragsklasseDto {
  @ApiProperty({ description: 'ID des Mitglieds' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ description: 'ID der Beitragsklasse (null zum Entfernen)' })
  @IsString()
  @IsOptional()
  beitragsklasseId?: string | null;
}
