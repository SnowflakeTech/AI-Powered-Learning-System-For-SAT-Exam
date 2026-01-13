import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ok } from "../common/api-response";
import { AiService } from "./ai.service";
import { AiChatDto } from "./dto/chat.dto";
import { AiGenerateTestDto } from "./dto/generate-test.dto";
import { AiGenerateQuestionsDto } from "./dto/generate-questions.dto";
import { AiExplainQuestionsDto } from "./dto/explain-questions.dto";
import { AiPracticeSummaryDto } from "./dto/practice-summary.dto";
import { AiTranslateQuestionsDto } from "./dto/translate-questions.dto";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  async chat(@Req() req: any, @Body() dto: AiChatDto) {
    const data = await this.aiService.chat(req.user.id, dto);
    return ok(data);
  }

  @Get("insights")
  async insights(@Req() req: any) {
    const data = await this.aiService.insights(req.user.id);
    return ok(data);
  }

  @Post("generate-test")
  async generateTest(@Req() req: any, @Body() dto: AiGenerateTestDto) {
    const data = await this.aiService.generateTest(req.user, dto);
    return ok(data, "Generated");
  }

  @Post("generate-questions")
  async generateQuestions(@Req() req: any, @Body() dto: AiGenerateQuestionsDto) {
    const data = await this.aiService.generateQuestions(req.user.id, dto);
    return ok(data, "Generated");
  }

  @Post("explain-questions")
  async explainQuestions(@Req() req: any, @Body() dto: AiExplainQuestionsDto) {
    const data = await this.aiService.explainQuestions(req.user.id, dto);
    return ok(data);
  }

  @Post("practice-summary")
  async practiceSummary(@Req() req: any, @Body() dto: AiPracticeSummaryDto) {
    const data = await this.aiService.practiceSummary(req.user.id, dto);
    return ok(data);
  }

  @Post("translate-questions")
  async translateQuestions(@Req() req: any, @Body() dto: AiTranslateQuestionsDto) {
    const data = await this.aiService.translateQuestions(req.user.id, dto);
    return ok(data);
  }
}
