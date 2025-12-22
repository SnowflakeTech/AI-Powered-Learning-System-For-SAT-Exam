import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { Question } from './question.model';
import { TestQuestion } from './test-question.model';

export type TestMode = 'adaptive' | 'fixed' | 'diagnostic';

@Table({ tableName: 'tests' })
export class Test extends Model<Test> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Default('fixed')
  @Column(DataType.ENUM('adaptive', 'fixed', 'diagnostic'))
  declare mode: TestMode;

  @AllowNull(false)
  @Default('Untitled Test')
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Default(3600)
  @Column(DataType.INTEGER)
  declare durationSec: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare quantities: number;

  // Hiển thị cho user thường: chỉ những test public, hoặc được assign.
  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isPublic: boolean;

  // Nguồn tạo đề: admin/import/ai (...)
  @AllowNull(false)
  @Default('admin')
  @Column(DataType.STRING)
  declare source: string;

  // Các cột dưới đây có thể tồn tại trong schema cũ. Nếu DB không có cũng không sao nếu DB_SYNC=true.
  @AllowNull(true)
  @Column(DataType.DATE)
  declare startedAt: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare endedAt: Date | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare userId: number | null;

  @BelongsToMany(() => Question, () => TestQuestion)
  declare questions?: Question[];

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
