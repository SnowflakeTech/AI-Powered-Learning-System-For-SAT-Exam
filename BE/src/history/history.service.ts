import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { ExamAttempt } from '../models/exam-attempt.model';
import { ExamAttemptAnswer } from '../models/exam-attempt-answer.model';
import { Test } from '../models/test.model';
import { TestQuestion } from '../models/test-question.model';
import { Question } from '../models/question.model';
import { QuestionChoice } from '../models/question-choice.model';

import { AiService } from '../ai/ai.service';

function fmtDuration(sec?: number | null) {
  const s = Math.max(0, Number(sec ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function toAttemptKey(id: number) {
  return `attempt-${id}`;
}

function parseAttemptId(input: string) {
  const s = String(input || '').trim();
  if (!s) return NaN;
  if (/^attempt-\d+$/i.test(s)) return Number(s.split('-')[1]);
  return Number(s);
}

function toLetter(idx: any): 'A' | 'B' | 'C' | 'D' | null {
  const n = Number(idx);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 3) return null;
  return String.fromCharCode(65 + n) as any;
}

type SubmitBody = {
  startedAt?: string | Date;
  submittedAt?: string | Date;
  durationSec?: number;
  answers?: Record<string, any> | Array<{ questionId: number; choiceId: number | null }>;
};

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(ExamAttempt) private readonly attemptModel: typeof ExamAttempt,
    @InjectModel(ExamAttemptAnswer) private readonly attemptAnswerModel: typeof ExamAttemptAnswer,
    @InjectModel(Test) private readonly testModel: typeof Test,
    @InjectModel(TestQuestion) private readonly testQuestionModel: typeof TestQuestion,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice) private readonly choiceModel: typeof QuestionChoice,
    private readonly aiService: AiService,
  ) {}

  async submitAttempt(userId: number, testId: number, body: SubmitBody) {
    const test = await this.testModel.findByPk(testId);
    if (!test) throw new NotFoundException('Không tìm thấy đề thi');

    const links = await this.testQuestionModel.findAll({
      where: { testId },
      order: [['order', 'ASC']],
    });
    const qids = links.map((l) => (l as any).questionId as number);
    if (!qids.length) throw new BadRequestException('Đề thi chưa có câu hỏi');

    const orderMap = new Map<number, number>();
    links.forEach((l: any) => orderMap.set(l.questionId, l.order ?? 0));

    const questions = await this.questionModel.findAll({
      where: { id: qids },
      include: [QuestionChoice],
    });

    const qMap = new Map<number, any>();
    for (const q of questions) {
      const qq = q.toJSON() as any;
      const choices = (qq.questionChoices || [])
        .slice()
        .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0));
      qMap.set(qq.id, { ...qq, questionChoices: choices });
    }

    const ansList: Array<{ questionId: number; choiceId: number | null }> = [];
    const a = body?.answers as any;

    if (Array.isArray(a)) {
      for (const item of a) {
        const qid = Number(item?.questionId);
        const cid = item?.choiceId === null || item?.choiceId === undefined ? null : Number(item?.choiceId);
        if (Number.isFinite(qid)) ansList.push({ questionId: qid, choiceId: cid });
      }
    } else if (a && typeof a === 'object') {
      for (const [k, v] of Object.entries(a)) {
        const qid = Number(k);
        const cid = v === null || v === undefined ? null : Number(v);
        if (Number.isFinite(qid)) ansList.push({ questionId: qid, choiceId: cid });
      }
    }

    const qidSet = new Set(qids);
    const filtered = ansList.filter((x) => qidSet.has(x.questionId));

    let correct = 0;
    const answerRows: any[] = [];

    for (const qid of qids) {
      const q = qMap.get(qid);
      if (!q) continue;

      const picked = filtered.find((x) => x.questionId === qid)?.choiceId ?? null;
      const correctChoice = (q.questionChoices || []).find((c: any) => !!c.isCorrect);
      const isCorrect = picked != null && correctChoice && Number(correctChoice.id) === Number(picked);

      if (isCorrect) correct += 1;

      answerRows.push({
        questionId: qid,
        selectedChoiceId: picked,
        isCorrect: !!isCorrect,
      });
    }

    const total = qids.length;
    const totalScore = 800;
    const score = total ? Math.round((correct / total) * totalScore) : 0;

    const startedAt = body?.startedAt ? new Date(body.startedAt) : new Date();
    const submittedAt = body?.submittedAt ? new Date(body.submittedAt) : new Date();

    const attempt = await this.attemptModel.create({
      userId,
      testId,
      status: 'completed',
      startedAt: isNaN(startedAt.getTime()) ? new Date() : startedAt,
      submittedAt: isNaN(submittedAt.getTime()) ? new Date() : submittedAt,
      durationSec: body?.durationSec ?? null,
      correctCount: correct,
      totalQuestions: total,
      score,
      totalScore,
    } as any);

    await this.attemptAnswerModel.bulkCreate(
      answerRows.map((r) => ({ ...r, attemptId: attempt.id })),
    );

    return {
      id: toAttemptKey(attempt.id),
      attemptId: attempt.id,
      testId: test.id,
      testName: test.title,
      date: (attempt.submittedAt ?? attempt.createdAt).toISOString().slice(0, 10),
      score,
      totalScore,
      correct,
      totalQuestions: total,
      time: fmtDuration(body?.durationSec),
      status: 'Completed',
    };
  }

  async list(userId: number) {
    const rows = await this.attemptModel.findAll({
      where: { userId },
      include: [{ model: Test }],
      order: [['id', 'DESC']],
    });

    return rows.map((r: any) => {
      const t = r.test;
      const submitted = r.submittedAt ?? r.createdAt;
      return {
        id: toAttemptKey(r.id),
        attemptId: r.id,
        testId: r.testId,
        testName: t?.title ?? `Test #${r.testId}`,
        date: submitted ? new Date(submitted).toISOString().slice(0, 10) : null,
        score: r.score ?? 0,
        totalScore: r.totalScore ?? 800,
        correct: r.correctCount ?? 0,
        totalQuestions: r.totalQuestions ?? 0,
        time: fmtDuration(r.durationSec),
        status: r.status === 'in_progress' ? 'In progress' : 'Completed',
      };
    });
  }

  async detail(userId: number, attemptKey: string) {
    const attemptId = parseAttemptId(attemptKey);
    if (!Number.isFinite(attemptId)) throw new BadRequestException('attemptId không hợp lệ');

    const attempt = await this.attemptModel.findByPk(attemptId, {
      include: [
        { model: Test },
        {
          model: ExamAttemptAnswer,
          include: [{ model: Question, include: [QuestionChoice] }, { model: QuestionChoice, as: 'selectedChoice' }],
        },
      ],
    });

    if (!attempt) throw new NotFoundException('Không tìm thấy lần làm bài');
    if ((attempt as any).userId !== userId) throw new NotFoundException('Không tìm thấy lần làm bài');

    const test = (attempt as any).test as Test | undefined;

    const links = await this.testQuestionModel.findAll({
      where: { testId: (attempt as any).testId },
      order: [['order', 'ASC']],
    });
    const orderMap = new Map<number, number>();
    links.forEach((l: any) => orderMap.set(l.questionId, l.order ?? 0));

    const answers = ((attempt as any).answers || []) as any[];

    const questions = answers
      .map((a) => {
        const q = a.question?.toJSON?.() ?? a.question;
        if (!q) return null;

        const choices = (q.questionChoices || [])
          .slice()
          .sort((x: any, y: any) => (x.choiceOrder ?? 0) - (y.choiceOrder ?? 0));
        const options = choices.map((c: any) => c.choiceText);

        const correctIdx = Math.max(0, choices.findIndex((c: any) => !!c.isCorrect));

        const chosenIdx = a.selectedChoiceId
          ? choices.findIndex((c: any) => Number(c.id) === Number(a.selectedChoiceId))
          : -1;

        const no = orderMap.get(q.id) ?? 0;

        return {
          no,
          content: q.content,
          options,
          correctIndex: correctIdx,
          chosenIndex: chosenIdx,
          topic: q.skill ?? q.section ?? null,
          difficulty: q.difficulty ?? null,
          explanation: null,
          finalAnswer: null,
          picked: null,
        };
      })
      .filter(Boolean)
      .sort((x: any, y: any) => (x.no ?? 0) - (y.no ?? 0));

    const submitted = (attempt as any).submittedAt ?? (attempt as any).createdAt;

    const testName = test?.title ?? `Test #${(attempt as any).testId}`;
    const lower = String(testName).toLowerCase();
    const exam: 'SAT' | 'HSA' = lower.includes('hsa') ? 'HSA' : 'SAT';

    let aiExplanations: any = null;
    let aiSummary: any = null;

    try {
      const explainPayload = questions.map((q: any) => {
        const correct = toLetter(q.correctIndex) || 'A';
        const picked = toLetter(q.chosenIndex);

        return {
          tempKey: `q-${attemptId}-${q.no}`,
          questionId: null,
          content: String(q.content || ''),
          choices: (q.options || []).slice(0, 4).map((t: any, i: number) => ({
            label: String.fromCharCode(65 + i),
            text: String(t ?? ''),
          })),
          picked,
          correct,
          skill: q.topic ?? null,
          difficulty: q.difficulty ?? null,
        };
      });

      const explainRes = await this.aiService.explainQuestions(userId, {
        exam,
        questions: explainPayload,
      } as any);

      aiExplanations = (explainRes as any)?.explanations ?? (explainRes as any) ?? null;

      const results = questions.map((q: any) => ({
        skill: q.topic ?? null,
        difficulty: q.difficulty ?? null,
        correct: Number(q.chosenIndex) === Number(q.correctIndex),
      }));

      const summaryRes = await this.aiService.practiceSummary(userId, {
        exam,
        results,
      } as any);

      aiSummary = summaryRes ?? null;

      if (aiExplanations && typeof aiExplanations === 'object') {
        for (const q of questions as any[]) {
          const k = `q-${attemptId}-${q.no}`;
          const ex = aiExplanations?.[k] ?? null;
          if (ex) {
            q.explanation = ex.explanation ?? null;
            q.finalAnswer = ex.finalAnswer ?? null;
            q.picked = ex.picked ?? null;
          }
        }
      }
    } catch {
      aiExplanations = null;
      aiSummary = null;
    }

    return {
      id: toAttemptKey((attempt as any).id),
      attemptId: (attempt as any).id,
      testId: (attempt as any).testId,
      testName,
      date: submitted ? new Date(submitted).toISOString().slice(0, 10) : null,
      score: (attempt as any).score ?? 0,
      totalScore: (attempt as any).totalScore ?? 800,
      correct: (attempt as any).correctCount ?? 0,
      totalQuestions: (attempt as any).totalQuestions ?? 0,
      time: fmtDuration((attempt as any).durationSec),
      status: (attempt as any).status === 'in_progress' ? 'In progress' : 'Completed',
      exam,
      ai: {
        explanations: aiExplanations,
        summary: aiSummary,
      },
      questions,
    };
  }
}
