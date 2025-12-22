import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class AddQuestionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  questionIds!: number[];
}
