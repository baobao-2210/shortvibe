import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('videos/:id/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async likeVideo(
    @Param('id') videoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likesService.likeVideo(userId, videoId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlikeVideo(
    @Param('id') videoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likesService.unlikeVideo(userId, videoId);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getLikeStatus(
    @Param('id') videoId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.likesService.getLikeStatus(videoId, userId);
  }
}
