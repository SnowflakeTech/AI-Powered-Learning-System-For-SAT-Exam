import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { APP_GUARD } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { TestsModule } from "./tests/tests.module";
import { QuestionsModule } from "./questions/questions.module";
import { AssistantModule } from "./assistant/assistant.module";
import { AiModule } from "./ai/ai.module";
import { HistoryModule } from "./history/history.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { UploadModule } from "./upload/upload.module";
import { LookupModule } from "./lookup/lookup.module";
import { AppController } from "./app.controller";

import { Passage } from "./models/passage.model";
import { User } from "./models/user.model";
import { Test } from "./models/test.model";
import { Question } from "./models/question.model";
import { QuestionChoice } from "./models/question-choice.model";
import { TestQuestion } from "./models/test-question.model";
import { ExamAttempt } from "./models/exam-attempt.model";
import { ExamAttemptAnswer } from "./models/exam-attempt-answer.model";
import { Feedback } from "./models/feedback.model";
import { AiConversation } from "./models/ai-conversation.model";
import { AiMessage } from "./models/ai-message.model";
import { TestAssignment } from "./models/test-assignment.model";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
    UploadModule,

    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const DB_SYNC = String(cfg.get("DB_SYNC") || "").toLowerCase() === "true";
        const DB_LOG = String(cfg.get("DB_LOG") || "").toLowerCase() === "true";

        return {
          dialect: "mysql",
          host: cfg.get("DB_HOST") || "localhost",
          port: Number(cfg.get("DB_PORT") || 3306),
          username: cfg.get("DB_USER") || "root",
          password: cfg.get("DB_PASSWORD") || cfg.get("DB_PASS") || "",
          database: cfg.get("DB_NAME") || "sat_hsa",
          models: [
            Passage,
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
          synchronize: DB_SYNC,
          sync: { alter: DB_SYNC },
          logging: DB_LOG ? console.log : false,
          timezone: "+07:00",
        };
      },
    }),

    AuthModule,
    UserModule,
    TestsModule,
    QuestionsModule,
    AssistantModule,
    AiModule,
    HistoryModule,
    FeedbackModule,
    LookupModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
