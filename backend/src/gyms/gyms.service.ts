import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GymsService {
  constructor(private prisma: PrismaService) {}

  async getAllGyms() {
    const gyms = await this.prisma.gym.findMany({
      include: {
        reviews: {
          select: {
            overallRating: true,
          },
        },
      },
    });

    return gyms.map(gym => ({
      id: gym.id,
      name: gym.name,
      address: gym.address,
      borough: gym.borough,
      latitude: gym.latitude,
      longitude: gym.longitude,
      photos: gym.photos,
      amenities: gym.amenities,
      priceRange: gym.priceRange,
      climbingTypes: gym.climbingTypes,
      rating: this.calculateAverageRating(gym.reviews),
      reviewCount: gym.reviews.length,
    }));
  }

  async getPopularGyms() {
    // Get gyms with most reviews
    const gyms = await this.prisma.gym.findMany({
      include: {
        reviews: {
          select: {
            overallRating: true,
          },
        },
      },
      take: 10,
    });

    // Sort by review count
    const sorted = gyms
      .map(gym => ({
        id: gym.id,
        name: gym.name,
        borough: gym.borough,
        photos: gym.photos,
        rating: this.calculateAverageRating(gym.reviews),
        reviewCount: gym.reviews.length,
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5);

    return sorted;
  }

  async getNearbyGyms() {
  // TODO: Calculate distance based on user location
  // For now, just return all gyms
  const gyms = await this.prisma.gym.findMany({
    include: {
      reviews: {
        select: {
          overallRating: true,
        },
      },
    },
  });

  return gyms.map(gym => ({
    id: gym.id,
    name: gym.name,
    borough: gym.borough,
    latitude: gym.latitude,    // ← Add this
    longitude: gym.longitude,  // ← Add this
    distance: '0.0 mi', // Will be calculated on frontend
    rating: this.calculateAverageRating(gym.reviews),
    reviewCount: gym.reviews.length,
    tags: gym.amenities.slice(0, 2), // Show first 2 amenities as tags
  }));
}

  async getGymById(id: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    return {
      id: gym.id,
      name: gym.name,
      address: gym.address,
      borough: gym.borough,
      latitude: gym.latitude,
      longitude: gym.longitude,
      photos: gym.photos,
      amenities: gym.amenities,
      priceRange: gym.priceRange,
      climbingTypes: gym.climbingTypes,
      rating: this.calculateAverageRating(gym.reviews),
      reviewCount: gym.reviews.length,
      reviews: gym.reviews,
    };
  }

  private calculateAverageRating(reviews: { overallRating: number }[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.overallRating, 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
  }

  async addPhotos(gymId: string, photoUrls: string[]) {
  const gym = await this.prisma.gym.findUnique({
    where: { id: gymId },
  });

  if (!gym) {
    throw new NotFoundException('Gym not found');
  }

  // Append new photos to existing ones
  const updatedGym = await this.prisma.gym.update({
    where: { id: gymId },
    data: {
      photos: [...gym.photos, ...photoUrls],
    },
  });

  return {
    id: updatedGym.id,
    photos: updatedGym.photos,
  };
}
}