import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health-Check' })
  async check() {
    // Datenbank-Verbindung pruefen
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        zeitstempel: new Date().toISOString(),
        datenbank: 'verbunden',
      };
    } catch {
      return {
        status: 'fehler',
        zeitstempel: new Date().toISOString(),
        datenbank: 'nicht verbunden',
      };
    }
  }
}
