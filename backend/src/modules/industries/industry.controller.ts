import { 
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseIntPipe, 
  UseGuards
} from '@nestjs/common';
import { IndustryService } from './industry.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('industries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @Post()
  @Roles(Role.admin)
  create(@Body() dto: CreateIndustryDto) {
    return this.industryService.create(dto);
  }

  @Get()
  @Roles(Role.recruiter)
  findAll() {
    return this.industryService.findAll();
  }

  @Get(':id')
  @Roles(Role.recruiter)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.industryService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Roles(Role.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIndustryDto,
  ) {
    return this.industryService.update(BigInt(id), dto);
  }

  @Delete(':id')
  @Roles(Role.admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.industryService.remove(BigInt(id));
  }
}
