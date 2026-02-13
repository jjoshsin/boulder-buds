import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getAllGyms() {
    const gyms = await this.prisma.gym.findMany({
      include: {
        reviews: {
          select: {
            overallRating: true,
          },
        },
        communityPhotos: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
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

    return gyms.map(gym => ({
      id: gym.id,
      name: gym.name,
      address: gym.address,
      borough: gym.borough,
      latitude: gym.latitude,
      longitude: gym.longitude,
      officialPhotos: gym.officialPhotos,
      communityPhotos: gym.communityPhotos,
      amenities: gym.amenities,
      priceRange: gym.priceRange,
      climbingTypes: gym.climbingTypes,
      rating: this.calculateAverageRating(gym.reviews),
      reviewCount: gym.reviews.length,
    }));
  }

  async getPopularGyms() {
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

    const sorted = gyms
      .map(gym => ({
        id: gym.id,
        name: gym.name,
        borough: gym.borough,
        officialPhotos: gym.officialPhotos, // Show official photos in main card
        rating: this.calculateAverageRating(gym.reviews),
        reviewCount: gym.reviews.length,
        tags: gym.amenities?.slice(0, 2) || [],
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5);

    return sorted;
  }

  async getNearbyGyms() {
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
      latitude: gym.latitude,
      longitude: gym.longitude,
      officialPhotos: gym.officialPhotos, // Show official photos
      distance: '0.0 mi',
      rating: this.calculateAverageRating(gym.reviews),
      reviewCount: gym.reviews.length,
      tags: gym.amenities.slice(0, 2),
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

  return {
  id: gym.id,
  name: gym.name,
  address: gym.address,
  borough: gym.borough,
  latitude: gym.latitude,
  longitude: gym.longitude,
  officialPhotos: gym.officialPhotos,
  communityPhotos: gym.communityPhotos,
  amenities: gym.amenities,
  priceRange: gym.priceRange,
  climbingTypes: gym.climbingTypes,
  rating: this.calculateAverageRating(gym.reviews),
  reviewCount: gym.reviews.length,
  reviews: gym.reviews.map(review => ({
    ...review,
    likeCount: review.likes.length,
  })),
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
    console.log('⚠️ DEPRECATED: Use addCommunityPhoto instead');
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
      console.log(`✅ Gym ${gym.name} already has ${gym.officialPhotos.length} official photos`);
      return gym.officialPhotos;
    }

    console.log(`🔍 Fetching official photos for: ${gym.name}`);

    // Fetch photos from Google Places
    const photoUrls = await this.googlePlacesService.fetchAndSetGymPhotos(
      gym.name,
      gym.address,
    );

    if (photoUrls.length === 0) {
      console.log(`❌ No photos found for ${gym.name}`);
      return [];
    }

    // Save photos to database
    const updatedGym = await this.prisma.gym.update({
      where: { id: gymId },
      data: {
        officialPhotos: photoUrls,
      },
    });

    console.log(`✅ Saved ${photoUrls.length} official photos for ${gym.name}`);
    
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

  console.log(`📸 Found ${gyms.length} gyms without official photos`);

  for (const gym of gyms) {
    console.log(`\n🏋️ Processing: ${gym.name}`);
    
    try {
      await this.fetchOfficialPhotos(gym.id);
      
      // Add delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error processing ${gym.name}:`, error);
    }
  }

  console.log('\n✅ Finished fetching official photos for all gyms');
}

  async createGym(data: {
    name: string;
    address: string;
    borough: string;
    latitude?: number;
    longitude?: number;
    amenities?: string[];
    priceRange?: number;
    climbingTypes?: string[];
  }) {
    let latitude = data.latitude;
    let longitude = data.longitude;

    // If coordinates not provided, geocode the address
    if (!latitude || !longitude) {
      console.log(`🗺️ No coordinates provided, geocoding address...`);
      const coords = await this.geocodingService.geocodeAddress(data.address, data.borough);
      
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      } else {
        // Default to NYC center if geocoding fails
        console.warn(`⚠️ Geocoding failed, using default NYC coordinates`);
        latitude = 40.7128;
        longitude = -74.0060;
      }
    }

    // Create the gym
    const gym = await this.prisma.gym.create({
      data: {
        name: data.name,
        address: data.address,
        borough: data.borough,
        latitude,
        longitude,
        officialPhotos: [],
        amenities: data.amenities || [],
        priceRange: data.priceRange || 2,
        climbingTypes: data.climbingTypes || ['bouldering'],
      },
    });

    console.log(`✅ Created gym: ${gym.name} at (${latitude}, ${longitude})`);

    // Automatically fetch official photos after creating gym
    try {
      console.log(`🔍 Fetching official photos for new gym: ${gym.name}`);
      await this.fetchOfficialPhotos(gym.id);
    } catch (error) {
      console.error('Failed to fetch official photos:', error);
    }

    return gym;
  }

async getGymsMapData() {
  const gyms = await this.prisma.gym.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      borough: true,
      reviews: {
        select: {
          overallRating: true,
        },
      },
    },
  });

  // Calculate average rating and review count for each gym
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
      borough: gym.borough,
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
}