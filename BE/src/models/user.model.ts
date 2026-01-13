import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";

import type { Optional } from "sequelize";

export type UserRole = "admin" | "student";

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  lastLoginUa?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  "id" | "role" | "lastLoginAt" | "lastLoginIp" | "lastLoginUa" | "createdAt" | "updatedAt"
>;

@Table({ tableName: "users" })
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare username: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare passwordHash: string;

  @AllowNull(false)
  @Default("student")
  @Column(DataType.ENUM("admin", "student"))
  declare role: UserRole;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLoginAt: Date | null;

  @AllowNull(true)
  @Column(DataType.STRING(64))
  declare lastLoginIp: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare lastLoginUa: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
