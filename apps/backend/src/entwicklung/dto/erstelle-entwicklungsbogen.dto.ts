import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleEntwicklungsbogenDto {
  @ApiProperty({ example: 'cm...', description: 'Team-ID' })
  @IsString({ message: 'Team-ID muss ein Text sein.' })
  teamId!: string;

  @ApiProperty({ example: '2025/2026', description: 'Saison (z.B. 2025/2026)' })
  @IsString({ message: 'Saison muss ein Text sein.' })
  @MinLength(4, { message: 'Saison muss mindestens 4 Zeichen lang sein.' })
  saison!: string;

  // Technik
  @ApiPropertyOptional({ example: 4, description: 'Ballkontrolle (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Ballkontrolle muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  ball?: number;

  @ApiPropertyOptional({ example: 3, description: 'Passen (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Passen muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  passen?: number;

  @ApiPropertyOptional({ example: 3, description: 'Schuss (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Schuss muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  schuss?: number;

  @ApiPropertyOptional({ example: 4, description: 'Zweikampf (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Zweikampf muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  zweikampf?: number;

  @ApiPropertyOptional({ example: 2, description: 'Kopfball (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Kopfball muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  kopfball?: number;

  // Taktik
  @ApiPropertyOptional({ example: 3, description: 'Spielverstaendnis (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Spielverstaendnis muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  spielverstaendnis?: number;

  @ApiPropertyOptional({ example: 3, description: 'Positionsspiel (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Positionsspiel muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  positionsspiel?: number;

  @ApiPropertyOptional({ example: 3, description: 'Defensivverhalten (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Defensivverhalten muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  defensivverhalten?: number;

  // Athletik
  @ApiPropertyOptional({ example: 4, description: 'Schnelligkeit (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Schnelligkeit muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  schnelligkeit?: number;

  @ApiPropertyOptional({ example: 3, description: 'Ausdauer (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Ausdauer muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  ausdauer?: number;

  @ApiPropertyOptional({ example: 3, description: 'Sprungkraft (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Sprungkraft muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  sprungkraft?: number;

  // Sozial
  @ApiPropertyOptional({ example: 5, description: 'Teamgeist (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Teamgeist muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  teamgeist?: number;

  @ApiPropertyOptional({ example: 4, description: 'Einstellung (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Einstellung muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  einstellung?: number;

  @ApiPropertyOptional({ example: 4, description: 'Coachbarkeit (1-5)' })
  @IsOptional()
  @IsInt({ message: 'Coachbarkeit muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Bewertung mindestens 1.' })
  @Max(5, { message: 'Bewertung maximal 5.' })
  coaching?: number;

  // Textfelder
  @ApiPropertyOptional({ example: 'Starker linker Fuss, gutes Auge', description: 'Staerken' })
  @IsOptional()
  @IsString({ message: 'Staerken muss ein Text sein.' })
  staerken?: string;

  @ApiPropertyOptional({ example: 'Kopfball, rechter Fuss', description: 'Entwicklungsfelder' })
  @IsOptional()
  @IsString({ message: 'Entwicklungsfelder muss ein Text sein.' })
  entwicklungsfelder?: string;

  @ApiPropertyOptional({ example: 'Kopfball verbessern', description: 'Ziele' })
  @IsOptional()
  @IsString({ message: 'Ziele muss ein Text sein.' })
  ziele?: string;

  @ApiPropertyOptional({ example: 'Naechste Saison U15 moeglich', description: 'Trainer-Empfehlung' })
  @IsOptional()
  @IsString({ message: 'Trainer-Empfehlung muss ein Text sein.' })
  trainerEmpfehlung?: string;
}
