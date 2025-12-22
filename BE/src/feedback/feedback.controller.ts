import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ok } from '../common/api-response';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // User gửi phản hồi
  @Post()
  async create(@Req() req: any, @Body() dto: CreateFeedbackDto) {
    const data = await this.feedbackService.create(req.user.id, dto);
    return ok(data, 'Created');
  }

  // User xem feedback của mình
  @Get('me')
  async mine(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const data = await this.feedbackService.listMine(req.user.id, Number(page), Number(limit));
    return ok(data);
  }

  // Admin xem tất cả feedback 
  @Roles('admin')
  @Get()
  async listAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const data = await this.feedbackService.listAll({ status, type, page: Number(page), limit: Number(limit) });
    return ok(data);
  }

  // Xem chi tiết 1 feedback (owner hoặc admin)
  @Get(':id')
  async detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.feedbackService.detail(req.user.id, req.user.role, id);
    return ok(data);
  }

  // Admin cập nhật trạng thái/ghi chú
  @Roles('admin')
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFeedbackDto) {
    const data = await this.feedbackService.update(id, dto);
    return ok(data, 'Updated');
  }
}
