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
  Default,
  Unique,
} from 'sequelize-typescript';

import { User } from './user.model';
import { Test } from './test.model';

export type AssignmentSource = 'ai' | 'admin' | 'import';

@Table({ tableName: 'test_assignments' })
export class TestAssignment extends Model<TestAssignment> {
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
  @Default('ai')
  @Column(DataType.ENUM('ai', 'admin', 'import'))
  declare source: AssignmentSource;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Test)
  declare test?: Test;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
