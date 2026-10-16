import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private validateUuid(id: string, entity = 'ID') {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(`Invalid ${entity} format (UUID expected)`);
    }
  }

  async getComments(
    videoId: string,
    query?: QueryCommentDto,
    viewerId?: string,
  ) {
    this.validateUuid(videoId, 'Video ID');

    // 1. Check video existence & visibility
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.visibility === 'PRIVATE' && video.userId !== viewerId) {
      throw new ForbiddenException('Cannot view comments of a private video');
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    // Filter by parentCommentId if fetching replies, else fetch top-level comments
    const whereCondition: any = {
      videoId,
      parentCommentId: query?.parentCommentId || null,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where: whereCondition }),
    ]);

    const data = comments.map((c) => ({
      ...c,
      replyCount: c._count.replies,
      isOwner: viewerId === c.userId,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createComment(
    userId: string,
    videoId: string,
    dto: CreateCommentDto,
  ) {
    this.validateUuid(videoId, 'Video ID');

    // 1. Verify video
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.visibility === 'PRIVATE' && video.userId !== userId) {
      throw new ForbiddenException('Cannot comment on a private video');
    }

    // 2. If reply, verify parent comment belongs to the same video
    if (dto.parentCommentId) {
      this.validateUuid(dto.parentCommentId, 'Parent Comment ID');
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment to reply to was not found');
      }

      if (parentComment.videoId !== videoId) {
        throw new BadRequestException(
          'Parent comment does not belong to this video',
        );
      }
    }

    // 3. Create comment
    const comment = await this.prisma.comment.create({
      data: {
        userId,
        videoId,
        content: dto.content.trim(),
        parentCommentId: dto.parentCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 4. Create Notifications:
    // a) Notify parent comment author if this is a reply
    let repliedUserId: string | null = null;
    if (dto.parentCommentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentCommentId },
        select: { userId: true },
      });
      if (parent && parent.userId !== userId) {
        repliedUserId = parent.userId;
        await this.notificationsService.createNotification({
          recipientId: parent.userId,
          actorId: userId,
          type: NotificationType.COMMENT,
          videoId,
          commentId: comment.id,
          content: comment.content,
        });
      }
    }

    // b) Notify video author if not commenting on own video & not already notified as parent reply
    if (video.userId !== userId && video.userId !== repliedUserId) {
      await this.notificationsService.createNotification({
        recipientId: video.userId,
        actorId: userId,
        type: NotificationType.COMMENT,
        videoId,
        commentId: comment.id,
        content: comment.content,
      });
    }

    // c) Notify users mentioned via @username in comment text
    const mentionedUserIds = await this.notificationsService.extractMentionedUserIds(
      comment.content,
      userId,
    );
    for (const mentionedId of mentionedUserIds) {
      if (mentionedId !== video.userId && mentionedId !== repliedUserId) {
        await this.notificationsService.createNotification({
          recipientId: mentionedId,
          actorId: userId,
          type: NotificationType.MENTION,
          videoId,
          commentId: comment.id,
          content: comment.content,
        });
      }
    }

    return {
      message: 'Comment added successfully',
      comment: {
        ...comment,
        replyCount: 0,
        isOwner: true,
      },
    };
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    this.validateUuid(commentId, 'Comment ID');

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Comment updated successfully',
      comment: updated,
    };
  }

  async deleteComment(commentId: string, userId: string) {
    this.validateUuid(commentId, 'Comment ID');

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        video: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Permission: Comment author OR Video owner can delete comment
    const isCommentAuthor = comment.userId === userId;
    const isVideoOwner = comment.video.userId === userId;

    if (!isCommentAuthor && !isVideoOwner) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      message: 'Comment deleted successfully',
      commentId,
    };
  }
}
