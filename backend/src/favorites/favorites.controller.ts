import { Controller, Post, Delete, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('saved-gyms')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post(':gymId')
  async saveGym(@Param('gymId') gymId: string, @Request() req) {
    return this.favoritesService.saveGym(req.user.userId, gymId);
  }

  @Delete(':gymId')
  async unsaveGym(@Param('gymId') gymId: string, @Request() req) {
    return this.favoritesService.unsaveGym(req.user.userId, gymId);
  }

  @Get()
  async getSavedGyms(@Request() req) {
    return this.favoritesService.getSavedGyms(req.user.userId);
  }

  @Get('check/:gymId')
  async isSaved(@Param('gymId') gymId: string, @Request() req) {
    const saved = await this.favoritesService.isSaved(req.user.userId, gymId);
    return { saved };
  }

  @Get('count')
  async getSavedCount(@Request() req) {
    const count = await this.favoritesService.getSavedCount(req.user.userId);
    return { count };
  }
}