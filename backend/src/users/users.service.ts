import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET;
  }
    

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      birthday: user.birthday,
      borough: user.borough,
      climbingLevel: user.climbingLevel,
      climbingType: user.climbingType,
    };
  }

  async updateProfile(
    userId: string,
    data: { 
      displayName?: string; 
      birthday?: string; 
      borough?: string;
      climbingLevel?: string;
      climbingType?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        birthday: data.birthday,
        borough: data.borough,
        climbingLevel: data.climbingLevel,
        climbingType: data.climbingType,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
    };
  }

  async getUserReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            borough: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews;
  }

  async getUserPhotos(userId: string) {
    const photos = await this.prisma.communityPhoto.findMany({
      where: { userId },
      include: {
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
    });

    return photos;
  }

  // NEW: Get follower/following stats
  async getFollowStats(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }

  // NEW: Get followers list
  async getFollowers(userId: string) {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            climbingLevel: true,
            borough: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return followers.map(f => f.follower);
  }

  // NEW: Get following list
  async getFollowing(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            displayName: true,
            climbingLevel: true,
            borough: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return following.map(f => f.following);
  }

  // NEW: Search users
  async searchUsers(query: string, currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          { id: { not: currentUserId } }, // Exclude current user
        ],
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        climbingLevel: true,
        borough: true,
      },
      take: 20,
    });

    return users;
  }

  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload to S3
    const key = `profile-photos/${uuidv4()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const photoUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoUrl },
    });

    return { profilePhoto: updatedUser.profilePhoto };
  }
}