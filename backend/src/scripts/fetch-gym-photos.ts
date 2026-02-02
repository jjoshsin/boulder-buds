import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GymsService } from '../gyms/gyms.service';

async function bootstrap() {
  console.log('🚀 Starting gym photo fetcher...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get the GymsService
  const gymsService = app.get(GymsService);

  try {
    // Fetch photos for all gyms without official photos
    await gymsService.fetchAllMissingOfficialPhotos();
    
    console.log('\n✅ Successfully fetched photos for all gyms!');
  } catch (error) {
    console.error('\n❌ Error fetching gym photos:', error);
  } finally {
    // Close the application
    await app.close();
  }
}

bootstrap();