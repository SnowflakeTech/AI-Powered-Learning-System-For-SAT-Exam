import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { User } from '../models/user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminSeed } from './admin.seed';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, AdminSeed],
  exports: [UserService],
})
export class UserModule {}
