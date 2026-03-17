import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
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
