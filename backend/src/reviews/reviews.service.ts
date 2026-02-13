import { Injectable, ConflictException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

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
  const review = await this.prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundException('Review not found');
  }

  if (review.userId !== userId) {
    throw new UnauthorizedException('Not authorized to delete this review');
  }

  // Delete photos from S3 if any
  if (review.photos && review.photos.length > 0) {
    await Promise.all(
      review.photos.map(photoUrl => this.uploadService.deleteImage(photoUrl))
    );
  }

  await this.prisma.review.delete({
    where: { id: reviewId },
  });

  return { success: true };
}

async toggleLike(reviewId: string, userId: string) {
  const existing = await this.prisma.reviewLike.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
  });

  if (existing) {
    await this.prisma.reviewLike.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });
  } else {
    await this.prisma.reviewLike.create({
      data: { reviewId, userId },
    });
  }

  const likeCount = await this.prisma.reviewLike.count({
    where: { reviewId },
  });

  return {
    liked: !existing,
    likeCount,
  };
}
}