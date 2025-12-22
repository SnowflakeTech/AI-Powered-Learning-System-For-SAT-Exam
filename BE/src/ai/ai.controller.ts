import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ok } from '../common/api-response';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/chat.dto';
import { AiGenerateTestDto } from './dto/generate-test.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req: any, @Body() dto: AiChatDto) {
    const data = await this.aiService.chat(req.user.id, dto);
    return ok(data);
  }

  @Get('insights')
  async insights(@Req() req: any) {
    const data = await this.aiService.insights(req.user.id);
    return ok(data);
  }

  @Post('generate-test')
  async generateTest(@Req() req: any, @Body() dto: AiGenerateTestDto) {
    const data = await this.aiService.generateTest(req.user.id, dto);
    return ok(data, 'Generated');
  }
}
