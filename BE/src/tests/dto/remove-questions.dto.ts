import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class RemoveQuestionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  questionIds!: number[];
}
