import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { User } from './user.model';
import { Test } from './test.model';
import { Question } from './question.model';
import { ExamAttempt } from './exam-attempt.model';

export type FeedbackType = 'wrong_answer' | 'invalid_question' | 'too_hard' | 'bug' | 'other';
export type FeedbackStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type FeedbackPriority = 'low' | 'medium' | 'high';

@Table({ tableName: 'feedbacks' })
export class Feedback extends Model<Feedback> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare userId: number;

  @AllowNull(false)
  @Column(DataType.ENUM('wrong_answer', 'invalid_question', 'too_hard', 'bug', 'other'))
  declare type: FeedbackType;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare message: string;

  @AllowNull(false)
  @Default('open')
  @Column(DataType.ENUM('open', 'in_review', 'resolved', 'dismissed'))
  declare status: FeedbackStatus;

  @AllowNull(false)
  @Default('medium')
  @Column(DataType.ENUM('low', 'medium', 'high'))
  declare priority: FeedbackPriority;

  @ForeignKey(() => Test)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare testId: number | null;

  @ForeignKey(() => Question)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare questionId: number | null;

  @ForeignKey(() => ExamAttempt)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare attemptId: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare adminNote: string | null;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Test)
  declare test?: Test;

  @BelongsTo(() => Question)
  declare question?: Question;

  @BelongsTo(() => ExamAttempt)
  declare attempt?: ExamAttempt;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
