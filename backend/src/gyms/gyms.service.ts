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
  dayPassPrice?: number;
  monthlyMembershipPrice?: number;
  studentDiscountAvailable?: boolean;
  studentDiscountDetails?: string;
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
      dayPassPrice: data.dayPassPrice ?? null,
      monthlyMembershipPrice: data.monthlyMembershipPrice ?? null,
      studentDiscountAvailable: data.studentDiscountAvailable ?? false,
      studentDiscountDetails: data.studentDiscountDetails ?? null,
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
    dayPassPrice: gym.dayPassPrice,
    monthlyMembershipPrice: gym.monthlyMembershipPrice,
    studentDiscountAvailable: gym.studentDiscountAvailable,
    studentDiscountDetails: gym.studentDiscountDetails,
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
      dayPassPrice: gym.dayPassPrice,
      monthlyMembershipPrice: gym.monthlyMembershipPrice,
      studentDiscountAvailable: gym.studentDiscountAvailable,
      studentDiscountDetails: gym.studentDiscountDetails,
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
    dayPassPrice: gym.dayPassPrice,
    monthlyMembershipPrice: gym.monthlyMembershipPrice,
    studentDiscountAvailable: gym.studentDiscountAvailable,
    studentDiscountDetails: gym.studentDiscountDetails,
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
    registeredByUser: gym.registeredByUser,
    dayPassPrice: gym.dayPassPrice,
    monthlyMembershipPrice: gym.monthlyMembershipPrice,
    studentDiscountAvailable: gym.studentDiscountAvailable,
    studentDiscountDetails: gym.studentDiscountDetails,
  };
}

async getGymsNearLocation(latitude: number, longitude: number, radiusMiles: number = 15) {
  console.log('=== GET GYMS NEAR LOCATION ===');
  console.log('User location:', latitude, longitude);
  console.log('Radius:', radiusMiles);

  const allGyms = await this.prisma.gym.findMany({
    include: {
      reviews: {
        select: {
          overallRating: true,
        },
      },
    },
  });

  console.log('Total gyms in database:', allGyms.length);

  // Calculate distance for each gym
  const gymsWithDistance = allGyms.map(gym => {
    const distance = this.calculateDistance(latitude, longitude, gym.latitude, gym.longitude);
    console.log(`${gym.name}: (${gym.latitude}, ${gym.longitude}) = ${distance} miles`);
    return {
      ...gym,
      distance,
    };
  });

  // Filter gyms within the radius
  const nearbyGyms = gymsWithDistance.filter(gym => gym.distance <= radiusMiles);

  console.log('Gyms within radius:', nearbyGyms.length);

  // Sort by distance (closest first)
  nearbyGyms.sort((a, b) => a.distance - b.distance);

  // Calculate ratings and format response
  const result = nearbyGyms.map(gym => {
    const reviewCount = gym.reviews.length;
    const rating = this.calculateAverageRating(gym.reviews);

    return {
      id: gym.id,
      name: gym.name,
      address: gym.address,
      city: gym.city,
      state: gym.state,
      latitude: gym.latitude,
      longitude: gym.longitude,
      rating,
      reviewCount,
      officialPhotos: gym.officialPhotos,
      amenities: gym.amenities,
      climbingTypes: gym.climbingTypes,
      distance: Math.round(gym.distance * 10) / 10,
      dayPassPrice: gym.dayPassPrice,
      monthlyMembershipPrice: gym.monthlyMembershipPrice,
      studentDiscountAvailable: gym.studentDiscountAvailable,
      studentDiscountDetails: gym.studentDiscountDetails,
    };
  });

  console.log('Returning gyms with distances:', result.map(g => `${g.name}: ${g.distance}mi`));
  console.log('=== END ===');

  return result;
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

  // Fetch and store official photos for a gym.
  // Pass force=true to re-fetch even if the gym already has photos (e.g. to replace expired URLs).
  async fetchOfficialPhotos(gymId: string, force = false): Promise<string[]> {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Skip if already has proxy URLs and not forcing a refresh
    const alreadyHasProxyUrls =
      gym.officialPhotos &&
      gym.officialPhotos.length > 0 &&
      !gym.officialPhotos[0].includes('maps.googleapis.com');

    if (!force && alreadyHasProxyUrls) {
      console.log(`Gym ${gym.name} already has ${gym.officialPhotos.length} proxy photo URLs`);
      return gym.officialPhotos;
    }

    console.log(`Fetching official photos for: ${gym.name}`);

    const { placeId, photoUrls } = await this.googlePlacesService.fetchAndSetGymPhotos(
      gym.name,
      gym.address,
    );

    if (photoUrls.length === 0) {
      console.log(`No photos found for ${gym.name}`);
      return [];
    }

    // Store proxy URLs instead of raw Google URLs so they never expire in the DB
    const baseUrl = process.env.BACKEND_URL || 'http://192.168.1.166:3000';
    const proxyUrls = photoUrls.map(
      (_, index) => `${baseUrl}/gyms/${gymId}/photo/${index}`,
    );

    const updatedGym = await this.prisma.gym.update({
      where: { id: gymId },
      data: {
        officialPhotos: proxyUrls,
        ...(placeId ? { placeId } : {}),
      },
    });

    console.log(`Saved ${proxyUrls.length} proxy photo URLs for ${gym.name}`);

    return updatedGym.officialPhotos;
  }

  // Returns a fresh Google photo URL for a specific photo index by re-fetching
  // the photo reference from Google using the stored placeId.
  async getPhotoUrl(gymId: string, index: number): Promise<string | null> {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym || !gym.placeId) {
      return null;
    }

    const urls = await this.googlePlacesService.getFreshPhotoUrls(gym.placeId, 3);
    return urls[index] ?? null;
  }

  // Batch fetch photos for all gyms without proxy photo URLs
  async fetchAllMissingOfficialPhotos(): Promise<void> {
    const allGyms = await this.prisma.gym.findMany();

    const gyms = allGyms.filter(
      gym => !gym.officialPhotos || gym.officialPhotos.length === 0,
    );

    console.log(`Found ${gyms.length} gyms without official photos`);

    for (const gym of gyms) {
      console.log(`\nProcessing: ${gym.name}`);

      try {
        await this.fetchOfficialPhotos(gym.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${gym.name}:`, error);
      }
    }

    console.log('\nFinished fetching official photos for all gyms');
  }

  // Force re-fetch photos for ALL gyms, replacing any stale/expired Google URLs with fresh proxy URLs
  async forceRefreshAllPhotos(): Promise<void> {
    const gyms = await this.prisma.gym.findMany();

    console.log(`Force-refreshing photos for ${gyms.length} gyms`);

    for (const gym of gyms) {
      console.log(`\nRefreshing: ${gym.name}`);

      try {
        await this.fetchOfficialPhotos(gym.id, true);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error refreshing ${gym.name}:`, error);
      }
    }

    console.log('\nFinished force-refreshing all gym photos');
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

  async updatePricing(gymId: string, data: {
    dayPassPrice?: number | null;
    monthlyMembershipPrice?: number | null;
    studentDiscountAvailable?: boolean;
    studentDiscountDetails?: string | null;
  }) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');

    return this.prisma.gym.update({
      where: { id: gymId },
      data: {
        dayPassPrice: data.dayPassPrice,
        monthlyMembershipPrice: data.monthlyMembershipPrice,
        studentDiscountAvailable: data.studentDiscountAvailable,
        studentDiscountDetails: data.studentDiscountDetails,
      },
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

private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = this.toRad(lat2 - lat1);
  const dLon = this.toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

private toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
}