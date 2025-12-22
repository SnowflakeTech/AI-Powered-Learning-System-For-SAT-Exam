import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AiChatDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  conversationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  questionId?: number;
}
