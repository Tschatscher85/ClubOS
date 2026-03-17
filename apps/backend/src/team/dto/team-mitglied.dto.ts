import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MitgliedHinzufuegenDto {
  @ApiProperty({ description: 'Mitglied-ID' })
  @IsString({ message: 'Mitglied-ID muss ein Text sein.' })
  @MinLength(1, { message: 'Mitglied-ID darf nicht leer sein.' })
  memberId!: string;

  @ApiPropertyOptional({
    example: 'SPIELER',
    description: 'Rolle im Team (SPIELER, TORWART, KAPITAEN)',
  })
  @IsOptional()
  @IsString()
  rolle?: string;
}
