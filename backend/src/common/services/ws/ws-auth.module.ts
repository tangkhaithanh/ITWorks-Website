import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsAuthService } from './ws-auth.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn'),
        },
      }),
    }),
    PrismaModule,
    ConfigModule,
  ],
  providers: [WsAuthService],
  exports: [WsAuthService],
})
export class WsAuthModule {}
