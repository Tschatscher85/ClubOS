import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeilnehmerDto {
  @ApiProperty({ description: 'Mitglied-ID' })
  @IsString()
  memberId!: string;

  @ApiProperty({ description: 'Anwesenheit' })
  @IsBoolean()
  anwesend!: boolean;
}

export class ErstelleTrainingsprotokollDto {
  @ApiProperty({ description: 'Datum des Trainings' })
  @IsDateString()
  datum!: string;

  @ApiProperty({ description: 'Dauer in Minuten' })
  @IsInt()
  @Min(1)
  dauer!: number;

  @ApiProperty({ description: 'Thema des Trainings' })
  @IsString()
  thema!: string;

  @ApiPropertyOptional({ description: 'Was wurde trainiert (Freitext)' })
  @IsOptional()
  @IsString()
  inhalt?: string;

  @ApiPropertyOptional({ description: 'Besonderheiten, Verletzungen etc.' })
  @IsOptional()
  @IsString()
  notizen?: string;

  @ApiProperty({ description: 'Teilnehmer mit Anwesenheitsstatus', type: [TeilnehmerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeilnehmerDto)
  teilnehmer!: TeilnehmerDto[];
}
