import { Controller, Get, Param, Post, Patch, UseGuards, Body, Request, Query, Delete, BadRequestException, } from '@nestjs/common';
import { GymsService } from './gyms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gyms')
export class GymsController {
  constructor(private gymsService: GymsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllGyms() {
    return this.gymsService.getAllGyms();
  }

  // IMPORTANT: All specific routes MUST come before ':id' route
  @UseGuards(JwtAuthGuard)
  @Get('popular')
  async getPopularGyms(@Query('climbingType') climbingType?: string) {
    return this.gymsService.getPopularGyms(climbingType);
  }

@UseGuards(JwtAuthGuard)
@Get('nearby')
async getNearbyGyms(
  @Query('latitude') latitude?: string,
  @Query('longitude') longitude?: string,
  @Query('radius') radius?: string,
  @Query('climbingType') climbingType?: string,
  @Request() req?,
) {
  console.log('=== NEARBY GYMS ENDPOINT CALLED ===');
  console.log('Latitude:', latitude);
  console.log('Longitude:', longitude);
  console.log('Radius:', radius);
  console.log('ClimbingType:', climbingType);

  // If coordinates provided, use new location-based method
  if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMiles = radius ? parseFloat(radius) : 15;

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Invalid coordinates');
    }

    return this.gymsService.getGymsNearLocation(lat, lng, radiusMiles);
  }

  // Otherwise, use old method for HomeScreen
  return this.gymsService.getNearbyGyms(climbingType);
}

  // NEW: Fetch photos for ALL gyms (run this once to populate all gyms)
  @UseGuards(JwtAuthGuard)
  @Post('fetch-all-official-photos')
  async fetchAllOfficialPhotos() {
    await this.gymsService.fetchAllMissingOfficialPhotos();
    return {
      success: true,
      message: 'Started fetching official photos for all gyms',
    };
  }

  // ':id' route MUST come after all specific routes
@UseGuards(JwtAuthGuard)
@Get(':id')
async getGymById(@Param('id') id: string) {
  console.log('=== GET GYM BY ID CALLED ===');
  console.log('ID:', id);
  return this.gymsService.getGymById(id);
}

  @UseGuards(JwtAuthGuard)
  @Post(':id/community-photos')
  async addCommunityPhoto(
    @Param('id') id: string,
    @Body() body: { url: string; caption?: string },
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.gymsService.addCommunityPhoto(id, userId, body.url, body.caption);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/photos')
  async addGymPhotos(
    @Param('id') id: string,
    @Body() body: { photos: string[] },
  ) {
    return this.gymsService.addPhotos(id, body.photos);
  }

  // NEW: Manually trigger photo fetch for a specific gym
  @UseGuards(JwtAuthGuard)
  @Post(':id/fetch-official-photos')
  async fetchOfficialPhotos(@Param('id') id: string) {
    const photos = await this.gymsService.fetchOfficialPhotos(id);
    return {
      success: true,
      photoCount: photos.length,
      photos,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGym(
    @Request() req,
    @Body() body: {
      name: string;
      address: string;
      city: string;
      state: string;
      latitude?: number;
      longitude?: number;
      amenities?: string[];
      priceRange?: number;
      climbingTypes?: string[];
    }
  ) {
    return this.gymsService.createGym({
      ...body,
      userId: req.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/amenities')
  async updateAmenities(
    @Param('id') id: string,
    @Body() body: { amenities: string[] },
  ) {
    return this.gymsService.updateAmenities(id, body.amenities);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteGym(@Param('id') id: string, @Request() req) {
    return this.gymsService.deleteGym(id, req.user.userId);
  }
}