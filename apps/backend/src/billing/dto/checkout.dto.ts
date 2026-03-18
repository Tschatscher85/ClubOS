import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    description: 'Gewaehlter Tarif',
    enum: ['STARTER', 'PRO', 'CLUB'],
  })
  @IsString()
  @IsIn(['STARTER', 'PRO', 'CLUB'])
  plan!: 'STARTER' | 'PRO' | 'CLUB';
}
