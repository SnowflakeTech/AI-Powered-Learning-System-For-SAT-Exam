import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';


@Injectable()
export class AdminSeed implements OnModuleInit {
  private readonly logger = new Logger(AdminSeed.name);

  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'admin';
    const username = process.env.ADMIN_USERNAME || 'Admin';

    try {
      const existed = await this.userModel.findOne({ where: { email } });
      const passwordHash = await bcrypt.hash(password, 10);

      if (!existed) {
        await this.userModel.create({
          username,
          email,
          passwordHash,
          role: 'admin',
        } as any);
        this.logger.log(`Seeded admin user: ${email} / ${password}`);
        return;
      }

      existed.username = username;
      existed.role = 'admin';
      existed.passwordHash = passwordHash;
      await existed.save();
      this.logger.log(`Ensured admin user: ${email} / ${password}`);
    } catch (err: any) {
      this.logger.error(`Admin seed failed: ${err?.message || err}`);
    }
  }
}
