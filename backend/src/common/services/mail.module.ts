import { Module } from '@nestjs/common';
import { CustomMailerModule } from '../../config/mailer.module';
import { MailService } from './mail.service';

@Module({
  imports: [CustomMailerModule], // 👈 import module đã config
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}