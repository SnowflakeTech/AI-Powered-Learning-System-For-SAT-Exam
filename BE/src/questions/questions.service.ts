import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';

import { Question } from '../models/question.model';
import { QuestionChoice } from '../models/question-choice.model';
import { CreateQuestionWithChoicesDto } from './dto/create-question-with-choices.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateChoicesDto } from './dto/update-choices.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice) private readonly choiceModel: typeof QuestionChoice,
  ) {}

  async listAll(page = 1, limit = 50) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(200, Math.max(1, Number(limit) || 50));
    const offset = (p - 1) * l;

    const rows = await this.questionModel.findAll({
      attributes: ['id', 'content', 'section', 'skill', 'difficulty', 'createdAt'],
      order: [['id', 'DESC']],
      limit: l,
      offset,
    });
    return rows;
  }

  async createWithChoices(dto: CreateQuestionWithChoicesDto) {
    const correctCount = dto.choices.filter((c) => !!c.isCorrect).length;
    if (correctCount === 0) throw new BadRequestException('Phải có ít nhất 1 đáp án đúng');

    const question = await this.questionModel.create({
      content: dto.content,
      section: dto.section ?? null,
      skill: dto.skill ?? null,
      difficulty: dto.difficulty ?? null,
      passage: dto.passage ?? null,
    } as any);

    const choices = dto.choices.map((c, idx) => ({
      questionId: question.id,
      choiceText: c.choiceText,
      isCorrect: !!c.isCorrect,
      choiceOrder: c.choiceOrder ?? idx + 1,
    }));

    await this.choiceModel.bulkCreate(choices as any[]);

    const full = await this.questionModel.findByPk(question.id, { include: [QuestionChoice] });
    return full;
  }

  async updateQuestion(questionId: number, dto: UpdateQuestionDto) {
    const q = await this.questionModel.findByPk(questionId);
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');

    if (dto.content !== undefined) q.content = dto.content as any;
    if (dto.section !== undefined) q.section = dto.section as any;
    if (dto.skill !== undefined) q.skill = dto.skill as any;
    if (dto.passage !== undefined) q.passage = dto.passage as any;
    if (dto.difficulty !== undefined) q.difficulty = dto.difficulty as any;

    await q.save();
    const full = await this.questionModel.findByPk(q.id, { include: [QuestionChoice] });
    return full;
  }

  async updateChoices(questionId: number, dto: UpdateChoicesDto) {
    const q = await this.questionModel.findByPk(questionId);
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');

    const correctCount = (dto.choices || []).filter((c) => !!c.isCorrect).length;
    if (correctCount === 0) throw new BadRequestException('Phải có ít nhất 1 đáp án đúng');

    // Xoá toàn bộ choices cũ, tạo lại choices mới (đơn giản & ít bug)
    await this.choiceModel.destroy({ where: { questionId } });

    const choices = dto.choices.map((c, idx) => ({
      questionId,
      choiceText: c.choiceText,
      isCorrect: !!c.isCorrect,
      choiceOrder: c.choiceOrder ?? idx + 1,
    }));
    await this.choiceModel.bulkCreate(choices as any[]);

    const full = await this.questionModel.findByPk(questionId, { include: [QuestionChoice] });
    return full;
  }

  /**
   * Xoá câu hỏi. Lưu ý: nếu câu hỏi đang được gắn vào 1 test thì sẽ bị chặn.
   */
  async removeQuestion(questionId: number) {
    // tránh import vòng: dùng raw check qua choiceModel/questionModel, và check liên kết bằng query
    // test_questions được map ở DB, nên dùng raw query nhẹ.
    const q = await this.questionModel.findByPk(questionId);
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');

    const links = await (this.questionModel.sequelize as any).query(
      'SELECT COUNT(*) as c FROM test_questions WHERE questionId = :qid',
      { replacements: { qid: questionId }, type: QueryTypes.SELECT },
    );
    const cnt = Number((links?.[0] as any)?.c || 0);
    if (cnt > 0) throw new BadRequestException('Câu hỏi đang thuộc 1 đề thi, hãy gỡ khỏi đề trước');

    const deletedChoices = await this.choiceModel.destroy({ where: { questionId } });
    await q.destroy();
    return { questionId, deletedChoices };
  }
}
