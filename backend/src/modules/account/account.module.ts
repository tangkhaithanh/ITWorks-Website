import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AccountController } from './account.controller';
import { MailModule } from '@/common/services/mail/mail.module';
@Module({
  imports: [MailModule],
  controllers: [AccountController],
  providers: [AccountService, PrismaService],
})
export class AccountModule {}
