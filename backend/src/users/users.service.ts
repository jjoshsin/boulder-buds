import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UsersService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private prisma: PrismaService, private uploadService: UploadService) {
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
      city: user.city,
      state: user.state,
      climbingLevel: user.climbingLevel,
      climbingType: user.climbingType,
    };
  }

  async updateProfile(
    userId: string,
    data: { 
      displayName?: string; 
      birthday?: string;
      city?: string;
      state?: string;
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
        city: data.city,
        state: data.state,
        climbingLevel: data.climbingLevel,
        climbingType: data.climbingType,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      city: updatedUser.city,
      state: updatedUser.state,
      climbingType: updatedUser.climbingType,
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
            city: true,
            state: true,
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
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return photos;
  }

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

  async getFollowers(userId: string) {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            climbingLevel: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return followers.map(f => f.follower);
  }

  async getFollowing(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            displayName: true,
            climbingLevel: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return following.map(f => f.following);
  }

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
          { id: { not: currentUserId } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        climbingLevel: true,
        city: true,
        state: true,
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

    const key = `profile-photos/${uuidv4()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const photoUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoUrl },
    });

    return { profilePhoto: updatedUser.profilePhoto };
  }

  async deleteAccount(userId: string): Promise<void> {
  console.log(`🗑️ Starting account deletion for user ${userId}`);

  // 1. Collect all S3 photo URLs that need to be deleted
  const photoUrls: string[] = [];

  // Get user's profile photo
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.profilePhoto) {
    photoUrls.push(user.profilePhoto);
  }

  // Get all review photos by this user
  const reviews = await this.prisma.review.findMany({
    where: { userId },
    select: { photos: true },
  });

  reviews.forEach(review => {
    if (review.photos && review.photos.length > 0) {
      photoUrls.push(...review.photos);
    }
  });

  // Get all community photos by this user
  const communityPhotos = await this.prisma.communityPhoto.findMany({
    where: { userId },
    select: { url: true },
  });

  communityPhotos.forEach(photo => {
    photoUrls.push(photo.url);
  });

  console.log(`📸 Found ${photoUrls.length} photos to delete from S3`);

  // 2. Delete all photos from S3
  if (photoUrls.length > 0) {
    await this.uploadService.deleteImages(photoUrls);
  }

  // 3. Delete user from database (cascades will handle related records)
  await this.prisma.user.delete({
    where: { id: userId },
  });

  console.log(`✅ Successfully deleted account for user ${userId}`);
}
}