import React, { useEffect, useMemo, useState } from "react";

const EXAMS = [
  { value: "SAT", label: "SAT" },
  { value: "HSA", label: "HSA" },
  { value: "auto", label: "Auto" },
];

const PRESETS = {
  SAT: {
    durationSec: 5880,
    sections: ["Reading & Writing", "Math"],
    difficulties: ["easy", "medium", "hard"],
    skills: [
      "Information and Ideas",
      "Craft and Structure",
      "Expression of Ideas",
      "Standard English Conventions",
    ],
  },
  HSA: {
    durationSec: 3600,
    sections: ["math", "logic", "reading"],
    difficulties: ["easy", "medium", "hard"],
    skills: ["reasoning", "data-interpretation", "reading-comprehension"],
  },
};

function mmss(sec) {
  const m = Math.round(Number(sec || 0) / 60);
  return `${m} phút`;
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-neutral-200 bg-neutral-50 text-neutral-700">
      {children}
    </span>
  );
}

export default function AiTestCreateModal({ open, onClose, onSubmit, loading, isAdmin }) {
  const [exam, setExam] = useState("SAT");
  const preset = useMemo(() => PRESETS[exam] || PRESETS.SAT, [exam]);

  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!open) return;
    setExam("SAT");
    setTitle("");
    setNumQuestions(10);
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

  const canSubmit = useMemo(() => {
    const n = Number(numQuestions);
    return Number.isFinite(n) && n >= 5 && n <= 40;
  }, [numQuestions]);

  const titleComputed = useMemo(() => {
    const t = String(title || "").trim();
    if (t) return t;
    return exam === "SAT" ? "SAT Practice Test" : exam === "HSA" ? "HSA Practice Test" : "AI Practice Test";
  }, [title, exam]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-neutral-900">Tạo đề bằng AI</div>
              <div className="text-sm text-neutral-500">
                {exam === "SAT" ? "SAT • 98 phút" : exam === "HSA" ? "HSA • 60 phút" : "Auto"}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-60"
            >
              Đóng
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <div className="text-sm font-medium mb-1">Loại đề</div>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                >
                  {EXAMS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-1">Số câu (5–40)</div>
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="text-sm font-medium mb-1">Tiêu đề (tuỳ chọn)</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  placeholder={titleComputed}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Chip>Thời gian: {mmss(durationSec)}</Chip>
                <Chip>Sections: {preset.sections.join(", ")}</Chip>
                <Chip>Độ khó: {preset.difficulties.join(", ")}</Chip>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                {preset.skills.slice(0, 4).map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>

              {isAdmin ? (
                <label className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4"
                  />
                  Công khai (mọi user đều thấy)
                </label>
              ) : null}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-60"
            >
              Huỷ
            </button>
            <button
              disabled={!canSubmit || loading}
              onClick={() =>
                onSubmit({
                  exam,
                  numQuestions: Math.min(Math.max(Number(numQuestions || 10), 5), 40),
                  durationSec,
                  title: titleComputed,
                  isPublic: isAdmin ? isPublic : false,
                })
              }
              className="px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800 disabled:opacity-60"
            >
              {loading ? "Đang tạo..." : "Tạo đề"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
