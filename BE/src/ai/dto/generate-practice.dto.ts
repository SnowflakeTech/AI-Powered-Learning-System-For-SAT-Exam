import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AiGeneratePracticeDto {
  @IsOptional()
  @IsIn(["SAT", "HSA"])
  exam?: "SAT" | "HSA";

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
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}
