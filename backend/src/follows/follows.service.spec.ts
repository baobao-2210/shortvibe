import { Test, TestingModule } from '@nestjs/testing';
import { FollowsService } from './follows.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FollowsService', () => {
  let followsService: FollowsService;
  let prisma: any;

  const userAId = '11111111-1111-4111-a111-111111111111';
  const userBId = '22222222-2222-4222-a222-222222222222';

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      follow: {
        upsert: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    followsService = module.get<FollowsService>(FollowsService);
  });

  describe('followUser', () => {
    it('should throw BadRequestException when user tries to follow themselves', async () => {
      await expect(
        followsService.followUser(userAId, userAId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should follow target user and return followers count', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userBId,
        username: 'bob_creator',
      });
      prisma.follow.upsert.mockResolvedValue({});
      prisma.follow.count.mockResolvedValue(42);

      const result = await followsService.followUser(userAId, userBId);
      expect(result.isFollowing).toBe(true);
      expect(result.followersCount).toBe(42);
      expect(prisma.follow.upsert).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: userAId,
            followingId: userBId,
          },
        },
        update: {},
        create: {
          followerId: userAId,
          followingId: userBId,
        },
      });
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow target user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userBId,
        username: 'bob_creator',
      });
      prisma.follow.delete.mockResolvedValue({});
      prisma.follow.count.mockResolvedValue(41);

      const result = await followsService.unfollowUser(userAId, userBId);
      expect(result.isFollowing).toBe(false);
      expect(result.followersCount).toBe(41);
    });
  });

  describe('getFollowStatus', () => {
    it('should return follow status between two users', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userBId,
        username: 'bob_creator',
        _count: { followers: 42, following: 10 },
      });
      prisma.follow.findUnique.mockResolvedValue({
        followerId: userAId,
        followingId: userBId,
      });

      const result = await followsService.getFollowStatus(userAId, userBId);
      expect(result.isFollowing).toBe(true);
      expect(result.followersCount).toBe(42);
      expect(result.followingCount).toBe(10);
    });
  });
});
