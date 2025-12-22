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
import { Question } from './question.model';

@Table({ tableName: 'questionchoices' })
export class QuestionChoice extends Model<QuestionChoice> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare choiceText: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isCorrect: boolean;

  @ForeignKey(() => Question)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare questionId: number;

  @BelongsTo(() => Question)
  declare question?: Question;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare choiceOrder: number | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
