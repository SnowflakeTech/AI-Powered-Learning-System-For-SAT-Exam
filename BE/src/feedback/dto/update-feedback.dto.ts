import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export type FeedbackStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export class UpdateFeedbackDto {
  @IsOptional()
  @IsIn(['open', 'in_review', 'resolved', 'dismissed'])
  status?: FeedbackStatus;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: FeedbackPriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
