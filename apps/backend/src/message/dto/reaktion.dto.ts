import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReaktionTyp } from '@prisma/client';

export class ReaktionDto {
  @ApiProperty({
    enum: ReaktionTyp,
    example: ReaktionTyp.JA,
    description: 'Reaktion auf die Nachricht (JA, NEIN, VIELLEICHT, GESEHEN)',
  })
  @IsEnum(ReaktionTyp, {
    message: 'Ungueltige Reaktion. Erlaubt: GESEHEN, JA, NEIN, VIELLEICHT.',
  })
  reaktion!: ReaktionTyp;
}
