// To run backend use command: npm run start:dev

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Increase payload size limit for images
  app.use((req, res, next) => {
    if (req.path === '/upload/image') {
      req.setTimeout(60000); // 60 seconds for uploads
    }
    next();
  });
  
  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();