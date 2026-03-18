import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleTrikotDto {
  @ApiProperty({ example: 7, description: 'Trikotnummer' })
  @IsInt({ message: 'Nummer muss eine ganze Zahl sein.' })
  @Min(1, { message: 'Nummer muss mindestens 1 sein.' })
  nummer!: number;

  @ApiPropertyOptional({ example: 'M', description: 'Groesse (S, M, L, XL)' })
  @IsOptional()
  @IsString({ message: 'Groesse muss ein Text sein.' })
  groesse?: string;

  @ApiPropertyOptional({ example: 'Heimtrikot', description: 'Farbe/Typ des Trikots' })
  @IsOptional()
  @IsString({ message: 'Farbe muss ein Text sein.' })
  farbe?: string;

  @ApiPropertyOptional({ example: 'Neu', description: 'Zustand des Trikots' })
  @IsOptional()
  @IsString({ message: 'Zustand muss ein Text sein.' })
  zustand?: string;
}
