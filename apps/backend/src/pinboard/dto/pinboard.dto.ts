import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErstellePinboardItemDto {
  @ApiProperty({ example: 'Wichtige Info zum Training', description: 'Titel des Pinboard-Eintrags' })
  @IsString()
  @MinLength(2, { message: 'Titel muss mindestens 2 Zeichen lang sein.' })
  titel!: string;

  @ApiProperty({ example: 'Bitte Hallenschuhe mitbringen!', description: 'Inhalt des Eintrags' })
  @IsString()
  @MinLength(2, { message: 'Inhalt muss mindestens 2 Zeichen lang sein.' })
  inhalt!: string;

  @ApiPropertyOptional({ example: 'warning', description: 'Icon fuer den Eintrag (z.B. info, warning, pin)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: true, description: 'Eintrag oben anpinnen' })
  @IsOptional()
  @IsBoolean({ message: 'istAngepinnt muss ein Boolean sein.' })
  istAngepinnt?: boolean;
}

export class AktualisierePinboardItemDto {
  @ApiPropertyOptional({ example: 'Aktualisierter Titel', description: 'Titel des Pinboard-Eintrags' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Titel muss mindestens 2 Zeichen lang sein.' })
  titel?: string;

  @ApiPropertyOptional({ example: 'Aktualisierter Inhalt', description: 'Inhalt des Eintrags' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Inhalt muss mindestens 2 Zeichen lang sein.' })
  inhalt?: string;

  @ApiPropertyOptional({ example: 'warning', description: 'Icon fuer den Eintrag' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: true, description: 'Eintrag oben anpinnen' })
  @IsOptional()
  @IsBoolean({ message: 'istAngepinnt muss ein Boolean sein.' })
  istAngepinnt?: boolean;
}
