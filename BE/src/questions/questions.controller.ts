import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateQuestionWithChoicesDto } from './dto/create-question-with-choices.dto';
import { UpdateChoicesDto } from './dto/update-choices.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@Controller('question')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('all')
  async all(@Query('page') page?: string, @Query('limit') limit?: string) {
    const rows = await this.questionsService.listAll(Number(page), Number(limit));
    return ok(rows);
  }

  @Roles('admin')
  @Post('with-choices')
  async createWithChoices(@Body() dto: CreateQuestionWithChoicesDto) {
    const q = await this.questionsService.createWithChoices(dto);
    return ok(q);
  }

  @Roles('admin')
  @Patch(':id')
  async updateQuestion(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuestionDto) {
    const q = await this.questionsService.updateQuestion(id, dto);
    return ok(q, 'Updated');
  }

  @Roles('admin')
  @Put(':id/choices')
  async updateChoices(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChoicesDto) {
    const q = await this.questionsService.updateChoices(id, dto);
    return ok(q, 'Updated');
  }

  @Roles('admin')
  @Delete(':id')
  async removeQuestion(@Param('id', ParseIntPipe) id: number) {
    const r = await this.questionsService.removeQuestion(id);
    return ok(r, 'Deleted');
  }
}
