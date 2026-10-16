import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @IsString({ message: 'Comment content must be a string' })
  @Length(1, 1000, { message: 'Comment must be between 1 and 1000 characters' })
  content: string;
}
