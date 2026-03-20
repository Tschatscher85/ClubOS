import {
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleUmfrageDto {
  @ApiProperty({ example: 'Wann soll das Sommerfest stattfinden?', description: 'Die Frage der Umfrage' })
  @IsString()
  @MinLength(3, { message: 'Frage muss mindestens 3 Zeichen lang sein.' })
  frage!: string;

  @ApiProperty({ example: ['Samstag 10.07.', 'Sonntag 11.07.', 'Samstag 17.07.'], description: 'Antwortoptionen (min 2, max 6)' })
  @IsArray()
  @ArrayMinSize(2, { message: 'Mindestens 2 Optionen erforderlich.' })
  @ArrayMaxSize(6, { message: 'Maximal 6 Optionen erlaubt.' })
  @IsString({ each: true })
  optionen!: string[];

  @ApiPropertyOptional({ description: 'Team-ID (optional, fuer teamspezifische Umfragen)' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Ablaufdatum der Umfrage (ISO-String)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ungueltiges Datumsformat.' })
  endetAm?: string;
}

export class AbstimmenDto {
  @ApiProperty({ example: 'Samstag 10.07.', description: 'Gewaehlte Option' })
  @IsString()
  @MinLength(1, { message: 'Option darf nicht leer sein.' })
  option!: string;

  @ApiPropertyOptional({ description: 'Name des Abstimmenden (optional)' })
  @IsOptional()
  @IsString()
  mitgliedName?: string;
}

export class TokenAbstimmenDto {
  @ApiProperty({ example: 'Samstag 10.07.', description: 'Gewaehlte Option' })
  @IsString()
  @MinLength(1, { message: 'Option darf nicht leer sein.' })
  option!: string;

  @ApiProperty({ example: 'Max Mustermann', description: 'Name des Abstimmenden' })
  @IsString()
  @MinLength(1, { message: 'Name darf nicht leer sein.' })
  name!: string;
}
