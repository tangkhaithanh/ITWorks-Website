import { Module } from '@nestjs/common';
import { IndustryService } from './industry.service';
import { IndustryController } from './industry.controller';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [IndustryController],
  providers: [IndustryService, PrismaService],
})
export class IndustryModule {}
