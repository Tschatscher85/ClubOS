import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswortAendernDto {
  @ApiProperty({ description: 'Aktuelles Passwort' })
  @IsString({ message: 'Altes Passwort muss ein Text sein.' })
  altesPasswort!: string;

  @ApiProperty({ description: 'Neues Passwort (min. 8 Zeichen)' })
  @IsString({ message: 'Neues Passwort muss ein Text sein.' })
  @MinLength(8, { message: 'Neues Passwort muss mindestens 8 Zeichen lang sein.' })
  neuesPasswort!: string;
}
