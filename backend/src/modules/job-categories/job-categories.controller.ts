// src/modules/job-categories/job-categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JobCategoriesService } from './job-categories.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('job-categories')
export class JobCategoriesController {
  constructor(private readonly jcService: JobCategoriesService) {}

  @Get()
  getAll() {
    return this.jcService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  create(@Body() dto: { name: string }) {
    return this.jcService.create(dto.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { name: string }) {
    return this.jcService.update(BigInt(id), dto.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jcService.delete(BigInt(id));
  }
}
