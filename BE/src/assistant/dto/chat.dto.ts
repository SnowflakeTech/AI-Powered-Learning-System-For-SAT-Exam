import { IsArray, IsOptional, IsString } from 'class-validator';

export class ChatDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsArray()
  history?: Array<{ role: string; content: string }>;
}
