import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async followUser(followerId: string, followingId: string) {
    // Can't follow yourself
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if user exists
    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    // Create follow relationship
    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return { success: true, message: 'User followed successfully' };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return { success: true, message: 'User unfollowed successfully' };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return { isFollowing: !!follow };
  }

  async getFriendActivity(userId: string, limit: number = 10) {
    // Get list of users that the current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Get recent reviews from followed users
const reviews = await this.prisma.review.findMany({
  where: {
    userId: { in: followingIds },
  },
  include: {
    user: {
      select: {
        displayName: true,
      },
    },
    gym: {
      select: {
        id: true, 
        name: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: limit,
});

// Get recent community photos from followed users
const photos = await this.prisma.communityPhoto.findMany({
  where: {
    userId: { in: followingIds },
  },
  include: {
    user: {
      select: {
        displayName: true,
      },
    },
    gym: {
      select: {
        id: true,  
        name: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: limit,
});

// Combine and sort by date
const activities = [
  ...reviews.map(review => ({
    type: 'review' as const,
    id: review.id,
    user: review.user.displayName,
    gym: review.gym.name,
    gymId: review.gymId,
    rating: review.overallRating,
    text: review.reviewText,
    setting: review.setting,
    difficulty: review.difficulty,
    photos: review.photos || [],
    createdAt: review.createdAt.toISOString(),  // Convert to string
  })),
  ...photos.map(photo => ({
    type: 'photo' as const,
    id: photo.id,
    user: photo.user.displayName,
    gym: photo.gym.name,
    gymId: photo.gymId,
    photoUrl: photo.url,
    createdAt: photo.createdAt.toISOString(),  // Convert to string
  })),
].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
 .slice(0, limit);

return activities;
  }
}