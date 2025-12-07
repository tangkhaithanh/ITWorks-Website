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
import databaseConfig from '@/config/database.config';
import jwtConfig from '@/config/jwt.config';
import mailerConfig from '@/config/mailer.config';

@Module({
  imports: [
    // 🟢 1. Load .env toàn cục trước
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailerConfig],
    }),

    // 🟢 2. Load Prisma ORM
    PrismaModule,

    // 🟢 3. Load Elasticsearch sớm (phải đứng TRƯỚC các module khác dùng nó)
    ElasticsearchCustomModule,
    ScheduleModule.forRoot(), // Cho phép chạy cron jobs

    // 🟢 4. Các business modules còn lại
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
  ],
})
export class AppModule {}
