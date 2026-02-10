import { Module } from '@nestjs/common';
import { GymsController } from './gyms.controller';
import { GymsService } from './gyms.service';
import { GooglePlacesService } from './google-places.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [PrismaModule],
  controllers: [GymsController],
  providers: [GymsService, GooglePlacesService, GeocodingService],
  exports: [GymsService],
})
export class GymsModule {}