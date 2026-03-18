import { IsString, IsNotEmpty, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PushKeysDto {
  @ApiProperty({ description: 'p256dh-Schluessel des Browsers' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ description: 'Auth-Schluessel des Browsers' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class WebPushAbonnierenDto {
  @ApiProperty({ description: 'Push-Subscription-Endpoint-URL' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({ description: 'Push-Schluessel (p256dh + auth)' })
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}
