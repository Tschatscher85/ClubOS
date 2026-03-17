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

  @ApiProperty({ description: 'Trainer-User-ID' })
  @IsString()
  trainerId!: string;
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

  @ApiPropertyOptional({ example: 'U12' })
  @IsOptional()
  @IsString()
  altersklasse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainerId?: string;
}
