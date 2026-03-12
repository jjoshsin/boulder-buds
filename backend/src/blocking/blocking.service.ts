import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockingService {
  constructor(private prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new BadRequestException('User is already blocked');
    }

    // Create block
    await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    // Optionally: Remove follow relationships
    await this.prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    return { success: true, message: 'User blocked successfully' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('User is not blocked');
    }

    await this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return { success: true, message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map(block => block.blocked);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return !!block;
  }

  async isBlockedByEither(userId1: string, userId2: string): Promise<boolean> {
    const blocks = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });

    return !!blocks;
  }
}