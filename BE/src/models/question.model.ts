import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { QuestionChoice } from './question-choice.model';
import { Test } from './test.model';
import { TestQuestion } from './test-question.model';

@Table({ tableName: 'questions' })
export class Question extends Model<Question> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare hashId: string | null;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare content: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare section: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare skill: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare passage: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare difficulty: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare model: string | null;

  @HasMany(() => QuestionChoice)
  declare questionChoices?: QuestionChoice[];

  @BelongsToMany(() => Test, () => TestQuestion)
  declare tests?: Test[];

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
