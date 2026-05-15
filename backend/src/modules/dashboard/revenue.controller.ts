import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { TopCompaniesQueryDto } from './dto/top-companies-query.dto';

@ApiTags('Revenue')
@ApiBearerAuth()
@Controller('revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RevenueController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('top-companies')
  @Roles('admin')
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication' })
  @ApiForbiddenResponse({ description: 'Authenticated user is not an admin' })
  async getTopCompanies(@Query() query: TopCompaniesQueryDto) {
    return this.dashboardService.getTopRevenueCompanies(query);
  }
}
