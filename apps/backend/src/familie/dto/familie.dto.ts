import {
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FamilienRolle } from '@prisma/client';

export class ErstelleFamilieDto {
  @ApiPropertyOptional({ description: 'Familienname (wird automatisch generiert wenn leer)' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class FamilieMitgliedHinzufuegenDto {
  @ApiPropertyOptional({ description: 'Member-ID (fuer Kinder/spielende Mitglieder)' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'User-ID (fuer Eltern/Erziehungsberechtigte)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ enum: FamilienRolle, description: 'Rolle in der Familie' })
  @IsEnum(FamilienRolle, { message: 'Ungueltige Familienrolle.' })
  rolle!: FamilienRolle;
}
