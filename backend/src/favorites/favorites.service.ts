import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addFavorite(userId: string, gymId: string, listType: string, notes?: string) {
    // Validate list type
    const validListTypes = ['favorites', 'want_to_visit', 'bucket_list'];
    if (!validListTypes.includes(listType)) {
      throw new BadRequestException('Invalid list type');
    }

    // Check if gym exists
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Check if already favorited
    const existing = await this.prisma.favoriteGym.findUnique({
      where: {
        userId_gymId_listType: {
          userId,
          gymId,
          listType,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Gym already in this list');
    }

    const favorite = await this.prisma.favoriteGym.create({
      data: {
        userId,
        gymId,
        listType,
        notes,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            rating: true,
            reviewCount: true,
            officialPhotos: true,
          },
        },
      },
    });

    return favorite;
  }

  async removeFavorite(userId: string, gymId: string, listType: string) {
    const favorite = await this.prisma.favoriteGym.findUnique({
      where: {
        userId_gymId_listType: {
          userId,
          gymId,
          listType,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favoriteGym.delete({
      where: {
        userId_gymId_listType: {
          userId,
          gymId,
          listType,
        },
      },
    });

    return { success: true, message: 'Removed from list' };
  }

  async getUserFavorites(userId: string, listType?: string) {
    const favorites = await this.prisma.favoriteGym.findMany({
      where: {
        userId,
        ...(listType ? { listType } : {}),
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            rating: true,
            reviewCount: true,
            officialPhotos: true,
            amenities: true,
            climbingTypes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites.map(fav => ({
      id: fav.id,
      listType: fav.listType,
      notes: fav.notes,
      createdAt: fav.createdAt,
      gym: fav.gym,
    }));
  }

  async isFavorited(userId: string, gymId: string, listType: string): Promise<boolean> {
    const favorite = await this.prisma.favoriteGym.findUnique({
      where: {
        userId_gymId_listType: {
          userId,
          gymId,
          listType,
        },
      },
    });

    return !!favorite;
  }

  async getFavoriteStatus(userId: string, gymId: string) {
    const favorites = await this.prisma.favoriteGym.findMany({
      where: {
        userId,
        gymId,
      },
    });

    return {
      favorites: favorites.some(f => f.listType === 'favorites'),
      want_to_visit: favorites.some(f => f.listType === 'want_to_visit'),
      bucket_list: favorites.some(f => f.listType === 'bucket_list'),
    };
  }

  async updateNotes(userId: string, gymId: string, listType: string, notes: string) {
    const favorite = await this.prisma.favoriteGym.findUnique({
      where: {
        userId_gymId_listType: {
          userId,
          gymId,
          listType,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.prisma.favoriteGym.update({
      where: {
        userId_gymId_listType: {
          userId,
          gymId,
          listType,
        },
      },
      data: { notes },
    });
  }

  async getFavoriteCounts(userId: string) {
    const [favorites, wantToVisit, bucketList] = await Promise.all([
      this.prisma.favoriteGym.count({
        where: { userId, listType: 'favorites' },
      }),
      this.prisma.favoriteGym.count({
        where: { userId, listType: 'want_to_visit' },
      }),
      this.prisma.favoriteGym.count({
        where: { userId, listType: 'bucket_list' },
      }),
    ]);

    return {
      favorites,
      want_to_visit: wantToVisit,
      bucket_list: bucketList,
      total: favorites + wantToVisit + bucketList,
    };
  }
}