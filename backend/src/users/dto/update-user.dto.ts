import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Display name must be a string' })
  @Length(1, 100, { message: 'Display name must be between 1 and 100 characters' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @Length(0, 500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;
}
