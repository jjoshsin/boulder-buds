import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async createReport(data: {
    reporterId: string;
    reportedUserId?: string;
    contentType: string;
    contentId?: string;
    reason: string;
    description?: string;
  }) {
    // Validate reason
    const validReasons = ['spam', 'harassment', 'inappropriate', 'false_info', 'other'];
    if (!validReasons.includes(data.reason)) {
      throw new BadRequestException('Invalid report reason');
    }

    // Validate content type
    const validContentTypes = ['review', 'video', 'comment', 'user'];
    if (!validContentTypes.includes(data.contentType)) {
      throw new BadRequestException('Invalid content type');
    }

    // Cannot report yourself
    if (data.reportedUserId && data.reportedUserId === data.reporterId) {
      throw new BadRequestException('You cannot report yourself');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId: data.reporterId,
        reportedUserId: data.reportedUserId,
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason,
        description: data.description,
      },
    });

    return { success: true, message: 'Report submitted successfully', reportId: report.id };
  }

  async getUserReports(userId: string) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      include: {
        reportedUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportsAgainstUser(userId: string) {
    return this.prisma.report.findMany({
      where: { reportedUserId: userId },
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin functions
  async getAllReports(status?: string) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReportStatus(
    reportId: string,
    status: string,
    reviewerId: string,
  ) {
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }
}