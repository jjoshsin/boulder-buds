import { Controller, Get, Post, Delete, Patch, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { ClimbLogsService } from './climb-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('climb-logs')
@UseGuards(JwtAuthGuard)
export class ClimbLogsController {
  constructor(private climbLogsService: ClimbLogsService) {}

  @Post()
  async createLog(
    @Request() req,
    @Body() body: {
      gymId: string;
      climbType: string;
      grade: string;
      outcome: string;
      notes?: string;
      date?: string;
    },
  ) {
    return this.climbLogsService.createLog({ userId: req.user.userId, ...body });
  }

  @Get('me')
  async getMyLogs(@Request() req, @Query('limit') limit?: string) {
    return this.climbLogsService.getUserLogs(req.user.userId, limit ? parseInt(limit) : 50);
  }

  @Get('me/stats')
  async getMyStats(@Request() req) {
    return this.climbLogsService.getUserStats(req.user.userId);
  }

  @Get('feed')
  async getFriendFeed(@Request() req) {
    return this.climbLogsService.getFriendLogs(req.user.userId);
  }

  @Get('user/:userId')
  async getUserLogs(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.climbLogsService.getUserLogs(userId, limit ? parseInt(limit) : 50);
  }

  @Patch(':id')
  async updateLog(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { grade?: string; outcome?: string; notes?: string },
  ) {
    return this.climbLogsService.updateLog(id, req.user.userId, body);
  }

  @Delete(':id')
  async deleteLog(@Param('id') id: string, @Request() req) {
    return this.climbLogsService.deleteLog(id, req.user.userId);
  }
}
