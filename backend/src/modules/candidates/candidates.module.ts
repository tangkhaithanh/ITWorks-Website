import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';

@Module({
  imports: [PrismaModule],
  providers: [CandidatesService],
  controllers: [CandidatesController],
  exports: [CandidatesService],
})
export class CandidatesModule {}
