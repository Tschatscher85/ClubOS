import { IsString, MinLength, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleSpielberichtDto {
  @ApiProperty({ example: '3:1', description: 'Ergebnis des Spiels (z.B. 3:1)' })
  @IsString()
  @MinLength(1, { message: 'Ergebnis darf nicht leer sein.' })
  ergebnis!: string;

  @ApiProperty({ example: 'TSV Musterstadt', description: 'Name des Gegners' })
  @IsString()
  @MinLength(2, { message: 'Gegnername muss mindestens 2 Zeichen lang sein.' })
  gegner!: string;

  @ApiPropertyOptional({ description: 'Aufstellung als JSON-Array (Spieler-IDs/Namen)' })
  @IsOptional()
  @IsArray({ message: 'Aufstellung muss ein Array sein.' })
  aufstellung?: unknown[];

  @ApiPropertyOptional({ description: 'Torschuetzen als JSON-Array [{name, minute}]' })
  @IsOptional()
  @IsArray({ message: 'Torschuetzen muss ein Array sein.' })
  torschuetzen?: unknown[];

  @ApiPropertyOptional({ description: 'Assists als JSON-Array [{name, minute}]' })
  @IsOptional()
  @IsArray({ message: 'Assists muss ein Array sein.' })
  assists?: unknown[];

  @ApiPropertyOptional({ description: 'Gelbe Karten als JSON-Array [{name, minute}]' })
  @IsOptional()
  @IsArray({ message: 'Gelbe Karten muss ein Array sein.' })
  gelbeKarten?: unknown[];

  @ApiPropertyOptional({ description: 'Rote Karten als JSON-Array [{name, minute}]' })
  @IsOptional()
  @IsArray({ message: 'Rote Karten muss ein Array sein.' })
  roteKarten?: unknown[];

  @ApiPropertyOptional({ example: 'Gutes Spiel, starke zweite Halbzeit', description: 'Notiz des Trainers' })
  @IsOptional()
  @IsString()
  trainerNotiz?: string;
}

export class AktualisiereSpielberichtDto {
  @ApiPropertyOptional({ description: 'KI-generierten Text manuell anpassen' })
  @IsOptional()
  @IsString()
  kiText?: string;

  @ApiPropertyOptional({ description: 'Bericht veroeffentlichen' })
  @IsOptional()
  @IsBoolean({ message: 'veroeffentlicht muss ein Boolean sein.' })
  veroeffentlicht?: boolean;

  @ApiPropertyOptional({ description: 'Ergebnis aktualisieren' })
  @IsOptional()
  @IsString()
  ergebnis?: string;

  @ApiPropertyOptional({ description: 'Gegner aktualisieren' })
  @IsOptional()
  @IsString()
  gegner?: string;

  @ApiPropertyOptional({ description: 'Torschuetzen aktualisieren' })
  @IsOptional()
  @IsArray()
  torschuetzen?: unknown[];

  @ApiPropertyOptional({ description: 'Assists aktualisieren' })
  @IsOptional()
  @IsArray()
  assists?: unknown[];

  @ApiPropertyOptional({ description: 'Gelbe Karten aktualisieren' })
  @IsOptional()
  @IsArray()
  gelbeKarten?: unknown[];

  @ApiPropertyOptional({ description: 'Rote Karten aktualisieren' })
  @IsOptional()
  @IsArray()
  roteKarten?: unknown[];

  @ApiPropertyOptional({ description: 'Trainer-Notiz aktualisieren' })
  @IsOptional()
  @IsString()
  trainerNotiz?: string;
}
