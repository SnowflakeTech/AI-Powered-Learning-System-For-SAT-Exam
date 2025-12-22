import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ok } from '../common/api-response';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.userService.register(dto.username, dto.email, dto.password);
    return ok({ id: user.id }, 'Register successful');
  }

  @Get('me')
  async me(@Req() req: any) {
    const me = await this.userService.getMe(req.user.id);
    return ok(me);
  }

  @Patch('change-password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.userService.changePassword(req.user.id, dto.oldPassword, dto.newPassword);
    return ok(null, 'Đổi mật khẩu thành công.');
  }
}
