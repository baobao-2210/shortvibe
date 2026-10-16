import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CommentsService', () => {
  let commentsService: CommentsService;
  let prisma: any;

  const sampleVideoId = '11111111-1111-4111-a111-111111111111';
  const commentAuthorId = '22222222-2222-4222-a222-222222222222';
  const videoOwnerId = '33333333-3333-4333-a333-333333333333';
  const strangerId = '44444444-4444-4444-a444-444444444444';
  const sampleCommentId = '55555555-5555-4555-a555-555555555555';

  beforeEach(async () => {
    prisma = {
      video: {
        findUnique: jest.fn(),
      },
      comment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    commentsService = module.get<CommentsService>(CommentsService);
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        visibility: 'PUBLIC',
      });
      prisma.comment.create.mockResolvedValue({
        id: sampleCommentId,
        userId: commentAuthorId,
        videoId: sampleVideoId,
        content: 'Awesome short!',
        user: { id: commentAuthorId, username: 'tester' },
      });

      const result = await commentsService.createComment(commentAuthorId, sampleVideoId, {
        content: 'Awesome short!',
      });

      expect(result.comment.content).toBe('Awesome short!');
      expect(result.comment.isOwner).toBe(true);
    });

    it('should throw BadRequestException if parentComment does not belong to the same video', async () => {
      const parentCommentId = '66666666-6666-4666-a666-666666666666';
      prisma.video.findUnique.mockResolvedValue({
        id: sampleVideoId,
        visibility: 'PUBLIC',
      });
      prisma.comment.findUnique.mockResolvedValue({
        id: parentCommentId,
        videoId: 'another-video-id', // mismatch!
      });

      await expect(
        commentsService.createComment(commentAuthorId, sampleVideoId, {
          content: 'Replying to comment',
          parentCommentId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteComment permissions', () => {
    it('should allow comment author to delete their comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: sampleCommentId,
        userId: commentAuthorId,
        video: { userId: videoOwnerId },
      });
      prisma.comment.delete.mockResolvedValue({});

      const result = await commentsService.deleteComment(sampleCommentId, commentAuthorId);
      expect(result.commentId).toBe(sampleCommentId);
    });

    it('should allow video author to delete any comment on their video', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: sampleCommentId,
        userId: commentAuthorId,
        video: { userId: videoOwnerId },
      });
      prisma.comment.delete.mockResolvedValue({});

      const result = await commentsService.deleteComment(sampleCommentId, videoOwnerId);
      expect(result.commentId).toBe(sampleCommentId);
    });

    it('should throw ForbiddenException if a stranger attempts to delete the comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: sampleCommentId,
        userId: commentAuthorId,
        video: { userId: videoOwnerId },
      });

      await expect(
        commentsService.deleteComment(sampleCommentId, strangerId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
