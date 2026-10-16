import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  videoId?: string;
  commentId?: string;
  content?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: CreateNotificationDto) {
    // 1. Do not notify self
    if (data.recipientId === data.actorId) {
      return null;
    }

    try {
      // 2. Deduplication check
      // For LIKE: if notification already exists for this video and actor, update timestamp and mark unread
      if (data.type === NotificationType.LIKE && data.videoId) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            recipientId: data.recipientId,
            actorId: data.actorId,
            type: NotificationType.LIKE,
            videoId: data.videoId,
          },
        });
        if (existing) {
          return await this.prisma.notification.update({
            where: { id: existing.id },
            data: {
              createdAt: new Date(),
              isRead: false,
              content: data.content,
            },
          });
        }
      }

      // For FOLLOW: if already exists, update timestamp and mark unread
      if (data.type === NotificationType.FOLLOW) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            recipientId: data.recipientId,
            actorId: data.actorId,
            type: NotificationType.FOLLOW,
          },
        });
        if (existing) {
          return await this.prisma.notification.update({
            where: { id: existing.id },
            data: {
              createdAt: new Date(),
              isRead: false,
            },
          });
        }
      }

      // Create new notification
      return await this.prisma.notification.create({
        data: {
          recipientId: data.recipientId,
          actorId: data.actorId,
          type: data.type,
          videoId: data.videoId,
          commentId: data.commentId,
          content: data.content,
        },
      });
    } catch (err) {
      console.error('Error creating notification:', err);
      return null;
    }
  }

  async getNotifications(userId: string, page = 1, limit = 20, type?: NotificationType) {
    const skip = (page - 1) * limit;
    const where: any = { recipientId: userId };
    if (type) {
      where.type = type;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          video: {
            select: {
              id: true,
              caption: true,
              thumbnailUrl: true,
              videoUrl: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif || notif.recipientId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true, message: 'All notifications marked as read' };
  }

  // Helper to extract @mentions from text and return matched user IDs
  async extractMentionedUserIds(text: string, authorId: string): Promise<string[]> {
    if (!text) return [];
    const matches = text.match(/@([a-zA-Z0-9_]+)/g);
    if (!matches) return [];

    const usernames = Array.from(new Set(matches.map((m) => m.slice(1))));
    if (usernames.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        username: { in: usernames },
        id: { not: authorId },
      },
      select: { id: true },
    });

    return users.map((u) => u.id);
  }
}
