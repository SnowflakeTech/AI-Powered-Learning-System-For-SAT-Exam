import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTestDto {
  @IsOptional()
  @IsIn(['adaptive', 'fixed', 'diagnostic'])
  mode?: 'adaptive' | 'fixed' | 'diagnostic';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  durationSec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantities?: number;
}
