import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorVerifizierenDto {
  @ApiProperty({ description: 'Temporaeres Token aus dem Login-Schritt' })
  @IsString({ message: 'tempToken muss ein Text sein.' })
  tempToken!: string;

  @ApiProperty({ example: '123456', description: 'TOTP-Code oder Backup-Code' })
  @IsString({ message: 'Code muss ein Text sein.' })
  @MinLength(6, { message: 'Code muss mindestens 6 Zeichen lang sein.' })
  code!: string;
}
