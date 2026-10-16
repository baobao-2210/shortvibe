import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { FeedQueryDto } from './dto/feed-query.dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'videos');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase() || '.mp4';
          cb(null, `shortvibe-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|quicktime|webm|x-matroska|jpeg|png|webp)$/)) {
          return cb(
            new BadRequestException('Only video (MP4, QuickTime, WebM) or image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    let host = req.get('host') || 'localhost:3000';
    if (host.includes('10.0.2.2')) {
      host = host.replace('10.0.2.2', 'localhost');
    }
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/videos/${file.filename}`;
    return {
      success: true,
      url: fileUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getFeed(
    @CurrentUser('id') viewerId: string | undefined,
    @Query() query: FeedQueryDto,
  ) {
    return this.videosService.getFeed(viewerId, query);
  }

  @Get('trending/hashtags')
  async getTrendingHashtags() {
    return this.videosService.getTrendingHashtags();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getVideoById(
    @Param('id') id: string,
    @CurrentUser('id') viewerId: string | undefined,
  ) {
    return this.videosService.getVideoById(id, viewerId);
  }

  @Post(':id/views')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async recordView(@Param('id') id: string) {
    return this.videosService.recordView(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createVideo(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVideoDto,
  ) {
    return this.videosService.createVideo(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateVideo(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.videosService.updateVideo(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteVideo(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.videosService.deleteVideo(id, userId);
  }
}
