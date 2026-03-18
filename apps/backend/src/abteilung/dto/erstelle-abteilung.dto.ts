import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sport } from '@prisma/client';

export class ErstelleAbteilungDto {
  @ApiProperty({ example: 'Fussball', description: 'Name der Abteilung' })
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(1, { message: 'Name darf nicht leer sein.' })
  name!: string;

  @ApiProperty({ enum: Sport, example: Sport.FUSSBALL, description: 'Sportart' })
  @IsEnum(Sport, { message: 'Ungueltige Sportart.' })
  sport!: Sport;

  @ApiPropertyOptional({ example: ['userId1'], description: 'UserIDs der Abteilungsleiter' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leiterIds?: string[];

  @ApiPropertyOptional({ example: 'Fussball-Abteilung des Vereins' })
  @IsOptional()
  @IsString()
  beschreibung?: string;
}

export class AktualisiereAbteilungDto {
  @ApiPropertyOptional({ example: 'Fussball' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: ['userId1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leiterIds?: string[];

  @ApiPropertyOptional({ example: 'Beschreibung' })
  @IsOptional()
  @IsString()
  beschreibung?: string;
}
