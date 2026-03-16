import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnmeldenDto {
  @ApiProperty({ example: 'vorstand@fckunchen.de', description: 'E-Mail-Adresse' })
  @IsEmail({}, { message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' })
  email!: string;

  @ApiProperty({ example: 'MeinSicheresPasswort123', description: 'Passwort' })
  @IsString({ message: 'Passwort muss ein Text sein.' })
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' })
  passwort!: string;
}
