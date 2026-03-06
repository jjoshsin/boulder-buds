import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GooglePlacesService } from './google-places.service';
import { GeocodingService } from './geocoding.service'; 

@Injectable()
export class GymsService {
  constructor(
    private prisma: PrismaService,
    private googlePlacesService: GooglePlacesService,
    private geocodingService: GeocodingService,
  ) {}

async createGym(data: {
  name: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  priceRange?: number;
  climbingTypes?: string[];
  userId: string;
}) {
  // Validate input lengths
  if (data.name.trim().length < 3) {
    throw new BadRequestException('Gym name must be at least 3 characters');
  }

  if (data.address.trim().length < 5) {
    throw new BadRequestException('Street address must be at least 5 characters');
  }

  // Address must contain at least one number (street number)
  if (!/\d/.test(data.address)) {
    throw new BadRequestException('Street address must include a street number');
  }

  if (data.city.trim().length < 2) {
    throw new BadRequestException('City name must be at least 2 characters');
  }

  let latitude = data.latitude;
  let longitude = data.longitude;

  if (!latitude || !longitude) {
    console.log(`🗺️ Geocoding full address: ${data.address}, ${data.city}, ${data.state}`);
    
    // Geocode the full address
    const geocodeResult = await this.geocodingService.geocodeAddressWithValidation(
      data.address,
      data.city,
      data.state,
    );

    if (!geocodeResult) {
      throw new BadRequestException(
        'Unable to verify this address. Please ensure the street address, city, and state are valid and match an existing location.',
      );
    }

    latitude = geocodeResult.lat;
    longitude = geocodeResult.lng;

    console.log(`✅ Validated address: (${latitude}, ${longitude})`);
  }

  const gym = await this.prisma.gym.create({
    data: {
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state,
      latitude,
      longitude,
      officialPhotos: [],
      amenities: data.amenities || [],
      priceRange: data.priceRange?.toString() || '2',
      climbingTypes: data.climbingTypes || ['bouldering'],
      registeredBy: data.userId,
    },
  });

  console.log(`✅ Created gym: ${gym.name} at (${latitude}, ${longitude})`);

  try {
    await this.fetchOfficialPhotos(gym.id);
  } catch (error) {
    console.error('Failed to fetch official photos:', error);
  }

  return gym;
}

async getAllGyms() {
  const gyms = await this.prisma.gym.findMany({
    include: {
      reviews: {
        select: { overallRating: true },
      },
    },
  });

  return gyms.map(gym => ({
    id: gym.id,
    name: gym.name,
    address: gym.address,
    city: gym.city,
    state: gym.state,
    latitude: gym.latitude,
    longitude: gym.longitude,
    officialPhotos: gym.officialPhotos,
    amenities: gym.amenities,
    priceRange: gym.priceRange,
    climbingTypes: gym.climbingTypes,
    rating: this.calculateAverageRating(gym.reviews),
    reviewCount: gym.reviews.length,
  }));
}

async getPopularGyms(climbingType?: string) {
  const gyms = await this.prisma.gym.findMany({
    where: climbingType ? {
      climbingTypes: { has: climbingType },
    } : {},
    include: {
      reviews: {
        select: { overallRating: true },
      },
    },
    take: 10,
  });

  return gyms
    .map(gym => ({
      id: gym.id,
      name: gym.name,
      city: gym.city,
      state: gym.state,
      officialPhotos: gym.officialPhotos,
      rating: this.calculateAverageRating(gym.reviews),
      reviewCount: gym.reviews.length,
      tags: gym.amenities.slice(0, 2),
      climbingTypes: gym.climbingTypes,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount);
}

async getNearbyGyms(climbingType?: string) {
  const gyms = await this.prisma.gym.findMany({
    where: climbingType ? {
      climbingTypes: { has: climbingType },
    } : {},
    include: {
      reviews: {
        select: { overallRating: true },
      },
    },
  });

  return gyms.map(gym => ({
    id: gym.id,
    name: gym.name,
    city: gym.city,
    state: gym.state,
    address: gym.address,
    latitude: gym.latitude,
    longitude: gym.longitude,
    officialPhotos: gym.officialPhotos,
    distance: '0.0 mi',
    rating: this.calculateAverageRating(gym.reviews),
    reviewCount: gym.reviews.length,
    tags: gym.amenities.slice(0, 2),
    climbingTypes: gym.climbingTypes,
  }));
}

async getGymById(id: string) {
  const gym = await this.prisma.gym.findUnique({
    where: { id },
    include: {
      registeredByUser: {  // Added
        select: {
          id: true,
          displayName: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      communityPhotos: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
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

  // Sort reviews by like count
  const reviewsWithLikeCount = gym.reviews.map(review => ({
    ...review,
    likeCount: review.likes.length,
  })).sort((a, b) => b.likeCount - a.likeCount);

  return {
    id: gym.id,
    name: gym.name,
    address: gym.address,
    city: gym.city,
    state: gym.state,
    latitude: gym.latitude,
    longitude: gym.longitude,
    officialPhotos: gym.officialPhotos,
    communityPhotos: gym.communityPhotos,
    amenities: gym.amenities,
    priceRange: gym.priceRange,
    climbingTypes: gym.climbingTypes,
    rating: this.calculateAverageRating(gym.reviews),
    reviewCount: gym.reviews.length,
    reviews: reviewsWithLikeCount,
    registeredByUser: gym.registeredByUser,  // Added
  };
}

  private calculateAverageRating(reviews: { overallRating: number }[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.overallRating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  // NEW: Add community photo
  async addCommunityPhoto(gymId: string, userId: string, photoUrl: string, caption?: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const communityPhoto = await this.prisma.communityPhoto.create({
      data: {
        url: photoUrl,
        caption: caption,
        gymId: gymId,
        userId: userId,
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return communityPhoto;
  }

  // OPTIONAL: Keep this for backward compatibility, but mark as deprecated
  async addPhotos(gymId: string, photoUrls: string[]) {
    console.log('DEPRECATED: Use addCommunityPhoto instead');
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // For now, add to officialPhotos (you can change this logic)
    const updatedGym = await this.prisma.gym.update({
      where: { id: gymId },
      data: {
        officialPhotos: [...gym.officialPhotos, ...photoUrls],
      },
    });

    return {
      id: updatedGym.id,
      photos: updatedGym.officialPhotos,
    };
  }

  // NEW: Automatically fetch and set official photos for a gym
  async fetchOfficialPhotos(gymId: string): Promise<string[]> {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Check if gym already has official photos
    if (gym.officialPhotos && gym.officialPhotos.length > 0) {
      console.log(`Gym ${gym.name} already has ${gym.officialPhotos.length} official photos`);
      return gym.officialPhotos;
    }

    console.log(`Fetching official photos for: ${gym.name}`);

    // Fetch photos from Google Places
    const photoUrls = await this.googlePlacesService.fetchAndSetGymPhotos(
      gym.name,
      gym.address,
    );

    if (photoUrls.length === 0) {
      console.log(`No photos found for ${gym.name}`);
      return [];
    }

    // Save photos to database
    const updatedGym = await this.prisma.gym.update({
      where: { id: gymId },
      data: {
        officialPhotos: photoUrls,
      },
    });

    console.log(`Saved ${photoUrls.length} official photos for ${gym.name}`);
    
    return updatedGym.officialPhotos;
  }

  // NEW: Batch fetch photos for all gyms without official photos
async fetchAllMissingOfficialPhotos(): Promise<void> {
  // Get ALL gyms first
  const allGyms = await this.prisma.gym.findMany();
  
  // Filter in JavaScript for gyms without official photos
  const gyms = allGyms.filter(
    gym => !gym.officialPhotos || gym.officialPhotos.length === 0
  );

  console.log(`Found ${gyms.length} gyms without official photos`);

  for (const gym of gyms) {
    console.log(`\nProcessing: ${gym.name}`);
    
    try {
      await this.fetchOfficialPhotos(gym.id);
      
      // Add delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing ${gym.name}:`, error);
    }
  }

  console.log('\nFinished fetching official photos for all gyms');
}

async getGymsMapData() {
  const gyms = await this.prisma.gym.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      city: true,
      state: true,
      reviews: {
        select: {
          overallRating: true,
        },
      },
    },
  });

  return gyms.map(gym => {
    const reviewCount = gym.reviews.length;
    const avgRating = reviewCount > 0
      ? gym.reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount
      : 0;

    return {
      id: gym.id,
      name: gym.name,
      latitude: gym.latitude,
      longitude: gym.longitude,
      city: gym.city,
      state: gym.state,
      reviewCount,
      rating: Math.round(avgRating * 10) / 10,
    };
  });
}

  async updateAmenities(gymId: string, amenities: string[]) {
  const gym = await this.prisma.gym.findUnique({
    where: { id: gymId },
  });

  if (!gym) {
    throw new NotFoundException('Gym not found');
  }

  const updatedGym = await this.prisma.gym.update({
    where: { id: gymId },
    data: { amenities },
  });

  return updatedGym;
}
async deleteGym(gymId: string, userId: string) {
  const gym = await this.prisma.gym.findUnique({
    where: { id: gymId },
  });

  if (!gym) {
    throw new NotFoundException('Gym not found');
  }

  // Only allow the user who registered the gym to delete it
  if (gym.registeredBy !== userId) {
    throw new UnauthorizedException('You can only delete gyms you registered');
  }

  // Delete the gym (cascade will handle reviews, photos, videos, etc.)
  await this.prisma.gym.delete({
    where: { id: gymId },
  });

  return { success: true, message: 'Gym deleted successfully' };
}
}