import { Injectable, ConflictException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

async createReview(data: {
  userId: string;
  gymId: string;
  overallRating: number;
  setting: string;
  difficulty: string;
  reviewText?: string;
  photos?: string[];
}) {
  const review = await this.prisma.review.create({
    data: {
      userId: data.userId,
      gymId: data.gymId,
      overallRating: data.overallRating,
      setting: data.setting,
      difficulty: data.difficulty,
      reviewText: data.reviewText,
      photos: data.photos || [],
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  return review;
}

async updateReview(reviewId: string, userId: string, data: {
  overallRating?: number;
  setting?: string;
  difficulty?: string;
  reviewText?: string;
  photos?: string[];
}) {
  const review = await this.prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundException('Review not found');
  }

  if (review.userId !== userId) {
    throw new UnauthorizedException('You can only edit your own reviews');
  }

  const updatedReview = await this.prisma.review.update({
    where: { id: reviewId },
    data: {
      overallRating: data.overallRating,
      setting: data.setting,
      difficulty: data.difficulty,
      reviewText: data.reviewText,
      photos: data.photos,
    },
    include: {
      user: {
        select: {
          id: true,
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