import { Controller, Post, Patch, Delete, UseGuards, Body, Request, Param, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Body() body: {
      gymId: string;
      overallRating: number;
      settingQuality?: number;
      difficulty?: number;
      variety?: number;
      crowding?: number;
      cleanliness?: number;
      vibe?: number;
      reviewText?: string;
      tags?: string[];
      photos?: string[];
    },
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.reviewsService.createReview(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateReview(
    @Param('id') id: string,
    @Body() body: {
      overallRating?: number;
      settingQuality?: number;
      difficulty?: number;
      variety?: number;
      crowding?: number;
      cleanliness?: number;
      vibe?: number;
      reviewText?: string;
      tags?: string[];
      photos?: string[];
    },
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.reviewsService.updateReview(id, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteReview(
    @Param('id') id: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.reviewsService.deleteReview(id, userId);
  }

  @UseGuards(JwtAuthGuard)
@Post(':id/like')
async toggleLike(
  @Param('id') id: string,
  @Request() req,
) {
  return this.reviewsService.toggleLike(id, req.user.userId);
}
}