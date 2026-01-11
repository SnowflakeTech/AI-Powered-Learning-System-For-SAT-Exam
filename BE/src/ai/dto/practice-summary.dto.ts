import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class PracticeResultItemDto {
  @IsOptional()
  questionId?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  correct: boolean;

  @IsOptional()
  @IsString()
  picked?: string;

  @IsOptional()
  @IsString()
  correctLabel?: string;
}

export class AiPracticeSummaryDto {
  @IsOptional()
  @IsString()
  exam?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PracticeResultItemDto)
  results: PracticeResultItemDto[];
}
