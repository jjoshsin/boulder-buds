import { Controller, Post, Get, Delete, Param, Body, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createVideo(
    @Request() req,
    @Body() body: {
      gymId: string;
      videoUrl: string;
      thumbnailUrl: string;
      caption?: string;
    },
  ) {
    return this.videosService.createVideo({
      userId: req.user.userId,
      ...body,
    });
  }

  @Get('gym/:gymId')
  async getGymVideos(
    @Param('gymId') gymId: string,
    @Query('sortBy') sortBy?: 'mostLiked' | 'mostRecent' | 'mostViewed' | 'mostCommented',
    @Query('limit') limit?: string,
  ) {
    return this.videosService.getGymVideos(
      gymId,
      sortBy || 'mostRecent',
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('user/:userId')
  async getUserVideos(@Param('userId') userId: string) {
    return this.videosService.getUserVideos(userId);
  }

  @Get(':id')
  async getVideo(@Param('id') id: string) {
    return this.videosService.getVideoById(id);
  }

  @Post(':id/view')
  async incrementViews(@Param('id') id: string) {
    await this.videosService.incrementViews(id);
    return { success: true };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('id') id: string, @Request() req) {
    return this.videosService.toggleLike(id, req.user.userId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { text: string; parentId?: string },
  ) {
    return this.videosService.addComment(id, req.user.userId, body.text, body.parentId);
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  async toggleCommentLike(@Param('commentId') commentId: string, @Request() req) {
    return this.videosService.toggleCommentLike(commentId, req.user.userId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Param('commentId') commentId: string, @Request() req) {
    return this.videosService.deleteComment(commentId, req.user.userId);
  }

@Patch(':id/caption')
@UseGuards(JwtAuthGuard)
async updateCaption(
  @Param('id') id: string,
  @Request() req,
  @Body() body: { caption: string },
) {
  return this.videosService.updateCaption(id, req.user.userId, body.caption);
}

@Delete(':id')
@UseGuards(JwtAuthGuard)
async deleteVideo(@Param('id') id: string, @Request() req) {
  return this.videosService.deleteVideo(id, req.user.userId);
}
}