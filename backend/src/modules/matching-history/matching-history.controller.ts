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
  findAll(@User('accountId') accountId: bigint) {
    return this.matchingHistoryService.findSummaries(accountId);
  }

  @Get(':id')
  findOne(
    @Param() params: MatchingHistoryIdDto,
    @User('accountId') accountId: bigint,
  ) {
    return this.matchingHistoryService.findDetail(BigInt(params.id), accountId);
  }
}
