import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { ExamAttempt } from './exam-attempt.model';
import { Question } from './question.model';
import { QuestionChoice } from './question-choice.model';

@Table({ tableName: 'exam_attempt_answers' })
export class ExamAttemptAnswer extends Model<ExamAttemptAnswer> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => ExamAttempt)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare attemptId: number;

  @ForeignKey(() => Question)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare questionId: number;

  @ForeignKey(() => QuestionChoice)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare selectedChoiceId: number | null;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare isCorrect: boolean;

  @BelongsTo(() => ExamAttempt)
  declare attempt?: ExamAttempt;

  @BelongsTo(() => Question)
  declare question?: Question;

  @BelongsTo(() => QuestionChoice)
  declare selectedChoice?: QuestionChoice;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
