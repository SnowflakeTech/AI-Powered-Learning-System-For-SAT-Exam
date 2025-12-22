import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { Test } from '../models/test.model';
import { Question } from '../models/question.model';
import { QuestionChoice } from '../models/question-choice.model';
import { TestQuestion } from '../models/test-question.model';
import { ExamAttempt } from '../models/exam-attempt.model';
import { ExamAttemptAnswer } from '../models/exam-attempt-answer.model';
import { Feedback } from '../models/feedback.model';
import { TestAssignment } from '../models/test-assignment.model';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Test) private readonly testModel: typeof Test,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice) private readonly choiceModel: typeof QuestionChoice,
    @InjectModel(TestQuestion) private readonly testQuestionModel: typeof TestQuestion,
    @InjectModel(ExamAttempt) private readonly attemptModel: typeof ExamAttempt,
    @InjectModel(ExamAttemptAnswer) private readonly attemptAnswerModel: typeof ExamAttemptAnswer,
    @InjectModel(Feedback) private readonly feedbackModel: typeof Feedback,
    @InjectModel(TestAssignment) private readonly assignModel: typeof TestAssignment,
  ) {}

  private async isAssigned(userId: number, testId: number) {
    const row = await this.assignModel.findOne({ where: { userId, testId } });
    return !!row;
  }

  async canAccessTest(user: any, testId: number) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const test = await this.testModel.findByPk(testId, { attributes: ['id', 'isPublic'] });
    if (!test) return false;
    if ((test as any).isPublic) return true;
    return this.isAssigned(user.id, testId);
  }

  async listForUser(user: any) {
    // admin thấy tất cả
    if (user?.role === 'admin') {
      return this.testModel.findAll({
        attributes: ['id', 'title', 'mode', 'quantities', 'durationSec', 'createdAt', 'isPublic', 'source'],
        order: [['id', 'DESC']],
      });
    }

    const assigned = await this.assignModel.findAll({ where: { userId: user.id }, attributes: ['testId'] });
    const ids = assigned.map((x: any) => x.testId);

    return this.testModel.findAll({
      where: {
        [Op.or]: [{ isPublic: true }, ...(ids.length ? [{ id: { [Op.in]: ids } }] : [])],
      } as any,
      attributes: ['id', 'title', 'mode', 'quantities', 'durationSec', 'createdAt', 'isPublic', 'source'],
      order: [['id', 'DESC']],
    });
  }

  async create(userId: number, dto: CreateTestDto) {
    // NOTE: Không cho FE set primary key `id` của bảng tests (DB dùng AUTO_INCREMENT).
    // Nếu cần "ID hiển thị", dùng dto.code để prefix vào title.
    const rawTitle = (dto.title ?? '').trim() || `New Test ${Date.now()}`;
    const code = (dto.code ?? '').trim();
    const title = code ? `[${code}] ${rawTitle}` : rawTitle;

    const created = await this.testModel.create({
      mode: dto.mode ?? 'fixed',
      title,
      durationSec: dto.durationSec ?? 3600,
      quantities: dto.quantities ?? 0,
      startedAt: new Date(),
      userId,
    } as any);

    return created;
  }

  async update(testId: number, dto: UpdateTestDto) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException('Không tìm thấy đề thi');

    if (dto.title !== undefined) test.title = dto.title as any;
    if (dto.mode !== undefined) test.mode = dto.mode as any;
    if (dto.durationSec !== undefined) test.durationSec = dto.durationSec as any;
    if (dto.quantities !== undefined) test.quantities = dto.quantities as any;

    await test.save();
    return test;
  }

  async attachQuestions(testId: number, questionIds: number[]) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException('Không tìm thấy đề thi');

    const uniqueIds = Array.from(new Set(questionIds)).filter((x) => Number.isFinite(x));
    if (uniqueIds.length === 0) throw new BadRequestException('questionIds rỗng');

    const questions = await this.questionModel.findAll({ where: { id: { [Op.in]: uniqueIds } } });
    const existingLinks = await this.testQuestionModel.findAll({ where: { testId } });
    const existed = new Set(existingLinks.map((l) => l.questionId));

    let nextOrder = 0;
    for (const l of existingLinks) {
      const v = l.order ?? 0;
      if (v > nextOrder) nextOrder = v;
    }
    if (nextOrder === 0) nextOrder = existingLinks.length;

    const toCreate = questions
      .filter((q) => !existed.has(q.id))
      .map((q) => ({ testId, questionId: q.id, order: ++nextOrder }));

    if (toCreate.length > 0) {
      await this.testQuestionModel.bulkCreate(toCreate as any[]);
    }

    const total = await this.testQuestionModel.count({ where: { testId } });
    test.quantities = total;
    await test.save();

    return { attached: toCreate.length, total };
  }

  async detachQuestions(testId: number, questionIds: number[]) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException('Không tìm thấy đề thi');

    const uniqueIds = Array.from(new Set(questionIds)).filter((x) => Number.isFinite(x));
    if (uniqueIds.length === 0) throw new BadRequestException('questionIds rỗng');

    const removed = await this.testQuestionModel.destroy({
      where: { testId, questionId: { [Op.in]: uniqueIds } },
    });

    const total = await this.testQuestionModel.count({ where: { testId } });
    test.quantities = total;
    await test.save();

    return { removed, total };
  }

  /**
   * Xoá hẳn đề thi.
   * - Luôn xoá link test_questions
   * - Tuỳ chọn: xoá luôn các câu hỏi/choices bị orphan (không còn thuộc test nào)
   */
    /**
   * Xoá đề thi.
   * Mặc định: xoá đề + link test_questions + lịch sử làm bài (attempts/answers) của đề đó.
   * Không xoá bảng questions/choices (tránh đụng FK feedback, attempt cũ...).
   * Nếu thật sự muốn xoá luôn câu hỏi orphan thì set ?deleteOrphans=true.
   */
  async removeTest(testId: number, deleteOrphans = false) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException('Không tìm thấy đề thi');

    // Lấy danh sách questionIds đang thuộc đề (để tuỳ chọn xoá orphan)
    const links = await this.testQuestionModel.findAll({ where: { testId } });
    const questionIds = Array.from(new Set(links.map((l) => l.questionId)));

    // Lấy attemptIds để xoá answers trước
    const attempts = await this.attemptModel.findAll({
      where: { testId },
      attributes: ['id'],
    });
    const attemptIds = attempts.map((a: any) => a.id);

    const sequelize: any = (this.testModel as any).sequelize;
    await sequelize.transaction(async (t: any) => {
      // Gỡ FK trong feedback để không bị chặn khi xoá attempts/tests
      if (attemptIds.length > 0) {
        await this.feedbackModel.update(
          { attemptId: null },
          { where: { attemptId: { [Op.in]: attemptIds } }, transaction: t },
        );
      }
      await this.feedbackModel.update(
        { testId: null },
        { where: { testId }, transaction: t },
      );

      // Xoá attempt answers -> attempts
      if (attemptIds.length > 0) {
        await this.attemptAnswerModel.destroy({
          where: { attemptId: { [Op.in]: attemptIds } },
          transaction: t,
        });
      }
      await this.attemptModel.destroy({ where: { testId }, transaction: t });

      // Xoá link test_questions
      await this.testQuestionModel.destroy({ where: { testId }, transaction: t });

      // Xoá test
      await this.testModel.destroy({ where: { id: testId }, transaction: t });

      // Tuỳ chọn: xoá questions/choices orphan
      if (deleteOrphans && questionIds.length > 0) {
        const remainLinks = await this.testQuestionModel.findAll({
          where: { questionId: { [Op.in]: questionIds } },
          attributes: ['questionId'],
          transaction: t,
        });
        const stillUsed = new Set(remainLinks.map((x: any) => x.questionId));
        const orphanIds = questionIds.filter((id) => !stillUsed.has(id));

        if (orphanIds.length > 0) {
          // gỡ FK feedback.questionId trước khi xoá question
          await this.feedbackModel.update(
            { questionId: null },
            { where: { questionId: { [Op.in]: orphanIds } }, transaction: t },
          );

          await this.choiceModel.destroy({
            where: { questionId: { [Op.in]: orphanIds } },
            transaction: t,
          });
          await this.questionModel.destroy({
            where: { id: { [Op.in]: orphanIds } },
            transaction: t,
          });
        }
      }
    });

    return { testId, removedAttempts: attemptIds.length, removedLinks: links.length, deleteOrphans };
  }

  async getTestQuestions(user: any, testId: number) {
    const okAccess = await this.canAccessTest(user, testId);
    if (!okAccess) throw new NotFoundException('Không tìm thấy đề thi');

    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException('Không tìm thấy đề thi');

    const links = await this.testQuestionModel.findAll({
      where: { testId },
      include: [
        {
          model: Question,
          include: [QuestionChoice],
        },
      ],
      order: [
        ['order', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    const questions = links
      .map((l) => (l as any).question as Question | undefined)
      .filter(Boolean)
      .map((q) => {
        const qq = q!.toJSON() as any;
        // đảm bảo FE đọc được: questionChoices
        const choices = (qq.questionChoices || qq.questionchoices || []).map((c: any) => ({
          id: c.id,
          choiceText: c.choiceText,
          isCorrect: !!c.isCorrect,
          choiceOrder: c.choiceOrder ?? null,
        }));
        return {
          id: qq.id,
          content: qq.content,
          section: qq.section,
          skill: qq.skill,
          passage: qq.passage,
          difficulty: qq.difficulty,
          questionChoices: choices,
        };
      });

    return { test: test.toJSON(), questions };
  }
}
