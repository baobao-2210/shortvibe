import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private validateUuid(id: string, entity = 'User') {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(`Invalid ${entity} ID format (UUID expected)`);
    }
  }

  async getUserProfile(targetUserId: string, viewerId?: string) {
    this.validateUuid(targetUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            videos: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isFollowing = false;
    if (viewerId && viewerId !== targetUserId) {
      const followRecord = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: targetUserId,
          },
        },
      });
      isFollowing = !!followRecord;
    }

    return {
      ...user,
      isFollowing,
    };
  }

  async searchUsers(q?: string, query?: PaginationQueryDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const searchTerm = q?.trim() || '';
    const whereCondition = searchTerm
      ? {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' as const } },
            { displayName: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              videos: true,
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user,
    };
  }

  async getUserVideos(
    targetUserId: string,
    viewerId?: string,
    query?: PaginationQueryDto,
  ) {
    this.validateUuid(targetUserId);

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If viewer is the owner, allow seeing private videos; otherwise only PUBLIC
    const isOwner = viewerId === targetUserId;
    const whereCondition: any = {
      userId: targetUserId,
      ...(!isOwner && { visibility: 'PUBLIC' }),
    };

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
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
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.video.count({ where: whereCondition }),
    ]);

    return {
      data: videos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowers(targetUserId: string, query?: PaginationQueryDto) {
    this.validateUuid(targetUserId);

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: targetUserId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.follow.count({ where: { followingId: targetUserId } }),
    ]);

    return {
      data: follows.map((f) => ({
        ...f.follower,
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(targetUserId: string, query?: PaginationQueryDto) {
    this.validateUuid(targetUserId);

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: targetUserId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.follow.count({ where: { followerId: targetUserId } }),
    ]);

    return {
      data: follows.map((f) => ({
        ...f.following,
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
