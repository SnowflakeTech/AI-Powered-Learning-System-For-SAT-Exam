import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { ok } from '../common/api-response';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTestDto } from './dto/create-test.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { RemoveQuestionsDto } from './dto/remove-questions.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { TestsService } from './tests.service';
import { HistoryService } from '../history/history.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService, private readonly historyService: HistoryService) {}

  @Get()
  async list(@Req() req: any) {
    const rows = await this.testsService.listForUser(req.user);
    return ok(rows);
  }

  @Roles('admin')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateTestDto) {
    const created = await this.testsService.create(req.user.id, dto);
    return ok({ id: created.id }, 'Created');
  }

  @Roles('admin')
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestDto) {
    const updated = await this.testsService.update(id, dto);
    return ok(updated, 'Updated');
  }

  @Roles('admin')
  @Post(':id/questions')
  async attach(@Param('id', ParseIntPipe) id: number, @Body() dto: AddQuestionsDto) {
    const result = await this.testsService.attachQuestions(id, dto.questionIds);
    return ok(result, 'Attached');
  }

  @Roles('admin')
  @Delete(':id/questions')
  async detach(@Param('id', ParseIntPipe) id: number, @Body() dto: RemoveQuestionsDto) {
    const result = await this.testsService.detachQuestions(id, dto.questionIds);
    return ok(result, 'Detached');
  }

  @Roles('admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('deleteOrphans') deleteOrphans?: string,
  ) {
    const data = await this.testsService.removeTest(id, (deleteOrphans || 'false').toLowerCase() === 'true');
    return ok(data, 'Deleted');
  }

  @Get(':id/questions')
  async getQuestions(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const data = await this.testsService.getTestQuestions(req.user, id);
    return ok(data);
  }

  @Post(':id/attempts')
  async submitAttempt(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const okAccess = await this.testsService.canAccessTest(req.user, id);
    if (!okAccess) throw new NotFoundException('Không tìm thấy đề thi');
    const data = await this.historyService.submitAttempt(req.user.id, id, body);
    return ok(data, 'Submitted');
  }
}
