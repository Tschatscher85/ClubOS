import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Fuehrt eine Transaktion mit gesetztem Tenant-Kontext aus.
   * PostgreSQL RLS filtert automatisch nach tenantId.
   * Verwendung: await prisma.mitTenant(tenantId, (tx) => tx.member.findMany())
   */
  async mitTenant<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // SET LOCAL gilt nur innerhalb dieser Transaktion
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}'`,
      );
      return fn(tx as unknown as PrismaClient);
    });
  }
}
