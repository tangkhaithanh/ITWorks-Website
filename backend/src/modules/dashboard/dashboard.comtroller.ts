// src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RecruiterDashboardQueryDto } from './dto/recruiter-dashboard-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
// import { Roles } from 'src/auth/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /recruiter/dashboard
   *
   * Query:
   *  - range / from / to
   *  - topJobsLimit / recentApplicationsLimit / upcomingInterviewsLimit
   */
  @Get('recruiter')
  @Roles('recruiter')
  async getDashboard(
    @User('accountId') accountId: bigint,
    @Query() query: RecruiterDashboardQueryDto,
  ) {
    // Tùy JWT payload của bạn:
    // ví dụ req.user.id là account_id
    // const accountId = Number(req.user.id);

    return this.dashboardService.getRecruiterDashboard(accountId, query);
  }

  @Get('admin')
  @Roles('admin')
  async getAdminDashboard(@Query() query: AdminDashboardQueryDto) {
    return this.dashboardService.getAdminDashboard(query);
  }
}
