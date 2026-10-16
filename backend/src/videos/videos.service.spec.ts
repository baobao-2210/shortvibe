import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('VideosService', () => {
  let videosService: VideosService;
  let prisma: any;

  const sampleVideoId = '11111111-1111-4111-a111-111111111111';
  const ownerUserId = '22222222-2222-4222-a222-222222222222';
  const strangerUserId = '33333333-3333-4333-a333-333333333333';

  beforeEach(async () => {
    prisma = {
      video: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      like: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    videosService = module.get<VideosService>(VideosService);
  });

  describe('getVideoById and Privacy Access', () => {
    it('should throw ForbiddenException if video is PRIVATE and viewer is not the author', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        userId: ownerUserId,
        visibility: 'PRIVATE',
        caption: 'Secret draft',
        videoUrl: 'https://cdn.example.com/video.mp4',
        _count: { likes: 0, comments: 0 },
      });

      await expect(
        videosService.getVideoById(sampleVideoId, strangerUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author to view their own PRIVATE video and increment viewCount', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        userId: ownerUserId,
        visibility: 'PRIVATE',
        caption: 'Secret draft',
        videoUrl: 'https://cdn.example.com/video.mp4',
        viewCount: 10,
        _count: { likes: 0, comments: 0 },
      });

      prisma.video.update.mockResolvedValue({
        viewCount: 11,
      });

      prisma.like.findUnique.mockResolvedValue(null);

      const result = await videosService.getVideoById(sampleVideoId, ownerUserId);
      expect(result.viewCount).toBe(11);
      expect(result.isOwner).toBe(true);
      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: sampleVideoId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
    });
  });

  describe('updateVideo & deleteVideo Ownership', () => {
    it('should throw ForbiddenException when updating someone else video', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        userId: ownerUserId,
      });

      await expect(
        videosService.updateVideo(sampleVideoId, strangerUserId, { caption: 'Hacked caption' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when deleting someone else video', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        userId: ownerUserId,
      });

      await expect(
        videosService.deleteVideo(sampleVideoId, strangerUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to delete their video', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        userId: ownerUserId,
      });
      prisma.video.delete.mockResolvedValue({ id: sampleVideoId });

      const result = await videosService.deleteVideo(sampleVideoId, ownerUserId);
      expect(result.videoId).toBe(sampleVideoId);
      expect(prisma.video.delete).toHaveBeenCalledWith({ where: { id: sampleVideoId } });
    });
  });
});
