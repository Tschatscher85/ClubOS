import { IsString, MinLength, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleRessourceDto {
  @ApiProperty({ example: 'Tennisplatz 1', description: 'Name der Ressource' })
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiProperty({ example: 'Platz', description: 'Typ der Ressource (z.B. Platz, Raum, Geraet)' })
  @IsString()
  @MinLength(1, { message: 'Typ ist erforderlich.' })
  typ!: string;

  @ApiPropertyOptional({ example: 'Sandplatz mit Flutlicht', description: 'Beschreibung' })
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiPropertyOptional({ example: 'https://example.com/bild.jpg', description: 'Bild-URL' })
  @IsOptional()
  @IsString()
  bildUrl?: string;

  @ApiPropertyOptional({ example: 4, description: 'Maximale Personenanzahl' })
  @IsOptional()
  @IsInt({ message: 'Max. Personen muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Max. Personen muss mindestens 1 sein.' })
  maxPersonen?: number;
}

export class AktualisiereRessourceDto {
  @ApiPropertyOptional({ example: 'Tennisplatz 1', description: 'Name der Ressource' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name?: string;

  @ApiPropertyOptional({ example: 'Platz', description: 'Typ der Ressource' })
  @IsOptional()
  @IsString()
  typ?: string;

  @ApiPropertyOptional({ example: 'Sandplatz mit Flutlicht', description: 'Beschreibung' })
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiPropertyOptional({ example: 'https://example.com/bild.jpg', description: 'Bild-URL' })
  @IsOptional()
  @IsString()
  bildUrl?: string;

  @ApiPropertyOptional({ example: 4, description: 'Maximale Personenanzahl' })
  @IsOptional()
  @IsInt({ message: 'Max. Personen muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Max. Personen muss mindestens 1 sein.' })
  maxPersonen?: number;

  @ApiPropertyOptional({ example: true, description: 'Aktiv/Inaktiv' })
  @IsOptional()
  @IsBoolean({ message: 'Aktiv muss ein Boolean sein.' })
  aktiv?: boolean;
}
