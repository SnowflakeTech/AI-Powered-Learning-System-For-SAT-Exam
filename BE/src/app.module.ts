import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TestsModule } from './tests/tests.module';
import { QuestionsModule } from './questions/questions.module';
import { AssistantModule } from './assistant/assistant.module';
import { AiModule } from './ai/ai.module';
import { HistoryModule } from './history/history.module';
import { FeedbackModule } from './feedback/feedback.module';

import { User } from './models/user.model';
import { Test } from './models/test.model';
import { Question } from './models/question.model';
import { QuestionChoice } from './models/question-choice.model';
import { TestQuestion } from './models/test-question.model';
import { ExamAttempt } from './models/exam-attempt.model';
import { ExamAttemptAnswer } from './models/exam-attempt-answer.model';
import { Feedback } from './models/feedback.model';
import { AiConversation } from './models/ai-conversation.model';
import { AiMessage } from './models/ai-message.model';
import { TestAssignment } from './models/test-assignment.model';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'root',
      // Mặc định trùng với cấu hình MySQL Windows của dự án
      password: process.env.DB_PASS || 'DNguyen2',
      database: process.env.DB_NAME || 'sat_hsa',
      models: [
        User,
        Test,
        Question,
        QuestionChoice,
        TestQuestion,
        ExamAttempt,
        ExamAttemptAnswer,
        Feedback,
        AiConversation,
        AiMessage,
        TestAssignment,
      ],
      autoLoadModels: true,
      synchronize: (process.env.DB_SYNC || 'true').toLowerCase() === 'true',
      // tạo/điều chỉnh bảng theo model 
      sync: { alter: true },
      logging: false,
      timezone: '+07:00',
    }),
    AuthModule,
    UserModule,
    TestsModule,
    QuestionsModule,
    AssistantModule,
    AiModule,
    HistoryModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
