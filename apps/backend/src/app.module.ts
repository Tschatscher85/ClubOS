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
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
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
  ],
})
export class AppModule {}
