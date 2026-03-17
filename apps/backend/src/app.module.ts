import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { MemberModule } from './member/member.module';
import { TeamModule } from './team/team.module';
import { EventModule } from './event/event.module';
import { TournamentModule } from './tournament/tournament.module';
import { MessageModule } from './message/message.module';
import { FahrgemeinschaftModule } from './fahrgemeinschaft/fahrgemeinschaft.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    UserModule,
    MemberModule,
    TeamModule,
    EventModule,
    TournamentModule,
    MessageModule,
    FahrgemeinschaftModule,
    HealthModule,
  ],
})
export class AppModule {}
