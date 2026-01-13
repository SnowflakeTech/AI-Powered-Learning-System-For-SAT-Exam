import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateTestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(["adaptive", "fixed", "diagnostic"])
  mode?: "adaptive" | "fixed" | "diagnostic";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(7200)
  durationSec?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  quantities?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
