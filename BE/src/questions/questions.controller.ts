import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import * as fs from "fs";
import * as path from "path";

import { ok } from "../common/api-response";
import { Roles } from "../common/decorators/roles.decorator";

import { CreateQuestionWithChoicesDto } from "./dto/create-question-with-choices.dto";
import { UpdateChoicesDto } from "./dto/update-choices.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { QuestionsService } from "./questions.service";

import { Question } from "../models/question.model";
import { AiService } from "../ai/ai.service";

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileName(req: any, file: any, cb: any) {
  const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
  cb(null, `q-${unique}${extname(file.originalname)}`);
}

function imageInterceptor() {
  return FileInterceptor("file", {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, ensureUploadsDir()),
      filename: fileName,
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const okType = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
      cb(okType ? null : new BadRequestException("Invalid image type"), okType);
    },
  });
}

@Controller("question")
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly aiService: AiService,
    @InjectModel(Question) private readonly questionModel: typeof Question
  ) {}

  @Get("all")
  async all(@Query("page") page?: string, @Query("limit") limit?: string) {
    const rows = await this.questionsService.listAll(Number(page), Number(limit));
    return ok(rows);
  }

  @Get("stats")
  async stats(@Query("section") section?: string, @Query("skill") skill?: string) {
    const rows = await this.questionsService.statsBySkillDifficulty({
      section: section?.trim() || undefined,
      skill: skill?.trim() || undefined,
    });
    return ok(rows);
  }

  @Roles("admin")
  @Post("with-choices")
  async createWithChoices(@Body() dto: CreateQuestionWithChoicesDto) {
    const q = await this.questionsService.createWithChoices(dto);
    return ok(q);
  }

  @Roles("admin")
  @Patch(":id")
  async updateQuestion(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateQuestionDto) {
    const q = await this.questionsService.updateQuestion(id, dto);
    return ok(q, "Updated");
  }

  @Roles("admin")
  @Put(":id/choices")
  async updateChoices(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateChoicesDto) {
    const q = await this.questionsService.updateChoices(id, dto);
    return ok(q, "Updated");
  }

  @Roles("admin")
  @Delete(":id")
  async removeQuestion(@Param("id", ParseIntPipe) id: number) {
    const r = await this.questionsService.removeQuestion(id);
    return ok(r, "Deleted");
  }

  @Roles("admin")
  @Post("image-draft")
  @UseInterceptors(imageInterceptor())
  async uploadDraft(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Missing file");
    const url = `/uploads/${file.filename}`;
    return ok({ imageUrl: url }, "Uploaded");
  }

  @Roles("admin")
  @Post(":id/image")
  @UseInterceptors(imageInterceptor())
  async uploadQuestionImage(@Param("id", ParseIntPipe) id: number, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Missing file");

    const q = await this.questionModel.findByPk(id);
    if (!q) throw new BadRequestException("Question not found");

    const url = `/uploads/${file.filename}`;
    await q.update({ imageUrl: url });

    return ok({ questionId: q.id, imageUrl: url }, "Uploaded");
  }

  @Get("by-ids")
  async byIds(@Query("ids") ids?: string) {
    const data = await this.questionsService.getByIds(ids || "");
    return ok(data);
  }

  @Get("practice")
  async practice(
    @Query("exam") exam?: string,
    @Query("section") section?: string,
    @Query("skill") skill?: string,
    @Query("difficulty") difficulty?: string,
    @Query("limit") limit?: string
  ) {
    const data = await this.questionsService.listForPractice({
      exam,
      section,
      skill,
      difficulty,
      limit: Number(limit) || 10,
    });
    return ok(data);
  }

  @Roles("admin")
  @Post("ai-generate")
  async aiGenerate(@Req() req: any, @Body() body: any) {
    const dto = {
      testId: Number(body?.testId),
      numQuestions: Number(body?.count) || Number(body?.numQuestions) || 3,
      exam: body?.exam || "SAT",
      section: body?.section,
      skill: body?.skill,
      difficulty: body?.difficulty,
    };
    const data = await this.aiService.generateQuestions(req.user.id, dto as any);
    return ok(data);
  }
}
