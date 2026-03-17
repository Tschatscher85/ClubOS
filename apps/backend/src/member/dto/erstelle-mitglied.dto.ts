import {
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  IsArray,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberStatus } from '@prisma/client';

export class ErstelleMitgliedDto {
  @ApiProperty({ example: 'Max', description: 'Vorname' })
  @IsString({ message: 'Vorname muss ein Text sein.' })
  @MinLength(1, { message: 'Vorname darf nicht leer sein.' })
  vorname!: string;

  @ApiProperty({ example: 'Mustermann', description: 'Nachname' })
  @IsString({ message: 'Nachname muss ein Text sein.' })
  @MinLength(1, { message: 'Nachname darf nicht leer sein.' })
  nachname!: string;

  @ApiPropertyOptional({ example: '2010-05-15', description: 'Geburtsdatum' })
  @IsOptional()
  @IsDateString({}, { message: 'Bitte ein gueltiges Datum angeben.' })
  geburtsdatum?: string;

  @ApiPropertyOptional({ example: '+49 176 12345678' })
  @IsOptional()
  @IsString()
  telefon?: string;

  @ApiPropertyOptional({ example: 'Musterstr. 1, 73037 Goeppingen' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: ['FUSSBALL'], description: 'Sportarten' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional({
    example: 'eltern@beispiel.de',
    description: 'E-Mail der Eltern (bei Jugendlichen)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Bitte eine gueltige E-Mail-Adresse angeben.' })
  elternEmail?: string;
}

export class AktualisiereMitgliedDto {
  @ApiPropertyOptional({ example: 'Max' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  vorname?: string;

  @ApiPropertyOptional({ example: 'Mustermann' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  nachname?: string;

  @ApiPropertyOptional({ example: '2010-05-15' })
  @IsOptional()
  @IsDateString()
  geburtsdatum?: string;

  @ApiPropertyOptional({ example: '+49 176 12345678' })
  @IsOptional()
  @IsString()
  telefon?: string;

  @ApiPropertyOptional({ example: 'Musterstr. 1, 73037 Goeppingen' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: ['FUSSBALL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sportarten?: string[];

  @ApiPropertyOptional({ example: 'eltern@beispiel.de' })
  @IsOptional()
  @IsEmail()
  elternEmail?: string;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Ungueltiger Mitgliedsstatus.' })
  status?: MemberStatus;
}
