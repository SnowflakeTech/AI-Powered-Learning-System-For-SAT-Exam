import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import * as fs from "fs";
import * as path from "path";

import { AiChatDto } from "./dto/chat.dto";
import { AiGenerateTestDto } from "./dto/generate-test.dto";
import { AiGeneratePracticeDto } from "./dto/generate-practice.dto";

import { AiConversation } from "../models/ai-conversation.model";
import { AiMessage } from "../models/ai-message.model";
import { ExamAttempt } from "../models/exam-attempt.model";
import { ExamAttemptAnswer } from "../models/exam-attempt-answer.model";
import { Test } from "../models/test.model";
import { TestQuestion } from "../models/test-question.model";
import { Question } from "../models/question.model";
import { QuestionChoice } from "../models/question-choice.model";
import { TestAssignment } from "../models/test-assignment.model";

import { callOpenAI, callGemini, LlmMsg } from "./llm.providers";
import { AiGenerateQuestionsDto } from "./dto/generate-questions.dto";

type NormalizedChoice = { label: "A" | "B" | "C" | "D"; text: string };

type NormalizedQuestion = {
  stem: string;
  choices: NormalizedChoice[];
  answer: "A" | "B" | "C" | "D";
  section: string | null;
  skill: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  rationale?: string | null;
};

function normalizeChoiceLabel(x: any, idx: number): "A" | "B" | "C" | "D" {
  const s = String(x ?? "")
    .trim()
    .toUpperCase();
  const cleaned = s.replace(/[^A-D1-4]/g, "");
  if (["A", "B", "C", "D"].includes(cleaned)) return cleaned as any;
  if (cleaned === "1") return "A";
  if (cleaned === "2") return "B";
  if (cleaned === "3") return "C";
  if (cleaned === "4") return "D";
  return String.fromCharCode(65 + idx) as any;
}

type NormalizedTest = {
  title: string;
  exam: "SAT" | "HSA";
  questions: NormalizedQuestion[];
};

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
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
    @InjectModel(AiConversation)
    private readonly convModel: typeof AiConversation,
    @InjectModel(AiMessage) private readonly msgModel: typeof AiMessage,
    @InjectModel(ExamAttempt) private readonly attemptModel: typeof ExamAttempt,
    @InjectModel(ExamAttemptAnswer)
    private readonly attemptAnswerModel: typeof ExamAttemptAnswer,
    @InjectModel(Test) private readonly testModel: typeof Test,
    @InjectModel(TestQuestion)
    private readonly testQuestionModel: typeof TestQuestion,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice)
    private readonly choiceModel: typeof QuestionChoice,
    @InjectModel(TestAssignment)
    private readonly assignModel: typeof TestAssignment
  ) {}

  private isMockEnabled() {
    const mock = (process.env.AI_MOCK || "").toLowerCase();
    if (mock === "true") return true;
    if (!process.env.AI_API_KEY && !process.env.OPENAI_API_KEY) return true;
    return false;
  }

  private logEvent(kind: string, data: any) {
    const enabled = String(process.env.AI_LOG || "").toLowerCase() === "true";
    if (!enabled) return;

    const dir = process.env.AI_LOG_DIR || "logs";
    const full = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });

    const file = path.join(
      full,
      `ai-${new Date().toISOString().slice(0, 10)}.log`
    );
    const line = JSON.stringify(
      { ts: new Date().toISOString(), kind, data },
      null,
      0
    );
    fs.appendFileSync(file, line + "\n", "utf8");
  }

  private async callProvider(provider: string, messages: LlmMsg[]) {
    const p = (provider || "openai").toLowerCase();
    if (p === "gemini") return await callGemini(messages);
    return await callOpenAI(messages);
  }

  private async callLLM(messages: LlmMsg[]): Promise<string> {
    const primary = (process.env.AI_PRIMARY || "openai").toLowerCase();
    const strategy = (process.env.AI_STRATEGY || "fallback").toLowerCase();

    const tryPrimary = async () => this.callProvider(primary, messages);
    const secondary = primary === "gemini" ? "openai" : "gemini";
    const trySecondary = async () => this.callProvider(secondary, messages);

    if (strategy === "fallback") {
      try {
        return await tryPrimary();
      } catch {
        return await trySecondary();
      }
    }

    return await tryPrimary();
  }

  async generatePractice(userId: number, dto: AiGeneratePracticeDto) {
    const count = Math.min(Math.max(Number(dto.count || 5), 1), 20);
    const exam: "SAT" | "HSA" = dto.exam === "HSA" ? "HSA" : "SAT";

    const section = String(dto.section || "math").trim();
    const skill = String(dto.skill || "auto").trim();
    const difficultyRaw = String(dto.difficulty || "mixed")
      .trim()
      .toLowerCase();

    const difficulty =
      difficultyRaw === "easy" ||
      difficultyRaw === "medium" ||
      difficultyRaw === "hard"
        ? difficultyRaw
        : difficultyRaw === "easy"
        ? "easy"
        : difficultyRaw === "medium"
        ? "medium"
        : difficultyRaw === "hard"
        ? "hard"
        : "mixed";

    if (this.isMockEnabled()) {
      const mock = this.buildMockNormalizedTest(exam, count);
      return {
        questions: mock.questions.map((q) => {
          const correctIdx = ["A", "B", "C", "D"].indexOf(q.answer);
          return {
            content: q.stem,
            section: q.section || section,
            skill: q.skill || skill,
            difficulty: (q.difficulty || "medium").toLowerCase(),
            passage: null,
            choices: q.choices.map((c, i) => ({
              text: c.text,
              isCorrect: i === correctIdx,
              order: i + 1,
            })),
          };
        }),
      };
    }

    const sys: LlmMsg = {
      role: "system",
      content:
        "Return ONLY valid JSON. No markdown. " +
        "Each question must have exactly 4 choices labeled A,B,C,D. Exactly 1 correct. " +
        'Schema: {"questions":[{"stem":string,"section":string,"skill":string,"difficulty":"easy"|"medium"|"hard",' +
        '"choices":[{"label":"A"|"B"|"C"|"D","text":string}],' +
        '"answer":"A"|"B"|"C"|"D","rationale":string}]}',
    };

    const userPrompt: LlmMsg = {
      role: "user",
      content:
        `Create ${count} ${exam} questions.\n` +
        `Section: ${section}\n` +
        `Skill: ${skill}\n` +
        `Difficulty: ${difficulty}\n` +
        `Language: Vietnamese (SAT Reading may include short English).\n`,
    };

    const raw = await this.callLLM([sys, userPrompt]);
    const parsed = safeJsonParse(raw);

    if (!parsed?.questions || !Array.isArray(parsed.questions)) {
      throw new BadRequestException("AI output invalid");
    }

    const out = parsed.questions.map((q: any) => {
      const choices = (q.choices || []).map((c: any, i: number) => ({
        label: normalizeChoiceLabel(c.label, i),
        text: String(c.text || "").trim(),
      }));

      if (choices.length !== 4)
        throw new BadRequestException("AI output choices must be 4");
      if (choices.map((c: any) => c.label).join("") !== "ABCD") {
        throw new BadRequestException("AI output choices label phải là A,B,C,D");
      }

      const answer = normalizeChoiceLabel(q.answer, 0);
      if (!["A", "B", "C", "D"].includes(answer))
        throw new BadRequestException("AI output missing answer");

      const correctIdx = ["A", "B", "C", "D"].indexOf(answer);

      const diff = String(q.difficulty || "")
        .toLowerCase()
        .trim();
      const normalizedDiff = ["easy", "medium", "hard"].includes(diff)
        ? diff
        : "medium";

      return {
        content: String(q.stem || "").trim(),
        section: String(q.section || section).trim(),
        skill: String(q.skill || skill).trim(),
        difficulty: normalizedDiff,
        passage: null,
        rationale: q.rationale ? String(q.rationale) : null,
        choices: choices.map((c: any, i: number) => ({
          text: c.text,
          isCorrect: i === correctIdx,
          order: i + 1,
        })),
      };
    });

    return { questions: out };
  }

  private toNormalizedTest(exam: "SAT" | "HSA", obj: any): NormalizedTest {
    if (!obj || typeof obj !== "object")
      throw new BadRequestException("AI output không hợp lệ");

    const title = String(obj.title || "").trim();
    if (!title) throw new BadRequestException("AI output thiếu title");

    const rawQs = Array.isArray(obj.questions) ? obj.questions : [];
    if (!rawQs.length) throw new BadRequestException("AI output thiếu questions");

    const outQs: NormalizedQuestion[] = rawQs.map((q: any) => {
      const stem = String(q.stem || q.content || "").trim();
      if (!stem)
        throw new BadRequestException("AI output có question thiếu stem/content");

      let choices: NormalizedChoice[] = [];
      if (Array.isArray(q.choices) && q.choices.length) {
        choices = q.choices.map((c: any) => ({
          label: String(c.label || "").toUpperCase(),
          text: String(c.text || "").trim(),
        })) as any;
      } else if (Array.isArray(q.options) && q.options.length) {
        choices = q.options.map((t: any, i: number) => ({
          label: String.fromCharCode(65 + i) as any,
          text: String(t || "").trim(),
        })) as any;
      }

      if (choices.length !== 4)
        throw new BadRequestException("AI output cần đúng 4 lựa chọn");

      const labels = choices.map((c) => c.label);
      if (labels.join("") !== "ABCD")
        throw new BadRequestException("AI output choices label phải là A,B,C,D");

      let answer = String(q.answer || "")
        .toUpperCase()
        .trim();
      if (!answer && Number.isFinite(Number(q.correctIndex))) {
        const idx = Number(q.correctIndex);
        if (idx < 0 || idx > 3)
          throw new BadRequestException("AI output correctIndex sai");
        answer = String.fromCharCode(65 + idx);
      }
      if (!["A", "B", "C", "D"].includes(answer))
        throw new BadRequestException("AI output thiếu answer");

      const difficultyRaw = String(q.difficulty || "")
        .toLowerCase()
        .trim();
      const difficulty = (
        ["easy", "medium", "hard"].includes(difficultyRaw)
          ? difficultyRaw
          : null
      ) as any;

      const section = q.section ? String(q.section) : null;
      const skill = q.skill ? String(q.skill) : null;
      const rationale = q.rationale ? String(q.rationale) : null;

      return {
        stem,
        choices,
        answer: answer as any,
        section,
        skill,
        difficulty,
        rationale,
      };
    });

    return { title, exam, questions: outQs };
  }

  private buildGeneratePrompt(
    exam: "SAT" | "HSA",
    num: number,
    weaknessText: string
  ) {
    const sys: LlmMsg = {
      role: "system",
      content:
        "You generate practice tests. Return ONLY valid JSON. No markdown, no explanations." +
        'Schema: {"title": string, "exam": "SAT"|"HSA", "questions": [{"stem": string, "section": string, "skill": string, "difficulty": "easy"|"medium"|"hard", "choices": [{"label":"A"|"B"|"C"|"D","text":string}], "answer":"A"|"B"|"C"|"D", "rationale": string}] }' +
        "Exactly 4 choices. Exactly 1 correct answer. Keep wording clear, unambiguous.",
    };

    const satSections = "reading_writing, math";
    const hsaSections = "math, logic, reading";
    const sections = exam === "SAT" ? satSections : hsaSections;

    const user: LlmMsg = {
      role: "user",
      content:
        `Create 1 ${exam} practice test with ${num} multiple-choice questions.\n` +
        `Sections allowed: ${sections}.\n` +
        `Prioritize weaknesses: ${weaknessText}.\n` +
        `Difficulty distribution: 40% easy, 40% medium, 20% hard.\n` +
        `Language: Vietnamese. If SAT reading, short English passages are allowed.\n` +
        `Return JSON strictly following schema.`,
    };

    return [sys, user] as LlmMsg[];
  }

  private async repairJson(provider: string, raw: string) {
    const sys: LlmMsg = {
      role: "system",
      content: "Fix the JSON to be valid and match schema exactly. Return ONLY JSON.",
    };
    const user: LlmMsg = { role: "user", content: raw };
    const fixed = await this.callProvider(provider, [sys, user]);
    this.logEvent("repair_response", { provider, fixed: fixed.slice(0, 4000) });
    return safeJsonParse(fixed);
  }

  private async judgeTest(
    provider: string,
    exam: "SAT" | "HSA",
    normalized: NormalizedTest
  ) {
    const sys: LlmMsg = {
      role: "system",
      content:
        "You are a strict test quality judge. Return ONLY JSON." +
        'Schema: {"pass": boolean, "score": number, "issues": string[], "fixes": string[] }' +
        "Criteria: 4 choices, exactly 1 correct, no ambiguous wording, difficulty matches, answer plausible.",
    };

    const user: LlmMsg = {
      role: "user",
      content: JSON.stringify({ exam, test: normalized }).slice(0, 120000),
    };

    const raw = await this.callProvider(provider, [sys, user]);
    const obj = safeJsonParse(raw);
    if (!obj || typeof obj !== "object")
      return { pass: false, score: 0, issues: ["judge_invalid_json"], fixes: [] };

    return {
      pass: Boolean(obj.pass),
      score: Number(obj.score || 0),
      issues: Array.isArray(obj.issues) ? obj.issues.map((x: any) => String(x)) : [],
      fixes: Array.isArray(obj.fixes) ? obj.fixes.map((x: any) => String(x)) : [],
    };
  }

  private async regenerateWithFeedback(
    provider: string,
    exam: "SAT" | "HSA",
    num: number,
    weaknessText: string,
    feedback: string[]
  ) {
    const sys: LlmMsg = {
      role: "system",
      content: "You regenerate a test. Return ONLY valid JSON matching schema exactly.",
    };

    const user: LlmMsg = {
      role: "user",
      content:
        `Regenerate a ${exam} test with ${num} questions.\n` +
        `Weaknesses: ${weaknessText}\n` +
        `Fix these issues:\n- ${feedback.join("\n- ")}\n` +
        `Return JSON in the strict schema.`,
    };

    return [sys, user] as LlmMsg[];
  }

  async insightsAi(userId: number) {
    const base = await this.insights(userId);

    const provider = (process.env.AI_PRIMARY || "openai").toLowerCase();
    const sys: LlmMsg = {
      role: "system",
      content:
        "Bạn là gia sư luyện thi SAT/HSA. Viết nhận xét ngắn gọn, rõ ràng, có kế hoạch 7 ngày. Không markdown.",
    };

    const user: LlmMsg = {
      role: "user",
      content:
        "Dữ liệu thống kê của học sinh:\n" +
        JSON.stringify(base) +
        '\nHãy trả về JSON schema: {"summary": string, "strengths": string[], "weaknesses": string[], "plan7d": {"day1": string, "day2": string, "day3": string, "day4": string, "day5": string, "day6": string, "day7": string}, "tips": string[] }',
    };

    const raw = await this.callProvider(provider, [sys, user]);
    this.logEvent("insights_ai_response", { provider, raw: raw.slice(0, 4000) });

    const obj = safeJsonParse(raw);
    if (!obj) throw new BadRequestException("AI insights output không hợp lệ");

    return obj;
  }

  async chat(userId: number, dto: AiChatDto) {
    const message = (dto.message || "").trim();
    if (!message) throw new BadRequestException("message rỗng");

    let conv: AiConversation | null = null;
    if (dto.conversationId) {
      conv = await this.convModel.findByPk(dto.conversationId);
      if (!conv || (conv as any).userId !== userId)
        throw new NotFoundException("conversationId không hợp lệ");
    }
    if (!conv) {
      conv = await this.convModel.create({ userId, title: "Trợ lý học tập" } as any);
    }

    await this.msgModel.create({
      conversationId: conv.id,
      role: "user",
      content: message,
    } as any);

    const recent = await this.msgModel.findAll({
      where: { conversationId: conv.id },
      order: [["id", "DESC"]],
      limit: 12,
    });

    const history = recent
      .slice()
      .reverse()
      .map((m: any) => ({ role: m.role as any, content: m.content as string }));

    const sys: LlmMsg = {
      role: "system",
      content:
        "Bạn là trợ lý luyện thi SAT/HSA. Trả lời ngắn gọn, rõ ràng, ưu tiên hướng dẫn từng bước. " +
        "Nếu user hỏi về hệ thống web: hướng dẫn đúng theo các trang (Tests/Exam/History/Stats/Feedback). " +
        "Nếu user hỏi câu hỏi học thuật: giải thích có lập luận và đưa đáp án cuối cùng rõ ràng.",
    };

    const messages: LlmMsg[] = [sys, ...history];

    if (dto.questionId) {
      const q = await this.questionModel.findByPk(dto.questionId, {
        include: [QuestionChoice],
      });
      if (q) {
        const qq: any = q.toJSON();
        const choices = (qq.questionChoices || [])
          .slice()
          .sort((a: any, b: any) => (a.choiceOrder ?? 0) - (b.choiceOrder ?? 0));
        const formatted = choices
          .map((c: any, i: number) => `${String.fromCharCode(65 + i)}. ${c.choiceText}`)
          .join("\n");
        messages.push({
          role: "system",
          content: `Ngữ cảnh câu hỏi trong DB (questionId=${dto.questionId}):\n${qq.content}\n\nĐáp án lựa chọn:\n${formatted}`,
        });
      }
    }

    let reply = "";
    if (this.isMockEnabled()) {
      reply =
        "AI mock: Mình đã nhận được câu hỏi của bạn. " +
        "Hãy nói rõ bạn luyện SAT hay HSA, và bạn đang yếu mảng nào (Toán/Đọc/Logic) để mình hướng dẫn cụ thể.";
    } else {
      reply = await this.callLLM(messages);
    }

    await this.msgModel.create({
      conversationId: conv.id,
      role: "assistant",
      content: reply,
    } as any);

    return { conversationId: conv.id, reply };
  }

  private async computeWeakSkills(userId: number) {
    const attempts = await this.attemptModel.findAll({
      where: { userId, status: "completed" },
      order: [["id", "DESC"]],
      limit: 30,
      attributes: ["id"],
    });
    const attemptIds = attempts.map((a: any) => a.id);
    if (!attemptIds.length) return [] as Array<{ skill: string; accuracy: number; total: number }>;

    const rows = await this.attemptAnswerModel.findAll({
      where: { attemptId: { [Op.in]: attemptIds } },
      include: [{ model: Question, attributes: ["skill", "section"] }],
      attributes: ["isCorrect"],
    });

    const map = new Map<string, { correct: number; total: number }>();
    for (const r of rows as any[]) {
      const q: any = r.question;
      const key = (q?.skill || q?.section || "Khác") as string;
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
      where: { userId, status: "completed" },
      include: [{ model: Test, attributes: ["title"] }],
      order: [["id", "DESC"]],
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

    let suggestion = "Hãy luyện lại các dạng câu có accuracy thấp nhất, ưu tiên làm chậm và chắc.";
    if (weakSkills.length) {
      suggestion =
        "Bạn đang yếu nhất ở: " +
        weakSkills
          .slice(0, 3)
          .map((s) => `${s.skill} (${Math.round(s.accuracy * 100)}%)`)
          .join(", ") +
        ". Hãy luyện tập trung các dạng này trong 3–5 buổi tới.";
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

  private buildMockNormalizedTest(exam: "SAT" | "HSA", n: number): NormalizedTest {
    const qs: NormalizedQuestion[] = [];
    for (let i = 0; i < n; i++) {
      const difficulty: "easy" | "medium" | "hard" =
        i < Math.floor(n * 0.4)
          ? "easy"
          : i < Math.floor(n * 0.8)
          ? "medium"
          : "hard";

      if (exam === "SAT") {
        const a = i + 2;
        const b = i + 3;
        const ans = a + b;

        const choices: NormalizedChoice[] = [
          { label: "A", text: String(ans) },
          { label: "B", text: String(ans + 1) },
          { label: "C", text: String(ans - 1) },
          { label: "D", text: String(ans + 2) },
        ];

        qs.push({
          stem: `SAT Math: Tính ${a} + ${b} = ?`,
          choices,
          answer: "A",
          section: "math",
          skill: "arithmetic",
          difficulty,
          rationale: `Cộng ${a} và ${b} được ${ans}.`,
        });
      } else {
        const idx = (i % 4) as 0 | 1 | 2 | 3;
        const answers: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
        const answer = answers[idx];

        const choices: NormalizedChoice[] = [
          { label: "A", text: "Phương án A" },
          { label: "B", text: "Phương án B" },
          { label: "C", text: "Phương án C" },
          { label: "D", text: "Phương án D" },
        ];

        qs.push({
          stem: `HSA Logic: Chọn phương án đúng cho câu số ${i + 1}.`,
          choices,
          answer,
          section: "logic",
          skill: "reasoning",
          difficulty,
          rationale: `Đáp án mẫu: ${answer}.`,
        });
      }
    }

    return {
      title: `${exam} - AI Mock - ${new Date().toISOString().slice(0, 10)}`,
      exam,
      questions: qs,
    };
  }

  async generateTest(user: any, dto: AiGenerateTestDto) {
    const userId = Number(user?.id);
    if (!userId) throw new BadRequestException("User không hợp lệ");

    const isAdmin = String(user?.role || "").toLowerCase() === "admin";
    const isPublic = isAdmin ? Boolean((dto as any)?.isPublic) : false;

    const num = clamp(Number(dto.numQuestions || 10), 5, 40);

    const weak = await this.computeWeakSkills(userId);

    let exam: "SAT" | "HSA" = "SAT";
    if (dto.exam === "SAT" || dto.exam === "HSA") {
      exam = dto.exam;
    } else {
      const recent = await this.attemptModel.findAll({
        where: { userId },
        include: [{ model: Test, attributes: ["title"] }],
        order: [
          ["submittedAt", "DESC"],
          ["id", "DESC"],
        ],
        limit: 10,
      });

      let sat = 0;
      let hsa = 0;
      for (const a of recent as any[]) {
        const title = String(a?.test?.title || "").toLowerCase();
        if (title.includes("hsa")) hsa++;
        if (title.includes("sat")) sat++;
      }

      if (hsa !== sat) {
        exam = hsa > sat ? "HSA" : "SAT";
      } else {
        const weakText = weak
          .map((w) => String(w.skill || "").toLowerCase())
          .join(" ");
        if (
          weakText.includes("logic") ||
          weakText.includes("reason") ||
          weakText.includes("suy luận")
        ) {
          exam = "HSA";
        }
      }
    }

    const fixedSat = 3600;
    const fixedHsa = 3600;
    const durationSec = exam === "SAT" ? fixedSat : fixedHsa;

    let normalized: NormalizedTest | null = null;

    if (this.isMockEnabled()) {
      normalized = this.buildMockNormalizedTest(exam, num);
    } else {
      const genProvider = (process.env.AI_GENERATE_PROVIDER || "openai").toLowerCase();
      const judgeProvider = (process.env.AI_JUDGE_PROVIDER || "openai").toLowerCase();
      const repairProvider = (process.env.AI_REPAIR_PROVIDER || "gemini").toLowerCase();

      const useJudge = String(process.env.AI_JUDGE || "").toLowerCase() === "true";
      const maxRounds = clamp(Number(process.env.AI_JUDGE_MAX_ROUNDS || 2), 1, 3);

      const weaknessText = weak.length
        ? weak
            .slice(0, 3)
            .map((s) => `${s.skill} (${Math.round(s.accuracy * 100)}%)`)
            .join(", ")
        : "chưa có dữ liệu lịch sử";

      let raw = "";
      let obj: any = null;

      for (let round = 1; round <= maxRounds; round++) {
        const prompt =
          round === 1
            ? this.buildGeneratePrompt(exam, num, weaknessText)
            : await this.regenerateWithFeedback(genProvider, exam, num, weaknessText, []);

        this.logEvent("generate_prompt", { provider: genProvider, round, prompt });

        raw = await this.callProvider(genProvider, prompt);
        this.logEvent("generate_response", { provider: genProvider, round, raw: raw.slice(0, 4000) });

        obj = safeJsonParse(raw);
        try {
          normalized = this.toNormalizedTest(exam, obj);
        } catch (e: any) {
          const repaired = await this.repairJson(repairProvider, raw);
          normalized = this.toNormalizedTest(exam, repaired);
        }

        normalized.questions = normalized.questions.slice(0, num);

        if (!useJudge) break;

        const judge = await this.judgeTest(judgeProvider, exam, normalized);
        this.logEvent("judge_result", { provider: judgeProvider, round, judge });

        if (judge.pass) break;

        const regenPrompt = await this.regenerateWithFeedback(
          genProvider,
          exam,
          num,
          weaknessText,
          [...(judge.issues || []), ...(judge.fixes || [])]
        );

        this.logEvent("regenerate_prompt", { provider: genProvider, round, regenPrompt });

        raw = await this.callProvider(genProvider, regenPrompt);
        this.logEvent("regenerate_response", { provider: genProvider, round, raw: raw.slice(0, 4000) });

        obj = safeJsonParse(raw);
        try {
          normalized = this.toNormalizedTest(exam, obj);
        } catch {
          const repaired = await this.repairJson(repairProvider, raw);
          normalized = this.toNormalizedTest(exam, repaired);
        }

        normalized.questions = normalized.questions.slice(0, num);

        const judge2 = await this.judgeTest(judgeProvider, exam, normalized);
        this.logEvent("judge_result", { provider: judgeProvider, round: round + 0.5, judge: judge2 });

        if (judge2.pass) break;

        if (round === maxRounds)
          throw new BadRequestException("AI generated test quality failed after judge");
      }

      if (!normalized) throw new BadRequestException("AI generate failed");
    }

    const sequelize: any = (this.testModel as any).sequelize;
    if (!sequelize) throw new BadRequestException("Sequelize chưa sẵn sàng");

    const overrideTitle = String((dto as any)?.title || "").trim();

    const created = await sequelize.transaction(async (t: any) => {
      const test = await this.testModel.create(
        {
          mode: "fixed",
          title: overrideTitle || normalized!.title,
          durationSec,
          quantities: normalized!.questions.length,
          startedAt: new Date(),
          userId: isPublic ? null : userId,
          isPublic,
          source: "ai",
        } as any,
        { transaction: t }
      );

      for (let i = 0; i < normalized!.questions.length; i++) {
        const q = normalized!.questions[i];

        const question = await this.questionModel.create(
          {
            content: q.stem,
            section: q.section || null,
            skill: q.skill || null,
            difficulty: q.difficulty || null,
            passage: null,
            model: process.env.AI_MODEL || null,
          } as any,
          { transaction: t }
        );

        const correctIdx = ["A", "B", "C", "D"].indexOf(q.answer);
        const choices = q.choices.map((c, idx) => ({
          choiceText: c.text,
          isCorrect: idx === correctIdx,
          questionId: question.id,
          choiceOrder: idx + 1,
        }));

        await this.choiceModel.bulkCreate(choices as any[], { transaction: t });

        await this.testQuestionModel.create(
          { testId: test.id, questionId: question.id, order: i + 1 } as any,
          { transaction: t }
        );
      }

      if (!isPublic) {
        await this.assignModel.create(
          { userId, testId: test.id, source: "ai" } as any,
          { transaction: t }
        );
      }

      return test;
    });

    return { testId: created.id, title: created.title };
  }

  async explainQuestions(userId: number, dto: any) {
    const exam = String(dto?.exam || "SAT").toUpperCase();

    const questions = Array.isArray(dto?.questions) ? dto.questions : [];
    if (!questions.length) {
      return { explanations: {} };
    }

    const sys: LlmMsg = {
      role: "system",
      content:
        "Bạn là gia sư luyện thi SAT/HSA. Trả về ONLY JSON hợp lệ, không markdown. " +
        'Schema: {"explanations": {"<key>": {"explanation": string, "finalAnswer": "A"|"B"|"C"|"D", "picked": "A"|"B"|"C"|"D"|null, "isCorrect": boolean, "note": string|null }}}. ' +
        "Giải thích ngắn gọn, từng bước. finalAnswer luôn là A/B/C/D.",
    };

    const user: LlmMsg = {
      role: "user",
      content: JSON.stringify({ exam, questions }).slice(0, 120000),
    };

    const raw = await this.callLLM([sys, user]);
    const parsed = safeJsonParse(raw);

    if (parsed?.explanations && typeof parsed.explanations === "object") {
      return parsed;
    }

    const fallback: any = {};
    for (const q of questions) {
      const key = String(
        q.questionId ||
          q.id ||
          q.tempKey ||
          q.content?.slice(0, 18) ||
          Math.random()
      );
      fallback[key] = {
        explanation: "Chưa lấy được giải thích từ AI.",
        finalAnswer: String(q.correct || "A").toUpperCase(),
        picked: q.picked ? String(q.picked).toUpperCase() : null,
        isCorrect: q.picked
          ? String(q.picked).toUpperCase() === String(q.correct).toUpperCase()
          : false,
        note: null,
      };
    }

    return { explanations: fallback };
  }

  async practiceSummary(userId: number, dto: any) {
    const exam = String(dto?.exam || "SAT").toUpperCase();
    const results = Array.isArray(dto?.results) ? dto.results : [];

    const total = results.length;
    const correctCount = results.reduce(
      (s: number, r: any) => s + (r?.correct ? 1 : 0),
      0
    );

    const sys: LlmMsg = {
      role: "system",
      content:
        "Bạn là gia sư luyện thi SAT/HSA. Trả về ONLY JSON hợp lệ, không markdown. " +
        'Schema: {"summary": string, "level": "beginner"|"intermediate"|"advanced", "strengths": string[], "weaknesses": string[], "plan": string[]}. ' +
        "Đánh giá dựa trên kết quả đúng/sai theo skill và difficulty. Ngắn gọn, thực tế.",
    };

    const user: LlmMsg = {
      role: "user",
      content: JSON.stringify({
        exam,
        meta: { total, correctCount },
        filters: {
          section: dto?.section || null,
          skill: dto?.skill || null,
          difficulty: dto?.difficulty || null,
        },
        results,
      }).slice(0, 120000),
    };

    const raw = await this.callLLM([sys, user]);
    const parsed = safeJsonParse(raw);

    if (parsed && typeof parsed === "object" && typeof parsed.summary === "string") {
      return parsed;
    }

    const pct = total ? Math.round((correctCount / total) * 100) : 0;
    return {
      summary: `Bạn đúng ${correctCount}/${total} (${pct}%).`,
      level: pct >= 75 ? "advanced" : pct >= 45 ? "intermediate" : "beginner",
      strengths: [],
      weaknesses: [],
      plan: ["Luyện thêm 10 câu cùng kỹ năng và độ khó hiện tại."],
    };
  }

  async generateQuestions(userId: number, dto: AiGenerateQuestionsDto) {
    const testId = dto.testId ? Number(dto.testId) : null;
    const exam = (dto.exam || "SAT") as "SAT" | "HSA";

    const sequelize: any = (this.testModel as any).sequelize;
    if (!sequelize) throw new BadRequestException("Sequelize chưa sẵn sàng");

    const normalizeDiff = (x: any) => {
      const d = String(x || "").toLowerCase().trim();
      if (d === "easy" || d === "medium" || d === "hard") return d;
      return "medium";
    };

    const planFromDistribution = () => {
      const dist: any = (dto as any).distribution;
      if (!dist || typeof dist !== "object") return null;

      const buckets: Array<{
        section: string;
        skill: string;
        difficulty: "easy" | "medium" | "hard";
        count: number;
      }> = [];

      const sections = Array.isArray(dist.sections) ? dist.sections : [];
      for (const s of sections) {
        const section = String(s?.section || "").trim();
        const skills = Array.isArray(s?.skills) ? s.skills : [];
        for (const sk of skills) {
          const skill = String(sk?.skill || "").trim();
          const d = sk?.difficulty || {};
          const easy = Number(d?.easy || 0) || 0;
          const medium = Number(d?.medium || 0) || 0;
          const hard = Number(d?.hard || 0) || 0;

          if (section && skill && easy > 0) buckets.push({ section, skill, difficulty: "easy", count: easy });
          if (section && skill && medium > 0) buckets.push({ section, skill, difficulty: "medium", count: medium });
          if (section && skill && hard > 0) buckets.push({ section, skill, difficulty: "hard", count: hard });
        }
      }

      const total = buckets.reduce((s, b) => s + b.count, 0);
      if (!total) return null;

      return { buckets, total };
    };

    const fallbackNum = Math.min(Math.max(Number((dto as any).numQuestions || 5), 1), 40);
    const distPlan = planFromDistribution();
    const targetTotal = distPlan ? Math.min(distPlan.total, 40) : fallbackNum;

    const sys: LlmMsg = {
      role: "system",
      content:
        "Return ONLY valid JSON. No markdown. " +
        "Each question must have exactly 4 choices labeled A,B,C,D (plain letters only). " +
        'Schema: {"questions":[{"stem":string,"section":string,"skill":string,"difficulty":"easy"|"medium"|"hard",' +
        '"choices":[{"label":"A"|"B"|"C"|"D","text":string}],' +
        '"answer":"A"|"B"|"C"|"D"}]}',
    };

    const genBucket = async (
      count: number,
      section: string,
      skill: string,
      difficulty: "easy" | "medium" | "hard"
    ) => {
      const userPrompt: LlmMsg = {
        role: "user",
        content:
          `Create ${count} ${exam} questions.\n` +
          `Section: ${section}\n` +
          `Skill: ${skill}\n` +
          `Difficulty: ${difficulty}\n` +
          `Language: Vietnamese (SAT Reading may include short English).\n`,
      };

      const raw = await this.callLLM([sys, userPrompt]);
      const parsed = safeJsonParse(raw);

      if (!parsed?.questions || !Array.isArray(parsed.questions)) {
        throw new BadRequestException("AI output invalid");
      }

      const out = parsed.questions.map((q: any) => {
        const choices = (q.choices || []).map((c: any, i: number) => ({
          label: normalizeChoiceLabel(c.label, i),
          text: String(c.text || "").trim(),
        }));

        if (choices.length !== 4) throw new BadRequestException("AI output choices must be 4");
        const labels = choices.map((c) => c.label).join("");
        if (labels !== "ABCD") throw new BadRequestException("AI output choices label phải là A,B,C,D");

        const answer = normalizeChoiceLabel(q.answer, 0);
        if (!["A", "B", "C", "D"].includes(answer))
          throw new BadRequestException("AI output missing answer");

        return {
          stem: String(q.stem || "").trim(),
          section: String(q.section || section).trim() || section,
          skill: String(q.skill || skill).trim() || skill,
          difficulty: normalizeDiff(q.difficulty || difficulty) as any,
          choices,
          answer,
        };
      });

      return out;
    };

    const genFallbackMixed = async (n: number) => {
      const userPrompt: LlmMsg = {
        role: "user",
        content:
          `Create ${n} ${exam} questions.\n` +
          `Section: ${dto.section || "auto"}\n` +
          `Skill: ${dto.skill || "auto"}\n` +
          `Difficulty: ${dto.difficulty || "mixed"}\n` +
          `Language: Vietnamese (SAT Reading may include short English).\n`,
      };

      const raw = await this.callLLM([sys, userPrompt]);
      const parsed = safeJsonParse(raw);

      if (!parsed?.questions || !Array.isArray(parsed.questions)) {
        throw new BadRequestException("AI output invalid");
      }

      return parsed.questions;
    };

    const allGenerated: any[] = [];

    if (distPlan) {
      const buckets = distPlan.buckets.slice();
      let remaining = targetTotal;

      for (const b of buckets) {
        if (remaining <= 0) break;
        const need = Math.min(b.count, remaining);
        if (need <= 0) continue;

        const qs = await genBucket(need, b.section, b.skill, b.difficulty);
        allGenerated.push(
          ...qs.map((x: any) => ({
            stem: x.stem,
            section: b.section,
            skill: b.skill,
            difficulty: b.difficulty,
            choices: x.choices,
            answer: x.answer,
          }))
        );

        remaining -= need;
      }

      if (allGenerated.length !== targetTotal) {
        throw new BadRequestException("AI generate distribution mismatch");
      }
    } else {
      const mixed = await genFallbackMixed(targetTotal);
      allGenerated.push(...mixed);
    }

    const createdQuestionIds: number[] = [];
    let attached = 0;

    await sequelize.transaction(async (t: any) => {
      let startOrder = 0;

      if (testId) {
        const test = await this.testModel.findByPk(testId, { transaction: t });
        if (!test) throw new BadRequestException("Test not found");

        const maxOrderRow = await this.testQuestionModel.findOne({
          where: { testId },
          order: [["order", "DESC"]],
          attributes: ["order"],
          transaction: t,
        });
        startOrder = Number((maxOrderRow as any)?.order || 0);
      }

      for (const q of allGenerated) {
        const choices = (q.choices || []).map((c: any, i: number) => ({
          label: normalizeChoiceLabel(c.label, i),
          text: String(c.text || "").trim(),
        }));

        if (choices.length !== 4)
          throw new BadRequestException("AI output choices must be 4");
        const labels = choices.map((c) => c.label).join("");
        if (labels !== "ABCD")
          throw new BadRequestException("AI output choices label phải là A,B,C,D");

        const answer = normalizeChoiceLabel(q.answer, 0);
        if (!["A", "B", "C", "D"].includes(answer))
          throw new BadRequestException("AI output missing answer");

        const question = await this.questionModel.create(
          {
            content: String(q.stem || "").trim(),
            section: q.section ? String(q.section) : dto.section || null,
            skill: q.skill ? String(q.skill) : dto.skill || null,
            difficulty: q.difficulty ? String(q.difficulty) : dto.difficulty || null,
            model:
              process.env.OPENAI_MODEL ||
              process.env.GEMINI_MODEL ||
              process.env.AI_MODEL ||
              null,
            source: "ai",
          } as any,
          { transaction: t }
        );

        await this.choiceModel.bulkCreate(
          choices.map((c: any, i: number) => ({
            questionId: question.id,
            choiceText: c.text,
            isCorrect: c.label === answer,
            choiceOrder: i + 1,
          })),
          { transaction: t }
        );

        createdQuestionIds.push(question.id);

        if (testId) {
          startOrder += 1;
          await this.testQuestionModel.create(
            { testId, questionId: question.id, order: startOrder } as any,
            { transaction: t }
          );
          attached += 1;
        }
      }

      if (testId) {
        const total = await this.testQuestionModel.count({
          where: { testId },
          transaction: t,
        });
        await this.testModel.update(
          { quantities: total },
          { where: { id: testId }, transaction: t }
        );
      }
    });

    return {
      testId,
      added: createdQuestionIds.length,
      attached,
      questionIds: createdQuestionIds,
    };
  }
}
