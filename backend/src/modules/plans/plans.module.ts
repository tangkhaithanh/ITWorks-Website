import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService], // export để module khác dùng (CompanyPlan, Payment...)
})
export class PlansModule {}
