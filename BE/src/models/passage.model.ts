import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Question } from './question.model';

@Table({ tableName: 'passages' })
export class Passage extends Model<Passage> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.ENUM('SAT', 'HSA'), allowNull: true })
  declare exam: 'SAT' | 'HSA' | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare title: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({ type: DataType.STRING(32), allowNull: true })
  declare language: string | null;

  @HasMany(() => Question)
  declare questions?: Question[];
}
