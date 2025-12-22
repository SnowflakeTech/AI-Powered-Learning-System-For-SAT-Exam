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
  HasMany,
} from 'sequelize-typescript';

import { User } from './user.model';
import { Test } from './test.model';
import { ExamAttemptAnswer } from './exam-attempt-answer.model';

export type AttemptStatus = 'completed' | 'in_progress';

@Table({ tableName: 'exam_attempts' })
export class ExamAttempt extends Model<ExamAttempt> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare userId: number;

  @ForeignKey(() => Test)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare testId: number;

  @AllowNull(false)
  @Default('completed')
  @Column(DataType.ENUM('completed', 'in_progress'))
  declare status: AttemptStatus;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare startedAt: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare submittedAt: Date | null;

  // thời gian làm (giây)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare durationSec: number | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare correctCount: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare totalQuestions: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare score: number;

  @AllowNull(false)
  @Default(800)
  @Column(DataType.INTEGER)
  declare totalScore: number;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Test)
  declare test?: Test;

  @HasMany(() => ExamAttemptAnswer)
  declare answers?: ExamAttemptAnswer[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
