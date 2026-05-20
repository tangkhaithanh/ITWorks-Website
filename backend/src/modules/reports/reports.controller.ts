import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { CloseReportedJobDto } from './dto/close-reported-job.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a report for a job or company' })
  createReport(
    @User('accountId') accountId: bigint,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(accountId, dto);
  }

  @Get('admin')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'List reports for admin review' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  listAdminReports(@Query() query: AdminReportQueryDto) {
    return this.reportsService.listAdminReports(query);
  }

  @Get('admin/:id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Get report detail for admin review' })
  @ApiParam({ name: 'id', type: String })
  getAdminReportDetail(@Param('id') id: string) {
    return this.reportsService.getAdminReportDetail(BigInt(id));
  }

  @Patch('admin/:id/status')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Update report review status' })
  @ApiParam({ name: 'id', type: String })
  updateReportStatus(
    @Param('id') id: string,
    @User('accountId') accountId: bigint,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateReportStatus(BigInt(id), accountId, dto);
  }

  @Patch('admin/:id/close-job')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Close a suspicious job from report review' })
  @ApiParam({ name: 'id', type: String })
  closeReportedJob(
    @Param('id') id: string,
    @User('accountId') accountId: bigint,
    @Body() dto: CloseReportedJobDto,
  ) {
    return this.reportsService.closeReportedJob(BigInt(id), accountId, dto);
  }
}
