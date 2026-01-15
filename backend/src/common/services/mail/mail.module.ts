import { Module } from '@nestjs/common';
import { CustomMailerModule } from '../../../config/mailer.module';
import { MailService } from './mail.service';

@Module({
  imports: [CustomMailerModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
