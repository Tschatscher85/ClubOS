import { IsString, IsEnum, IsOptional, ValidateIf, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AnmeldungDto {
  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.YES })
  @IsEnum(AttendanceStatus, { message: 'Ungueltiger Status (YES, NO, MAYBE).' })
  status!: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Pflichtfeld bei Absage (NO)' })
  @ValidateIf((o) => o.status === AttendanceStatus.NO)
  @IsString({ message: 'Grund muss ein Text sein.' })
  @MinLength(3, { message: 'Bitte geben Sie einen Grund an (mind. 3 Zeichen).' })
  grund?: string;

  @ApiProperty({ description: 'Mitglied-ID' })
  @IsString()
  memberId!: string;
}
