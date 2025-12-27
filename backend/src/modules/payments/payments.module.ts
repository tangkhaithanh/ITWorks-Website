import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [ConfigModule, PrismaModule, CompaniesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, VnpayService],
})
export class PaymentsModule {}
