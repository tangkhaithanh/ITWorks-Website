import { Module } from '@nestjs/common';
import { PotentialCandidatesController } from './potential-candidates.controller';
import { PotentialCandidatesService } from './potential-candidates.service';

@Module({
  controllers: [PotentialCandidatesController],
  providers: [PotentialCandidatesService],
})
export class PotentialCandidatesModule {}
