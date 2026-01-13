import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from "class-validator";

export class PracticeResultItemDto {
  @IsOptional()
  @IsString()
  questionId?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsBoolean()
  correct!: boolean;
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
  results!: PracticeResultItemDto[];
}
