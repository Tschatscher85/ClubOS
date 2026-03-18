import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AktualisiereKiEinstellungenDto {
  @ApiProperty({
    description: 'KI-Anbieter: "anthropic" oder "openai"',
    example: 'anthropic',
  })
  @IsString()
  @IsIn(['anthropic', 'openai'], {
    message: 'KI-Anbieter muss "anthropic" oder "openai" sein.',
  })
  kiProvider!: string;

  @ApiPropertyOptional({
    description: 'API-Key des KI-Anbieters',
    example: 'sk-...',
  })
  @IsString()
  @IsOptional()
  kiApiKey?: string;

  @ApiPropertyOptional({
    description: 'KI-Modell (z.B. "claude-sonnet-4-20250514" oder "gpt-4o")',
    example: 'claude-sonnet-4-20250514',
  })
  @IsString()
  @IsOptional()
  kiModell?: string;
}
