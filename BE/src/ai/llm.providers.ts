import { BadRequestException } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type LlmMsg = { role: "system" | "user" | "assistant"; content: string };

function shorten(msg: any) {
  const s = String(msg || "").replace(/\s+/g, " ").trim();
  return s.length > 180 ? s.slice(0, 180) : s;
}

export async function callOpenAI(messages: LlmMsg[]): Promise<string> {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY || "";

  if (!apiKey) throw new BadRequestException("OpenAI unavailable");

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
    payload = null;
  }

  if (!res.ok) {
    const msg = payload?.error?.message || payload?.message || `OpenAI error ${res.status}`;
    const s = shorten(msg);
    throw new BadRequestException(s || "OpenAI error");
  }

  const reply = payload?.choices?.[0]?.message?.content;
  if (!reply) throw new BadRequestException("OpenAI empty response");
  return reply;
}

export async function callGemini(messages: LlmMsg[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) throw new BadRequestException("Gemini unavailable");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

    const result = await model.generateContent(prompt);
    const out = result.response.text();
    if (!out) throw new BadRequestException("Gemini empty response");
    return out;
  } catch (e: any) {
    const raw = String(e?.message || e || "Gemini error");
    const lower = raw.toLowerCase();
    const short =
      lower.includes("429") || lower.includes("quota") || lower.includes("rate")
        ? "Gemini quota exceeded"
        : shorten(raw);
    throw new BadRequestException(short || "Gemini error");
  }
}
