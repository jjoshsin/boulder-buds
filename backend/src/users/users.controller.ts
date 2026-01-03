// ============================================
// FILE: backend/src/users/users.controller.ts
// ============================================
import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { displayName?: string; birthday?: string; borough?: string },
  ) {
    return this.usersService.updateProfile(id, body);
  }
}