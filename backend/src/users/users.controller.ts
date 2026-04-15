import { Controller, Patch, Get, Param, Body, UseGuards, Request, Query, Post, UseInterceptors, UploadedFile, UnauthorizedException, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ── me/* routes must come BEFORE :id to avoid routing conflicts ──

  @UseGuards(JwtAuthGuard)
  @Post('me/push-token')
  async savePushToken(@Request() req, @Body() body: { token: string }) {
    return this.usersService.savePushToken(req.user.userId, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/privacy')
  async updatePrivacy(@Request() req, @Body() body: { isPrivate: boolean }) {
    return this.usersService.updatePrivacy(req.user.userId, body.isPrivate);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/change-password')
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/blocked')
  async getBlockedUsers(@Request() req) {
    return this.usersService.getBlockedUsers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/blocked/:blockedId')
  async unblockUser(@Request() req, @Param('blockedId') blockedId: string) {
    return this.usersService.unblockUser(req.user.userId, blockedId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/query')
  async searchUsers(@Query('q') query: string, @Request() req) {
    return this.usersService.searchUsers(query, req.user.userId);
  }

  // ── :id routes ────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string, @Request() req) {
    return this.usersService.getUser(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: {
      displayName?: string;
      birthday?: string;
      city?: string;
      state?: string;
      climbingLevel?: string;
      climbingType?: string;
    },
  ) {
    return this.usersService.updateProfile(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/reviews')
  async getUserReviews(@Param('id') id: string, @Request() req) {
    return this.usersService.getUserReviews(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/photos')
  async getUserPhotos(@Param('id') id: string, @Request() req) {
    return this.usersService.getUserPhotos(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-stats')
  async getFollowStats(@Param('id') id: string) {
    return this.usersService.getFollowStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/followers')
  async getFollowers(@Param('id') id: string, @Request() req) {
    return this.usersService.getFollowers(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/following')
  async getFollowing(@Param('id') id: string, @Request() req) {
    return this.usersService.getFollowing(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/profile-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const userId = req.user.userId;
    if (userId !== id) {
      throw new Error('Unauthorized');
    }
    return this.usersService.updateProfilePhoto(id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
async deleteAccount(
  @Param('id') id: string,
  @Request() req,
) {
  // Security: Only allow users to delete their own account
  if (req.user.userId !== id) {
    throw new UnauthorizedException('You can only delete your own account');
  }

  await this.usersService.deleteAccount(id);
  return { message: 'Account successfully deleted' };
}
}