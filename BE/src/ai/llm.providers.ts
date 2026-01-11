import { BadRequestException } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type LlmMsg = { role: "system" | "user" | "assistant"; content: string };

export async function callOpenAI(messages: LlmMsg[]): Promise<string> {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY || "";

  if (!apiKey) throw new BadRequestException("Missing OPENAI_API_KEY");

  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  const text = await res.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    const msg = payload?.error?.message || payload?.message || text || "OpenAI error";
    throw new BadRequestException(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  const reply = payload?.choices?.[0]?.message?.content;
  if (!reply) throw new BadRequestException("OpenAI empty response");
  return reply;
}

export async function callGemini(messages: LlmMsg[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (!apiKey) throw new BadRequestException("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  const result = await model.generateContent(prompt);
  const out = result.response.text();
  if (!out) throw new BadRequestException("Gemini empty response");
  return out;
}
