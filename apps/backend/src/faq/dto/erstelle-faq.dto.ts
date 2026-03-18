import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleFaqDto {
  @ApiProperty({ example: 'Wann ist das naechste Training?', description: 'Frage' })
  @IsString()
  @MinLength(3, { message: 'Frage muss mindestens 3 Zeichen lang sein.' })
  frage!: string;

  @ApiProperty({ example: 'Jeden Dienstag und Donnerstag um 18:00 Uhr.', description: 'Antwort' })
  @IsString()
  @MinLength(3, { message: 'Antwort muss mindestens 3 Zeichen lang sein.' })
  antwort!: string;

  @ApiPropertyOptional({ description: 'Team-ID (optional, fuer teamspezifische FAQs)' })
  @IsOptional()
  @IsString()
  teamId?: string;
}

export class AktualisiereFaqDto {
  @ApiPropertyOptional({ example: 'Wann ist das naechste Training?', description: 'Frage' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Frage muss mindestens 3 Zeichen lang sein.' })
  frage?: string;

  @ApiPropertyOptional({ example: 'Jeden Dienstag und Donnerstag um 18:00 Uhr.', description: 'Antwort' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Antwort muss mindestens 3 Zeichen lang sein.' })
  antwort?: string;

  @ApiPropertyOptional({ description: 'Team-ID (optional, fuer teamspezifische FAQs)' })
  @IsOptional()
  @IsString()
  teamId?: string;
}

export class FrageDto {
  @ApiProperty({ example: 'Wann ist das naechste Spiel?', description: 'Die Frage des Nutzers' })
  @IsString()
  @MinLength(3, { message: 'Frage muss mindestens 3 Zeichen lang sein.' })
  frage!: string;

  @ApiPropertyOptional({ description: 'Team-ID (optional, fuer teamspezifische Antworten)' })
  @IsOptional()
  @IsString()
  teamId?: string;
}
