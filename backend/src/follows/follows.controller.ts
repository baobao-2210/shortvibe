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
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users/:id')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async followUser(
    @Param('id') targetUserId: string,
    @CurrentUser('id') followerId: string,
  ) {
    return this.followsService.followUser(followerId, targetUserId);
  }

  @Delete('follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollowUser(
    @Param('id') targetUserId: string,
    @CurrentUser('id') followerId: string,
  ) {
    return this.followsService.unfollowUser(followerId, targetUserId);
  }

  @Get('follow-status')
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(
    @Param('id') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.followsService.getFollowStatus(currentUserId, targetUserId);
  }
}
