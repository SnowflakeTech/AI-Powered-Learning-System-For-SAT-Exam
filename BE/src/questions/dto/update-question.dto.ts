import { IsOptional, IsString } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  section?: string | null;

  @IsOptional()
  @IsString()
  skill?: string | null;

  @IsOptional()
  @IsString()
  passage?: string | null;

  @IsOptional()
  @IsString()
  difficulty?: string | null;
}
