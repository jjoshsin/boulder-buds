import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClimbLogsService {
  constructor(private prisma: PrismaService) {}

  async createLog(data: {
    userId: string;
    gymId: string;
    climbType: string;
    grade: string;
    outcome: string;
    notes?: string;
    date?: string;
  }) {
    return this.prisma.climbLog.create({
      data: {
        userId: data.userId,
        gymId: data.gymId,
        climbType: data.climbType,
        grade: data.grade,
        outcome: data.outcome,
        notes: data.notes,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: {
        gym: { select: { id: true, name: true, city: true, state: true } },
      },
    });
  }

  async getUserLogs(userId: string, limit = 50) {
    return this.prisma.climbLog.findMany({
      where: { userId },
      include: {
        gym: { select: { id: true, name: true, city: true, state: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getUserStats(userId: string) {
    const logs = await this.prisma.climbLog.findMany({
      where: { userId },
      select: { climbType: true, grade: true, outcome: true },
    });

    const totalSessions = logs.length;
    const sent = logs.filter(l => l.outcome !== 'project').length;
    const boulderLogs = logs.filter(l => l.climbType === 'boulder');
    const ropeLogs = logs.filter(l => l.climbType === 'rope');

    // Grade histogram for boulder (sent only)
    const boulderGrades: Record<string, number> = {};
    boulderLogs
      .filter(l => l.outcome !== 'project')
      .forEach(l => { boulderGrades[l.grade] = (boulderGrades[l.grade] || 0) + 1; });

    const ropeGrades: Record<string, number> = {};
    ropeLogs
      .filter(l => l.outcome !== 'project')
      .forEach(l => { ropeGrades[l.grade] = (ropeGrades[l.grade] || 0) + 1; });

    return { totalSessions, sent, boulderGrades, ropeGrades };
  }

  async getFriendLogs(userId: string, limit = 30) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    if (followingIds.length === 0) return [];

    return this.prisma.climbLog.findMany({
      where: { userId: { in: followingIds } },
      include: {
        user: { select: { id: true, displayName: true, profilePhoto: true } },
        gym: { select: { id: true, name: true, city: true, state: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async deleteLog(logId: string, userId: string) {
    const log = await this.prisma.climbLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Log not found');
    if (log.userId !== userId) throw new UnauthorizedException('Not your log');
    await this.prisma.climbLog.delete({ where: { id: logId } });
    return { success: true };
  }
}
