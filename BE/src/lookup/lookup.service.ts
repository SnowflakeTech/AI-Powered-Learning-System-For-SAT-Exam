import { Injectable } from "@nestjs/common";

type CacheEntry<T> = { ts: number; data: T };

@Injectable()
export class LookupService {
  private satCache: CacheEntry<any> | null = null;
  private hsaCache: CacheEntry<any> | null = null;

  private cacheMs() {
    const h = Number(process.env.LOOKUP_CACHE_HOURS || 12);
    return Math.max(1, h) * 60 * 60 * 1000;
  }

  private async fetchText(url: string) {
    const fetchFn: any = (global as any).fetch || require("node-fetch");

    const res = await fetchFn(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const text = await res.text();
    return { status: Number(res.status || 0), text };
  }

  private parseSatDates(html: string) {
    const dates: any[] = [];
    const lines = String(html || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const monthRegex =
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i;

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(monthRegex);
      if (!m) continue;

      const testDate = m[0];
      let reg: string | null = null;
      let late: string | null = null;

      for (let j = i; j < Math.min(i + 40, lines.length); j++) {
        const s = lines[j];
        if (!reg && /registration/i.test(s) && monthRegex.test(s)) {
          const mm = s.match(monthRegex);
          if (mm) reg = mm[0];
        }
        if (!late && /late/i.test(s) && monthRegex.test(s)) {
          const mm = s.match(monthRegex);
          if (mm) late = mm[0];
        }
      }

      dates.push({
        testDate,
        registrationDeadline: reg,
        lateRegistrationDeadline: late,
      });

      if (dates.length >= 20) break;
    }

    const uniq = new Map<string, any>();
    for (const d of dates) {
      const key = String(d.testDate || "");
      if (!uniq.has(key)) uniq.set(key, d);
    }
    return [...uniq.values()];
  }

  private parseHsaSchedule(html: string) {
    const rows: any[] = [];
    const plain = String(html || "")
      .replace(/\r/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ");

    const lines = plain
      .split("\n")
      .map((x) => x.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/;

    for (let i = 0; i < lines.length; i++) {
      const d = lines[i].match(dateRegex);
      if (!d) continue;

      const date = d[1];
      const chunk = lines
        .slice(Math.max(0, i - 2), Math.min(lines.length, i + 4))
        .join(" • ");

      const roundMatch = chunk.match(/(Đợt|Dot)\s*\d+/i);
      const round = roundMatch ? roundMatch[0] : null;

      const locationMatch = chunk.match(
        /(Hà Nội|Hai Phong|Hải Phòng|Huế|Đà Nẵng|Da Nang|TP\.?HCM|Hồ Chí Minh|Ho Chi Minh|Nam Định|Thái Nguyên|Thai Nguyen|Vinh|Nghệ An|Nghe An)/i
      );
      const location = locationMatch ? locationMatch[0] : null;

      rows.push({
        round,
        date,
        location,
        note: chunk.length > 220 ? chunk.slice(0, 220) + "..." : chunk,
      });

      if (rows.length >= 80) break;
    }

    const uniq = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.round || ""}-${r.date}-${r.location || ""}`;
      if (!uniq.has(key)) uniq.set(key, r);
    }
    return [...uniq.values()];
  }

  async getSatDates() {
    const now = Date.now();
    const ttl = this.cacheMs();
    if (this.satCache && now - this.satCache.ts < ttl) return this.satCache.data;

    const sourceUrl =
      "https://satsuite.collegeboard.org/sat/registration/dates-deadlines";

    try {
      const { status, text } = await this.fetchText(sourceUrl);
      const dates = status >= 200 && status < 400 ? this.parseSatDates(text) : [];
      const data = { sourceUrl, dates, ok: true };
      this.satCache = { ts: now, data };
      return data;
    } catch {
      const data = { sourceUrl, dates: [], ok: false };
      this.satCache = { ts: now, data };
      return data;
    }
  }

  async getHsaSchedule() {
    const now = Date.now();
    const ttl = this.cacheMs();
    if (this.hsaCache && now - this.hsaCache.ts < ttl) return this.hsaCache.data;

    const sourceUrl = "https://hsa.edu.vn/lich-thi/lich-thi-hsa";

    try {
      const { status, text } = await this.fetchText(sourceUrl);
      const rows = status >= 200 && status < 400 ? this.parseHsaSchedule(text) : [];
      const data = { sourceUrl, rows, ok: true };
      this.hsaCache = { ts: now, data };
      return data;
    } catch {
      const data = { sourceUrl, rows: [], ok: false };
      this.hsaCache = { ts: now, data };
      return data;
    }
  }
}
