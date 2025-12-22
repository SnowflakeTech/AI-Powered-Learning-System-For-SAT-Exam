import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AiGenerateTestDto {
  @IsOptional()
  @IsString()
  // SAT | HSA | auto
  @IsIn(['SAT', 'HSA', 'auto'])
  exam?: 'SAT' | 'HSA' | 'auto';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(40)
  numQuestions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(600)
  @Max(7200)
  durationSec?: number;
}
