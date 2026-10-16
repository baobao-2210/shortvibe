import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { SearchUserQueryDto } from './dto/search-user-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(userId, dto);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  async searchUsers(
    @Query() query: SearchUserQueryDto,
  ) {
    return this.usersService.searchUsers(query.q, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserProfile(
    @Param('id') targetUserId: string,
    @CurrentUser('id') viewerId?: string,
  ) {
    return this.usersService.getUserProfile(targetUserId, viewerId);
  }

  @Get(':id/videos')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserVideos(
    @Param('id') targetUserId: string,
    @CurrentUser('id') viewerId: string | undefined,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.getUserVideos(targetUserId, viewerId, query);
  }

  @Get(':id/followers')
  async getFollowers(
    @Param('id') targetUserId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.getFollowers(targetUserId, query);
  }

  @Get(':id/following')
  async getFollowing(
    @Param('id') targetUserId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.getFollowing(targetUserId, query);
  }
}
