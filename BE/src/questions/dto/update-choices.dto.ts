import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ChoiceInputDto {
  @IsString()
  choiceText!: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  choiceOrder?: number;
}

export class UpdateChoicesDto {
  @IsArray()
  @ArrayNotEmpty()
  choices!: ChoiceInputDto[];
}
