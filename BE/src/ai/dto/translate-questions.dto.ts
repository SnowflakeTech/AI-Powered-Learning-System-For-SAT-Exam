import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export class TranslateQuestionItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  imageAlt?: string | null;

  @IsArray()
  @IsString({ each: true })
  choices!: string[];
}

export class AiTranslateQuestionsDto {
  @IsString()
  @IsIn(["en", "vi", "ja", "ko", "zh", "fr", "de", "es", "th", "id", "ru"])
  targetLang!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslateQuestionItemDto)
  questions!: TranslateQuestionItemDto[];
}
