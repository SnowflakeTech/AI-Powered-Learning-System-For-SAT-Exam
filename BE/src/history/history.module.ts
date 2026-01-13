import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

import { ExamAttempt } from '../models/exam-attempt.model';
import { ExamAttemptAnswer } from '../models/exam-attempt-answer.model';
import { Test } from '../models/test.model';
import { TestQuestion } from '../models/test-question.model';
import { Question } from '../models/question.model';
import { QuestionChoice } from '../models/question-choice.model';

import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ExamAttempt,
      ExamAttemptAnswer,
      Test,
      TestQuestion,
      Question,
      QuestionChoice,
    ]),
    AiModule,
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
