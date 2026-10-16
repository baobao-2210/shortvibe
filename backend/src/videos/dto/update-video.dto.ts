import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { VideoVisibility } from '@prisma/client';

export class UpdateVideoDto {
  @IsOptional()
  @IsString({ message: 'Caption must be a string' })
  caption?: string;

  @IsOptional()
  @IsString({ message: 'Thumbnail URL must be a string' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsEnum(VideoVisibility, {
    message: 'Visibility must be either PUBLIC or PRIVATE',
  })
  visibility?: VideoVisibility;
}
