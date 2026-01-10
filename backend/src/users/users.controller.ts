import { Controller, Patch, Get, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { 
      displayName?: string; 
      birthday?: string; 
      borough?: string;
      climbingLevel?: string;
      climbingType?: string;
    },
  ) {
    return this.usersService.updateProfile(id, body);
  }
}