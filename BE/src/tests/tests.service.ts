import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";

import { Test } from "../models/test.model";
import { Question } from "../models/question.model";
import { QuestionChoice } from "../models/question-choice.model";
import { TestQuestion } from "../models/test-question.model";
import { ExamAttempt } from "../models/exam-attempt.model";
import { ExamAttemptAnswer } from "../models/exam-attempt-answer.model";
import { Feedback } from "../models/feedback.model";
import { TestAssignment } from "../models/test-assignment.model";
import { CreateTestDto } from "./dto/create-test.dto";
import { UpdateTestDto } from "./dto/update-test.dto";

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Test) private readonly testModel: typeof Test,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice)
    private readonly choiceModel: typeof QuestionChoice,
    @InjectModel(TestQuestion)
    private readonly testQuestionModel: typeof TestQuestion,
    @InjectModel(ExamAttempt) private readonly attemptModel: typeof ExamAttempt,
    @InjectModel(ExamAttemptAnswer)
    private readonly attemptAnswerModel: typeof ExamAttemptAnswer,
    @InjectModel(Feedback) private readonly feedbackModel: typeof Feedback,
    @InjectModel(TestAssignment)
    private readonly assignModel: typeof TestAssignment
  ) {}

  private async isAssigned(userId: number, testId: number) {
    const row = await this.assignModel.findOne({ where: { userId, testId } });
    return !!row;
  }

  async canAccessTest(user: any, testId: number) {
    if (!user) return false;
    if (user.role === "admin") return true;

    const test = await this.testModel.findByPk(testId, {
      attributes: ["id", "isPublic", "userId"],
    });
    if (!test) return false;

    if ((test as any).isPublic) return true;
    if (
      (test as any).userId &&
      Number((test as any).userId) === Number(user.id)
    )
      return true;

    return this.isAssigned(user.id, testId);
  }

  async listForUser(user: any) {
    if (user?.role === "admin") {
      return this.testModel.findAll({
        attributes: [
          "id",
          "title",
          "mode",
          "quantities",
          "durationSec",
          "createdAt",
          "isPublic",
          "source",
        ],
        order: [["id", "DESC"]],
      });
    }

    const assigned = await this.assignModel.findAll({
      where: { userId: user.id },
      attributes: ["testId"],
    });
    const ids = assigned.map((x: any) => x.testId);

    return this.testModel.findAll({
      where: {
        [Op.or]: [
          { isPublic: true },
          { userId: user.id },
          ...(ids.length ? [{ id: { [Op.in]: ids } }] : []),
        ],
      } as any,
      attributes: [
        "id",
        "title",
        "mode",
        "quantities",
        "durationSec",
        "createdAt",
        "isPublic",
        "source",
      ],
      order: [["id", "DESC"]],
    });
  }

  async getOne(userId: number, testId: number) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException("Test not found");

    const ok =
      (test as any).isPublic === true ||
      (test as any).userId === userId ||
      (await this.isAssigned(userId, testId));

    if (!ok) throw new ForbiddenException("Forbidden");

    const items = await this.testQuestionModel.findAll({
      where: { testId },
      include: [
        {
          model: Question,
          include: [QuestionChoice],
        },
      ],
      order: [["order", "ASC"]],
    });

    const questions = items.map((tq: any) => {
      const q = tq.question?.toJSON?.() || tq.question;
      const choices = (q?.questionChoices || [])
        .slice()
        .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0))
        .map((c: any) => ({
          id: c.id,
          text: c.choiceText,
          isCorrect: c.isCorrect,
          order: c.choiceOrder,
        }));

      return {
        id: q.id,
        content: q.content,
        section: q.section,
        skill: q.skill,
        difficulty: q.difficulty,
        passage: q.passage,
        explanation: q.explanation,
        imageUrl: q.imageUrl,
        choices,
      };
    });

    return {
      id: test.id,
      title: test.title,
      mode: test.mode,
      durationSec: test.durationSec,
      quantities: test.quantities,
      questions,
    };
  }

  async create(userId: number, dto: CreateTestDto) {
    const rawTitle = (dto.title ?? "").trim() || `New Test ${Date.now()}`;
    const code = (dto.code ?? "").trim();
    const title = code ? `[${code}] ${rawTitle}` : rawTitle;

    const created = await this.testModel.create({
      mode: dto.mode ?? "fixed",
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
    if (!test) throw new NotFoundException("Không tìm thấy đề thi");

    if (dto.title !== undefined) test.title = dto.title as any;
    if (dto.mode !== undefined) test.mode = dto.mode as any;
    if (dto.durationSec !== undefined)
      test.durationSec = dto.durationSec as any;
    if (dto.quantities !== undefined) test.quantities = dto.quantities as any;
    if ((dto as any).isPublic !== undefined)
      (test as any).isPublic = !!(dto as any).isPublic;

    await test.save();
    return test;
  }

  async attachQuestions(testId: number, questionIds: number[]) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException("Không tìm thấy đề thi");

    const uniqueIds = Array.from(new Set(questionIds)).filter((x) =>
      Number.isFinite(x)
    );
    if (uniqueIds.length === 0)
      throw new BadRequestException("questionIds rỗng");

    const questions = await this.questionModel.findAll({
      where: { id: { [Op.in]: uniqueIds } },
    });
    const existingLinks = await this.testQuestionModel.findAll({
      where: { testId },
    });
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
    if (!test) throw new NotFoundException("Không tìm thấy đề thi");

    const uniqueIds = Array.from(new Set(questionIds)).filter((x) =>
      Number.isFinite(x)
    );
    if (uniqueIds.length === 0)
      throw new BadRequestException("questionIds rỗng");

    const removed = await this.testQuestionModel.destroy({
      where: { testId, questionId: { [Op.in]: uniqueIds } },
    });

    const total = await this.testQuestionModel.count({ where: { testId } });
    test.quantities = total;
    await test.save();

    return { removed, total };
  }

  async removeTest(testId: number, deleteOrphans = false) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException("Không tìm thấy đề thi");

    const links = await this.testQuestionModel.findAll({ where: { testId } });
    const questionIds = Array.from(new Set(links.map((l) => l.questionId)));

    const attempts = await this.attemptModel.findAll({
      where: { testId },
      attributes: ["id"],
    });
    const attemptIds = attempts.map((a: any) => a.id);

    const sequelize: any = (this.testModel as any).sequelize;
    await sequelize.transaction(async (t: any) => {
      if (attemptIds.length > 0) {
        await this.feedbackModel.update(
          { attemptId: null },
          { where: { attemptId: { [Op.in]: attemptIds } }, transaction: t }
        );
      }
      await this.feedbackModel.update(
        { testId: null },
        { where: { testId }, transaction: t }
      );

      if (attemptIds.length > 0) {
        await this.attemptAnswerModel.destroy({
          where: { attemptId: { [Op.in]: attemptIds } },
          transaction: t,
        });
      }
      await this.attemptModel.destroy({ where: { testId }, transaction: t });

      await this.testQuestionModel.destroy({
        where: { testId },
        transaction: t,
      });
      await this.testModel.destroy({ where: { id: testId }, transaction: t });

      if (deleteOrphans && questionIds.length > 0) {
        const remainLinks = await this.testQuestionModel.findAll({
          where: { questionId: { [Op.in]: questionIds } },
          attributes: ["questionId"],
          transaction: t,
        });
        const stillUsed = new Set(remainLinks.map((x: any) => x.questionId));
        const orphanIds = questionIds.filter((id) => !stillUsed.has(id));

        if (orphanIds.length > 0) {
          await this.feedbackModel.update(
            { questionId: null },
            { where: { questionId: { [Op.in]: orphanIds } }, transaction: t }
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

    return {
      testId,
      removedAttempts: attemptIds.length,
      removedLinks: links.length,
      deleteOrphans,
    };
  }

  async getTestQuestions(user: any, testId: number) {
    const okAccess = await this.canAccessTest(user, testId);
    if (!okAccess) throw new NotFoundException("Không tìm thấy đề thi");

    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException("Không tìm thấy đề thi");

    const links = await this.testQuestionModel.findAll({
      where: { testId },
      include: [
        {
          model: Question,
          include: [QuestionChoice],
        },
      ],
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    const questions = links
      .map((l) => (l as any).question as Question | undefined)
      .filter(Boolean)
      .map((q) => {
        const qq = q!.toJSON() as any;
        const choices = (qq.questionChoices || qq.questionchoices || []).map(
          (c: any) => ({
            id: c.id,
            choiceText: c.choiceText,
            isCorrect: !!c.isCorrect,
            choiceOrder: c.choiceOrder ?? null,
          })
        );
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
