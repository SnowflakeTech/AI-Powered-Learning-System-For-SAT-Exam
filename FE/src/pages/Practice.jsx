import React, { useMemo, useState } from "react";
import DashboardNavBar from "../components/DashboardNavBar.jsx";
import { apiPost } from "../lib/apiClient.js";
import { useNavigate } from "react-router-dom";

const SAT = {
  reading_writing: [
    "Information and Ideas",
    "Craft and Structure",
    "Expression of Ideas",
    "Standard English Conventions",
  ],
  math: ["Algebra", "Advanced Math", "Problem Solving and Data Analysis", "Geometry and Trigonometry"],
};

const HSA = {
  math: ["algebra", "geometry", "probability", "functions"],
  logic: ["reasoning", "patterns", "deduction"],
  reading: ["comprehension", "vocabulary", "inference"],
};

export default function Practice() {
  const nav = useNavigate();

  const [exam, setExam] = useState("SAT");
  const [section, setSection] = useState("math");
  const [skill, setSkill] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const sections = useMemo(() => {
    if (exam === "SAT") return ["reading_writing", "math"];
    return ["math", "logic", "reading"];
  }, [exam]);

  const skills = useMemo(() => {
    const source = exam === "SAT" ? SAT : HSA;
    return source[section] || [];
  }, [exam, section]);

  const difficulties = [
    { value: "mixed", label: "Mixed" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  async function startAi() {
    try {
      setErr("");
      setLoading(true);

      const payload = {
        exam,
        numQuestions: Math.max(1, Math.min(40, Number(count) || 10)),
        section: section || undefined,
        skill: skill || undefined,
        difficulty: difficulty === "mixed" ? undefined : difficulty,
      };

      const res = await apiPost("/ai/generate-questions", payload);
      const ids = res?.data?.questionIds || res?.questionIds || [];

      if (!Array.isArray(ids) || ids.length === 0) throw new Error("AI không trả về questionIds");

      nav(`/practice/session?ids=${ids.join(",")}`, { replace: false });
    } catch (e) {
      setErr(e?.message || "AI tạo câu hỏi thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavBar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Luyện theo kỹ năng</h1>
            <p className="mt-2 text-neutral-600">Chọn Section/Skill/Difficulty và số câu, rồi AI tạo đúng bộ câu để làm ngay.</p>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>
        ) : null}

        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium mb-1">Exam</div>
              <select
                value={exam}
                onChange={(e) => {
                  const v = e.target.value;
                  setExam(v);
                  const s0 = v === "SAT" ? "math" : "math";
                  setSection(s0);
                  setSkill("");
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                <option value="SAT">SAT</option>
                <option value="HSA">HSA</option>
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Section</div>
              <select
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setSkill("");
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Skill</div>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                <option value="">auto</option>
                {skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Difficulty</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                {difficulties.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Số câu</div>
              <input
                type="number"
                min={1}
                max={40}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              />
            </label>

            <div className="flex items-end">
              <button
                onClick={startAi}
                disabled={loading}
                className="w-full md:w-auto rounded-xl bg-black text-white px-5 py-2 font-medium disabled:opacity-60"
              >
                {loading ? "Đang tạo..." : "Bắt đầu luyện (AI tạo bộ câu)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
