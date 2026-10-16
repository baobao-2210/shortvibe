import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let jwtService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user, hash password and return access token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockImplementation((args: any) =>
        Promise.resolve({
          id: 'user-uuid-1',
          username: args.data.username,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          displayName: args.data.displayName,
          avatarUrl: null,
          bio: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await authService.register({
        username: 'new_user',
        email: 'new@shortvibe.app',
        password: 'Password123!',
        displayName: 'New User',
      });

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.user.username).toBe('new_user');
      // Ensure passwordHash is NEVER exposed
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw ConflictException if username already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-id',
        username: 'existing_user',
        email: 'other@shortvibe.app',
      });

      await expect(
        authService.register({
          username: 'existing_user',
          email: 'new@shortvibe.app',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      prisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        username: 'valid_user',
        email: 'user@shortvibe.app',
        passwordHash: hashedPassword,
        displayName: 'Valid User',
      });

      const result = await authService.login({
        usernameOrEmail: 'valid_user',
        password: plainPassword,
      });

      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.user.username).toBe('valid_user');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);

      prisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        username: 'valid_user',
        email: 'user@shortvibe.app',
        passwordHash: hashedPassword,
      });

      await expect(
        authService.login({
          usernameOrEmail: 'valid_user',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.login({
          usernameOrEmail: 'unknown_user',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
