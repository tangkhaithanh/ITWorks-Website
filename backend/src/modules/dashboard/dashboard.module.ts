// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.comtroller';
import { RevenueController } from './revenue.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DashboardController, RevenueController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
