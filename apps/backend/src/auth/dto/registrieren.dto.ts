import { IsEmail, IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrierenDto {
  @ApiProperty({ example: 'vorstand@fckunchen.de', description: 'E-Mail-Adresse' })
  @IsEmail({}, { message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' })
  email!: string;

  @ApiProperty({ example: 'MeinSicheresPasswort123', description: 'Passwort (min. 8 Zeichen)' })
  @IsString({ message: 'Passwort muss ein Text sein.' })
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' })
  passwort!: string;

  @ApiProperty({ example: 'FC Kunchen 1920', description: 'Name des Vereins' })
  @IsString({ message: 'Vereinsname muss ein Text sein.' })
  @MinLength(2, { message: 'Vereinsname muss mindestens 2 Zeichen lang sein.' })
  vereinsname!: string;

  @ApiProperty({ example: 'fckunchen', description: 'URL-Slug (nur Kleinbuchstaben, Zahlen, Bindestriche)' })
  @IsString({ message: 'Slug muss ein Text sein.' })
  @MinLength(3, { message: 'Slug muss mindestens 3 Zeichen lang sein.' })
  @MaxLength(50, { message: 'Slug darf maximal 50 Zeichen lang sein.' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.',
  })
  slug!: string;
}
