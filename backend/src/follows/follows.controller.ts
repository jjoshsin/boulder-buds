import { Controller, Post, Delete, Get, UseGuards, Param, Request, Query } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('follows')
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  async followUser(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    const currentUserId = req.user.userId;
    return this.followsService.followUser(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async unfollowUser(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    const currentUserId = req.user.userId;
    return this.followsService.unfollowUser(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check/:userId')
  async checkFollowStatus(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    const currentUserId = req.user.userId;
    return this.followsService.isFollowing(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed/activity')
  async getFriendActivity(@Request() req, @Query('limit') limit?: string) {
    const currentUserId = req.user.userId;
    const activityLimit = limit ? parseInt(limit) : 10;
    return this.followsService.getFriendActivity(currentUserId, activityLimit);
  }
}