import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    actorId: string;
    type: string;
    entityId?: string;
    entityType?: string;
    message: string;
  }) {
    // Don't create notification if actor is the same as recipient
    if (data.userId === data.actorId) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        entityId: data.entityId,
        entityType: data.entityType,
        message: data.message,
      },
    });
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Helper methods to create specific notification types
  async notifyFollow(followedUserId: string, followerId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
    });

    if (!follower) return;

    return this.createNotification({
      userId: followedUserId,
      actorId: followerId,
      type: 'follow',
      message: `${follower.displayName} started following you`,
    });
  }

  async notifyReviewLike(reviewId: string, likerId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { gym: true },
    });

    const liker = await this.prisma.user.findUnique({
      where: { id: likerId },
    });

    if (!review || !liker) return;

    return this.createNotification({
      userId: review.userId,
      actorId: likerId,
      type: 'review_like',
      entityId: reviewId,
      entityType: 'review',
      message: `${liker.displayName} liked your review of ${review.gym.name}`,
    });
  }

  async notifyVideoLike(videoId: string, likerId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { gym: true },
    });

    const liker = await this.prisma.user.findUnique({
      where: { id: likerId },
    });

    if (!video || !liker) return;

    return this.createNotification({
      userId: video.userId,
      actorId: likerId,
      type: 'video_like',
      entityId: videoId,
      entityType: 'video',
      message: `${liker.displayName} liked your video at ${video.gym.name}`,
    });
  }

  async notifyVideoComment(videoId: string, commenterId: string, commentText: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { gym: true },
    });

    const commenter = await this.prisma.user.findUnique({
      where: { id: commenterId },
    });

    if (!video || !commenter) return;

    const preview = commentText.length > 50 
      ? commentText.substring(0, 50) + '...' 
      : commentText;

    return this.createNotification({
      userId: video.userId,
      actorId: commenterId,
      type: 'video_comment',
      entityId: videoId,
      entityType: 'video',
      message: `${commenter.displayName} commented: "${preview}"`,
    });
  }

  async notifyCommentReply(parentCommentId: string, replierId: string, replyText: string) {
    const parentComment = await this.prisma.videoComment.findUnique({
      where: { id: parentCommentId },
      include: { video: { include: { gym: true } } },
    });

    const replier = await this.prisma.user.findUnique({
      where: { id: replierId },
    });

    if (!parentComment || !replier) return;

    const preview = replyText.length > 50 
      ? replyText.substring(0, 50) + '...' 
      : replyText;

    return this.createNotification({
      userId: parentComment.userId,
      actorId: replierId,
      type: 'comment_reply',
      entityId: parentComment.videoId,
      entityType: 'video',
      message: `${replier.displayName} replied: "${preview}"`,
    });
  }

  async notifyNewReview(gymId: string, reviewerId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      include: {
        registeredByUser: true,
      },
    });

    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
    });

    if (!gym || !reviewer || !gym.registeredByUser) return;

    return this.createNotification({
      userId: gym.registeredBy!,
      actorId: reviewerId,
      type: 'new_review',
      entityId: gymId,
      entityType: 'gym',
      message: `${reviewer.displayName} reviewed ${gym.name}`,
    });
  }
}