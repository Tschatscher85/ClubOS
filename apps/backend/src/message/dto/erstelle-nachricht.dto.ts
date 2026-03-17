import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class ErstelleNachrichtDto {
  @ApiProperty({ example: 'Training faellt morgen aus!', description: 'Nachrichteninhalt' })
  @IsString()
  @MinLength(1, { message: 'Nachricht darf nicht leer sein.' })
  inhalt!: string;

  @ApiProperty({ enum: MessageType, example: MessageType.BROADCAST })
  @IsEnum(MessageType, { message: 'Ungueltiger Nachrichtentyp.' })
  typ!: MessageType;

  @ApiPropertyOptional({ description: 'Team-ID (fuer Team-Nachrichten)' })
  @IsOptional()
  @IsString()
  teamId?: string;
}
