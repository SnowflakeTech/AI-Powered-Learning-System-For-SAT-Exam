import React, { useEffect, useMemo, useState } from "react";

const EXAMS = [
  { value: "SAT", label: "SAT" },
  { value: "HSA", label: "HSA" },
  { value: "auto", label: "Tự chọn (auto)" },
];

const PRESETS = {
  SAT: {
    durationSec: 3600,
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
    ],
  },
  HSA: {
    durationSec: 3600,
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
        Preset hiển thị để tham khảo. Nếu muốn AI “bám %” chính xác, cần wire vào BE.
      </div>
    </div>
  );
}

export default function AiTestCreateModal({
  open,
  onClose,
  onSubmit,
  loading,
  isAdmin,
}) {
  const [exam, setExam] = useState("SAT");
  const preset = useMemo(() => PRESETS[exam] || PRESETS.SAT, [exam]);

  const [meta, setMeta] = useState({
    title: "",
    numQuestions: 10,
  });

  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!open) return;
    setExam("SAT");
    setMeta({ title: "", numQuestions: 10 });
    setIsPublic(false);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const durationSec = preset.durationSec;

  const titleComputed = useMemo(() => {
    const rawTitle = (meta.title || "").trim();
    return rawTitle || `Đề ${exam}`;
  }, [meta.title, exam]);

  const canSubmit = useMemo(() => {
    const n = Number(meta.numQuestions);
    return Number.isFinite(n) && n >= 5 && n <= 40;
  }, [meta.numQuestions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-neutral-50 rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="bg-white px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-neutral-900 truncate">
                Tạo đề thi mới (AI)
              </div>
              <div className="text-sm text-neutral-500">
                Thiết lập cấu hình rồi bấm tạo
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100"
              disabled={loading}
            >
              Đóng
            </button>
          </div>

          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin đề + cấu hình AI</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Loại đề</span>
                  <select
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                    disabled={loading}
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
                    disabled={loading}
                  />
                  <div className="text-xs text-neutral-500 mt-1">Giới hạn: 5–40 câu.</div>
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-sm font-medium mb-1">Tiêu đề (tuỳ chọn)</span>
                  <input
                    value={meta.title}
                    onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))}
                    placeholder="vd: SAT Practice Test"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                    disabled={loading}
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    Tiêu đề thực tế: <b>{titleComputed}</b>
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-sm font-medium mb-1">Thời gian (giây) — theo preset</span>
                  <input
                    value={durationSec}
                    readOnly
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-700"
                  />
                </label>

                {isAdmin && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-800 select-none">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4"
                        disabled={loading}
                      />
                      Công khai (mọi user đều thấy)
                    </label>
                  </div>
                )}

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={() =>
                      onSubmit({
                        exam: exam === "auto" ? "auto" : exam,
                        numQuestions: Math.min(Math.max(Number(meta.numQuestions || 10), 5), 40),
                        durationSec,
                        title: titleComputed,
                        isPublic: isAdmin ? isPublic : false,
                      })
                    }
                    disabled={!canSubmit || loading}
                    className="w-full md:w-auto px-5 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {loading ? "AI đang tạo đề..." : "Tạo đề thi bằng AI"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PctList title="Phân bố Section (preset)" items={preset.sections} />
              <PctList title="Phân bố Độ khó (preset)" items={preset.difficulties} />
              <PctList title="Phân bố Kỹ năng (preset)" items={preset.skills} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
