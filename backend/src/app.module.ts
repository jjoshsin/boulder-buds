import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GymsModule } from './gyms/gyms.module';
import { UploadModule } from './upload/upload.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FollowsModule } from './follows/follows.module';
import { VideosModule } from './videos/videos.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportingModule } from './reporting/reporting.module';
import { BlockingModule } from './blocking/blocking.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ClimbLogsModule } from './climb-logs/climb-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GymsModule,
    UploadModule,
    ReviewsModule,
    FollowsModule,
    VideosModule,
    NotificationsModule,
    BlockingModule,
    ReportingModule,
    FavoritesModule,
    ClimbLogsModule,
  ],
})
export class AppModule {}