import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswortZuruecksetzenDto {
  @ApiProperty({ description: 'Reset-Token aus der E-Mail' })
  @IsString({ message: 'Token muss ein Text sein.' })
  token!: string;

  @ApiProperty({ description: 'Neues Passwort' })
  @IsString({ message: 'Passwort muss ein Text sein.' })
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' })
  neuesPasswort!: string;
}
