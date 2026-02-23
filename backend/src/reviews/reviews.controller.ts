import { Controller, Post, Patch, Delete, UseGuards, Body, Request, Param, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

@Post()
@UseGuards(JwtAuthGuard)
async createReview(
  @Request() req,
  @Body() body: {
    gymId: string;
    overallRating: number;
    setting: string;
    difficulty: string;
    reviewText?: string;
    photos?: string[];
  },
) {
  return this.reviewsService.createReview({
    userId: req.user.userId,
    ...body,
  });
}

@Patch(':id')
@UseGuards(JwtAuthGuard)
async updateReview(
  @Param('id') id: string,
  @Request() req,
  @Body() body: {
    overallRating?: number;
    setting?: string;
    difficulty?: string;
    reviewText?: string;
    photos?: string[];
  },
) {
  return this.reviewsService.updateReview(id, req.user.userId, body);
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