import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Feedback } from '../models/feedback.model';
import { Test } from '../models/test.model';
import { Question } from '../models/question.model';
import { ExamAttempt } from '../models/exam-attempt.model';

import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback) private readonly feedbackModel: typeof Feedback,
    @InjectModel(Test) private readonly testModel: typeof Test,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(ExamAttempt) private readonly attemptModel: typeof ExamAttempt,
  ) {}

  async create(userId: number, dto: CreateFeedbackDto) {
    // Validate refs 
    if (dto.testId) {
      const t = await this.testModel.findByPk(dto.testId);
      if (!t) throw new BadRequestException('testId không tồn tại');
    }
    if (dto.questionId) {
      const q = await this.questionModel.findByPk(dto.questionId);
      if (!q) throw new BadRequestException('questionId không tồn tại');
    }
    if (dto.attemptId) {
      const a = await this.attemptModel.findByPk(dto.attemptId);
      if (!a) throw new BadRequestException('attemptId không tồn tại');

    }

    const row = await this.feedbackModel.create({
      userId,
      type: dto.type,
      message: dto.message,
      priority: dto.priority || 'medium',
      status: 'open',
      testId: dto.testId || null,
      questionId: dto.questionId || null,
      attemptId: dto.attemptId || null,
    } as any);

    return row;
  }

  async listMine(userId: number, page = 1, limit = 20) {
    const offset = Math.max(0, (page - 1) * limit);
    const { rows, count } = await this.feedbackModel.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { items: rows, total: count, page, limit };
  }

  async listAll(params: { status?: string; type?: string; page: number; limit: number }) {
    const { status, type } = params;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = Math.max(0, (page - 1) * limit);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { rows, count } = await this.feedbackModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        { association: 'user', attributes: ['id', 'email', 'username', 'role'] },
        { association: 'test', attributes: ['id', 'title'] },
        { association: 'question', attributes: ['id', 'content'] },
        { association: 'attempt', attributes: ['id'] },
      ] as any,
    });

    return { items: rows, total: count, page, limit };
  }

  async detail(userId: number, role: string, id: number) {
    const row = await this.feedbackModel.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'email', 'username', 'role'] },
        { association: 'test', attributes: ['id', 'title'] },
        { association: 'question', attributes: ['id', 'content'] },
        { association: 'attempt', attributes: ['id', 'testId', 'userId', 'score', 'durationSec', 'status'] },
      ] as any,
    });
    if (!row) throw new NotFoundException('Feedback not found');

    if (role !== 'admin' && row.userId !== userId) {
      throw new ForbiddenException('Không có quyền xem feedback này');
    }
    return row;
  }

  async update(id: number, dto: UpdateFeedbackDto) {
    const row = await this.feedbackModel.findByPk(id);
    if (!row) throw new NotFoundException('Feedback not found');

    if (dto.status) row.status = dto.status as any;
    if (dto.priority) row.priority = dto.priority as any;
    if (dto.adminNote !== undefined) row.adminNote = dto.adminNote;

    await row.save();
    return row;
  }
}
