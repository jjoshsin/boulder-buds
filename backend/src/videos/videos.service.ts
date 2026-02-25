import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

type SortOption = 'mostLiked' | 'mostRecent' | 'mostViewed' | 'mostCommented';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

  async createVideo(data: {
    userId: string;
    gymId: string;
    videoUrl: string;
    thumbnailUrl: string;
    caption?: string;
  }) {
    const video = await this.prisma.video.create({
      data: {
        userId: data.userId,
        gymId: data.gymId,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        caption: data.caption,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return video;
  }

  async getGymVideos(gymId: string, sortBy: SortOption = 'mostRecent', limit?: number) {
    const videos = await this.prisma.video.findMany({
      where: { gymId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });

    const videosWithCounts = videos.map(video => ({
      ...video,
      likeCount: video.likes.length,
      commentCount: video.comments.length,
    }));

    const sorted = this.sortVideos(videosWithCounts, sortBy);

    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getUserVideos(userId: string) {
    return this.prisma.video.findMany({
      where: { userId },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getVideoById(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          where: {
            parentId: null, // Only get top-level comments
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profilePhoto: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    profilePhoto: true,
                  },
                },
                likes: {
                  select: {
                    userId: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Add like counts to comments and replies
    const commentsWithCounts = video.comments.map(comment => ({
      ...comment,
      likeCount: comment.likes.length,
      replies: comment.replies.map(reply => ({
        ...reply,
        likeCount: reply.likes.length,
      })),
    }));

    return {
      ...video,
      likeCount: video.likes.length,
      commentCount: video.comments.length,
      comments: commentsWithCounts,
    };
  }

  async incrementViews(videoId: string) {
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async toggleLike(videoId: string, userId: string) {
    const existing = await this.prisma.videoLike.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.videoLike.delete({
        where: {
          videoId_userId: {
            videoId,
            userId,
          },
        },
      });
      return { liked: false };
    } else {
      await this.prisma.videoLike.create({
        data: {
          videoId,
          userId,
        },
      });
      return { liked: true };
    }
  }

  async addComment(videoId: string, userId: string, text: string, parentId?: string) {
    // If replying, verify parent comment exists and belongs to same video
    if (parentId) {
      const parentComment = await this.prisma.videoComment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.videoId !== videoId) {
        throw new UnauthorizedException('Parent comment does not belong to this video');
      }
    }

    return this.prisma.videoComment.create({
      data: {
        videoId,
        userId,
        text,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const existing = await this.prisma.videoCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.videoCommentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });

      const likeCount = await this.prisma.videoCommentLike.count({
        where: { commentId },
      });

      return { liked: false, likeCount };
    } else {
      await this.prisma.videoCommentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      const likeCount = await this.prisma.videoCommentLike.count({
        where: { commentId },
      });

      return { liked: true, likeCount };
    }
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.videoComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new UnauthorizedException('You can only delete your own comments');
    }

    await this.prisma.videoComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  private sortVideos(videos: any[], sortBy: SortOption) {
    switch (sortBy) {
      case 'mostLiked':
        return videos.sort((a, b) => b.likeCount - a.likeCount);
      case 'mostRecent':
        return videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'mostViewed':
        return videos.sort((a, b) => b.views - a.views);
      case 'mostCommented':
        return videos.sort((a, b) => b.commentCount - a.commentCount);
      default:
        return videos;
    }
  }

    async updateCaption(videoId: string, userId: string, caption: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.userId !== userId) {
      throw new UnauthorizedException('You can only edit your own videos');
    }

    return this.prisma.video.update({
      where: { id: videoId },
      data: { caption },
    });
  }

  async deleteVideo(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.userId !== userId) {
      throw new UnauthorizedException('You can only delete your own videos');
    }

    // Delete video and thumbnail from S3
    try {
      await this.uploadService.deleteImages([video.videoUrl, video.thumbnailUrl]);
    } catch (error) {
      console.error('Error deleting video files from S3:', error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database (cascade will handle likes and comments)
    await this.prisma.video.delete({
      where: { id: videoId },
    });

    return { success: true };
  }
}