import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, data: any) {
    // Check if user already reviewed this gym
    const existing = await this.prisma.review.findUnique({
      where: {
        userId_gymId: {
          userId,
          gymId: data.gymId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this gym');
    }

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        userId,
        gymId: data.gymId,
        overallRating: data.overallRating,
        settingQuality: data.settingQuality,
        difficulty: data.difficulty,
        variety: data.variety,
        crowding: data.crowding,
        cleanliness: data.cleanliness,
        vibe: data.vibe,
        reviewText: data.reviewText,
        tags: data.tags || [],
        photos: data.photos || [],
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return review;
  }

  async updateReview(reviewId: string, userId: string, data: any) {
    // Find the review
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns this review
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // Update the review
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        overallRating: data.overallRating ?? review.overallRating,
        settingQuality: data.settingQuality ?? review.settingQuality,
        difficulty: data.difficulty ?? review.difficulty,
        variety: data.variety ?? review.variety,
        crowding: data.crowding ?? review.crowding,
        cleanliness: data.cleanliness ?? review.cleanliness,
        vibe: data.vibe ?? review.vibe,
        reviewText: data.reviewText ?? review.reviewText,
        tags: data.tags ?? review.tags,
        photos: data.photos ?? review.photos,
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string) {
    // Find the review
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns this review
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Delete the review
    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }
}