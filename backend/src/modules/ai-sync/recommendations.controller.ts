import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
import { AiSyncService } from './ai-sync.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { AiSyncRequestError } from './ai-sync.errors';

@ApiTags('Recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly aiSyncService: AiSyncService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get personalized job recommendations for the authenticated candidate',
  })
  @ApiQuery({
    name: 'top_k',
    required: false,
    type: Number,
    description: 'Number of recommendations (default 10, max 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Job recommendations returned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Candidate profile not found or not synced',
  })
  @ApiResponse({
    status: 503,
    description: 'Recommendation service temporarily unavailable',
  })
  async getRecommendations(
    @User('accountId') accountId: bigint,
    @Query() query: RecommendationQueryDto,
  ) {
    try {
      console.log(`Fetching recommendations for accountId: ${accountId}, top_k: ${query.top_k}`);
      return await this.aiSyncService.getRecommendations(
        accountId,
        query.top_k,
      );
    } catch (error) {
      if (error instanceof AiSyncRequestError) {
        throw error;
      }
      throw error;
    }
  }
}
