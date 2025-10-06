// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

// Import business modules
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
// import { AccountsModule } from './modules/accounts/accounts.module';
// import { UsersModule } from './modules/users/users.module';
// import { CandidatesModule } from './modules/candidates/candidates.module';
// import { CompaniesModule } from './modules/companies/companies.module';
// import { JobsModule } from './modules/jobs/jobs.module';
// import { ApplicationsModule } from './modules/applications/applications.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { AdminModule } from './modules/admin/admin.module';
// import { StatisticsModule } from './modules/statistics/statistics.module';
import databaseConfig from '@/config/database.config';
import jwtConfig from '@/config/jwt.config';
import mailerConfig from '@/config/mailer.config';
import { CompaniesModule } from '@/modules/companies/companies.module';
@Module({
  imports: [
    // load .env
     ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailerConfig], // 👈 thêm chỗ này
    }),
    // Prisma ORM

    // Business modules
    AuthModule,
    CloudinaryModule,
    PrismaModule,
    CompaniesModule,
    // AccountsModule,
    // UsersModule,
    // CandidatesModule,
    // CompaniesModule,
    // JobsModule,
    // ApplicationsModule,
    // NotificationsModule,
    // AdminModule,
    // StatisticsModule,
  ],
})
export class AppModule {}
