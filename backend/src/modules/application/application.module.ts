import { Module, forwardRef } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { MailModule } from '@/common/services/mail/mail.module';
@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
