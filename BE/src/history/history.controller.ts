import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { ok } from '../common/api-response';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async list(@Req() req: any) {
    const data = await this.historyService.list(req.user.id);
    return ok(data);
  }

  @Get(':attemptId')
  async detail(@Req() req: any, @Param('attemptId') attemptId: string) {
    const data = await this.historyService.detail(req.user.id, attemptId);
    return ok(data);
  }
}
