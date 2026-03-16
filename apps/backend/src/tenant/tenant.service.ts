import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTenantDto, AktualisiereTenantDto } from './dto/erstelle-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async erstellen(dto: ErstelleTenantDto) {
    const existierend = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existierend) {
      throw new ConflictException('Dieser Slug ist bereits vergeben.');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        primaryColor: dto.primaryColor,
      },
    });
  }

  async alleAbrufen() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async nachIdAbrufen(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return tenant;
  }

  async nachSlugAbrufen(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return tenant;
  }

  async aktualisieren(id: string, dto: AktualisiereTenantDto) {
    await this.nachIdAbrufen(id); // Pruefen ob existiert

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async loeschen(id: string) {
    await this.nachIdAbrufen(id);

    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
