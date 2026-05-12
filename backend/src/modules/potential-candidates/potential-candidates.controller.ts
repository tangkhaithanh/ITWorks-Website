import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PotentialCandidatesService } from './potential-candidates.service';
import { CreatePotentialCandidateDto } from './dto/create-potential-candidate.dto';
import { UpdatePotentialCandidateDto } from './dto/update-potential-candidate.dto';
import { QueryPotentialCandidateDto } from './dto/query-potential-candidate.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Potential Candidates')
@ApiBearerAuth()
@Controller('potential-candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.recruiter)
export class PotentialCandidatesController {
  constructor(private readonly service: PotentialCandidatesService) {}

  @Post()
  @ApiOperation({
    summary: 'Save a candidate to the talent pool for a specific job',
  })
  @ApiBody({ type: CreatePotentialCandidateDto })
  @ApiResponse({ status: 201, description: 'Candidate saved to talent pool' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — jobId is required',
  })
  @ApiResponse({
    status: 409,
    description: 'Candidate is already saved for this job',
  })
  create(
    @Body() dto: CreatePotentialCandidateDto,
    @User('accountId') accountId: bigint,
  ) {
    return this.service.create(dto, accountId);
  }

  @Get()
  @ApiOperation({
    summary:
      'List saved candidates in the talent pool, optionally scoped by job',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: 'Job id used to show a job-scoped potential candidate pool',
  })
  @ApiResponse({ status: 200, description: 'Talent pool candidates returned' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 403, description: 'Recruiter cannot manage this job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findAll(
    @User('accountId') accountId: bigint,
    @Query() query: QueryPotentialCandidateDto,
  ) {
    return this.service.findAll(accountId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('accountId') accountId: bigint) {
    return this.service.findOne(BigInt(id), accountId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePotentialCandidateDto,
    @User('accountId') accountId: bigint,
  ) {
    return this.service.update(BigInt(id), dto, accountId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('accountId') accountId: bigint) {
    return this.service.remove(BigInt(id), accountId);
  }
}
