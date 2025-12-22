import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ChatDto } from './dto/chat.dto';
import { AssistantService } from './assistant.service';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    const reply = await this.assistantService.reply(dto.message);
    return ok({ reply });
  }
}
