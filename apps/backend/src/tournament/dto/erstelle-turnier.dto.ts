import {
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sport, TournamentFormat, MatchStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class ErstelleTurnierDto {
  @ApiProperty({ example: 'Filstal-Cup 2026', description: 'Turniername' })
  @IsString()
  @MinLength(1, { message: 'Turniername darf nicht leer sein.' })
  name!: string;

  @ApiProperty({ enum: Sport, example: Sport.FUSSBALL })
  @IsEnum(Sport, { message: 'Ungueltige Sportart.' })
  sportart!: Sport;

  @ApiProperty({ enum: TournamentFormat, example: TournamentFormat.GRUPPE })
  @IsEnum(TournamentFormat, { message: 'Ungueltiges Turnierformat.' })
  format!: TournamentFormat;
}

export class AktualisiereTurnierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: TournamentFormat })
  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;
}

export class ErstelleSpielDto {
  @ApiProperty({ example: 'FC Kunchen', description: 'Team 1' })
  @IsString()
  @MinLength(1)
  team1!: string;

  @ApiProperty({ example: 'TSV Rechberg', description: 'Team 2' })
  @IsString()
  @MinLength(1)
  team2!: string;

  @ApiPropertyOptional({ example: '2026-03-22T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  zeit?: string;

  @ApiPropertyOptional({ example: 'Platz 1' })
  @IsOptional()
  @IsString()
  feld?: string;
}

export class AktualisiereSpielDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  score1?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  score2?: number;

  @ApiPropertyOptional({ enum: MatchStatus })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  zeit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feld?: string;
}
