import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Test } from '../models/test.model';
import { Question } from '../models/question.model';
import { QuestionChoice } from '../models/question-choice.model';
import { TestQuestion } from '../models/test-question.model';
import { ExamAttempt } from '../models/exam-attempt.model';
import { ExamAttemptAnswer } from '../models/exam-attempt-answer.model';
import { Feedback } from '../models/feedback.model';
import { TestAssignment } from '../models/test-assignment.model';

import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Test, Question, QuestionChoice, TestQuestion, ExamAttempt, ExamAttemptAnswer, Feedback, TestAssignment]),
    HistoryModule,
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
