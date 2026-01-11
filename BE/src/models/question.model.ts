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
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { QuestionChoice } from './question-choice.model';
import { Test } from './test.model';
import { TestQuestion } from './test-question.model';
import { Passage } from './passage.model';

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

  @ForeignKey(() => Passage)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare passageId: number | null;

  @BelongsTo(() => Passage)
  declare passageRef?: Passage;

  // ✅ IMAGE SUPPORT
  @AllowNull(true)
  @Column(DataType.STRING(512))
  declare imageUrl: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare imageAlt: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare difficulty: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare explanation: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare model: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare source: string | null;

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
