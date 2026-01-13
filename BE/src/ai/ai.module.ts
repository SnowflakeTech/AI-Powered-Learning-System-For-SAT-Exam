import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { AiConversation } from "../models/ai-conversation.model";
import { AiMessage } from "../models/ai-message.model";
import { ExamAttempt } from "../models/exam-attempt.model";
import { ExamAttemptAnswer } from "../models/exam-attempt-answer.model";
import { Test } from "../models/test.model";
import { TestQuestion } from "../models/test-question.model";
import { Question } from "../models/question.model";
import { QuestionChoice } from "../models/question-choice.model";
import { TestAssignment } from "../models/test-assignment.model";

@Module({
  imports: [
    SequelizeModule.forFeature([
      AiConversation,
      AiMessage,
      ExamAttempt,
      ExamAttemptAnswer,
      Test,
      TestQuestion,
      Question,
      QuestionChoice,
      TestAssignment,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
