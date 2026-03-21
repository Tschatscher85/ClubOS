import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sport } from '@prisma/client';

export class ErstelleTeamDto {
  @ApiProperty({ example: 'E-Jugend', description: 'Mannschaftsname' })
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(1, { message: 'Name darf nicht leer sein.' })
  name!: string;

  @ApiProperty({ enum: Sport, example: Sport.FUSSBALL })
  @IsEnum(Sport, { message: 'Ungueltige Sportart.' })
  sportart!: Sport;

  @ApiProperty({ example: 'U10', description: 'Altersklasse' })
  @IsString({ message: 'Altersklasse muss ein Text sein.' })
  @MinLength(1, { message: 'Altersklasse darf nicht leer sein.' })
  altersklasse!: string;

  @ApiPropertyOptional({ description: 'Trainer-User-ID (optional, kann spaeter zugeordnet werden)' })
  @IsOptional()
  @IsString()
  trainerId?: string;
}

export class AktualisiereTeamDto {
  @ApiPropertyOptional({ example: 'E-Jugend 2' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: Sport })
  @IsOptional()
  @IsEnum(Sport)
  sportart?: Sport;

  @ApiPropertyOptional({ enum: Sport, description: 'Alias fuer sportart' })
  @IsOptional()
  @IsEnum(Sport)
  sport?: Sport;

  @ApiPropertyOptional({ example: 'U12' })
  @IsOptional()
  @IsString()
  altersklasse?: string;

  @ApiPropertyOptional({ example: 'U12', description: 'Alias fuer altersklasse' })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainerId?: string;

  @ApiPropertyOptional({ description: 'Abteilungs-ID' })
  @IsOptional()
  @IsString()
  abteilungId?: string;
}
