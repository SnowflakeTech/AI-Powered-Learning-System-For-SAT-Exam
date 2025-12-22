import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Feedback } from '../models/feedback.model';
import { Test } from '../models/test.model';
import { Question } from '../models/question.model';
import { ExamAttempt } from '../models/exam-attempt.model';

import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [SequelizeModule.forFeature([Feedback, Test, Question, ExamAttempt])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
