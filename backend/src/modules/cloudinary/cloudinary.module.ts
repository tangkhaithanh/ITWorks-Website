import { Module } from '@nestjs/common';
import { CloudinaryProvider } from '@/config/cloudinary.config';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
