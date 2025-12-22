import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { AiChatDto } from './dto/chat.dto';
import { AiGenerateTestDto } from './dto/generate-test.dto';

import { AiConversation } from '../models/ai-conversation.model';
import { AiMessage } from '../models/ai-message.model';
import { ExamAttempt } from '../models/exam-attempt.model';
import { ExamAttemptAnswer } from '../models/exam-attempt-answer.model';
import { Test } from '../models/test.model';
import { TestQuestion } from '../models/test-question.model';
import { Question } from '../models/question.model';
import { QuestionChoice } from '../models/question-choice.model';
import { TestAssignment } from '../models/test-assignment.model';

type LlmMsg = { role: 'system' | 'user' | 'assistant'; content: string };

type GeneratedQuestion = {
  content: string;
  section?: string | null;
  skill?: string | null;
  difficulty?: string | null;
  options: string[];
  correctIndex: number;
};

type GeneratedTest = {
  title: string;
  questions: GeneratedQuestion[];
};

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // try to extract JSON block
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class AiService {
  constructor(
    @InjectModel(AiConversation) private readonly convModel: typeof AiConversation,
    @InjectModel(AiMessage) private readonly msgModel: typeof AiMessage,
    @InjectModel(ExamAttempt) private readonly attemptModel: typeof ExamAttempt,
    @InjectModel(ExamAttemptAnswer) private readonly attemptAnswerModel: typeof ExamAttemptAnswer,
    @InjectModel(Test) private readonly testModel: typeof Test,
    @InjectModel(TestQuestion) private readonly testQuestionModel: typeof TestQuestion,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice) private readonly choiceModel: typeof QuestionChoice,
    @InjectModel(TestAssignment) private readonly assignModel: typeof TestAssignment,
  ) {}

  private isMockEnabled() {
    const mock = (process.env.AI_MOCK || '').toLowerCase();
    if (mock === 'true') return true;
    // không có API key => tự động fallback mock
    if (!process.env.AI_API_KEY) return true;
    return false;
  }

  private async callLLM(messages: LlmMsg[]): Promise<string> {
    if (this.isMockEnabled()) {
      // Mock rất đơn giản: trả lời theo kiểu hướng dẫn + gợi ý học
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      return (
        '🧠 (AI mock) Mình đã nhận được: "' +
        lastUser.slice(0, 180) +
        '"\n\n' +
        'Gợi ý: hãy nói rõ bạn đang luyện SAT hay HSA, và bạn yếu mảng nào (Toán/Đọc/Logic). '
      );
    }

    const base = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-4o-mini';
    const apiKey = process.env.AI_API_KEY || '';

    const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
      }),
    });

    const text = await res.text();
    let payload: any;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    if (!res.ok) {
      const msg = payload?.error?.message || payload?.message || text || 'AI error';
      throw new BadRequestException(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }

    const reply = payload?.choices?.[0]?.message?.content;
    if (!reply) throw new BadRequestException('AI không trả lời');
    return reply;
  }

  async chat(userId: number, dto: AiChatDto) {
    const message = (dto.message || '').trim();
    if (!message) throw new BadRequestException('message rỗng');

    let conv: AiConversation | null = null;
    if (dto.conversationId) {
      conv = await this.convModel.findByPk(dto.conversationId);
      if (!conv || (conv as any).userId !== userId) throw new NotFoundException('conversationId không hợp lệ');
    }
    if (!conv) {
      conv = await this.convModel.create({ userId, title: 'Trợ lý học tập' } as any);
    }

    // lưu user message
    await this.msgModel.create({ conversationId: conv.id, role: 'user', content: message } as any);

    // lấy 12 messages gần nhất để làm context
    const recent = await this.msgModel.findAll({
      where: { conversationId: conv.id },
      order: [['id', 'DESC']],
      limit: 12,
    });

    const history = recent
      .slice()
      .reverse()
      .map((m: any) => ({ role: m.role as any, content: m.content as string }));

    const sys: LlmMsg = {
      role: 'system',
      content:
        'Bạn là trợ lý luyện thi SAT/HSA. Trả lời ngắn gọn, rõ ràng, ưu tiên hướng dẫn từng bước. ' +
        'Nếu user hỏi về hệ thống web: hướng dẫn đúng theo các trang (Tests/Exam/History/Stats/Feedback). ' +
        'Nếu user hỏi câu hỏi học thuật: giải thích có lập luận và đưa đáp án cuối cùng rõ ràng.',
    };

    const messages: LlmMsg[] = [sys, ...history];

    // nếu user đang hỏi về 1 câu cụ thể trong DB
    if (dto.questionId) {
      const q = await this.questionModel.findByPk(dto.questionId, { include: [QuestionChoice] });
      if (q) {
        const qq: any = q.toJSON();
        const choices = (qq.questionChoices || [])
          .slice()
          .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0));
        const formatted = choices
          .map((c: any, i: number) => `${String.fromCharCode(65 + i)}. ${c.choiceText}`)
          .join('\n');
        messages.push({
          role: 'system',
          content: `Ngữ cảnh câu hỏi trong DB (questionId=${dto.questionId}):\n${qq.content}\n\nĐáp án lựa chọn:\n${formatted}`,
        });
      }
    }

    const reply = await this.callLLM(messages);

    // lưu assistant message
    await this.msgModel.create({ conversationId: conv.id, role: 'assistant', content: reply } as any);

    return { conversationId: conv.id, reply };
  }

  private async computeWeakSkills(userId: number) {
    // lấy tối đa 30 attempts gần nhất
    const attempts = await this.attemptModel.findAll({
      where: { userId, status: 'completed' },
      order: [['id', 'DESC']],
      limit: 30,
      attributes: ['id'],
    });
    const attemptIds = attempts.map((a: any) => a.id);
    if (!attemptIds.length) return [] as Array<{ skill: string; accuracy: number; total: number }>;

    const rows = await this.attemptAnswerModel.findAll({
      where: { attemptId: { [Op.in]: attemptIds } },
      include: [{ model: Question, attributes: ['skill', 'section'] }],
      attributes: ['isCorrect'],
    });

    const map = new Map<string, { correct: number; total: number }>();
    for (const r of rows as any[]) {
      const q: any = r.question;
      const key = (q?.skill || q?.section || 'Khác') as string;
      const cur = map.get(key) || { correct: 0, total: 0 };
      cur.total += 1;
      if (r.isCorrect) cur.correct += 1;
      map.set(key, cur);
    }

    const out = [...map.entries()].map(([skill, v]) => ({
      skill,
      total: v.total,
      accuracy: v.total ? v.correct / v.total : 0,
    }));

    // ưu tiên skill có nhiều dữ liệu và accuracy thấp
    out.sort((a, b) => {
      const wa = a.accuracy + (a.total < 5 ? 0.2 : 0);
      const wb = b.accuracy + (b.total < 5 ? 0.2 : 0);
      if (wa !== wb) return wa - wb;
      return b.total - a.total;
    });

    return out.slice(0, 5);
  }

  async insights(userId: number) {
    const attempts = await this.attemptModel.findAll({
      where: { userId, status: 'completed' },
      include: [{ model: Test, attributes: ['title'] }],
      order: [['id', 'DESC']],
    });

    const totalTests = attempts.length;
    const sumScore = attempts.reduce((s: number, a: any) => s + Number(a.score || 0), 0);
    const bestScore = attempts.reduce((m: number, a: any) => Math.max(m, Number(a.score || 0)), 0);
    const totalQuestions = attempts.reduce((s: number, a: any) => s + Number(a.totalQuestions || 0), 0);
    const totalCorrect = attempts.reduce((s: number, a: any) => s + Number(a.correctCount || 0), 0);
    const totalDurationSec = attempts.reduce((s: number, a: any) => s + Number(a.durationSec || 0), 0);

    const avgScore = totalTests ? Math.round(sumScore / totalTests) : 0;
    const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const avgTimePerQ = totalQuestions ? Math.round(totalDurationSec / totalQuestions) : 0;
    const avgTimePerTest = totalTests ? Math.round(totalDurationSec / totalTests) : 0;

    const recent3 = attempts.slice(0, 3).map((a: any) => {
      const correct = Number(a.correctCount || 0);
      const total = Number(a.totalQuestions || 0);
      const pct = total ? Math.round((correct / total) * 100) : 0;
      const d = a.submittedAt || a.createdAt;
      return {
        testId: a.testId,
        testName: a.test?.title || `Test #${a.testId}`,
        date: d ? new Date(d).toISOString().slice(0, 10) : null,
        score: Number(a.score || 0),
        accuracyPercent: pct,
        durationSec: Number(a.durationSec || 0),
      };
    });

    const weakSkills = await this.computeWeakSkills(userId);

    let suggestion = 'Hãy luyện lại các dạng câu có accuracy thấp nhất, ưu tiên làm chậm và chắc.';
    if (weakSkills.length) {
      suggestion =
        'Bạn đang yếu nhất ở: ' +
        weakSkills
          .slice(0, 3)
          .map((s) => `${s.skill} (${Math.round(s.accuracy * 100)}%)`)
          .join(', ') +
        '. Hãy luyện tập trung các dạng này trong 3–5 buổi tới.';
    }

    return {
      overview: {
        totalTests,
        totalQuestions,
        totalDurationSec,
        avgScore,
        bestScore,
        accuracyPercent: accuracy,
      },
      recent3,
      speed: {
        avgTimePerQuestionSec: avgTimePerQ,
        avgTimePerTestSec: avgTimePerTest,
      },
      weakSkills,
      suggestion,
    };
  }

  private buildMockTest(exam: 'SAT' | 'HSA', n: number): GeneratedTest {
    const qs: GeneratedQuestion[] = [];
    for (let i = 0; i < n; i++) {
      if (exam === 'SAT') {
        const a = i + 2;
        const b = i + 3;
        const ans = a + b;
        const options = [String(ans), String(ans + 1), String(ans - 1), String(ans + 2)];
        // shuffle nhẹ
        const correctIndex = 0;
        qs.push({
          content: `SAT Math: Tính ${a} + ${b} = ?`,
          section: 'math',
          skill: 'arithmetic',
          difficulty: i < 3 ? 'easy' : 'medium',
          options,
          correctIndex,
        });
      } else {
        const options = ['A', 'B', 'C', 'D'];
        const correctIndex = (i + 1) % 4;
        qs.push({
          content: `HSA Logic: Chọn phương án đúng cho câu số ${i + 1}. (demo)`,
          section: 'logic',
          skill: 'reasoning',
          difficulty: i < 3 ? 'easy' : 'medium',
          options,
          correctIndex,
        });
      }
    }
    return {
      title: `${exam} - Đề AI (mock) #${new Date().toISOString().slice(0, 10)}`,
      questions: qs,
    };
  }

  private validateGeneratedTest(obj: any): GeneratedTest {
    if (!obj || typeof obj !== 'object') throw new BadRequestException('AI output không hợp lệ');
    const title = String(obj.title || '').trim();
    if (!title) throw new BadRequestException('AI output thiếu title');

    const questions = Array.isArray(obj.questions) ? obj.questions : [];
    if (!questions.length) throw new BadRequestException('AI output thiếu questions');

    const mapped: GeneratedQuestion[] = questions.map((q: any) => {
      const content = String(q.content || '').trim();
      const options = Array.isArray(q.options) ? q.options.map((x: any) => String(x)) : [];
      const correctIndex = Number(q.correctIndex);
      if (!content) throw new BadRequestException('AI output có question thiếu content');
      if (options.length < 2) throw new BadRequestException('AI output có question thiếu options');
      if (!Number.isFinite(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        throw new BadRequestException('AI output có question correctIndex sai');
      }
      return {
        content,
        options,
        correctIndex,
        section: q.section ? String(q.section) : null,
        skill: q.skill ? String(q.skill) : null,
        difficulty: q.difficulty ? String(q.difficulty) : null,
      };
    });

    return { title, questions: mapped };
  }

  async generateTest(userId: number, dto: AiGenerateTestDto) {
    const num = clamp(Number(dto.numQuestions || 10), 5, 40);
    const durationSec = clamp(Number(dto.durationSec || 3600), 600, 7200);

    const weak = await this.computeWeakSkills(userId);
    // Chọn loại đề: nếu user chọn SAT/HSA thì dùng trực tiếp.
    // Nếu "auto" (mặc định từ FE), chọn theo lịch sử gần đây (ưu tiên loại user luyện nhiều hơn),
    // nếu không có lịch sử thì dựa vào nhóm kỹ năng yếu (logic/reasoning -> HSA, còn lại -> SAT).
    let exam: 'SAT' | 'HSA' = 'SAT';
    if (dto.exam === 'SAT' || dto.exam === 'HSA') {
      exam = dto.exam;
    } else {
      const recent = await this.attemptModel.findAll({
        where: { userId },
        include: [{ model: Test, attributes: ['title'] }],
        order: [['submittedAt', 'DESC'], ['id', 'DESC']],
        limit: 10,
      });

      let sat = 0;
      let hsa = 0;
      for (const a of recent as any[]) {
        const title = String(a?.test?.title || '').toLowerCase();
        if (title.includes('hsa')) hsa++;
        if (title.includes('sat')) sat++;
      }

      if (hsa !== sat) {
        exam = hsa > sat ? 'HSA' : 'SAT';
      } else {
        const weakText = weak.map((w) => String(w.skill || '').toLowerCase()).join(' ');
        if (weakText.includes('logic') || weakText.includes('reason') || weakText.includes('suy luận')) {
          exam = 'HSA';
        }
      }
    }

    let generated: GeneratedTest;

    if (this.isMockEnabled()) {
      generated = this.buildMockTest(exam, num);
    } else {
      const weaknessText = weak.length
        ? weak
            .slice(0, 3)
            .map((s) => `${s.skill} (${Math.round(s.accuracy * 100)}%)`)
            .join(', ')
        : 'chưa có dữ liệu lịch sử';

      const sys: LlmMsg = {
        role: 'system',
        content:
          'Bạn là AI tạo đề luyện thi. Bạn PHẢI trả về JSON đúng schema. Không giải thích, không markdown.' +
          'Schema: {"title": string, "questions": [{"content": string, "section": string, "skill": string, "difficulty": string, "options": string[], "correctIndex": number}] }.' +
          'Mỗi câu trắc nghiệm 4 lựa chọn. correctIndex 0-3.',
      };

      const userPrompt: LlmMsg = {
        role: 'user',
        content:
          `Hãy tạo 1 đề ${exam} gồm ${num} câu trắc nghiệm.\n` +
          `Ưu tiên các kỹ năng user yếu: ${weaknessText}.\n` +
          `Độ khó phân bổ: 40% easy, 40% medium, 20% hard.\n` +
          `Ngôn ngữ: tiếng Việt (nếu là SAT Reading có thể xen tiếng Anh ngắn).\n` +
          `Chỉ trả JSON thuần theo schema.`,
      };

      const raw = await this.callLLM([sys, userPrompt]);
      const obj = safeJsonParse(raw);
      generated = this.validateGeneratedTest(obj);

      // cắt số câu nếu AI trả dư
      generated.questions = generated.questions.slice(0, num);
    }

    const sequelize: any = (this.testModel as any).sequelize;
    if (!sequelize) throw new BadRequestException('Sequelize chưa sẵn sàng');

    const created = await sequelize.transaction(async (t: any) => {
      const test = await this.testModel.create(
        {
          mode: 'fixed',
          title: generated.title,
          durationSec,
          quantities: generated.questions.length,
          startedAt: new Date(),
          userId: null,
          isPublic: false,
          source: 'ai',
        } as any,
        { transaction: t },
      );

      for (let i = 0; i < generated.questions.length; i++) {
        const q = generated.questions[i];
        const question = await this.questionModel.create(
          {
            content: q.content,
            section: q.section || null,
            skill: q.skill || null,
            difficulty: q.difficulty || null,
            passage: null,
            model: process.env.AI_MODEL || null,
          } as any,
          { transaction: t },
        );

        const choices = q.options.map((text, idx) => ({
          choiceText: text,
          isCorrect: idx === q.correctIndex,
          questionId: question.id,
          choiceOrder: idx + 1,
        }));

        await this.choiceModel.bulkCreate(choices as any[], { transaction: t });

        await this.testQuestionModel.create(
          { testId: test.id, questionId: question.id, order: i + 1 } as any,
          { transaction: t },
        );
      }

      await this.assignModel.create(
        { userId, testId: test.id, source: 'ai' } as any,
        { transaction: t },
      );

      return test;
    });

    return { testId: created.id, title: created.title };
  }
}
