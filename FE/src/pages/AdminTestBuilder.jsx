import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavBar from "../components/DashboardNavBar.jsx";
import { apiPost } from "../lib/apiClient.js";

const EXAMS = [
  { value: "SAT", label: "SAT" },
  { value: "HSA", label: "HSA" },
];

// Bạn chỉnh các preset này theo ý bạn
const PRESETS = {
  SAT: {
    durationSec: 3600, // cố định SAT
    sections: [
      { key: "Reading & Writing", pct: 50 },
      { key: "Math", pct: 50 },
    ],
    difficulties: [
      { key: "easy", pct: 40 },
      { key: "medium", pct: 40 },
      { key: "hard", pct: 20 },
    ],
    skills: [
      { key: "Information and Ideas", pct: 25 },
      { key: "Craft and Structure", pct: 25 },
      { key: "Expression of Ideas", pct: 25 },
      { key: "Standard English Conventions", pct: 25 },
      // Math skills có thể chuyển sang tab/nhóm riêng nếu muốn
    ],
  },
  HSA: {
    durationSec: 3600, // nếu HSA bạn muốn khác (vd 5400) thì đổi ở đây
    sections: [
      { key: "math", pct: 40 },
      { key: "logic", pct: 30 },
      { key: "reading", pct: 30 },
    ],
    difficulties: [
      { key: "easy", pct: 40 },
      { key: "medium", pct: 40 },
      { key: "hard", pct: 20 },
    ],
    skills: [
      { key: "reasoning", pct: 40 },
      { key: "data-interpretation", pct: 30 },
      { key: "reading-comprehension", pct: 30 },
    ],
  },
};

function PctList({ title, items }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-2">
        {items.map((x) => (
          <div key={x.key} className="flex items-center justify-between gap-3">
            <div className="text-sm text-neutral-800">{x.key}</div>
            <div className="text-sm font-semibold tabular-nums">{x.pct}%</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-neutral-500">
        (Hiện tại chỉ hiển thị preset; muốn “AI bám đúng %” thì mình sẽ wire vào BE ở bước B.)
      </div>
    </div>
  );
}

export default function AdminTestBuilder() {
  const nav = useNavigate();

  const [exam, setExam] = useState("SAT");
  const preset = useMemo(() => PRESETS[exam] || PRESETS.SAT, [exam]);

  const [meta, setMeta] = useState({
    code: "",
    title: "",
    numQuestions: 10,
  });

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // khi đổi exam thì reset duration cố định (UI)
  const durationSec = preset.durationSec;

  const titleComputed = useMemo(() => {
    const code = (meta.code || "").trim();
    const rawTitle = (meta.title || "").trim();
    if (code && rawTitle) return `[${code}] ${rawTitle}`;
    if (code && !rawTitle) return `[${code}] Đề ${exam}`;
    return rawTitle || `Đề ${exam}`;
  }, [meta.code, meta.title, exam]);

  const createByAI = async (e) => {
    e?.preventDefault?.();
    if (creating) return;

    setErr("");
    setOk("");
    setCreating(true);

    try {
      const n = Math.min(Math.max(Number(meta.numQuestions || 10), 5), 40);

      // Gọi BE: /ai/generate-test (đã có sẵn)
      const res = await apiPost("/ai/generate-test", {
        exam,                // SAT | HSA
        numQuestions: n,     // 5..40
        durationSec,         // cố định theo preset
        title: titleComputed, // (mình sẽ thêm vào DTO ở bước B)
      });

      const data = res?.data || res;
      const testId = data?.testId;
      const title = data?.title;

      if (!testId) throw new Error("Không nhận được testId từ AI");

      setOk(`Đã tạo đề bằng AI: #${testId}${title ? ` • ${title}` : ""}`);

      // Điều hướng sang trang edit đề (admin)
      nav(`/admin/tests/${testId}/edit`);
    } catch (e2) {
      setErr(e2?.message || "Tạo đề bằng AI thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavBar />

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin • Tạo đề thi mới (AI)</h1>
          <button
            onClick={() => nav("/tests")}
            className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100"
          >
            ← Quay lại Tests
          </button>
        </div>

        {err ? (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">{err}</div>
        ) : null}

        {ok ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">{ok}</div>
        ) : null}

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin đề + cấu hình AI</h2>

          <form onSubmit={createByAI} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1">Loại đề</span>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                {EXAMS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium mb-1">Số câu (AI tạo)</span>
              <input
                type="number"
                min={5}
                max={40}
                value={meta.numQuestions}
                onChange={(e) => setMeta((p) => ({ ...p, numQuestions: e.target.value }))}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              />
              <div className="text-xs text-neutral-500 mt-1">Giới hạn BE: 5–40 câu.</div>
            </label>

            <label className="block">
              <span className="block text-sm font-medium mb-1">Mã đề (tuỳ chọn)</span>
              <input
                value={meta.code}
                onChange={(e) => setMeta((p) => ({ ...p, code: e.target.value }))}
                placeholder="vd: SAT-01 hoặc HSA-TOAN-01"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium mb-1">Tiêu đề (tuỳ chọn)</span>
              <input
                value={meta.title}
                onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))}
                placeholder="vd: Practice Test 1"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              />
              <div className="text-xs text-neutral-500 mt-1">
                Tiêu đề thực tế: <b>{titleComputed}</b>
              </div>
            </label>

            <label className="block md:col-span-2">
              <span className="block text-sm font-medium mb-1">Thời gian (giây) — cố định theo loại đề</span>
              <input
                value={durationSec}
                readOnly
                className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-700"
              />
              <div className="text-xs text-neutral-500 mt-1">
                Nếu muốn đổi thời gian SAT/HSA, chỉnh ở preset FE hoặc ép ở BE (mình làm ở bước B luôn).
              </div>
            </label>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full md:w-auto px-5 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {creating ? "AI đang tạo đề..." : "Tạo đề thi bằng AI"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PctList title="Phân bố Section (preset)" items={preset.sections} />
          <PctList title="Phân bố Độ khó (preset)" items={preset.difficulties} />
          <PctList title="Phân bố Kỹ năng (preset)" items={preset.skills} />
        </div>
      </div>
    </div>
  );
}
