import { Controller, Post, Delete, Get, Param, UseGuards, Request } from '@nestjs/common';
import { BlockingService } from './blocking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blocking')
@UseGuards(JwtAuthGuard)
export class BlockingController {
  constructor(private blockingService: BlockingService) {}

  @Post(':userId')
  async blockUser(@Param('userId') userId: string, @Request() req) {
    return this.blockingService.blockUser(req.user.userId, userId);
  }

  @Delete(':userId')
  async unblockUser(@Param('userId') userId: string, @Request() req) {
    return this.blockingService.unblockUser(req.user.userId, userId);
  }

  @Get()
  async getBlockedUsers(@Request() req) {
    return this.blockingService.getBlockedUsers(req.user.userId);
  }

  @Get('check/:userId')
  async isBlocked(@Param('userId') userId: string, @Request() req) {
    const blocked = await this.blockingService.isBlocked(req.user.userId, userId);
    return { blocked };
  }
}