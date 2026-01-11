import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, QueryTypes } from "sequelize";

import { Question } from "../models/question.model";
import { QuestionChoice } from "../models/question-choice.model";
import { CreateQuestionWithChoicesDto } from "./dto/create-question-with-choices.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { UpdateChoicesDto } from "./dto/update-choices.dto";

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice)
    private readonly choiceModel: typeof QuestionChoice
  ) {}

  async listAll(page = 1, limit = 50) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(200, Math.max(1, Number(limit) || 50));
    const offset = (p - 1) * l;

    const rows = await this.questionModel.findAll({
      attributes: [
        "id",
        "content",
        "section",
        "skill",
        "difficulty",
        "imageUrl",
        "createdAt",
      ],
      order: [["id", "DESC"]],
      limit: l,
      offset,
    });
    return rows;
  }

  async statsBySkillDifficulty(params: { section?: string; skill?: string }) {
    const where: any = {};
    if (params.section) where.section = params.section;
    if (params.skill) where.skill = params.skill;

    const rows = await this.questionModel.findAll({
      where,
      attributes: [
        "skill",
        "difficulty",
        [
          this.questionModel.sequelize!.fn(
            "COUNT",
            this.questionModel.sequelize!.col("id")
          ),
          "count",
        ],
      ],
      group: ["skill", "difficulty"],
      raw: true,
    });

    const map: Record<string, any> = {};
    let total = 0;

    for (const r of rows as any[]) {
      const skill = r.skill || "Unknown";
      const diff = (r.difficulty || "Other").toLowerCase();
      const count = Number(r.count || 0);
      total += count;

      if (!map[skill]) {
        map[skill] = {
          skill,
          easy: 0,
          medium: 0,
          hard: 0,
          other: 0,
          total: 0,
        };
      }

      if (diff === "easy") map[skill].easy += count;
      else if (diff === "medium") map[skill].medium += count;
      else if (diff === "hard") map[skill].hard += count;
      else map[skill].other += count;

      map[skill].total += count;
    }

    return {
      section: params.section,
      total,
      rows: Object.values(map),
    };
  }

  async listForPractice(params: {
    exam?: string;
    section?: string;
    skill?: string;
    difficulty?: string;
    limit: number;
  }) {
    const where: any = {};
    if (params.exam) where.exam = params.exam;
    if (params.section) where.section = params.section;
    if (params.skill) where.skill = params.skill;
    if (params.difficulty) where.difficulty = params.difficulty;

    const rows = await this.questionModel.findAll({
      where,
      include: [QuestionChoice],
      order: this.questionModel.sequelize!.random(),
      limit: Math.min(50, Math.max(1, params.limit || 10)),
    });

    return rows.map((q: any) => {
      const qq = q.toJSON();

      const choices = (qq.questionChoices || [])
        .slice()
        .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0))
        .map((c: any) => ({
          id: c.id,
          text: c.choiceText,
          order: c.choiceOrder,
          isCorrect: !!c.isCorrect,
        }));

      return {
        id: qq.id,
        content: qq.content,
        section: qq.section,
        skill: qq.skill,
        difficulty: qq.difficulty,
        passage: qq.passage,
        imageUrl: qq.imageUrl,
        choices,
      };
    });
  }

  async getByIds(idsRaw: string) {
    const ids = String(idsRaw || "")
      .split(",")
      .map((x) => Number(String(x).trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return [];

    const rows = await this.questionModel.findAll({
      where: { id: uniqueIds as any },
      include: [QuestionChoice],
    });

    const map = new Map<number, any>();
    for (const r of rows as any[]) {
      const q = r.toJSON ? r.toJSON() : r;
      const choices = (q.questionChoices || [])
        .slice()
        .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0))
        .map((c: any) => ({
          id: c.id,
          text: c.choiceText,
          isCorrect: !!c.isCorrect,
          order: c.choiceOrder ?? null,
        }));

      map.set(q.id, {
        id: q.id,
        content: q.content,
        section: q.section,
        skill: q.skill,
        difficulty: q.difficulty,
        passage: q.passage,
        explanation: q.explanation,
        imageUrl: q.imageUrl,
        choices,
      });
    }

    return uniqueIds.map((id) => map.get(id)).filter(Boolean);
  }

  async createWithChoices(dto: CreateQuestionWithChoicesDto) {
    const correctCount = dto.choices.filter((c) => !!c.isCorrect).length;
    if (correctCount === 0)
      throw new BadRequestException("Phải có ít nhất 1 đáp án đúng");

    const sequelize: any = this.questionModel.sequelize;
    if (!sequelize) throw new BadRequestException("Sequelize chưa sẵn sàng");

    const created = await sequelize.transaction(async (t: any) => {
      const question = await this.questionModel.create(
        {
          content: dto.content,
          section: dto.section ?? null,
          skill: dto.skill ?? null,
          difficulty: dto.difficulty ?? null,
          passage: dto.passage ?? null,
          imageUrl: dto.imageUrl ?? null,
          imageAlt: dto.imageAlt ?? null,
        } as any,
        { transaction: t }
      );

      const choices = dto.choices.map((c, idx) => ({
        questionId: question.id,
        choiceText: c.choiceText,
        isCorrect: !!c.isCorrect,
        choiceOrder: c.choiceOrder ?? idx + 1,
      }));

      await this.choiceModel.bulkCreate(choices as any[], { transaction: t });
      return question.id;
    });

    return this.questionModel.findByPk(created, {
      include: [QuestionChoice],
    });
  }

  async updateQuestion(questionId: number, dto: UpdateQuestionDto) {
    const q = await this.questionModel.findByPk(questionId);
    if (!q) throw new NotFoundException("Không tìm thấy câu hỏi");

    if (dto.content !== undefined) q.content = dto.content as any;
    if (dto.section !== undefined) q.section = dto.section as any;
    if (dto.skill !== undefined) q.skill = dto.skill as any;
    if (dto.passage !== undefined) q.passage = dto.passage as any;
    if (dto.difficulty !== undefined) q.difficulty = dto.difficulty as any;
    if (dto.imageUrl !== undefined) (q as any).imageUrl = dto.imageUrl ?? null;
    if (dto.imageAlt !== undefined) (q as any).imageAlt = dto.imageAlt ?? null;

    await q.save();
    return this.questionModel.findByPk(q.id, {
      include: [QuestionChoice],
    });
  }

  async updateChoices(questionId: number, dto: UpdateChoicesDto) {
    const q = await this.questionModel.findByPk(questionId);
    if (!q) throw new NotFoundException("Không tìm thấy câu hỏi");

    const correctCount = (dto.choices || []).filter(
      (c) => !!c.isCorrect
    ).length;
    if (correctCount === 0)
      throw new BadRequestException("Phải có ít nhất 1 đáp án đúng");

    const sequelize: any = this.questionModel.sequelize;
    if (!sequelize) throw new BadRequestException("Sequelize chưa sẵn sàng");

    await sequelize.transaction(async (t: any) => {
      await this.choiceModel.destroy({ where: { questionId }, transaction: t });

      const choices = dto.choices.map((c, idx) => ({
        questionId,
        choiceText: c.choiceText,
        isCorrect: !!c.isCorrect,
        choiceOrder: c.choiceOrder ?? idx + 1,
      }));

      await this.choiceModel.bulkCreate(choices as any[], { transaction: t });
    });

    return this.questionModel.findByPk(questionId, {
      include: [QuestionChoice],
    });
  }

  async removeQuestion(questionId: number) {
    const q = await this.questionModel.findByPk(questionId);
    if (!q) throw new NotFoundException("Không tìm thấy câu hỏi");

    const links = await (this.questionModel.sequelize as any).query(
      "SELECT COUNT(*) as c FROM test_questions WHERE questionId = :qid",
      { replacements: { qid: questionId }, type: QueryTypes.SELECT }
    );
    const cnt = Number((links?.[0] as any)?.c || 0);
    if (cnt > 0)
      throw new BadRequestException(
        "Câu hỏi đang thuộc 1 đề thi, hãy gỡ khỏi đề trước"
      );

    const sequelize: any = this.questionModel.sequelize;
    if (!sequelize) throw new BadRequestException("Sequelize chưa sẵn sàng");

    return sequelize.transaction(async (t: any) => {
      const deletedChoices = await this.choiceModel.destroy({
        where: { questionId },
        transaction: t,
      });
      await q.destroy({ transaction: t });
      return { questionId, deletedChoices };
    });
  }

  async findByIds(ids?: string) {
    const arr = String(ids || "")
      .split(",")
      .map((x) => Number(String(x).trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

    if (!arr.length) return [];

    const rows = await this.questionModel.findAll({
      where: { id: arr as any },
      include: [QuestionChoice],
    });

    const map = new Map<number, any>();
    for (const q of rows as any[]) map.set(Number(q.id), q);

    const out = arr
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((q: any) => {
        const qq = q.toJSON ? q.toJSON() : q;
        const choices = (qq.questionChoices || [])
          .slice()
          .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0))
          .map((c: any) => ({
            id: c.id,
            text: c.choiceText,
            isCorrect: !!c.isCorrect,
          }));

        return {
          id: qq.id,
          content: qq.content,
          section: qq.section,
          skill: qq.skill,
          difficulty: qq.difficulty,
          imageUrl: qq.imageUrl,
          choices,
        };
      });

    return out;
  }
}
