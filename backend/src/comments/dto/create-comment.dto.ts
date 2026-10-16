import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @IsString({ message: 'Comment content must be a string' })
  @Length(1, 1000, { message: 'Comment must be between 1 and 1000 characters' })
  content: string;

  @IsOptional()
  @Matches(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    { message: 'Parent comment ID must be a valid UUID' },
  )
  parentCommentId?: string;
}
