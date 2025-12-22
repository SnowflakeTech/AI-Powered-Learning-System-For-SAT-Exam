import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  AllowNull,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Test } from './test.model';
import { Question } from './question.model';

@Table({ tableName: 'test_questions' })
export class TestQuestion extends Model<TestQuestion> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Test)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare testId: number;

  @BelongsTo(() => Test)
  declare test?: Test;

  @ForeignKey(() => Question)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare questionId: number;

  @BelongsTo(() => Question)
  declare question?: Question;

  // trong schema cũ thường là `order` (reserved word). Mình vẫn map đúng tên cột.
  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: 'order' })
  declare order: number | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
