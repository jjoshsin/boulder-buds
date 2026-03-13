import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async saveGym(userId: string, gymId: string) {
    // Check if gym exists
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Check if already saved
    const existing = await this.prisma.savedGym.findUnique({
      where: {
        userId_gymId: {
          userId,
          gymId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Gym already saved');
    }

    const saved = await this.prisma.savedGym.create({
      data: {
        userId,
        gymId,
      },
    });

    return { success: true, message: 'Gym saved' };
  }

  async unsaveGym(userId: string, gymId: string) {
    const saved = await this.prisma.savedGym.findUnique({
      where: {
        userId_gymId: {
          userId,
          gymId,
        },
      },
    });

    if (!saved) {
      throw new NotFoundException('Gym not saved');
    }

    await this.prisma.savedGym.delete({
      where: {
        userId_gymId: {
          userId,
          gymId,
        },
      },
    });

    return { success: true, message: 'Gym unsaved' };
  }

  async isSaved(userId: string, gymId: string): Promise<boolean> {
    const saved = await this.prisma.savedGym.findUnique({
      where: {
        userId_gymId: {
          userId,
          gymId,
        },
      },
    });

    return !!saved;
  }

  private calculateAverageRating(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.overallRating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  async getSavedGyms(userId: string) {
    const savedGyms = await this.prisma.savedGym.findMany({
      where: { userId },
      include: {
        gym: {
          include: {
            reviews: {
              select: {
                overallRating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return savedGyms.map(saved => {
      const reviewCount = saved.gym.reviews.length;
      const rating = this.calculateAverageRating(saved.gym.reviews);

      return {
        id: saved.id,
        createdAt: saved.createdAt,
        gym: {
          id: saved.gym.id,
          name: saved.gym.name,
          address: saved.gym.address,
          city: saved.gym.city,
          state: saved.gym.state,
          latitude: saved.gym.latitude,
          longitude: saved.gym.longitude,
          rating,
          reviewCount,
          officialPhotos: saved.gym.officialPhotos,
          amenities: saved.gym.amenities,
          climbingTypes: saved.gym.climbingTypes,
        },
      };
    });
  }

  async getSavedCount(userId: string) {
    return this.prisma.savedGym.count({
      where: { userId },
    });
  }
}