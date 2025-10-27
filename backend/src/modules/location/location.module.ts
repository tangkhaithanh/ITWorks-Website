import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';

@Module({
  imports: [ConfigModule], // để dùng ConfigService
  providers: [LocationService],
  controllers: [LocationController],
  exports: [LocationService], // 👈 để module khác có thể dùng (ví dụ JobService)
})
export class LocationModule {}
