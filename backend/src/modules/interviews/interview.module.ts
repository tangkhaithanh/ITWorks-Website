import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { PrismaService } from '@/prisma/prisma.service';
import { MailModule } from 'src/common/services/mail.module';

@Module({
  imports: [MailModule],
  providers: [InterviewService, PrismaService],
  controllers: [InterviewController],
})
export class InterviewModule { }
