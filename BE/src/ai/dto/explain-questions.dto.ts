import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ExplainChoiceDto {
  @IsString()
  label: string;

  @IsString()
  text: string;
}

class ExplainQuestionDto {
  @IsOptional()
  questionId?: number;

  @IsString()
  content: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExplainChoiceDto)
  choices: ExplainChoiceDto[];

  @IsString()
  correct: string;

  @IsOptional()
  @IsString()
  picked?: string;
}

export class AiExplainQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExplainQuestionDto)
  questions: ExplainQuestionDto[];

  @IsOptional()
  @IsString()
  exam?: string;
}
