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

import { AiConversation } from './ai-conversation.model';

export type AiRole = 'system' | 'user' | 'assistant';

@Table({ tableName: 'ai_messages' })
export class AiMessage extends Model<AiMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => AiConversation)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare conversationId: number;

  @AllowNull(false)
  @Column(DataType.ENUM('system', 'user', 'assistant'))
  declare role: AiRole;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare content: string;

  @BelongsTo(() => AiConversation)
  declare conversation?: AiConversation;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
