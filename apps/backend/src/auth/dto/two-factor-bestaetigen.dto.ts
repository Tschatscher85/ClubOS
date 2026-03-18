import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorBestaetigenDto {
  @ApiProperty({ example: '123456', description: 'TOTP-Code aus der Authenticator-App' })
  @IsString({ message: 'Code muss ein Text sein.' })
  @Length(6, 6, { message: 'Code muss genau 6 Zeichen lang sein.' })
  token!: string;
}
