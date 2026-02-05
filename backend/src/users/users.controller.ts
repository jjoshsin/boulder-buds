import { Controller, Patch, Get, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { 
      displayName?: string; 
      birthday?: string; 
      borough?: string;
      climbingLevel?: string;
      climbingType?: string;
    },
  ) {
    return this.usersService.updateProfile(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/reviews')
  async getUserReviews(@Param('id') id: string) {
    return this.usersService.getUserReviews(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/photos')
  async getUserPhotos(@Param('id') id: string) {
    return this.usersService.getUserPhotos(id);
  }

  // NEW ENDPOINTS
  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-stats')
  async getFollowStats(@Param('id') id: string) {
    return this.usersService.getFollowStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/followers')
  async getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/query')
  async searchUsers(@Query('q') query: string, @Request() req) {
    const currentUserId = req.user.userId;
    return this.usersService.searchUsers(query, currentUserId);
  }
}