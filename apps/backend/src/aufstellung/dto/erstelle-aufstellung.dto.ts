import { IsString, MinLength, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleAufstellungDto {
  @ApiProperty({ example: 'clxyz123', description: 'Team-ID' })
  @IsString()
  teamId!: string;

  @ApiProperty({ example: 'Aufstellung vs. FC Muster', description: 'Name der Aufstellung' })
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiProperty({ example: '4-3-3', description: 'Formation (z.B. 4-3-3, 4-4-2)' })
  @IsString()
  formation!: string;

  @ApiProperty({ description: 'Positionen als JSON-Objekt (Position -> Spieler-ID)' })
  @IsObject()
  positionen!: Record<string, string>;

  @ApiPropertyOptional({ example: 'clxyz456', description: 'Optionale Event-ID' })
  @IsOptional()
  @IsString()
  eventId?: string;
}

export class AktualisiereAufstellungDto {
  @ApiPropertyOptional({ example: 'Neue Aufstellung', description: 'Name der Aufstellung' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name?: string;

  @ApiPropertyOptional({ example: '4-4-2', description: 'Formation' })
  @IsOptional()
  @IsString()
  formation?: string;

  @ApiPropertyOptional({ description: 'Positionen als JSON-Objekt' })
  @IsOptional()
  @IsObject()
  positionen?: Record<string, string>;

  @ApiPropertyOptional({ example: 'clxyz456', description: 'Optionale Event-ID' })
  @IsOptional()
  @IsString()
  eventId?: string;
}
