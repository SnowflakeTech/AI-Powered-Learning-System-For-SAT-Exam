import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async register(username: string, email: string, password: string): Promise<User> {
    const existed = await this.userModel.findOne({ where: { email } });
    if (existed) throw new BadRequestException('Email đã tồn tại');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      username,
      email,
      passwordHash,
      role: 'student',
    });

    return user;
  }

  async getMe(userId: number): Promise<{ uid: number; email: string; username: string; role: string; name: string }> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      uid: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      name: user.username,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Mật khẩu hiện tại không đúng');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
  }
}
