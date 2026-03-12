import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Post()
  async createReport(@Body() body: {
    reportedUserId?: string;
    contentType: string;
    contentId?: string;
    reason: string;
    description?: string;
  }, @Request() req) {
    return this.reportingService.createReport({
      reporterId: req.user.userId,
      ...body,
    });
  }

  @Get('my-reports')
  async getMyReports(@Request() req) {
    return this.reportingService.getUserReports(req.user.userId);
  }
}