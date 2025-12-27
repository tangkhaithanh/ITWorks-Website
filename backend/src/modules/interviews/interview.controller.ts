import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { User } from '@/common/decorators/user.decorator';
import { InterviewOwnershipGuard } from '@/common/guards/interview-ownership.guard';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.recruiter)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  async create(
    @User('accountId') accountId: bigint,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewService.createInterview(accountId, dto);
  }

  @Patch(':id')
  @UseGuards(InterviewOwnershipGuard)
  async update(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviewService.updateInterview(accountId, BigInt(id), dto);
  }

  @Patch(':id/cancel')
  @UseGuards(InterviewOwnershipGuard)
  async cancel(
    @User('accountId') accountId: bigint,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.interviewService.cancelInterview(accountId, BigInt(id));
  }
}
