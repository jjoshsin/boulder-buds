import { Module } from '@nestjs/common';
import { ClimbLogsController } from './climb-logs.controller';
import { ClimbLogsService } from './climb-logs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClimbLogsController],
  providers: [ClimbLogsService],
  exports: [ClimbLogsService],
})
export class ClimbLogsModule {}
