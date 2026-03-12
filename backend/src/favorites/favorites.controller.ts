import { Controller, Post, Delete, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post()
  async addFavorite(
    @Body() body: {
      gymId: string;
      listType: string;
      notes?: string;
    },
    @Request() req,
  ) {
    return this.favoritesService.addFavorite(
      req.user.userId,
      body.gymId,
      body.listType,
      body.notes,
    );
  }

  @Delete(':gymId/:listType')
  async removeFavorite(
    @Param('gymId') gymId: string,
    @Param('listType') listType: string,
    @Request() req,
  ) {
    return this.favoritesService.removeFavorite(req.user.userId, gymId, listType);
  }

  @Get()
  async getUserFavorites(@Query('listType') listType: string, @Request() req) {
    return this.favoritesService.getUserFavorites(req.user.userId, listType);
  }

  @Get('status/:gymId')
  async getFavoriteStatus(@Param('gymId') gymId: string, @Request() req) {
    return this.favoritesService.getFavoriteStatus(req.user.userId, gymId);
  }

  @Get('counts')
  async getFavoriteCounts(@Request() req) {
    return this.favoritesService.getFavoriteCounts(req.user.userId);
  }

  @Patch(':gymId/:listType/notes')
  async updateNotes(
    @Param('gymId') gymId: string,
    @Param('listType') listType: string,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    return this.favoritesService.updateNotes(req.user.userId, gymId, listType, notes);
  }
}