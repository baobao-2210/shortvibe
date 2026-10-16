import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('LikesService', () => {
  let likesService: LikesService;
  let prisma: any;

  const sampleVideoId = '11111111-1111-4111-a111-111111111111';
  const userId = '22222222-2222-4222-a222-222222222222';

  beforeEach(async () => {
    prisma = {
      video: {
        findUnique: jest.fn(),
      },
      like: {
        upsert: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    likesService = module.get<LikesService>(LikesService);
  });

  describe('likeVideo', () => {
    it('should like video idempotently using upsert without duplicates', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        visibility: 'PUBLIC',
      });
      prisma.like.upsert.mockResolvedValue({});
      prisma.like.count.mockResolvedValue(15);

      const result = await likesService.likeVideo(userId, sampleVideoId);
      expect(result.isLiked).toBe(true);
      expect(result.totalLikes).toBe(15);
      expect(prisma.like.upsert).toHaveBeenCalledWith({
        where: {
          userId_videoId: {
            userId,
            videoId: sampleVideoId,
          },
        },
        update: {},
        create: {
          userId,
          videoId: sampleVideoId,
        },
      });
    });

    it('should throw ForbiddenException if user tries to like a private video they do not own', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        userId: 'other-author-uuid',
        visibility: 'PRIVATE',
      });

      await expect(
        likesService.likeVideo(userId, sampleVideoId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unlikeVideo', () => {
    it('should unlike video and return updated totalLikes', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        visibility: 'PUBLIC',
      });
      prisma.like.delete.mockResolvedValue({});
      prisma.like.count.mockResolvedValue(14);

      const result = await likesService.unlikeVideo(userId, sampleVideoId);
      expect(result.isLiked).toBe(false);
      expect(result.totalLikes).toBe(14);
    });
  });
});
