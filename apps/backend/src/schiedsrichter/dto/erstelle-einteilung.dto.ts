import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ErstelleEinteilungDto {
  @ApiProperty({ description: 'ID des Events/Spiels' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'ID des Mitglieds, das als Schiedsrichter eingeteilt wird' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional({ description: 'Optionale Notiz zur Einteilung' })
  @IsString()
  @IsOptional()
  notiz?: string;
}
