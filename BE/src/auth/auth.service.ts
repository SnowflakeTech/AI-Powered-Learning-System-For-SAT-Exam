import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../models/user.model";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    return user;
  }

  async updateLoginMeta(userId: number, ip: string | null, ua: string | null): Promise<void> {
    const user = await this.userModel.findByPk(userId);
    if (!user) return;

    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: ip ? String(ip).slice(0, 64) : null,
      lastLoginUa: ua ? String(ua).slice(0, 255) : null,
    } as any);
  }

  async signToken(user: User): Promise<{ accessToken: string }> {
    const payload = { id: user.id, email: user.email, role: user.role };

    const rawExpires = process.env.JWT_EXPIRES_IN ?? "7d";
    const expiresIn = /^\d+$/.test(rawExpires) ? Number(rawExpires) : (rawExpires as any);

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || "dev_secret_change_me",
      expiresIn,
    });

    return { accessToken };
  }
}
