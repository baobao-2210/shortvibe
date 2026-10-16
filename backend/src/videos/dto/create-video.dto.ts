import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { VideoVisibility } from '@prisma/client';

export class CreateVideoDto {
  @IsOptional()
  @IsString({ message: 'Caption must be a string' })
  caption?: string;

  @IsNotEmpty({ message: 'Video URL is required' })
  @IsString({ message: 'Video URL must be a string' })
  videoUrl: string;

  @IsOptional()
  @IsString({ message: 'Thumbnail URL must be a string' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsInt({ message: 'Duration must be an integer (in seconds)' })
  @Min(1, { message: 'Duration must be at least 1 second' })
  @Max(600, { message: 'Short video duration cannot exceed 600 seconds (10 minutes)' })
  durationSeconds?: number;

  @IsOptional()
  @IsEnum(VideoVisibility, {
    message: 'Visibility must be either PUBLIC or PRIVATE',
  })
  visibility?: VideoVisibility = VideoVisibility.PUBLIC;
}
