import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { PrismaModule } from '../../prisma/prisma.module';
import { CustomMailerModule } from '../../config/mailer.module';
import { MailModule } from '@/common/services/mail/mail.module';
import { QUEUES } from '@/modules/queue/queue.constants';
import { AuthSyncConsumer } from './consumers/auth-sync.consumer';
import { ExternalAuthClient } from './external-auth.client';
import { AuthSyncQueue } from './queues/auth-sync.queue';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // đăng ký module jwtmodule với các tham số lấy từ biến môi trường
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn'), // access token sống trong 15 phút
        },
      }),
    }),
    PrismaModule,
    CustomMailerModule,
    PassportModule,
    ConfigModule,
    MailModule,
    BullModule.registerQueue({
      name: QUEUES.AUTH_SYNC,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthSyncQueue,
    AuthSyncConsumer,
    ExternalAuthClient,
  ],
  exports: [AuthService],
})
export class AuthModule {}
