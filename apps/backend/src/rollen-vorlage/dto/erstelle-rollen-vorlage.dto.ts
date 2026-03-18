import { IsString, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ErstelleRollenVorlageDto {
  @ApiProperty({ example: 'Kassenprufer', description: 'Name der Rollenvorlage' })
  @IsString()
  @MinLength(2, { message: 'Name muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiPropertyOptional({ example: 'Zugriff auf Buchhaltung und Finanzdokumente', description: 'Beschreibung der Rolle' })
  @IsOptional()
  @IsString()
  beschreibung?: string;

  @ApiProperty({ example: 'ADMIN', description: 'System-Zugriffslevel (SUPERADMIN, ADMIN, TRAINER, MEMBER, PARENT)' })
  @IsEnum(Role, { message: 'systemRolle muss ein gueltiger Role-Wert sein.' })
  systemRolle!: Role;

  @ApiProperty({ example: ['BUCHHALTUNG', 'DOKUMENTE'], description: 'Liste der Berechtigungen' })
  @IsArray({ message: 'berechtigungen muss ein Array sein.' })
  @IsString({ each: true, message: 'Jede Berechtigung muss ein String sein.' })
  berechtigungen!: string[];

  @ApiPropertyOptional({ example: '#ea580c', description: 'Badge-Farbe (Hex)' })
  @IsOptional()
  @IsString()
  farbe?: string;
}
