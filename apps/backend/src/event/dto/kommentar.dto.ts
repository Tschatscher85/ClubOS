import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KommentarDto {
  @ApiProperty({ description: 'Kommentartext' })
  @IsString({ message: 'Kommentar muss ein Text sein.' })
  @MinLength(1, { message: 'Kommentar darf nicht leer sein.' })
  inhalt!: string;
}
