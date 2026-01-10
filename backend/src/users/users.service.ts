import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      birthday: user.birthday,
      borough: user.borough,
      climbingLevel: user.climbingLevel,
      climbingType: user.climbingType,
    };
  }

  async updateProfile(
    userId: string,
    data: { 
      displayName?: string; 
      birthday?: string; 
      borough?: string;
      climbingLevel?: string;
      climbingType?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        birthday: data.birthday,
        borough: data.borough,
        climbingLevel: data.climbingLevel,
        climbingType: data.climbingType,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
    };
  }
}