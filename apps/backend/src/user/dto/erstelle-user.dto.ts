import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ErstelleUserDto {
  @ApiProperty({ example: 'trainer@fckunchen.de' })
  @IsEmail({}, { message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' })
  email!: string;

  @ApiProperty({ example: 'SicheresPasswort123' })
  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' })
  passwort!: string;

  @ApiProperty({ enum: Role, example: Role.TRAINER })
  @IsEnum(Role, { message: 'Ungueltige Rolle.' })
  rolle!: Role;
}

export class PasswortZuruecksetzenDto {
  @ApiProperty({ example: 'NeuesPasswort123' })
  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' })
  neuesPasswort!: string;
}

export class AktualisiereUserDto {
  @ApiPropertyOptional({ example: 'neue-email@fckunchen.de' })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' })
  email?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role, { message: 'Ungueltige Rolle.' })
  rolle?: Role;
}

// ==================== Benutzerverwaltung DTOs ====================

export class ErstelleBenutzerDto {
  @ApiProperty({ example: 'neuer-trainer@fckunchen.de' })
  @IsEmail({}, { message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.TRAINER })
  @IsEnum(Role, { message: 'Ungueltige Rolle.' })
  rolle!: Role;

  @ApiPropertyOptional({
    example: ['MITGLIEDER', 'TEAMS', 'KALENDER'],
    description: 'Granulare Berechtigungen. Falls leer, werden Standard-Berechtigungen basierend auf der Rolle gesetzt.',
  })
  @IsOptional()
  @IsArray({ message: 'Berechtigungen muessen ein Array sein.' })
  @IsString({ each: true, message: 'Jede Berechtigung muss ein String sein.' })
  berechtigungen?: string[];

  @ApiPropertyOptional({ example: 'Neuer Jugendtrainer fuer die U12' })
  @IsOptional()
  @IsString()
  notizen?: string;
}

export class AktualisiereBenutzerDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role, { message: 'Ungueltige Rolle.' })
  rolle?: Role;

  @ApiPropertyOptional({
    example: ['MITGLIEDER', 'TEAMS', 'KALENDER'],
  })
  @IsOptional()
  @IsArray({ message: 'Berechtigungen muessen ein Array sein.' })
  @IsString({ each: true, message: 'Jede Berechtigung muss ein String sein.' })
  berechtigungen?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'istAktiv muss ein Boolean sein.' })
  istAktiv?: boolean;

  @ApiPropertyOptional({ example: 'Admin-Notiz zum Benutzer' })
  @IsOptional()
  @IsString()
  notizen?: string;
}

export class AktualisiereBerechtigungenDto {
  @ApiProperty({
    example: ['MITGLIEDER', 'TEAMS', 'KALENDER', 'TURNIERE', 'NACHRICHTEN'],
  })
  @IsArray({ message: 'Berechtigungen muessen ein Array sein.' })
  @IsString({ each: true, message: 'Jede Berechtigung muss ein String sein.' })
  berechtigungen!: string[];
}
