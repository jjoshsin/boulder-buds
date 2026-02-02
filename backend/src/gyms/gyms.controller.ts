import { Controller, Get, Param, Post, Patch, UseGuards, Body, Request } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get('popular')
  async getPopularGyms() {
    return this.gymsService.getPopularGyms();
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  async getNearbyGyms() {
    return this.gymsService.getNearbyGyms();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getGymById(@Param('id') id: string) {
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

  // Keep old endpoint for backward compatibility
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

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGym(@Body() body: {
    name: string;
    address: string;
    borough: string;
    latitude: number;
    longitude: number;
    amenities?: string[];
    priceRange?: number;
    climbingTypes?: string[];
  }) {
    return this.gymsService.createGym(body);
  }
}