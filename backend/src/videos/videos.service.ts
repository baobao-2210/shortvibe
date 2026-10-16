import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

import { FeedQueryDto } from './dto/feed-query.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  private validateUuid(id: string, entity = 'Video') {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(`Invalid ${entity} ID format (UUID expected)`);
    }
  }

  async getFeed(viewerId?: string, query?: FeedQueryDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const whereCondition: any = { visibility: 'PUBLIC' };
    if (query?.q && query.q.trim()) {
      whereCondition.caption = {
        contains: query.q.trim(),
        mode: 'insensitive',
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query?.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (query?.sort === 'views') {
      orderBy = { viewCount: 'desc' };
    } else if (query?.sort === 'likes') {
      orderBy = { likes: { _count: 'desc' } };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy,
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
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.video.count({ where: whereCondition }),
    ]);

    // If viewer is logged in, check which videos the viewer has liked and authors followed
    let userLikedVideoIds = new Set<string>();
    let userFollowingAuthorIds = new Set<string>();
    if (viewerId && videos.length > 0) {
      const [likedRecords, followRecords] = await Promise.all([
        this.prisma.like.findMany({
          where: {
            userId: viewerId,
            videoId: { in: videos.map((v) => v.id) },
          },
          select: { videoId: true },
        }),
        this.prisma.follow.findMany({
          where: {
            followerId: viewerId,
            followingId: { in: [...new Set(videos.map((v) => v.userId))] },
          },
          select: { followingId: true },
        }),
      ]);
      userLikedVideoIds = new Set(likedRecords.map((r) => r.videoId));
      userFollowingAuthorIds = new Set(followRecords.map((r) => r.followingId));
    }

    const items = videos.map((v) => ({
      ...v,
      isLiked: userLikedVideoIds.has(v.id),
      isFollowing: userFollowingAuthorIds.has(v.userId),
      likeCount: v._count.likes,
      commentCount: v._count.comments,
    }));

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recordView(id: string) {
    this.validateUuid(id);
    const updated = await this.prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });
    return {
      success: true,
      id: updated.id,
      viewCount: updated.viewCount,
    };
  }

  async getVideoById(id: string, viewerId?: string) {
    this.validateUuid(id);

    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check privacy
    if (video.visibility === 'PRIVATE' && video.userId !== viewerId) {
      throw new ForbiddenException('This video is private and only visible to its author');
    }

    // Atomic increment view count
    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    let isLiked = false;
    if (viewerId) {
      const like = await this.prisma.like.findUnique({
        where: {
          userId_videoId: {
            userId: viewerId,
            videoId: id,
          },
        },
      });
      isLiked = !!like;
    }

    return {
      ...video,
      viewCount: updatedVideo.viewCount,
      isLiked,
      likeCount: video._count.likes,
      commentCount: video._count.comments,
      isOwner: viewerId === video.userId,
    };
  }

  async createVideo(userId: string, dto: CreateVideoDto) {
    const videoUrl = dto.videoUrl ? dto.videoUrl.replace('10.0.2.2:3000', 'localhost:3000') : dto.videoUrl;
    const thumbnailUrl = dto.thumbnailUrl ? dto.thumbnailUrl.replace('10.0.2.2:3000', 'localhost:3000') : dto.thumbnailUrl;

    const video = await this.prisma.video.create({
      data: {
        userId,
        caption: dto.caption,
        videoUrl,
        thumbnailUrl,
        durationSeconds: dto.durationSeconds,
        visibility: dto.visibility,
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
      message: 'Video published successfully',
      video: {
        ...video,
        likeCount: 0,
        commentCount: 0,
      },
    };
  }

  async updateVideo(id: string, userId: string, dto: UpdateVideoDto) {
    this.validateUuid(id);

    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('You can only edit your own videos');
    }

    const updated = await this.prisma.video.update({
      where: { id },
      data: {
        ...(dto.caption !== undefined && { caption: dto.caption }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      message: 'Video updated successfully',
      video: {
        ...updated,
        likeCount: updated._count.likes,
        commentCount: updated._count.comments,
      },
    };
  }

  async deleteVideo(id: string, userId: string) {
    this.validateUuid(id);

    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.userId !== userId) {
      throw new ForbiddenException('You can only delete your own videos');
    }

    await this.prisma.video.delete({
      where: { id },
    });

    return {
      message: 'Video deleted successfully',
      videoId: id,
    };
  }

  async getTrendingHashtags() {
    const videos = await this.prisma.video.findMany({
      where: { visibility: 'PUBLIC' },
      select: { caption: true },
      take: 100,
    });

    const hashtagCounts = new Map<string, number>();
    const regex = /#([a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]+)/gi;

    for (const v of videos) {
      if (!v.caption) continue;
      const matches = v.caption.match(regex);
      if (matches) {
        for (const tag of matches) {
          const cleanTag = tag.toLowerCase();
          hashtagCounts.set(cleanTag, (hashtagCounts.get(cleanTag) || 0) + 1);
        }
      }
    }

    const sorted = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const defaults = ['#shortvibe', '#trending', '#coffee', '#vietnam', '#dance', '#fitness', '#travel', '#coding'];
    for (const d of defaults) {
      if (!sorted.find((s) => s.tag === d)) {
        sorted.push({ tag: d, count: 1 });
      }
    }

    return sorted.slice(0, 12);
  }
}
