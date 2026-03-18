import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class ErstelleVerletzungDto {
  @ApiProperty({ description: 'ID des verletzten Mitglieds' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ description: 'Art der Verletzung (z.B. Knoechelverstauchung)' })
  @IsString()
  @IsNotEmpty()
  art!: string;

  @ApiProperty({ description: 'Betroffenes Koerperteil (z.B. Linkes Knie)' })
  @IsString()
  @IsNotEmpty()
  koerperteil!: string;

  @ApiPropertyOptional({ description: 'Geschaetzte Pause in Tagen' })
  @IsInt()
  @Min(0)
  @IsOptional()
  pauseVoraus?: number;

  @ApiPropertyOptional({ description: 'Optionale Notiz zur Verletzung' })
  @IsString()
  @IsOptional()
  notiz?: string;
}

export class AktualisiereVerletzungDto {
  @ApiPropertyOptional({ description: 'Neuer Reha-Status (VERLETZT, REHA, BEOBACHTEN, FIT)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Datum der Rueckkehr (nur bei FIT)' })
  @IsString()
  @IsOptional()
  zurueckAm?: string;

  @ApiPropertyOptional({ description: 'Optionale Notiz' })
  @IsString()
  @IsOptional()
  notiz?: string;
}
