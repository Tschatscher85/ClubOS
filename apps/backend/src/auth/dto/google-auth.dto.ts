import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID Token vom Frontend' })
  @IsString({ message: 'Token muss ein Text sein.' })
  idToken!: string;
}
