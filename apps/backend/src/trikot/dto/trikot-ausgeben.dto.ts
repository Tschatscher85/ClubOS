import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrikotAusgebenDto {
  @ApiProperty({ description: 'ID des Mitglieds' })
  @IsString({ message: 'memberId muss ein Text sein.' })
  memberId!: string;

  @ApiPropertyOptional({ description: 'Optionale Notiz zur Vergabe' })
  @IsOptional()
  @IsString({ message: 'Notiz muss ein Text sein.' })
  notiz?: string;
}
