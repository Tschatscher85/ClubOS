import { IsString, MinLength, IsBoolean, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotfallBroadcastDto {
  @ApiProperty({
    example: 'Training heute abgesagt wegen Unwetterwarnung!',
    description: 'Inhalt der Notfall-Nachricht',
  })
  @IsString()
  @MinLength(5, { message: 'Notfall-Nachricht muss mindestens 5 Zeichen lang sein.' })
  inhalt!: string;

  @ApiProperty({
    example: true,
    description: 'Bestaetigung durch den Absender (muss true sein)',
  })
  @IsBoolean({ message: 'Bestaetigung muss ein Wahrheitswert sein.' })
  @Equals(true, { message: 'Notfall-Broadcast muss explizit bestaetigt werden (bestaetigung: true).' })
  bestaetigung!: boolean;
}
