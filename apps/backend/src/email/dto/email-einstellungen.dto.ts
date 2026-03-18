import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEmail,
  Min,
  Max,
} from 'class-validator';

export class EmailEinstellungenDto {
  @ApiProperty({ description: 'SMTP-Server Hostname', example: 'mail.fcmusterstadt.de' })
  @IsString()
  smtpHost!: string;

  @ApiProperty({ description: 'SMTP-Port', example: 587, default: 587 })
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort!: number;

  @ApiProperty({ description: 'SMTP-Benutzername', example: 'trainer.mueller@fcmusterstadt.de' })
  @IsString()
  smtpUser!: string;

  @ApiProperty({ description: 'SMTP-Passwort' })
  @IsString()
  smtpPass!: string;

  @ApiProperty({ description: 'Absender-E-Mail-Adresse', example: 'trainer.mueller@fcmusterstadt.de' })
  @IsEmail()
  absenderEmail!: string;

  @ApiProperty({ description: 'Absender-Name', example: 'Thomas Mueller - FC Musterstadt' })
  @IsString()
  absenderName!: string;

  @ApiPropertyOptional({ description: 'HTML-Signatur fuer E-Mails' })
  @IsOptional()
  @IsString()
  signatur?: string;

  @ApiPropertyOptional({ description: 'Einstellungen aktiv?', default: true })
  @IsOptional()
  @IsBoolean()
  istAktiv?: boolean;
}
