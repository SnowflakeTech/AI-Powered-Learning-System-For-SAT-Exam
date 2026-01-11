import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

class DifficultyCountDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  easy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  medium?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hard?: number;
}

class SkillDistributionDto {
  @IsString()
  skill!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DifficultyCountDto)
  difficulty?: DifficultyCountDto;
}

class SectionDistributionDto {
  @IsString()
  section!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDistributionDto)
  skills!: SkillDistributionDto[];
}

class DistributionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDistributionDto)
  sections!: SectionDistributionDto[];
}

export class AiGenerateQuestionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  testId?: number;

  @IsOptional()
  @IsIn(["SAT", "HSA"])
  exam?: "SAT" | "HSA";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  numQuestions?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DistributionDto)
  distribution?: DistributionDto;
}
