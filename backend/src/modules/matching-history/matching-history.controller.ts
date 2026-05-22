import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { MatchingHistoryIdDto } from './dto/matching-history-id.dto';
import { MatchingHistoryService } from './matching-history.service';

@ApiTags('Matching History')
@ApiBearerAuth()
@Controller('matching/history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.recruiter)
export class MatchingHistoryController {
  constructor(
    private readonly matchingHistoryService: MatchingHistoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the authenticated recruiter matching history sessions',
  })
  @ApiResponse({ status: 200, description: 'Matching history returned' })
  @ApiResponse({ status: 403, description: 'Recruiter role required' })
  findAll(@User('accountId') accountId: bigint) {
    return this.matchingHistoryService.findSummaries(accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read one saved recruiter matching session' })
  @ApiParam({
    name: 'id',
    description: 'String-encoded matching history session identifier',
  })
  @ApiResponse({ status: 200, description: 'Saved matching session returned' })
  @ApiResponse({ status: 403, description: 'Recruiter role required' })
  @ApiResponse({ status: 404, description: 'Matching session not found' })
  findOne(
    @Param() params: MatchingHistoryIdDto,
    @User('accountId') accountId: bigint,
  ) {
    return this.matchingHistoryService.findDetail(BigInt(params.id), accountId);
  }
}
