import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";

export class ExplainChoiceDto {
  @IsString()
  label!: string;

  @IsString()
  text!: string;
}

export class ExplainQuestionDto {
  @IsOptional()
  @IsString()
  questionId?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  content!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExplainChoiceDto)
  choices!: ExplainChoiceDto[];

  @IsString()
  correct!: string;

  @IsOptional()
  @IsString()
  picked?: string;
}

export class AiExplainQuestionsDto {
  @IsOptional()
  @IsString()
  exam?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExplainQuestionDto)
  questions!: ExplainQuestionDto[];
}
