// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { CompaniesModule } from '@/modules/companies/companies.module';
import { ElasticsearchCustomModule } from './modules/elasticsearch/elasticsearch.module';
import { LocationModule } from './modules/location/location.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CvsModule } from './modules/cvs/cvs.module';
import { ApplicationModule } from './modules/application/application.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { SkillsModule } from './modules/skills/skills.module';
import { JobCategoriesModule } from './modules/job-categories/job-categories.module';
import { InterviewModule } from './modules/interviews/interview.module';
import { IndustryModule } from './modules/industries/industry.module';
import { UsersModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AccountModule } from './modules/account/account.module';
import { PlansModule } from './modules/plans/plans.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QueueModule } from '@/modules/queue/queue.module';
import { MessagingModule } from '@/modules/messaging/messaging.module';
import { CvTemplatesModule } from '@/modules/cv-templates/cv-templates.module';
import databaseConfig from '@/config/database.config';
import jwtConfig from '@/config/jwt.config';
import mailerConfig from '@/config/mailer.config';
import aiServiceConfig from '@/config/ai-service.config';
import externalAuthConfig from '@/config/external-auth.config';
import { AiSyncModule } from '@/modules/ai-sync/ai-sync.module';
import { PotentialCandidatesModule } from '@/modules/potential-candidates/potential-candidates.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { JobOfferModule } from '@/modules/job-offer/job-offer.module';
import { MatchingHistoryModule } from '@/modules/matching-history/matching-history.module';

@Module({
  imports: [
    //Khi app khởi động, hãy load toàn bộ config này vào ConfigService, cho toàn app dùng.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        mailerConfig,
        aiServiceConfig,
        externalAuthConfig,
      ],
    }),
    PrismaModule,
    ElasticsearchCustomModule,
    ScheduleModule.forRoot(),
    AuthModule,
    CloudinaryModule,
    CompaniesModule,
    JobsModule,
    LocationModule,
    CvsModule,
    ApplicationModule,
    CandidatesModule,
    SkillsModule,
    JobCategoriesModule,
    InterviewModule,
    IndustryModule,
    UsersModule,
    DashboardModule,
    AccountModule,
    PlansModule,
    PaymentsModule,
    NotificationsModule,
    QueueModule,
    AiSyncModule,
    MatchingHistoryModule,
    CvTemplatesModule,
    MessagingModule,
    PotentialCandidatesModule,
    ReportsModule,
    JobOfferModule,
  ],
})
export class AppModule {}
