import { IsIn, IsInt, IsOptional, IsString, Min, Max, Length } from 'class-validator';

export class CreateTestDto {
  /**
   * Mã đề hiển thị (tuỳ chọn) - KHÔNG phải primary key trong DB.
   * Ví dụ: HSA-001, SAT-R-02...
   */
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsIn(['adaptive', 'fixed', 'diagnostic'])
  mode?: 'adaptive' | 'fixed' | 'diagnostic';

  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(24 * 60 * 60) // <= 24h
  durationSec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  quantities?: number;
}
