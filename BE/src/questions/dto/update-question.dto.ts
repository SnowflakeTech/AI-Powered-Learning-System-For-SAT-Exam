import { IsOptional, IsString, MaxLength } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MaxLength(512)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageAlt?: string | null;
}
