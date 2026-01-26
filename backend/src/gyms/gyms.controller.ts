import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
    // TODO: Accept lat/long from query params
    return this.gymsService.getNearbyGyms();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getGymById(@Param('id') id: string) {
    return this.gymsService.getGymById(id);
  }
}