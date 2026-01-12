import { Body, Controller, Post, Req } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { ok } from "../common/api-response";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  async login(@Req() req: any, @Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);

    const forwarded = String(req?.headers?.["x-forwarded-for"] || "");
    const ip =
      forwarded.split(",")[0]?.trim() ||
      String(req?.ip || "") ||
      null;

    const ua = String(req?.headers?.["user-agent"] || "") || null;

    await this.authService.updateLoginMeta(user.id, ip, ua);

    const token = await this.authService.signToken(user);
    return ok(token, "Login successful");
  }
}
