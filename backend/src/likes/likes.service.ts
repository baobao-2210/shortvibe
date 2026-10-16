import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private validateUuid(id: string, entity = 'Video') {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(`Invalid ${entity} ID format (UUID expected)`);
    }
  }

  async likeVideo(userId: string, videoId: string) {
    this.validateUuid(videoId);

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.visibility === 'PRIVATE' && video.userId !== userId) {
      throw new ForbiddenException('Cannot interact with a private video');
    }

    // Idempotent upsert: avoids duplicate primary key error
    await this.prisma.like.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {},
      create: {
        userId,
        videoId,
      },
    });

    // Create in-app notification for video author (if not liking own video)
    if (video.userId !== userId) {
      await this.notificationsService.createNotification({
        recipientId: video.userId,
        actorId: userId,
        type: NotificationType.LIKE,
        videoId,
        content: video.caption || undefined,
      });
    }

    const totalLikes = await this.prisma.like.count({
      where: { videoId },
    });

    return {
      message: 'Video liked successfully',
      isLiked: true,
      totalLikes,
    };
  }

  async unlikeVideo(userId: string, videoId: string) {
    this.validateUuid(videoId);

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    try {
      await this.prisma.like.delete({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
      });
    } catch (error) {
      // If record does not exist (P2025 in Prisma), handle gracefully
    }

    const totalLikes = await this.prisma.like.count({
      where: { videoId },
    });

    return {
      message: 'Video unliked successfully',
      isLiked: false,
      totalLikes,
    };
  }

  async getLikeStatus(videoId: string, userId?: string) {
    this.validateUuid(videoId);

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.visibility === 'PRIVATE' && video.userId !== userId) {
      throw new ForbiddenException('Cannot access details of a private video');
    }

    const totalLikes = await this.prisma.like.count({
      where: { videoId },
    });

    let isLiked = false;
    if (userId) {
      const record = await this.prisma.like.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
      });
      isLiked = !!record;
    }

    return {
      videoId,
      totalLikes,
      isLiked,
    };
  }
}
