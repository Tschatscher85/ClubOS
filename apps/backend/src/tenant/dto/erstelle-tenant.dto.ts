import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstelleTenantDto {
  @ApiProperty({ example: 'FC Kunchen 1920', description: 'Vereinsname' })
  @IsString()
  @MinLength(2, { message: 'Vereinsname muss mindestens 2 Zeichen lang sein.' })
  name!: string;

  @ApiProperty({ example: 'fckunchen', description: 'URL-Slug' })
  @IsString()
  @MinLength(3, { message: 'Slug muss mindestens 3 Zeichen lang sein.' })
  @MaxLength(50, { message: 'Slug darf maximal 50 Zeichen lang sein.' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.',
  })
  slug!: string;

  @ApiPropertyOptional({ example: '#1a56db', description: 'Vereinsfarbe' })
  @IsOptional()
  @IsString()
  primaryColor?: string;
}

export class AktualisiereTenantDto {
  @ApiPropertyOptional({ example: 'FC Kunchen 1920 e.V.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '#ff0000' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'fckunchen.de' })
  @IsOptional()
  @IsString()
  domain?: string;
}
