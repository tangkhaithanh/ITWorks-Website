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
import { PotentialCandidatesService } from './potential-candidates.service';
import { CreatePotentialCandidateDto } from './dto/create-potential-candidate.dto';
import { UpdatePotentialCandidateDto } from './dto/update-potential-candidate.dto';
import { QueryPotentialCandidateDto } from './dto/query-potential-candidate.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';

@Controller('potential-candidates')
@UseGuards(JwtAuthGuard)
export class PotentialCandidatesController {
  constructor(private readonly service: PotentialCandidatesService) {}

  @Post()
  create(
    @Body() dto: CreatePotentialCandidateDto,
    @User('accountId') accountId: bigint,
  ) {
    return this.service.create(dto, accountId);
  }

  @Get()
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
