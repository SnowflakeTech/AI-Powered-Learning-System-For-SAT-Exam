import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavBar.jsx";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "../lib/apiClient.js";

const MODES = ["fixed", "adaptive", "diagnostic"];

function normalizeQuestion(q) {
  const choices = (q?.questionChoices || q?.questionchoices || []).slice(0, 4);
  // đảm bảo luôn 4 choices để edit
  while (choices.length < 4) {
    choices.push({ choiceText: "", isCorrect: false, choiceOrder: choices.length + 1 });
  }
  // nếu không có correct, mặc định choice 1
  if (!choices.some((c) => !!c.isCorrect)) {
    choices[0].isCorrect = true;
  }
  return {
    id: q.id,
    section: q.section || "",
    skill: q.skill || "",
    difficulty: q.difficulty || "",
    passage: q.passage || "",
    content: q.content || "",
    choices: choices.map((c, i) => ({
      choiceText: c.choiceText || "",
      isCorrect: !!c.isCorrect,
      choiceOrder: c.choiceOrder ?? i + 1,
    })),
  };
}

function emptyQuestion() {
  return normalizeQuestion({ id: 0, content: "", questionChoices: [] });
}

export default function AdminTestEditor() {
  const nav = useNavigate();
  const { id } = useParams();
  const testId = Number(id);

  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingQ, setSavingQ] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [test, setTest] = useState(null);
  const [meta, setMeta] = useState({ title: "", mode: "fixed", durationSec: 3600, quantities: 0 });
  const [questions, setQuestions] = useState([]); // normalized
  const [newQ, setNewQ] = useState(() => emptyQuestion());

  const load = async () => {
    setLoading(true);
    setErr("");
    setOk("");
    try {
      const res = await apiGet(`/tests/${testId}/questions`);
      const data = res?.data;
      setTest(data?.test || null);
      setMeta({
        title: data?.test?.title || "",
        mode: data?.test?.mode || "fixed",
        durationSec: data?.test?.durationSec || 3600,
        quantities: data?.test?.quantities || 0,
      });
      setQuestions((data?.questions || []).map(normalizeQuestion));
    } catch (e) {
      setErr(e?.message || "Không tải được đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(testId)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const onMetaChange = (k) => (e) => {
    const v = e.target.value;
    setMeta((p) => ({ ...p, [k]: v }));
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    setErr("");
    setOk("");
    try {
      const payload = {
        title: (meta.title || "").trim(),
        mode: meta.mode,
        durationSec: Number(meta.durationSec) || 3600,
      };
      await apiPatch(`/tests/${testId}`, payload);
      setOk("Đã lưu thông tin đề thi");
      await load();
    } catch (e) {
      setErr(e?.message || "Lưu đề thi thất bại");
    } finally {
      setSavingMeta(false);
    }
  };

  const setQField = (qid, k) => (e) => {
    const v = e.target.value;
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, [k]: v } : q)));
  };

  const setQChoice = (qid, idx) => (e) => {
    const v = e.target.value;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, choices: q.choices.map((c, i) => (i === idx ? { ...c, choiceText: v } : c)) }
          : q
      )
    );
  };

  const setQCorrect = (qid, idx) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, choices: q.choices.map((c, i) => ({ ...c, isCorrect: i === idx })) }
          : q
      )
    );
  };

  const saveQuestion = async (q) => {
    setSavingQ(true);
    setErr("");
    setOk("");
    try {
      await apiPatch(`/question/${q.id}`, {
        content: q.content,
        section: q.section || null,
        skill: q.skill || null,
        difficulty: q.difficulty || null,
        passage: q.passage || null,
      });
      await apiPut(`/question/${q.id}/choices`, {
        choices: q.choices.map((c, i) => ({
          choiceText: c.choiceText,
          isCorrect: !!c.isCorrect,
          choiceOrder: i + 1,
        })),
      });
      setOk(`Đã lưu câu hỏi #${q.id}`);
      await load();
    } catch (e) {
      setErr(e?.message || "Lưu câu hỏi thất bại");
    } finally {
      setSavingQ(false);
    }
  };

  const removeFromTest = async (qid) => {
    if (!confirm(`Gỡ câu hỏi #${qid} khỏi đề #${testId}?`)) return;
    setSavingQ(true);
    setErr("");
    setOk("");
    try {
      await apiDelete(`/tests/${testId}/questions`, { questionIds: [qid] });
      setOk(`Đã gỡ câu hỏi #${qid}`);
      await load();
    } catch (e) {
      setErr(e?.message || "Gỡ câu hỏi thất bại");
    } finally {
      setSavingQ(false);
    }
  };

  const deleteTest = async () => {
    if (!confirm(`Xoá hẳn đề thi #${testId}? (Sẽ xoá cả các câu hỏi orphan nếu có)`)) return;
    setSavingMeta(true);
    setErr("");
    setOk("");
    try {
      await apiDelete(`/tests/${testId}?deleteOrphans=true`);
      alert("Đã xoá đề thi");
      nav("/tests");
    } catch (e) {
      setErr(e?.message || "Xoá đề thi thất bại");
    } finally {
      setSavingMeta(false);
    }
  };

  // NEW QUESTION
  const setNewField = (k) => (e) => setNewQ((p) => ({ ...p, [k]: e.target.value }));
  const setNewChoice = (idx) => (e) => {
    const v = e.target.value;
    setNewQ((p) => ({ ...p, choices: p.choices.map((c, i) => (i === idx ? { ...c, choiceText: v } : c)) }));
  };
  const setNewCorrect = (idx) => {
    setNewQ((p) => ({ ...p, choices: p.choices.map((c, i) => ({ ...c, isCorrect: i === idx })) }));
  };

  const canAddNew = useMemo(() => {
    if (!newQ.content.trim()) return false;
    if (!newQ.choices.every((c) => String(c.choiceText || "").trim())) return false;
    if (!newQ.choices.some((c) => !!c.isCorrect)) return false;
    return true;
  }, [newQ]);

  const addNewQuestion = async () => {
    if (!canAddNew) return;
    setSavingQ(true);
    setErr("");
    setOk("");
    try {
      const created = await apiPost("/question/with-choices", {
        section: newQ.section || null,
        skill: newQ.skill || null,
        difficulty: newQ.difficulty || null,
        passage: newQ.passage || null,
        content: newQ.content,
        choices: newQ.choices.map((c, i) => ({
          choiceText: c.choiceText,
          isCorrect: !!c.isCorrect,
          choiceOrder: i + 1,
        })),
      });
      const qId = created?.data?.id;
      if (!qId) throw new Error("Tạo câu hỏi thất bại");
      await apiPost(`/tests/${testId}/questions`, { questionIds: [qId] });
      setNewQ(emptyQuestion());
      setOk(`Đã thêm câu hỏi #${qId}`);
      await load();
    } catch (e) {
      setErr(e?.message || "Thêm câu hỏi thất bại");
    } finally {
      setSavingQ(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardNavbar />
        <div className="max-w-5xl mx-auto p-6 text-neutral-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNavbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin • Chỉnh sửa đề #{testId}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => nav("/tests")}
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100"
            >
              ← Quay lại Tests
            </button>
            <button
              onClick={deleteTest}
              disabled={savingMeta}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
            >
              Xoá đề
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">{err}</div>
        ) : null}
        {ok ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">{ok}</div>
        ) : null}

        {/* META */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin đề thi</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="block md:col-span-2">
              <span className="block text-sm font-medium mb-1">Tiêu đề</span>
              <input
                value={meta.title}
                onChange={onMetaChange("title")}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Mode</span>
              <select
                value={meta.mode}
                onChange={onMetaChange("mode")}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              >
                {MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Thời gian (giây)</span>
              <input
                type="number"
                min={60}
                value={meta.durationSec}
                onChange={onMetaChange("durationSec")}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-neutral-600">Số câu hiện tại: <b>{questions.length}</b></div>
            <button
              onClick={saveMeta}
              disabled={savingMeta}
              className="px-5 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {savingMeta ? "Đang lưu..." : "Lưu đề"}
            </button>
          </div>
        </div>

        {/* ADD NEW QUESTION */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Thêm câu hỏi mới</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1">Section</span>
              <input value={newQ.section} onChange={setNewField("section")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Skill</span>
              <input value={newQ.skill} onChange={setNewField("skill")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Difficulty</span>
              <input value={newQ.difficulty} onChange={setNewField("difficulty")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
            </label>
          </div>

          <label className="block mt-4">
            <span className="block text-sm font-medium mb-1">Passage (tuỳ chọn)</span>
            <textarea rows={3} value={newQ.passage} onChange={setNewField("passage")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
          </label>

          <label className="block mt-4">
            <span className="block text-sm font-medium mb-1">Nội dung câu hỏi</span>
            <textarea rows={4} value={newQ.content} onChange={setNewField("content")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
          </label>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Đáp án (chọn đáp án đúng)</div>
            <div className="space-y-2">
              {newQ.choices.map((c, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input type="radio" name="newCorrect" checked={!!c.isCorrect} onChange={() => setNewCorrect(idx)} />
                  <input value={c.choiceText} onChange={setNewChoice(idx)} className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2" placeholder={`Đáp án ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={addNewQuestion}
              disabled={!canAddNew || savingQ}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {savingQ ? "Đang thêm..." : "+ Thêm vào đề"}
            </button>
          </div>
        </div>

        {/* QUESTIONS LIST */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Danh sách câu hỏi</h2>
            <button
              onClick={load}
              disabled={savingQ}
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="mt-3 text-sm text-neutral-600">Chưa có câu hỏi nào.</div>
          ) : (
            <div className="mt-4 space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-neutral-500">#{idx + 1} • QuestionID: {q.id}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        section: <b>{q.section || "-"}</b> • skill: <b>{q.skill || "-"}</b> • difficulty: <b>{q.difficulty || "-"}</b>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveQuestion(q)}
                        disabled={savingQ}
                        className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => removeFromTest(q.id)}
                        disabled={savingQ}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Gỡ khỏi đề
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="block text-sm font-medium mb-1">Section</span>
                      <input value={q.section} onChange={setQField(q.id, "section")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium mb-1">Skill</span>
                      <input value={q.skill} onChange={setQField(q.id, "skill")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium mb-1">Difficulty</span>
                      <input value={q.difficulty} onChange={setQField(q.id, "difficulty")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
                    </label>
                  </div>

                  <label className="block mt-4">
                    <span className="block text-sm font-medium mb-1">Passage</span>
                    <textarea rows={3} value={q.passage} onChange={setQField(q.id, "passage")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
                  </label>

                  <label className="block mt-4">
                    <span className="block text-sm font-medium mb-1">Nội dung câu hỏi</span>
                    <textarea rows={4} value={q.content} onChange={setQField(q.id, "content")} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2" />
                  </label>

                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Đáp án (chọn đáp án đúng)</div>
                    <div className="space-y-2">
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={!!c.isCorrect}
                            onChange={() => setQCorrect(q.id, ci)}
                          />
                          <input
                            value={c.choiceText}
                            onChange={setQChoice(q.id, ci)}
                            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2"
                            placeholder={`Đáp án ${ci + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
