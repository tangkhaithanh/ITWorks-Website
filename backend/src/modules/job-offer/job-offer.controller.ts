import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CreateJobOfferDto } from './dto/create-job-offer.dto';
import { JobOfferService } from './job-offer.service';

@Controller('job-offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.recruiter)
export class JobOfferController {
  constructor(private readonly jobOfferService: JobOfferService) {}

  private parseBigIntParam(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('Invalid id');
    }

    return BigInt(value);
  }

  @Get('my')
  @Roles(Role.candidate)
  async findMyOffers(@User('userId') userId: bigint) {
    return this.jobOfferService.findByCandidate(userId);
  }

  @Get('my/:id')
  @Roles(Role.candidate)
  async findMyOfferById(
    @User('userId') userId: bigint,
    @Param('id') id: string,
  ) {
    return this.jobOfferService.findMyOfferById(
      userId,
      this.parseBigIntParam(id),
    );
  }

  @Patch(':id/accept')
  @Roles(Role.candidate)
  async acceptOffer(@User('userId') userId: bigint, @Param('id') id: string) {
    return this.jobOfferService.acceptOffer(userId, this.parseBigIntParam(id));
  }

  @Patch(':id/reject')
  @Roles(Role.candidate)
  async rejectOffer(@User('userId') userId: bigint, @Param('id') id: string) {
    return this.jobOfferService.rejectOffer(userId, this.parseBigIntParam(id));
  }

  @Get(':applicationId')
  async findByApplicationId(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.jobOfferService.findByApplicationId(BigInt(applicationId));
  }

  @Post()
  async create(
    @User('accountId') accountId: bigint,
    @Body() dto: CreateJobOfferDto,
  ) {
    return this.jobOfferService.create(accountId, dto);
  }
}
