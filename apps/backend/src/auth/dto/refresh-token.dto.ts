import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Aktueller Refresh-Token' })
  @IsString({ message: 'Refresh-Token muss ein Text sein.' })
  refreshToken!: string;
}
