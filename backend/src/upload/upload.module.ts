import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { VideoProcessingService } from './video-processing.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, VideoProcessingService],
  exports: [UploadService, VideoProcessingService],
})
export class UploadModule {}