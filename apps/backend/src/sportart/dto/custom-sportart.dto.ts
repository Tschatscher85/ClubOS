import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleCustomSportartDto {
  @ApiProperty({ example: 'Unterwasser-Rugby', description: 'Name der eigenen Sportart' })
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  @MaxLength(100, { message: 'Name darf maximal 100 Zeichen lang sein.' })
  name!: string;

  @ApiPropertyOptional({ example: 'Eine Mannschaftssportart im Wasser', description: 'Beschreibung der Sportart' })
  @IsOptional()
  @IsString({ message: 'Beschreibung muss ein Text sein.' })
  @MaxLength(500, { message: 'Beschreibung darf maximal 500 Zeichen lang sein.' })
  beschreibung?: string;

  @ApiPropertyOptional({ example: '🏊', description: 'Optionales Icon/Emoji fuer die Sportart' })
  @IsOptional()
  @IsString({ message: 'Icon muss ein Text sein.' })
  @MaxLength(10, { message: 'Icon darf maximal 10 Zeichen lang sein.' })
  icon?: string;
}

export class AktualisiereCustomSportartDto {
  @ApiPropertyOptional({ example: 'Unterwasser-Rugby', description: 'Name der eigenen Sportart' })
  @IsOptional()
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  @MaxLength(100, { message: 'Name darf maximal 100 Zeichen lang sein.' })
  name?: string;

  @ApiPropertyOptional({ example: 'Eine Mannschaftssportart im Wasser', description: 'Beschreibung der Sportart' })
  @IsOptional()
  @IsString({ message: 'Beschreibung muss ein Text sein.' })
  @MaxLength(500, { message: 'Beschreibung darf maximal 500 Zeichen lang sein.' })
  beschreibung?: string;

  @ApiPropertyOptional({ example: '🏊', description: 'Optionales Icon/Emoji fuer die Sportart' })
  @IsOptional()
  @IsString({ message: 'Icon muss ein Text sein.' })
  @MaxLength(10, { message: 'Icon darf maximal 10 Zeichen lang sein.' })
  icon?: string;
}
