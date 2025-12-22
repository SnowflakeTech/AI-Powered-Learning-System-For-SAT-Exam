import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export type FeedbackType = 'wrong_answer' | 'invalid_question' | 'too_hard' | 'bug' | 'other';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export class CreateFeedbackDto {
  @IsIn(['wrong_answer', 'invalid_question', 'too_hard', 'bug', 'other'])
  type!: FeedbackType;

  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: FeedbackPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  testId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  questionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  attemptId?: number;
}
