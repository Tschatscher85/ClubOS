import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { FormModule } from './form/form.module';
import { DokumentModule } from './dokument/dokument.module';
import { AbteilungModule } from './abteilung/abteilung.module';
import { WorkflowModule } from './workflow/workflow.module';
import { EinladungModule } from './einladung/einladung.module';
import { FaqModule } from './faq/faq.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { HalleModule } from './halle/halle.module';
import { SponsorModule } from './sponsor/sponsor.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SchiedsrichterModule } from './schiedsrichter/schiedsrichter.module';
import { BuchhaltungModule } from './buchhaltung/buchhaltung.module';
import { KiModule } from './ki/ki.module';
import { EmailEinstellungenModule } from './email/email-einstellungen.module';
import { DfbnetModule } from './dfbnet/dfbnet.module';
import { HomepageModule } from './homepage/homepage.module';
import { ProfilbildModule } from './profilbild/profilbild.module';
import { SportartModule } from './sportart/sportart.module';
import { PosteingangModule } from './posteingang/posteingang.module';
import { PinboardModule } from './pinboard/pinboard.module';
import { SubdomainMiddleware } from './common/middleware/subdomain.middleware';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 Sekunde
        limit: 3,     // max 3 Anfragen pro Sekunde
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 Sekunden
        limit: 20,    // max 20 Anfragen pro 10 Sekunden
      },
      {
        name: 'long',
        ttl: 60000,   // 1 Minute
        limit: 100,   // max 100 Anfragen pro Minute
      },
    ]),
    PrismaModule,
    KiModule,
    AuthModule,
    TenantModule,
    UserModule,
    MemberModule,
    TeamModule,
    EventModule,
    TournamentModule,
    MessageModule,
    FahrgemeinschaftModule,
    FormModule,
    DokumentModule,
    AbteilungModule,
    WorkflowModule,
    EinladungModule,
    FaqModule,
    QrcodeModule,
    HealthModule,
    QueueModule,
    HalleModule,
    SponsorModule,
    RealtimeModule,
    SchiedsrichterModule,
    BuchhaltungModule,
    EmailEinstellungenModule,
    DfbnetModule,
    HomepageModule,
    ProfilbildModule,
    SportartModule,
    PosteingangModule,
    PinboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware).forRoutes('*');
  }
}
