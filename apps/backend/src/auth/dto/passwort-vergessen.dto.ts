import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswortVergessenDto {
  @ApiProperty({
    example: 'vorstand@fckunchen.de',
    description: 'E-Mail-Adresse des Kontos',
  })
  @IsEmail({}, { message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' })
  email!: string;
}
