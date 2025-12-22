import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiPost } from "../lib/apiClient.js";

const MODES = [
  { value: "fixed", label: "fixed" },
  { value: "adaptive", label: "adaptive" },
  { value: "diagnostic", label: "diagnostic" },
];

function emptyQuestion() {
  return {
    section: "",
    skill: "",
    difficulty: "",
    passage: "",
    content: "",
    choices: [
      { choiceText: "", isCorrect: true, choiceOrder: 1 },
      { choiceText: "", isCorrect: false, choiceOrder: 2 },
      { choiceText: "", isCorrect: false, choiceOrder: 3 },
      { choiceText: "", isCorrect: false, choiceOrder: 4 },
    ],
  };
}

export default function AdminTestBuilder() {
  const nav = useNavigate();

  const [step, setStep] = useState(1); // 1: meta, 2: questions
  const [creating, setCreating] = useState(false);
  const [savingQ, setSavingQ] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [testMeta, setTestMeta] = useState({
    code: "",
    title: "",
    mode: "fixed",
    quantities: 10,
    durationSec: 3600,
  });
  const [testId, setTestId] = useState(null);
  const [added, setAdded] = useState([]); // questions added
  const [qForm, setQForm] = useState(() => emptyQuestion());

  const target = useMemo(() => {
    const n = Number(testMeta.quantities);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [testMeta.quantities]);

  const onMetaChange = (k) => (e) => {
    const v = e.target.value;
    setTestMeta((prev) => ({ ...prev, [k]: v }));
  };

  const createTest = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setOk("");
    setCreating(true);
    try {
      const code = (testMeta.code || "").trim();
      const rawTitle = (testMeta.title || "").trim();
      const title = code ? `[${code}] ${rawTitle || 'Đề thi mới'}` : (rawTitle || 'Đề thi mới');

      const payload = {
        title,
        mode: testMeta.mode,
        quantities: Number(testMeta.quantities) || 0,
        durationSec: Number(testMeta.durationSec) || 3600,
      };

      const res = await apiPost("/tests", payload);
      const id = res?.data?.id;
      if (!id) throw new Error("Không lấy được ID đề thi vừa tạo");
      setTestId(id);
      setStep(2);
      setOk(`Đã tạo đề thi #${id}. Bây giờ nhập câu hỏi & đáp án.`);
    } catch (e2) {
      setErr(e2?.message || "Tạo đề thi thất bại");
    } finally {
      setCreating(false);
    }
  };

  const setCorrectIndex = (idx) => {
    setQForm((prev) => ({
      ...prev,
      choices: prev.choices.map((c, i) => ({ ...c, isCorrect: i === idx })),
    }));
  };

  const onQChange = (k) => (e) => setQForm((p) => ({ ...p, [k]: e.target.value }));
  const onChoiceChange = (i) => (e) => {
    const v = e.target.value;
    setQForm((p) => ({
      ...p,
      choices: p.choices.map((c, idx) => (idx === i ? { ...c, choiceText: v } : c)),
    }));
  };

  const canAdd = useMemo(() => {
    if (!testId) return false;
    if (!qForm.content.trim()) return false;
    const filled = qForm.choices.every((c) => String(c.choiceText || "").trim());
    const hasCorrect = qForm.choices.some((c) => !!c.isCorrect);
    return filled && hasCorrect;
  }, [testId, qForm]);

  const addQuestion = async () => {
    if (!canAdd) return;
    setSavingQ(true);
    setErr("");
    setOk("");
    try {
      // 1) tạo question
      const created = await apiPost("/question/with-choices", {
        section: qForm.section || null,
        skill: qForm.skill || null,
        difficulty: qForm.difficulty || null,
        passage: qForm.passage || null,
        content: qForm.content,
        choices: qForm.choices.map((c, idx) => ({
          choiceText: c.choiceText,
          isCorrect: !!c.isCorrect,
          choiceOrder: idx + 1,
        })),
      });
      const qId = created?.data?.id;
      if (!qId) throw new Error("Tạo câu hỏi thất bại");

      // 2) attach vào test
      await apiPost(`/tests/${testId}/questions`, { questionIds: [qId] });

      setAdded((prev) => [
        ...prev,
        {
          id: qId,
          content: qForm.content,
          questionChoices: qForm.choices,
        },
      ]);
      setQForm(emptyQuestion());
      setOk(`Đã thêm câu hỏi #${qId} vào đề #${testId}`);
    } catch (e) {
      setErr(e?.message || "Thêm câu hỏi thất bại");
    } finally {
      setSavingQ(false);
    }
  };

  const done = () => {
    if (!testId) return nav("/tests");
    nav(`/admin/tests/${testId}/edit`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavBar />

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin • Tạo đề thi mới</h1>
          <button
            onClick={() => nav("/tests")}
            className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100"
          >
            ← Quay lại Tests
          </button>
        </div>

        {err ? (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {err}
          </div>
        ) : null}
        {ok ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            {ok}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">1) Thông tin đề thi</h2>
            <form onSubmit={createTest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Mã đề (tuỳ chọn)</span>
                <input
                  value={testMeta.code}
                  onChange={onMetaChange("code")}
                  placeholder="vd: SAT-01 hoặc HSA-TOAN-01"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
                <div className="text-xs text-neutral-500 mt-1">
                  Mã này chỉ để dễ quản lý. ID số sẽ do hệ thống tự tăng.
                </div>
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Tiêu đề</span>
                <input
                  value={testMeta.title}
                  onChange={onMetaChange("title")}
                  placeholder="vd: SAT Practice Test 1"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Mode</span>
                <select
                  value={testMeta.mode}
                  onChange={onMetaChange("mode")}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                >
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Số câu</span>
                <input
                  type="number"
                  min={1}
                  value={testMeta.quantities}
                  onChange={onMetaChange("quantities")}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Thời gian (giây)</span>
                <input
                  type="number"
                  min={60}
                  value={testMeta.durationSec}
                  onChange={onMetaChange("durationSec")}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full md:w-auto px-5 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo đề thi"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">2) Nhập câu hỏi & đáp án</h2>
                <div className="text-sm text-neutral-600">
                  Đã thêm: <b>{added.length}</b>/{target}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Section</span>
                  <input
                    value={qForm.section}
                    onChange={onQChange("section")}
                    placeholder="vd: Math"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Skill</span>
                  <input
                    value={qForm.skill}
                    onChange={onQChange("skill")}
                    placeholder="vd: Algebra"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1">Difficulty</span>
                  <input
                    value={qForm.difficulty}
                    onChange={onQChange("difficulty")}
                    placeholder="easy/medium/hard"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                  />
                </label>
                <div className="block" />
              </div>

              <label className="block mt-4">
                <span className="block text-sm font-medium mb-1">Passage (tuỳ chọn)</span>
                <textarea
                  rows={3}
                  value={qForm.passage}
                  onChange={onQChange("passage")}
                  placeholder="Đoạn văn / dữ kiện dài..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </label>

              <label className="block mt-4">
                <span className="block text-sm font-medium mb-1">Nội dung câu hỏi</span>
                <textarea
                  rows={4}
                  value={qForm.content}
                  onChange={onQChange("content")}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
                />
              </label>

              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Đáp án (chọn đáp án đúng)</div>
                <div className="space-y-2">
                  {qForm.choices.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correct"
                        checked={!!c.isCorrect}
                        onChange={() => setCorrectIndex(i)}
                      />
                      <input
                        value={c.choiceText}
                        onChange={onChoiceChange(i)}
                        placeholder={`Đáp án ${i + 1}`}
                        className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={!canAdd || savingQ}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingQ ? "Đang thêm..." : "+ Thêm câu hỏi"}
                </button>

                <button
                  type="button"
                  onClick={done}
                  className="px-5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100"
                >
                  Xong / Chỉnh sửa tiếp
                </button>

                <div className="text-xs text-neutral-500 flex items-center">
                  Mẹo: nên thêm đủ {target} câu để đề thi hiển thị đúng số lượng.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-3">Câu hỏi đã thêm</h2>
              {added.length === 0 ? (
                <div className="text-sm text-neutral-600">Chưa có câu hỏi nào.</div>
              ) : (
                <div className="space-y-3 max-h-[650px] overflow-auto pr-1">
                  {added.map((q, idx) => (
                    <div key={q.id} className="border border-neutral-200 rounded-xl p-4">
                      <div className="text-sm text-neutral-500">#{idx + 1} • QuestionID: {q.id}</div>
                      <div className="mt-2 font-medium whitespace-pre-wrap">{q.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
