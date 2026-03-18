import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class ErstelleRechnungDto {
  @ApiProperty({ description: 'ID des Mitglieds' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ description: 'Rechnungsnummer' })
  @IsString()
  @IsNotEmpty()
  rechnungsNr!: string;

  @ApiProperty({ description: 'Betrag in Euro' })
  @IsNumber()
  @Min(0)
  betrag!: number;

  @ApiProperty({ description: 'Beschreibung der Rechnung' })
  @IsString()
  @IsNotEmpty()
  beschreibung!: string;

  @ApiProperty({ description: 'Faelligkeitsdatum (ISO 8601)' })
  @IsDateString()
  faelligAm!: string;

  @ApiPropertyOptional({ description: 'SEPA-Mandatsreferenz' })
  @IsString()
  @IsOptional()
  sepaMandat?: string;
}

export class ErstelleBeitragDto {
  @ApiProperty({ description: 'Name des Beitrags, z.B. "Jahresbeitrag Erwachsene"' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Betrag in Euro' })
  @IsNumber()
  @Min(0)
  betrag!: number;

  @ApiProperty({
    description: 'Zahlungsintervall',
    enum: ['MONATLICH', 'QUARTALSWEISE', 'JAEHRLICH'],
  })
  @IsString()
  @IsNotEmpty()
  intervall!: string;

  @ApiPropertyOptional({ description: 'Sportart (optional, fuer sportartspezifische Beitraege)' })
  @IsString()
  @IsOptional()
  sportart?: string;
}
