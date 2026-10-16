import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private validateUuid(id: string, entity = 'User ID') {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(`Invalid ${entity} format (UUID expected)`);
    }
  }

  async followUser(followerId: string, targetUserId: string) {
    this.validateUuid(targetUserId, 'Target User ID');

    if (followerId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User to follow was not found');
    }

    // Idempotent upsert
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
      update: {},
      create: {
        followerId,
        followingId: targetUserId,
      },
    });

    // Create notification for followed user
    await this.notificationsService.createNotification({
      recipientId: targetUserId,
      actorId: followerId,
      type: NotificationType.FOLLOW,
    });

    const followersCount = await this.prisma.follow.count({
      where: { followingId: targetUserId },
    });

    return {
      message: `You are now following @${targetUser.username}`,
      isFollowing: true,
      followersCount,
    };
  }

  async unfollowUser(followerId: string, targetUserId: string) {
    this.validateUuid(targetUserId, 'Target User ID');

    if (followerId === targetUserId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User to unfollow was not found');
    }

    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId,
          },
        },
      });
    } catch (error) {
      // Gracefully ignore if not currently following
    }

    const followersCount = await this.prisma.follow.count({
      where: { followingId: targetUserId },
    });

    return {
      message: `You unfollowed @${targetUser.username}`,
      isFollowing: false,
      followersCount,
    };
  }

  async getFollowStatus(currentUserId: string, targetUserId: string) {
    this.validateUuid(targetUserId, 'Target User ID');

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User was not found');
    }

    const record = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    return {
      targetUserId,
      username: targetUser.username,
      isFollowing: !!record,
      followersCount: targetUser._count.followers,
      followingCount: targetUser._count.following,
    };
  }
}
