import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DokumentKategorie } from '@prisma/client';

export class ErstelleDokumentDto {
  @ApiProperty({ example: 'Satzung 2026', description: 'Dokumentname' })
  @IsString({ message: 'Name muss ein Text sein.' })
  @MinLength(1, { message: 'Name darf nicht leer sein.' })
  name!: string;

  @ApiPropertyOptional({ example: 'Aktuelle Vereinssatzung', description: 'Beschreibung' })
  @IsOptional()
  @IsString({ message: 'Beschreibung muss ein Text sein.' })
  beschreibung?: string;

  @ApiProperty({ enum: DokumentKategorie, example: DokumentKategorie.SATZUNG })
  @IsEnum(DokumentKategorie, { message: 'Ungueltige Kategorie.' })
  kategorie!: DokumentKategorie;

  @ApiPropertyOptional({ example: 'Vorstand/2026', description: 'Ordner-Pfad' })
  @IsOptional()
  @IsString({ message: 'Ordner muss ein Text sein.' })
  ordner?: string;
}
