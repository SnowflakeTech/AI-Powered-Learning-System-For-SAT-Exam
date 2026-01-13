import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";

import { Question } from "../models/question.model";
import { QuestionChoice } from "../models/question-choice.model";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [SequelizeModule.forFeature([Question, QuestionChoice]), AiModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
