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
  HasMany,
  Default,
} from 'sequelize-typescript';

import { User } from './user.model';
import { AiMessage } from './ai-message.model';

@Table({ tableName: 'ai_conversations' })
export class AiConversation extends Model<AiConversation> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare userId: number;

  @AllowNull(false)
  @Default('Cuộc trò chuyện')
  @Column(DataType.STRING)
  declare title: string;

  @BelongsTo(() => User)
  declare user?: User;

  @HasMany(() => AiMessage)
  declare messages?: AiMessage[];

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
