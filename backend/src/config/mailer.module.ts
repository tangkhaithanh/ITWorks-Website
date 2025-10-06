import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule], // để inject ConfigService
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('mailer.host'),
          port: config.get<number>('mailer.port'),
          secure: false, // Gmail port 587 → STARTTLS
          auth: {
            user: config.get<string>('mailer.user'),
            pass: config.get<string>('mailer.pass'),
          },
        },
        defaults: {
          from: config.get<string>('mailer.from'),
        },
      }),
    }),
  ],
  exports: [MailerModule],
})
export class CustomMailerModule {}
